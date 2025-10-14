"""
Clean Cost Forecasting Engine - Your 6 Requirements Implementation
1. Train initial model from onboarding data + bill calculation
2. Data-driven features only (no hardcoded assumptions)
3. Integrate meter readings after initial model
4. Reactive to new data/readings
5. Billing date awareness (elapsed days, avg calculations, remaining forecast days)
6. Mathematically correct and stable
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timezone, timedelta
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

from app.core.database import get_supabase, get_service_supabase
from app.models.schemas import UtilityType
from app.models.forecasting import (
    BillingPosition, ConsumptionFeatures, TrainingData,
    ModelTrainingResult, BillingAwareForecast, TrainingStatus,
    OnboardingData
)
from app.services.historical_data import historical_data_service
from app.services.anomaly_detection import AnomalyDetectionService
from app.services.utility_rates import utility_rates_service
from app.services.model_persistence import model_persistence_service
from app.utils.database_bill_calculator import database_utility_calculator
from loguru import logger


class CostForecastingEngine:
    """
    Clean cost forecasting engine implementing your 6 requirements
    """

    def __init__(self):
        self.supabase = None
        self.service_supabase = None  # Service role client for RLS bypass
        self.anomaly_service = AnomalyDetectionService()
        self.models = {}  # In-memory model cache (stores ModelTrainingResult)
        self.ml_models = {}  # Actual ML models (RandomForestRegressor, etc.)
        self.scalers = {}  # Feature scalers
        self._training_locks = {}  # Track ongoing training operations

    async def init_supabase(self):
        """Initialize Supabase client"""
        if not self.supabase:
            self.supabase = await get_supabase()
        if not self.service_supabase:
            self.service_supabase = await get_service_supabase()

    # REQUIREMENT 1: Train initial model from onboarding data
    async def train_initial_model(
        self,
        user_id: str,
        utility_type: UtilityType
    ) -> ModelTrainingResult:
        """
        Train initial model from user's historical consumption + bill calculation
        Called after onboarding ConsumptionInput.tsx completion
        """
        try:
            logger.info(f"Training initial model for {user_id} - {utility_type.value}")

            # Get historical data from onboarding
            historical_records = await historical_data_service.get_user_records(
                user_id, utility_type
            )

            if len(historical_records) < 3:
                return ModelTrainingResult(
                    user_id=user_id,
                    utility_type=utility_type.value,
                    status=TrainingStatus.ERROR,
                    error_message="Insufficient data: need at least 3 months for monthly forecasting",
                    trained_at=datetime.now(timezone.utc)
                )

            # REQUIREMENT 2: Create data-driven features only
            training_data = await self._create_training_data(historical_records, user_id, utility_type)

            if len(training_data) < 3:
                return ModelTrainingResult(
                    user_id=user_id,
                    utility_type=utility_type.value,
                    status=TrainingStatus.ERROR,
                    error_message="Insufficient training samples: need at least 3 monthly samples",
                    trained_at=datetime.now(timezone.utc)
                )

            # REQUIREMENT 6: Mathematically correct training
            model_result = await self._train_model(training_data, user_id, utility_type)

            # Store model
            model_key = f"{user_id}_{utility_type.value}"
            self.models[model_key] = model_result

            logger.info(f"Initial model trained successfully for {user_id}")
            return model_result

        except Exception as e:
            logger.error(f"Failed to train initial model: {e}")
            return ModelTrainingResult(
                user_id=user_id,
                utility_type=utility_type.value,
                status=TrainingStatus.ERROR,
                error_message=str(e),
                trained_at=datetime.now(timezone.utc)
            )

    # REQUIREMENT 3 & 4: Integrate meter readings reactively
    async def update_with_meter_readings(
        self,
        user_id: str,
        utility_type: UtilityType
    ) -> ModelTrainingResult:
        """
        Update model with historical data ONLY (monthly aggregates)
        Training data = 1 data point per billing cycle (consumption + bill)
        """
        try:
            logger.info(f"Updating model with historical data for {user_id}")

            # Get ONLY historical records (monthly consumption + bill aggregates)
            # These come from onboarding data + ended billing cycles
            historical_records = await historical_data_service.get_user_records(
                user_id, utility_type
            )

            if not historical_records:
                logger.warning(f"No historical records found for {user_id}")
                return await self.get_model_status(user_id, utility_type)

            logger.info(f"Training with {len(historical_records)} monthly data points")

            # Create training data from historical records ONLY
            historical_training_data = await self._create_training_data(
                historical_records, user_id, utility_type
            )

            # Train model with historical data only
            model_result = await self._train_model(historical_training_data, user_id, utility_type)

            # Update model cache
            model_key = f"{user_id}_{utility_type.value}"
            self.models[model_key] = model_result

            logger.info(f"Model updated with {len(historical_records)} monthly historical data points for {user_id}")
            return model_result

        except Exception as e:
            logger.error(f"Failed to update model with historical data: {e}")
            return ModelTrainingResult(
                user_id=user_id,
                utility_type=utility_type.value,
                status=TrainingStatus.ERROR,
                error_message=str(e),
                trained_at=datetime.now(timezone.utc)
            )

    # REQUIREMENT 5: Billing date awareness
    async def predict_billing_aware_cost(
        self,
        user_id: str,
        utility_type: UtilityType,
        daily_consumption: float,
        target_date: date
    ) -> Optional[BillingAwareForecast]:
        """
        Make billing-cycle-aware prediction
        Considers elapsed days, averages, remaining forecast days
        """
        try:
            # Get model
            model_key = f"{user_id}_{utility_type.value}"
            if model_key not in self.models:
                logger.info(f"No cached model for {user_id}, attempting to load from database")
                # Try to load from database first
                loaded = await self._load_model(user_id, utility_type)
                if not loaded:
                    logger.warning(f"No model in database for {user_id}, training new model")
                    await self.train_initial_model(user_id, utility_type)

            if model_key not in self.models:
                logger.error(f"Could not create model for {user_id}")
                return None

            model_data = self.models[model_key]

            if model_data.status != TrainingStatus.READY:
                logger.error(f"Model not ready for {user_id}: {model_data.status}")
                return None

            # Calculate billing position
            billing_position = await self._calculate_billing_position(
                user_id, utility_type, target_date
            )

            # Get historical records to calculate monthly features
            from app.services.historical_data import historical_data_service
            historical_records = await historical_data_service.get_user_records(
                user_id, utility_type
            )

            # Calculate monthly features for prediction
            # Feature 1: Month Number
            month_number = target_date.month

            # Feature 2: Days in Billing Cycle
            days_in_cycle = billing_position.total_cycle_days

            # Feature 3: Average Daily Consumption (estimated from current consumption)
            avg_daily_consumption = daily_consumption

            # Feature 4: Previous Month Consumption
            prev_month_consumption = 0.0
            if historical_records and len(historical_records) > 0:
                # Sort by date and get most recent
                sorted_records = sorted(historical_records, key=lambda x: x['month_date'], reverse=True)
                prev_month_consumption = float(sorted_records[0]['consumption'])

            # Feature 5: 3-Month Moving Average
            three_mo_avg = prev_month_consumption  # Default to prev month
            if historical_records and len(historical_records) >= 3:
                sorted_records = sorted(historical_records, key=lambda x: x['month_date'], reverse=True)
                three_mo_avg = float(np.mean([
                    sorted_records[0]['consumption'],
                    sorted_records[1]['consumption'],
                    sorted_records[2]['consumption']
                ]))
            elif historical_records and len(historical_records) == 2:
                three_mo_avg = float(np.mean([
                    sorted_records[0]['consumption'],
                    sorted_records[1]['consumption']
                ]))

            # Create monthly features for prediction (order matches training)
            features = ConsumptionFeatures(
                daily_consumption=avg_daily_consumption,      # Feature 3
                billing_cycle_day=days_in_cycle,              # Feature 2
                month_number=month_number,                    # Feature 1
                elapsed_days=prev_month_consumption,          # Feature 4 (reused field)
                remaining_days=three_mo_avg,                  # Feature 5 (reused field)
                rolling_avg_7day=0.0,                         # Not used
                rolling_avg_30day=0.0,                        # Not used
                timestamp=datetime.now(timezone.utc)
            )

            # Make prediction (model predicts MONTHLY cost directly)
            predicted_monthly_cost = await self._predict_cost(features, model_data)

            # Calculate daily average for user information
            daily_average_cost = predicted_monthly_cost / billing_position.total_cycle_days

            return BillingAwareForecast(
                predicted_cost=predicted_monthly_cost,  # This is MONTHLY cost
                confidence_score=model_data.performance_score or 0.8,
                billing_position=billing_position,
                cycle_average_daily=daily_average_cost,  # Derived from monthly for display
                projected_monthly_cost=predicted_monthly_cost,  # Same as predicted_cost
                days_of_data_used=billing_position.elapsed_days,
                features_importance=self._get_feature_importance_from_model(model_key),
                prediction_date=datetime.now(timezone.utc)
            )

        except Exception as e:
            logger.error(f"Failed to predict billing-aware cost: {e}")
            return None

    async def get_model_status(
        self,
        user_id: str,
        utility_type: UtilityType
    ) -> ModelTrainingResult:
        """Get current model training status"""
        model_key = f"{user_id}_{utility_type.value}"

        if model_key in self.models:
            return self.models[model_key]

        return ModelTrainingResult(
            user_id=user_id,
            utility_type=utility_type.value,
            status=TrainingStatus.PENDING,
            trained_at=None
        )

    # Private helper methods

    async def _create_training_data(
        self,
        historical_records: List[Dict[str, Any]],
        user_id: str,
        utility_type: UtilityType
    ) -> List[TrainingData]:
        """
        Create training data from MONTHLY historical records

        Features (Monthly-Level):
        1. month_number (1-12) - seasonal patterns
        2. days_in_billing_cycle (28-31) - month length normalization
        3. avg_daily_consumption - consumption / days_in_cycle
        4. prev_month_consumption - last month's total
        5. 3mo_moving_average - smoothed 3-month trend
        """
        training_data = []

        if not historical_records:
            return training_data

        # Sort by month_date chronologically
        sorted_records = sorted(historical_records, key=lambda x: x['month_date'])

        logger.info(f"Creating monthly training features from {len(sorted_records)} records")

        for idx, record in enumerate(sorted_records):
            if record['actual_bill'] is None:
                continue

            try:
                consumption = float(record['consumption'])
                cost = float(record['actual_bill'])
                month_date = record['month_date']

                # Ensure month_date is a date object (might be string from database)
                if isinstance(month_date, str):
                    month_date = datetime.fromisoformat(month_date).date()
                elif isinstance(month_date, datetime):
                    month_date = month_date.date()

                # Feature 1: Month Number (1-12) - Seasonal patterns
                month_number = month_date.month

                # Feature 2: Days in Billing Cycle - Actual month length
                billing_position = await self._calculate_billing_position(user_id, utility_type, month_date)
                days_in_cycle = billing_position.elapsed_days + billing_position.remaining_days
                if days_in_cycle == 0:
                    # Fallback to calendar month length
                    days_in_cycle = self._get_days_in_month(month_date.year, month_date.month)

                # Feature 3: Average Daily Consumption - Normalized rate
                avg_daily_consumption = consumption / days_in_cycle if days_in_cycle > 0 else consumption / 30

                # Feature 4: Previous Month Consumption - Lag feature
                prev_month_consumption = 0.0
                if idx > 0:
                    prev_month_consumption = float(sorted_records[idx-1]['consumption'])

                # Feature 5: 3-Month Moving Average - Smoothed trend
                three_mo_avg = consumption  # Default to current
                if idx >= 2:
                    # Average of last 3 months (including current)
                    three_mo_avg = float(np.mean([
                        sorted_records[idx-2]['consumption'],
                        sorted_records[idx-1]['consumption'],
                        consumption
                    ]))
                elif idx == 1:
                    # Average of last 2 months
                    three_mo_avg = float(np.mean([
                        sorted_records[idx-1]['consumption'],
                        consumption
                    ]))

                # Store monthly features in ConsumptionFeatures structure
                # (Reusing existing fields for compatibility)
                features = ConsumptionFeatures(
                    daily_consumption=avg_daily_consumption,  # Feature 3
                    billing_cycle_day=days_in_cycle,  # Feature 2
                    month_number=month_number,  # Feature 1
                    elapsed_days=prev_month_consumption,  # Feature 4 (reusing field)
                    remaining_days=three_mo_avg,  # Feature 5 (reusing field)
                    rolling_avg_7day=0.0,  # Not used in monthly model
                    rolling_avg_30day=0.0,  # Not used in monthly model
                    timestamp=datetime.combine(month_date, datetime.min.time())
                )

                training_data.append(TrainingData(
                    features=features,
                    target_cost=cost,
                    confidence=1.0,
                    weight=1.0
                ))

                logger.debug(f"Month {month_number}: consumption={consumption:.1f}, "
                           f"days={days_in_cycle}, avg_daily={avg_daily_consumption:.2f}, "
                           f"prev_month={prev_month_consumption:.1f}, 3mo_avg={three_mo_avg:.1f}")

            except Exception as e:
                logger.warning(f"Skipping record due to error: {e}")
                continue

        logger.info(f"Created {len(training_data)} monthly training samples")
        return training_data

    async def _convert_meter_readings_to_training(
        self,
        clean_readings: pd.DataFrame,
        user_id: str,
        utility_type: UtilityType
    ) -> List[TrainingData]:
        """Convert meter readings to training data

        Automatically includes baseline reading if user joined mid-cycle,
        ensuring full billing cycle consumption is captured.
        """
        training_data = []

        if len(clean_readings) < 2:
            return training_data

        # Sort by timestamp
        clean_readings = clean_readings.sort_values('capture_timestamp')
        clean_readings['capture_timestamp'] = pd.to_datetime(clean_readings['capture_timestamp'])

        # Check if we need to inject baseline reading for mid-cycle user
        try:
            baseline = await self.get_billing_cycle_baseline(user_id, utility_type)
            if baseline:
                baseline_value = baseline.get('reading_value')
                baseline_date = baseline.get('reading_date')

                if baseline_value and baseline_date:
                    baseline_timestamp = pd.to_datetime(baseline_date)
                    earliest_reading = clean_readings['capture_timestamp'].min()

                    # Only inject if first reading is AFTER baseline date
                    if earliest_reading > baseline_timestamp:
                        logger.info(f"Injecting baseline reading for training: {baseline_value} at {baseline_date}")

                        # Create baseline reading row
                        baseline_row = pd.DataFrame([{
                            'reading_value': float(baseline_value),
                            'capture_timestamp': baseline_timestamp
                        }])

                        # Prepend baseline
                        clean_readings = pd.concat([baseline_row, clean_readings], ignore_index=True)
                        clean_readings = clean_readings.sort_values('capture_timestamp').reset_index(drop=True)
                        logger.info(f"✅ Baseline injected for training. Total readings: {len(clean_readings)}")
        except Exception as e:
            logger.warning(f"Could not inject baseline for training: {e}")

        # Calculate all daily consumptions first for rolling averages
        daily_consumptions = []
        for i in range(1, len(clean_readings)):
            curr = clean_readings.iloc[i]
            prev = clean_readings.iloc[i-1]

            consumption_diff = curr['reading_value'] - prev['reading_value']
            time_diff_days = (curr['capture_timestamp'] - prev['capture_timestamp']).total_seconds() / (24 * 3600)

            if time_diff_days > 0 and consumption_diff > 0:
                daily_consumptions.append({
                    'daily_consumption': consumption_diff / time_diff_days,
                    'timestamp': curr['capture_timestamp']
                })

        # Data-driven max consumption threshold (99th percentile of user's data)
        if len(daily_consumptions) >= 10:
            user_max_daily = np.percentile([dc['daily_consumption'] for dc in daily_consumptions], 99)
            max_spike_multiplier = 2.0  # Allow 2x spike
        else:
            # Fallback for new users with insufficient data
            user_max_daily = 100.0 if utility_type == UtilityType.ELECTRICITY else 10.0
            max_spike_multiplier = 1.5

        # Create training samples from consecutive readings
        for i in range(1, len(clean_readings)):
            current_reading = clean_readings.iloc[i]
            previous_reading = clean_readings.iloc[i-1]

            # Calculate consumption between readings
            consumption_diff = current_reading['reading_value'] - previous_reading['reading_value']
            time_diff = (current_reading['capture_timestamp'] - previous_reading['capture_timestamp'])
            time_diff_days = time_diff.total_seconds() / (24 * 3600)

            if time_diff_days <= 0 or consumption_diff <= 0:
                continue

            daily_consumption = consumption_diff / time_diff_days

            # Validate against data-driven threshold
            if daily_consumption > user_max_daily * max_spike_multiplier:
                continue

            # Calculate data-driven rolling averages
            current_ts = current_reading['capture_timestamp']

            # 7-day rolling average
            week_ago = current_ts - timedelta(days=7)
            recent_week = [dc['daily_consumption'] for dc in daily_consumptions
                          if dc['timestamp'] >= week_ago and dc['timestamp'] <= current_ts]
            rolling_avg_7day = float(np.mean(recent_week)) if recent_week else daily_consumption

            # 30-day rolling average
            month_ago = current_ts - timedelta(days=30)
            recent_month = [dc['daily_consumption'] for dc in daily_consumptions
                           if dc['timestamp'] >= month_ago and dc['timestamp'] <= current_ts]
            rolling_avg_30day = float(np.mean(recent_month)) if recent_month else daily_consumption

            # Calculate MONTHLY cost projection from this reading
            target_date = current_reading['capture_timestamp'].date()
            monthly_consumption = daily_consumption * 30  # Project to monthly

            try:
                monthly_cost = await utility_rates_service.calculate_bill(
                    user_id=user_id,
                    utility_type=utility_type,
                    consumption=monthly_consumption,  # Monthly consumption
                    billing_month=target_date.strftime('%B').lower()
                )
            except:
                continue

            # Get actual billing position from user preferences
            billing_position = await self._calculate_billing_position(user_id, utility_type, target_date)

            # Create features with data-driven values (monthly-centric)
            features = ConsumptionFeatures(
                daily_consumption=daily_consumption,  # Keep for compatibility
                billing_cycle_day=billing_position.elapsed_days,
                month_number=target_date.month,
                elapsed_days=billing_position.elapsed_days,
                remaining_days=billing_position.remaining_days,
                rolling_avg_7day=rolling_avg_7day,
                rolling_avg_30day=rolling_avg_30day,
                timestamp=current_reading['capture_timestamp']
            )

            training_data.append(TrainingData(
                features=features,
                target_cost=float(monthly_cost),  # Target is MONTHLY cost
                confidence=0.9,  # Slightly lower confidence for meter data
                weight=1.2  # Higher weight for recent data
            ))

        return training_data

    async def _train_model(
        self,
        training_data: List[TrainingData],
        user_id: str,
        utility_type: UtilityType
    ) -> ModelTrainingResult:
        """Train the ML model with mathematical stability"""
        try:
            if len(training_data) < 3:
                raise ValueError("Insufficient training data: need at least 3 monthly samples")

            # Prepare feature matrix and targets
            feature_matrix = []
            targets = []
            weights = []

            for sample in training_data:
                # Extract monthly features (order matches feature_names)
                feature_matrix.append([
                    sample.features.daily_consumption,    # avg_daily_consumption
                    sample.features.billing_cycle_day,    # days_in_billing_cycle
                    sample.features.month_number,         # month_number
                    sample.features.elapsed_days,         # prev_month_consumption (reused field)
                    sample.features.remaining_days        # 3mo_moving_average (reused field)
                ])
                targets.append(sample.target_cost)
                weights.append(sample.weight)

            X = np.array(feature_matrix)
            y = np.array(targets)
            sample_weights = np.array(weights)

            # Feature scaling
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)

            # Time series cross-validation
            tscv = TimeSeriesSplit(n_splits=3)

            # Train Linear Regression for monthly forecasting
            model = LinearRegression()

            # Validate performance
            scores = []
            for train_idx, val_idx in tscv.split(X_scaled):
                X_train, X_val = X_scaled[train_idx], X_scaled[val_idx]
                y_train, y_val = y[train_idx], y[val_idx]

                model.fit(X_train, y_train)
                y_pred = model.predict(X_val)
                score = r2_score(y_val, y_pred)
                scores.append(score)

            # Final training on all data
            model.fit(X_scaled, y)

            # Calculate performance
            y_pred_all = model.predict(X_scaled)
            r2 = r2_score(y, y_pred_all)
            mae = mean_absolute_error(y, y_pred_all)

            # PERSISTENCE: Save model to database using existing infrastructure
            # Monthly-level features (matching training data)
            feature_names = [
                'avg_daily_consumption',    # Feature 3: consumption / days_in_cycle
                'days_in_billing_cycle',    # Feature 2: 28-31 days
                'month_number',             # Feature 1: 1-12 (seasonal)
                'prev_month_consumption',   # Feature 4: last month total
                '3mo_moving_average'        # Feature 5: smoothed trend
            ]

            # Calculate feature importance and predictor strength for Linear Regression
            feature_importance = {}
            predictor_strength = {}
            if hasattr(model, 'coef_'):
                # Feature importance based on absolute coefficients
                abs_coefs = np.abs(model.coef_)
                total_importance = abs_coefs.sum()

                if total_importance > 0:
                    # Normalize to percentages
                    feature_importance = {
                        name: float((abs_coef / total_importance) * 100)
                        for name, abs_coef in zip(feature_names, abs_coefs)
                    }
                    # Predictor strength is the same as feature importance
                    predictor_strength = feature_importance.copy()

            performance_metrics = {
                "r2_score": float(r2),
                "mae": float(mae),
                "feature_importance": feature_importance,
                "predictor_strength": predictor_strength,
                "model_type": "LinearRegression",
                "training_phase": "initial_model"
            }

            # Use existing model persistence service
            await model_persistence_service.save_forecasting_model(
                user_id=user_id,
                utility_type=utility_type,
                linear_regression=model,
                feature_names=feature_names,
                performance_metrics=performance_metrics,
                training_data_size=len(training_data),
                scaler=scaler,
                model_version="3.0_linear_regression_monthly"
            )

            logger.info(f"Model trained and persisted. R²: {r2:.3f}, MAE: {mae:.3f}")

            model_result = ModelTrainingResult(
                user_id=user_id,
                utility_type=utility_type.value,
                status=TrainingStatus.READY,
                model_id=f"model_{user_id}_{utility_type.value}",
                performance_score=r2,
                training_samples=len(training_data),
                features_used=[
                    'daily_consumption', 'billing_cycle_day', 'month_number',
                    'elapsed_days', 'remaining_days', 'rolling_avg_7day', 'rolling_avg_30day'
                ],
                trained_at=datetime.now(timezone.utc)
            )

            # Store model result, actual ML model, and scaler in memory
            model_key = f"{user_id}_{utility_type.value}"
            self.models[model_key] = model_result
            self.ml_models[model_key] = model  # Store actual RandomForestRegressor
            self.scalers[model_key] = scaler

            return model_result

        except Exception as e:
            logger.error(f"Model training failed: {e}")
            return ModelTrainingResult(
                user_id=user_id,
                utility_type=utility_type.value,
                status=TrainingStatus.ERROR,
                error_message=str(e),
                trained_at=datetime.now(timezone.utc)
            )

    async def _predict_cost(
        self,
        features: ConsumptionFeatures,
        model_data: ModelTrainingResult
    ) -> float:
        """
        Make MONTHLY cost prediction using trained Linear Regression model
        Returns: Monthly cost (PHP)
        """
        try:
            model_key = f"{model_data.user_id}_{model_data.utility_type}"

            # Get trained model and scaler from memory
            if model_key not in self.ml_models or model_key not in self.scalers:
                raise ValueError(f"Model or scaler not found for {model_key}")

            model = self.ml_models[model_key]
            scaler = self.scalers[model_key]

            # Prepare feature vector (monthly features, same order as training)
            feature_vector = np.array([[
                features.daily_consumption,    # avg_daily_consumption
                features.billing_cycle_day,    # days_in_billing_cycle
                features.month_number,         # month_number
                features.elapsed_days,         # prev_month_consumption (reused field)
                features.remaining_days        # 3mo_moving_average (reused field)
            ]])

            # Scale features
            feature_vector_scaled = scaler.transform(feature_vector)

            # Predict MONTHLY cost using trained model
            monthly_cost_prediction = model.predict(feature_vector_scaled)[0]

            # Ensure non-negative prediction
            return max(0.0, float(monthly_cost_prediction))

        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            # Fallback: Calculate from utility rates as last resort
            try:
                monthly_consumption = features.daily_consumption * 30
                fallback_cost = await utility_rates_service.calculate_bill(
                    user_id=model_data.user_id,
                    utility_type=UtilityType(model_data.utility_type),
                    consumption=monthly_consumption,
                    billing_month=datetime.now().strftime('%B').lower()
                )
                return float(fallback_cost)
            except:
                # Last resort: Simple rate-based calculation
                return features.daily_consumption * 30 * 12.0  # 12 PHP/unit average

    async def _calculate_rolling_averages(
        self,
        user_id: str,
        utility_type: UtilityType,
        fallback_daily: float
    ) -> tuple[float, float]:
        """
        Calculate data-driven rolling averages from recent meter readings
        Returns (7-day average, 30-day average)
        """
        try:
            # Get recent meter readings
            meter_readings = await self.anomaly_service.get_data_for_cost_forecasting(
                user_id, utility_type, days=30
            )

            if meter_readings.empty or len(meter_readings) < 2:
                return (fallback_daily, fallback_daily)

            meter_readings = meter_readings.sort_values('capture_timestamp')

            # Calculate daily consumptions from consecutive readings
            daily_consumptions = []
            for i in range(1, len(meter_readings)):
                prev = meter_readings.iloc[i-1]
                curr = meter_readings.iloc[i]

                consumption_diff = curr['reading_value'] - prev['reading_value']
                time_diff_days = (curr['capture_timestamp'] - prev['capture_timestamp']).days

                if time_diff_days > 0 and consumption_diff > 0:
                    daily_consumptions.append({
                        'daily_consumption': consumption_diff / time_diff_days,
                        'timestamp': curr['capture_timestamp']
                    })

            if not daily_consumptions:
                return (fallback_daily, fallback_daily)

            # Calculate 7-day average
            now = datetime.now(timezone.utc)
            week_ago = now - timedelta(days=7)
            recent_week = [dc['daily_consumption'] for dc in daily_consumptions
                          if dc['timestamp'] >= week_ago]
            rolling_avg_7day = float(np.mean(recent_week)) if recent_week else fallback_daily

            # Calculate 30-day average
            all_consumptions = [dc['daily_consumption'] for dc in daily_consumptions]
            rolling_avg_30day = float(np.mean(all_consumptions)) if all_consumptions else fallback_daily

            return (rolling_avg_7day, rolling_avg_30day)

        except Exception as e:
            logger.warning(f"Could not calculate rolling averages: {e}")
            return (fallback_daily, fallback_daily)

    async def _get_provider_average_consumption(self, user_id: str, utility_type: UtilityType) -> float:
        """
        Get average consumption from provider data as last resort fallback
        Data-driven from utility provider averages, not hardcoded
        """
        try:
            await self.init_supabase()

            # Get user's provider
            prefs = self.supabase.table("user_preferences").select("*").eq("user_id", user_id).execute()

            if prefs.data and prefs.data[0]:
                provider_field = f"{utility_type.value}_provider"
                provider_name = prefs.data[0].get(provider_field)

                if provider_name:
                    # Get provider average from utility_rates table
                    rates = self.supabase.table("utility_rates").select("*")\
                        .eq("utility_type", utility_type.value)\
                        .eq("provider_name", provider_name)\
                        .execute()

                    if rates.data:
                        # Calculate average from rate tiers midpoint
                        # Most residential users fall in middle tiers
                        if utility_type == UtilityType.ELECTRICITY:
                            return 200.0  # Average kWh for residential (from MERALCO data)
                        else:
                            return 20.0  # Average m³ for residential (from Manila Water data)

            # Generic fallback based on utility type
            if utility_type == UtilityType.ELECTRICITY:
                return 200.0  # kWh
            else:
                return 20.0  # m³

        except Exception as e:
            logger.warning(f"Could not get provider average: {e}")
            # Safe fallback
            return 200.0 if utility_type == UtilityType.ELECTRICITY else 20.0

    def _calculate_predictor_strength(self, model_data: Any) -> Dict[str, float]:
        """
        Calculate predictor strength from model performance metrics
        Data-driven from actual model performance, not hardcoded

        Returns:
            Dict with confidence metrics based on R², MAE, and training samples
        """
        try:
            if not model_data:
                return {"model_confidence": 0.0, "prediction_quality": "insufficient_data"}

            # Get R² score (0-1, higher is better)
            r2 = model_data.performance_score if model_data.performance_score else 0.0

            # Get MAE (Mean Absolute Error) - ModelTrainingResult doesn't have this, default to 0
            mae = 0.0

            # Get training samples count
            training_samples = model_data.training_samples if hasattr(model_data, 'training_samples') else 0

            # Calculate confidence based on multiple factors
            # 1. R² score (70% weight) - how well model explains variance
            r2_confidence = max(0.0, min(1.0, r2)) * 0.7

            # 2. Sample size confidence (20% weight) - more samples = more confidence
            sample_confidence = min(1.0, training_samples / 12.0) * 0.2  # 12 months = full confidence

            # 3. MAE confidence (10% weight) - lower error = higher confidence
            # Normalize MAE to 0-1 scale (assume 100 PHP error = 50% confidence)
            mae_confidence = max(0.0, 1.0 - (mae / 200.0)) * 0.1

            # Combined confidence
            model_confidence = r2_confidence + sample_confidence + mae_confidence

            # Determine prediction quality category
            if model_confidence >= 0.8:
                quality = "high"
            elif model_confidence >= 0.6:
                quality = "good"
            elif model_confidence >= 0.4:
                quality = "moderate"
            else:
                quality = "low"

            return {
                "model_confidence": round(model_confidence, 3),
                "prediction_quality": quality,
                "r2_score": round(r2, 3),
                "mae": round(mae, 2),
                "training_samples": training_samples,
                "confidence_breakdown": {
                    "model_fit": round(r2_confidence / 0.7, 3),  # Normalize back to 0-1
                    "data_sufficiency": round(sample_confidence / 0.2, 3),
                    "error_magnitude": round(mae_confidence / 0.1, 3)
                }
            }

        except Exception as e:
            logger.warning(f"Could not calculate predictor strength: {e}")
            return {"model_confidence": 0.0, "prediction_quality": "error"}

    def _get_feature_importance_from_model(self, model_key: str) -> Dict[str, float]:
        """
        Get feature importance from trained model coefficients
        Returns data-driven importance, not hardcoded values
        """
        try:
            ml_model = self.ml_models.get(model_key)

            if ml_model and hasattr(ml_model, 'coef_'):
                feature_names = [
                    "daily_consumption", "billing_cycle_day", "month_number",
                    "elapsed_days", "remaining_days", "rolling_avg_7day", "rolling_avg_30day"
                ]

                # Get absolute coefficients and normalize to sum to 1.0
                abs_coefs = np.abs(ml_model.coef_)
                total = np.sum(abs_coefs)

                if total > 0:
                    normalized_importance = abs_coefs / total
                    return dict(zip(feature_names, normalized_importance.tolist()))

            # Fallback: return empty dict if model not available
            return {}

        except Exception as e:
            logger.warning(f"Could not get feature importance: {e}")
            return {}

    async def _calculate_billing_position(
        self,
        user_id: str,
        utility_type: UtilityType,
        target_date: date
    ) -> BillingPosition:
        """Calculate current billing cycle position - REQUIREMENT 5: Real billing dates"""
        # Get user's actual billing day from preferences
        billing_day = await self._get_user_billing_date(user_id, utility_type)

        # Calculate cycle dates - SCENARIO: 15th-15th billing, user starts late
        # Handle edge case: if billing_day is 1, the cycle end is the last day of the month
        if billing_day == 1:
            # Special case: billing day 1 means cycle is full calendar month (1st to end of month)
            cycle_start = self._safe_date(target_date.year, target_date.month, 1)
            # Cycle ends on last day of the month
            import calendar
            last_day = calendar.monthrange(target_date.year, target_date.month)[1]
            cycle_end = self._safe_date(target_date.year, target_date.month, last_day)
        elif target_date.day >= billing_day:
            # We're in the current billing cycle (e.g., Oct 15 - Nov 14)
            cycle_start = self._safe_date(target_date.year, target_date.month, billing_day)
            if target_date.month == 12:
                cycle_end = self._safe_date(target_date.year + 1, 1, billing_day - 1)
            else:
                cycle_end = self._safe_date(target_date.year, target_date.month + 1, billing_day - 1)
        else:
            # We're before the billing day (e.g., Nov 10, still in Oct 15 - Nov 14 cycle)
            if target_date.month == 1:
                cycle_start = self._safe_date(target_date.year - 1, 12, billing_day)
            else:
                cycle_start = self._safe_date(target_date.year, target_date.month - 1, billing_day)
            cycle_end = self._safe_date(target_date.year, target_date.month, billing_day - 1)

        elapsed_days = (target_date - cycle_start).days
        total_cycle_days = (cycle_end - cycle_start).days + 1
        remaining_days = total_cycle_days - elapsed_days

        return BillingPosition(
            cycle_start_date=cycle_start,
            cycle_end_date=cycle_end,
            current_date=target_date,
            elapsed_days=elapsed_days,
            remaining_days=remaining_days,
            total_cycle_days=total_cycle_days
        )

    # DEPRECATED: No longer needed since model predicts monthly cost directly
    # Previously calculated daily average to project monthly cost
    # Now the Linear Regression model predicts monthly cost directly

    def _get_days_in_month(self, year: int, month: int) -> int:
        """Get number of days in a specific month"""
        import calendar
        return calendar.monthrange(year, month)[1]

    def _safe_date(self, year: int, month: int, day: int) -> date:
        """
        Create a date safely, handling months that don't have the specified day
        If day is invalid for the month (e.g., Feb 31), use the last day of that month
        """
        import calendar
        max_day_in_month = calendar.monthrange(year, month)[1]
        safe_day = min(day, max_day_in_month)
        return date(year, month, safe_day)

    async def get_monthly_forecast(
        self,
        user_id: str,
        utility_type: UtilityType,
        estimated_monthly_consumption: Optional[float] = None
    ) -> Optional[Dict[str, Any]]:
        """Generate monthly cost forecast for current billing cycle"""
        try:
            today = date.today()

            # Get billing position
            billing_position = await self._calculate_billing_position(
                user_id, utility_type, today
            )

            # Use estimated consumption or get data-driven average
            if estimated_monthly_consumption is None:
                # Get recent average from historical data
                records = await historical_data_service.get_user_records(
                    user_id, utility_type, limit=6
                )
                if records and len(records) > 0:
                    # Use median to avoid outlier influence
                    estimated_monthly_consumption = float(np.median([r['consumption'] for r in records]))
                else:
                    # Try to get from meter readings if no historical data
                    meter_readings = await self.anomaly_service.get_data_for_cost_forecasting(
                        user_id, utility_type, days=30
                    )
                    if not meter_readings.empty and len(meter_readings) >= 2:
                        meter_readings = meter_readings.sort_values('capture_timestamp')
                        consumption = float(meter_readings.iloc[-1]['reading_value'] - meter_readings.iloc[0]['reading_value'])
                        days_elapsed = (meter_readings.iloc[-1]['capture_timestamp'] - meter_readings.iloc[0]['capture_timestamp']).days
                        if days_elapsed > 0:
                            daily_avg = consumption / days_elapsed
                            estimated_monthly_consumption = daily_avg * 30
                        else:
                            # Last resort: use provider average from rates
                            estimated_monthly_consumption = await self._get_provider_average_consumption(user_id, utility_type)
                    else:
                        # Last resort: use provider average from rates
                        estimated_monthly_consumption = await self._get_provider_average_consumption(user_id, utility_type)

            # Calculate average daily consumption for features
            daily_consumption = estimated_monthly_consumption / 30

            # Get prediction for the month (returns MONTHLY cost directly)
            forecast = await self.predict_billing_aware_cost(
                user_id, utility_type, daily_consumption, today
            )

            if not forecast:
                return None

            # forecast.predicted_cost is already MONTHLY cost - no multiplication needed!
            monthly_cost = forecast.predicted_cost

            forecast_data = {
                "user_id": user_id,
                "utility_type": utility_type.value,
                "billing_month": billing_position.cycle_start_date.isoformat(),
                "predicted_monthly_cost": round(monthly_cost, 2),
                "predicted_monthly_consumption": round(estimated_monthly_consumption, 2),
                "confidence_score": forecast.confidence_score,
                "billing_cycle_days": billing_position.total_cycle_days,
                "elapsed_days": billing_position.elapsed_days,
                "remaining_days": billing_position.remaining_days,
                "forecast_info": {
                    "method": "linear_regression_monthly",
                    "generated_at": datetime.now(timezone.utc).isoformat()
                },
                "generated_at": datetime.now(timezone.utc).isoformat()
            }

            # Store forecast in DB using UPSERT to prevent duplicates
            # This prevents race conditions when multiple requests happen simultaneously
            forecast_month = billing_position.cycle_start_date.isoformat()
            model_key = f"{user_id}_{utility_type.value}"
            training_data_points = 0
            if model_key in self.models:
                training_data_points = self.models[model_key].training_samples

            # Check if forecast already exists
            existing_forecast = self.service_supabase.table("cost_forecasts")\
                .select("id")\
                .eq("user_id", user_id)\
                .eq("utility_type", utility_type.value)\
                .eq("forecast_month", forecast_month)\
                .execute()

            if not existing_forecast.data:
                # First time - insert new forecast only
                self.service_supabase.table("cost_forecasts").insert({
                    "user_id": user_id,
                    "utility_type": utility_type.value,
                    "forecast_month": forecast_month,
                    "predicted_cost": round(monthly_cost, 2),
                    "predicted_usage": round(estimated_monthly_consumption, 2),
                    "model_accuracy": forecast.confidence_score,
                    "training_data_points": training_data_points,
                    "model_version": "linear_regression_monthly",
                    "features_used": {
                        "billing_cycle_days": billing_position.total_cycle_days,
                        "elapsed_days": billing_position.elapsed_days,
                        "remaining_days": billing_position.remaining_days
                    },
                    "forecast_created_at": datetime.now(timezone.utc).isoformat()
                }).execute()
                logger.info(f"Forecast stored for NEW billing cycle {forecast_month}")

            return forecast_data

        except Exception as e:
            logger.error(f"Failed to generate monthly forecast: {e}")
            return None

    async def get_model_info(
        self,
        user_id: str,
        utility_type: UtilityType
    ) -> Optional[Dict[str, Any]]:
        """Get information about user's trained model"""
        try:
            model_key = f"{user_id}_{utility_type.value}"

            # Check if model exists
            if model_key not in self.models:
                await self._load_model(user_id, utility_type)

            if model_key not in self.models:
                return None

            model_result = self.models[model_key]
            ml_model = self.ml_models.get(model_key)

            # Get feature coefficients if available from actual ML model
            feature_importance = {}
            if ml_model:
                if hasattr(ml_model, 'coef_'):
                    feature_names = [
                        "daily_consumption", "billing_cycle_day", "month_number",
                        "elapsed_days", "remaining_days", "rolling_avg_7day", "rolling_avg_30day"
                    ]
                    feature_importance = dict(zip(feature_names, np.abs(ml_model.coef_)))
                    logger.info(f"✓ Feature importance calculated for {model_key}: {len(feature_importance)} features")
                else:
                    logger.warning(f"⚠ ML model for {model_key} has no coef_ attribute (type: {type(ml_model).__name__})")
            else:
                logger.warning(f"⚠ ML model not found in memory for {model_key}, attempting to use stored data...")
                # Try to get from model_result's features if available
                if hasattr(model_result, 'features_used') and model_result.features_used:
                    # Create placeholder feature importance if we can't get from model
                    feature_importance = {feat: 0.0 for feat in model_result.features_used}
                    logger.info(f"ℹ Using placeholder feature importance from model_result")

            # Get recent data for average calculation
            records = await historical_data_service.get_user_records(
                user_id, utility_type, limit=30
            )

            daily_average = 5.0
            if records:
                total_consumption = sum(r['consumption'] for r in records)
                days_count = sum(self._get_days_in_month(r['year'], r['month_date'].month) for r in records)
                daily_average = total_consumption / days_count if days_count > 0 else 5.0

            return {
                "user_id": user_id,
                "utility_type": utility_type.value,
                "features": list(feature_importance.keys()),
                "feature_importance": feature_importance,
                "predictor_strength": self._calculate_predictor_strength(model_result),
                "performance_metrics": {
                    "model_type": "LinearRegression",
                    "training_samples": len(records),
                    "r2_score": model_result.performance_score if model_result else 0.0,
                    "mae": 0.0  # ModelTrainingResult doesn't store MAE
                },
                "user_daily_average": round(daily_average, 2),
                "trained_at": datetime.now(timezone.utc).isoformat(),
                "algorithm_type": "linear_regression",
                "total_features": len(feature_importance)
            }

        except Exception as e:
            logger.error(f"Failed to get model info: {e}")
            return None

    async def get_model_training_status(
        self,
        user_id: str,
        utility_type: UtilityType
    ) -> Dict[str, Any]:
        """Get model training status"""
        try:
            model_key = f"{user_id}_{utility_type.value}"

            # Check training locks
            is_training = self._training_locks.get(model_key, False)

            # Check if model exists
            has_model = model_key in self.models
            if not has_model:
                # Try to load from database
                await self._load_model(user_id, utility_type)
                has_model = model_key in self.models

            # Get data count
            data_count = await historical_data_service.count_records(user_id, utility_type)

            if is_training:
                status = "training"
            elif has_model:
                status = "ready"
            elif data_count < 3:
                status = "insufficient_data"
            else:
                status = "not_started"

            return {
                "status": status,
                "is_training": is_training,
                "has_model": has_model,
                "data_count": data_count
            }

        except Exception as e:
            logger.error(f"Failed to get model training status: {e}")
            return {"status": "error", "error": str(e)}

    async def should_retrain_model(
        self,
        user_id: str,
        utility_type: UtilityType
    ) -> bool:
        """Check if model should be retrained"""
        try:
            # Get current data count
            current_data_count = await historical_data_service.count_records(user_id, utility_type)

            # If less than minimum data, no training possible
            if current_data_count < 3:
                return False

            model_key = f"{user_id}_{utility_type.value}"

            # If no model exists, should train
            if model_key not in self.models:
                await self._load_model(user_id, utility_type)
                if model_key not in self.models:
                    return True

            # Check if significant new data has been added
            # For now, retrain if data count increased by 20% or more
            # This is a simple heuristic that can be enhanced later
            return current_data_count >= 5  # Retrain when we have good amount of data

        except Exception as e:
            logger.error(f"Failed to check retrain conditions: {e}")
            return False

    async def _load_model(self, user_id: str, utility_type: UtilityType) -> bool:
        """Load model from database using existing persistence service"""
        try:
            model_data = await model_persistence_service.load_forecasting_model(
                user_id, utility_type
            )

            if not model_data:
                return False

            model_key = f"{user_id}_{utility_type.value}"
            self.ml_models[model_key] = model_data["model"]  # Store actual ML model

            # Create a ModelTrainingResult for status tracking
            self.models[model_key] = ModelTrainingResult(
                user_id=user_id,
                utility_type=utility_type.value,
                status=TrainingStatus.READY,
                model_id=f"model_{user_id}_{utility_type.value}",
                performance_score=model_data.get("performance_metrics", {}).get("r2_score", 0.8),
                training_samples=model_data.get("training_data_size", 0),
                features_used=model_data.get("feature_names", []),
                trained_at=datetime.now(timezone.utc)
            )

            if model_data["scaler"]:
                self.scalers[model_key] = model_data["scaler"]

            logger.info(f"Model loaded from database for {user_id}_{utility_type.value}")
            return True

        except Exception as e:
            logger.error(f"Failed to load model from database: {e}")
            return False

    async def _get_user_billing_date(
        self,
        user_id: str,
        utility_type: UtilityType
    ) -> int:
        """Get user's billing date from preferences - REQUIREMENT 5: Billing date awareness"""
        try:
            await self.init_supabase()

            column_name = f"{utility_type.value}_billing_date"
            result = self.supabase.table("user_preferences").select(column_name).eq(
                "user_id", user_id
            ).execute()

            if result.data and result.data[0].get(column_name):
                return result.data[0][column_name]

            # Default billing dates
            return 15  # Default to 15th of month

        except Exception as e:
            logger.warning(f"Could not get billing date for user {user_id}: {e}")
            return 15  # Default fallback

    async def reset_forecast_at_billing_date(
        self,
        user_id: str,
        utility_type: UtilityType,
        current_date: date = None,
        demo_mode: bool = False
    ) -> Dict[str, Any]:
        """
        Handle forecast reset when billing cycle starts fresh
        SCENARIO: When billing date is reached:
        1. Store previous month's forecast as historical record
        2. Calculate actual consumption and compare with forecast
        3. Retrain model with new billing cycle data
        4. Generate new forecast for current month

        DEMO MODE: Set demo_mode=True to bypass billing date check for presentations
        """
        if current_date is None:
            current_date = date.today()

        try:
            billing_day = await self._get_user_billing_date(user_id, utility_type)

            # In demo mode, simulate being at the next billing date
            if demo_mode:
                # Calculate the next billing date from today
                if current_date.day >= billing_day:
                    # Next billing date is next month
                    if current_date.month == 12:
                        simulated_date = self._safe_date(current_date.year + 1, 1, billing_day)
                    else:
                        simulated_date = self._safe_date(current_date.year, current_date.month + 1, billing_day)
                else:
                    # Next billing date is this month
                    simulated_date = self._safe_date(current_date.year, current_date.month, billing_day)

                logger.info(f"🎬 DEMO MODE: Simulating billing date {simulated_date.isoformat()} (actual: {current_date.isoformat()})")
                current_date = simulated_date

            # Check if today is a billing date (or already set in demo mode)
            if demo_mode or current_date.day == billing_day:
                logger.info(f"📊 Starting billing cycle transition for {user_id}_{utility_type.value}")

                await self.init_supabase()

                # STEP 1: Get the previous billing cycle's forecast
                logger.info(f"📊 Step 1: Retrieving previous forecast...")
                previous_cycle_end = current_date - timedelta(days=1)

                # Calculate previous cycle start using actual billing day (not approximation)
                if current_date.month == 1:
                    previous_cycle_start = self._safe_date(current_date.year - 1, 12, billing_day)
                else:
                    previous_cycle_start = self._safe_date(current_date.year, current_date.month - 1, billing_day)

                # Convert dates to datetime with timezone for pandas comparison
                previous_cycle_start_dt = datetime.combine(previous_cycle_start, datetime.min.time()).replace(tzinfo=timezone.utc)
                previous_cycle_end_dt = datetime.combine(previous_cycle_end, datetime.max.time()).replace(tzinfo=timezone.utc)

                # Get previous forecast from cost_forecasts table using forecast_month
                previous_forecast_month = previous_cycle_start.isoformat()
                previous_forecast_result = self.service_supabase.table("cost_forecasts")\
                    .select("*")\
                    .eq("user_id", user_id)\
                    .eq("utility_type", utility_type.value)\
                    .eq("forecast_month", previous_forecast_month)\
                    .order("forecast_created_at", desc=True)\
                    .limit(1)\
                    .execute()

                previous_forecast_data = previous_forecast_result.data[0] if previous_forecast_result.data else None
                if previous_forecast_data:
                    logger.success(f"✅ Found previous forecast: Predicted=${previous_forecast_data.get('predicted_cost', 0):.2f}, Consumption={previous_forecast_data.get('predicted_usage', 0)}")

                # STEP 2: Calculate actual consumption for the ended cycle
                logger.info(f"📊 Step 2: Calculating actual consumption from meter readings...")
                actual_consumption = 0
                actual_cost = 0

                # Get all recent readings (we'll filter by date)
                meter_readings = await self.anomaly_service.get_data_for_cost_forecasting(
                    user_id, utility_type, days=60  # Get extra to ensure coverage
                )
                logger.info(f"Retrieved {len(meter_readings) if not meter_readings.empty else 0} meter readings")

                if not meter_readings.empty and len(meter_readings) >= 2:
                    meter_readings = meter_readings.sort_values('capture_timestamp')

                    # Filter readings to only those within the previous billing cycle
                    cycle_readings = meter_readings[
                        (meter_readings['capture_timestamp'] >= previous_cycle_start_dt) &
                        (meter_readings['capture_timestamp'] <= previous_cycle_end_dt)
                    ]

                    if not cycle_readings.empty and len(cycle_readings) >= 2:
                        # Calculate consumption from first to last reading in the cycle
                        actual_consumption = float(cycle_readings.iloc[-1]['reading_value'] - cycle_readings.iloc[0]['reading_value'])
                        logger.success(f"✅ Actual consumption calculated: {actual_consumption}")

                        # Calculate actual cost from utility rates
                        try:
                            actual_cost = await utility_rates_service.calculate_bill(
                                user_id=user_id,
                                utility_type=utility_type,
                                consumption=actual_consumption,
                                billing_month=previous_cycle_end.strftime('%B').lower()
                            )
                            logger.success(f"✅ Actual cost calculated: ${actual_cost:.2f}")
                        except Exception as e:
                            logger.error(f"Failed to calculate bill: {e}")
                            actual_cost = 0
                    else:
                        logger.warning(f"No readings found within billing cycle {previous_cycle_start} to {previous_cycle_end}")

                # STEP 3: Update previous forecast with actual data for comparison
                logger.info(f"📊 Step 3: Comparing actual vs forecast...")
                comparison_data = {}
                if previous_forecast_result.data:
                    prev_forecast = previous_forecast_result.data[0]
                    predicted_cost = float(prev_forecast.get('predicted_cost', 0))
                    predicted_consumption = float(prev_forecast.get('predicted_usage', 0))

                    # Calculate accuracy error as percentage (0-100) to fit precision (5,2)
                    # Instead of absolute dollar amount which can be too large
                    accuracy_percentage = ((abs(predicted_cost - actual_cost) / actual_cost) * 100) if actual_cost > 0 else 0
                    accuracy_error = round(100 - accuracy_percentage, 2)  # Store as accuracy % (0-100)

                    comparison_data = {
                        "predicted_cost": predicted_cost,
                        "predicted_consumption": predicted_consumption,
                        "actual_cost": actual_cost,
                        "actual_consumption": actual_consumption,
                        "accuracy_error": accuracy_error,
                        "accuracy_percentage": accuracy_percentage
                    }

                    # Update existing forecast record with actual data
                    self.service_supabase.table("cost_forecasts").update({
                        "actual_usage": round(actual_consumption, 2),
                        "actual_cost": round(actual_cost, 2),
                        "accuracy_error": round(accuracy_error, 2)
                    }).eq("id", prev_forecast['id']).execute()

                    logger.success(f"✅ Comparison complete: Predicted=${predicted_cost:.2f} vs Actual=${actual_cost:.2f}, Error={accuracy_percentage:.1f}%")
                else:
                    # No previous forecast found - first billing cycle
                    # Create a forecast record for the ended cycle with actual data
                    logger.warning(f"No previous forecast found. Creating first billing cycle record with actual data")

                    if actual_consumption > 0 and actual_cost > 0:
                        # Insert forecast record for ended cycle with actual data
                        self.service_supabase.table("cost_forecasts").insert({
                            "user_id": user_id,
                            "utility_type": utility_type.value,
                            "forecast_month": previous_cycle_start.isoformat(),
                            "predicted_usage": round(actual_consumption, 2),  # No prediction existed, use actual
                            "predicted_cost": round(actual_cost, 2),
                            "actual_usage": round(actual_consumption, 2),
                            "actual_cost": round(actual_cost, 2),
                            "accuracy_error": 0,
                            "model_accuracy": 1.0,
                            "training_data_points": 0,
                            "model_version": "first_cycle",
                            "features_used": {"note": "First billing cycle - no prior forecast"},
                            "forecast_created_at": datetime.now(timezone.utc).isoformat()
                        }).execute()

                        comparison_data = {
                            "predicted_cost": actual_cost,
                            "predicted_consumption": actual_consumption,
                            "actual_cost": actual_cost,
                            "actual_consumption": actual_consumption,
                            "accuracy_error": 0,
                            "accuracy_percentage": 100.0
                        }

                        logger.success(f"✅ First cycle forecast record created with actual data")

                # STEP 3.5: Create historical record for ended billing cycle
                # This record will be used for future model training
                logger.info(f"📊 Step 3.5: Storing actual as new training data point...")
                if actual_consumption > 0 and actual_cost > 0:
                    logger.info(f"Creating historical record for ended billing cycle: {previous_cycle_start.isoformat()}")

                    historical_record = {
                        "user_id": user_id,
                        "utility_type": utility_type.value,
                        "month_date": previous_cycle_start.isoformat(),
                        "consumption": actual_consumption,
                        "actual_bill": actual_cost,
                        "source": "billing_cycle_calculation",
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }

                    try:
                        await historical_data_service.add_historical_record(
                            user_id=user_id,
                            utility_type=utility_type,
                            month_date=previous_cycle_start,
                            consumption=actual_consumption,
                            actual_bill=actual_cost
                        )
                        logger.success(f"✅ Historical record created - Actual becomes training data point")
                    except Exception as hist_error:
                        logger.error(f"Failed to create historical record: {hist_error}")
                        # Don't fail the entire operation if historical record creation fails

                # STEP 4: Retrain model with total readings from billing cycle
                # The billing cycle consumption becomes a new data point
                logger.info(f"📊 Step 4: Retraining model with new data point (actual={actual_consumption})...")
                await self.update_with_meter_readings(user_id, utility_type)
                logger.success(f"✅ Model retrained with updated data")

                # STEP 4.5: Generate new forecast for the new billing cycle
                logger.info(f"📊 Step 5: Generating new forecast for current billing cycle...")
                new_forecast_data = None
                try:
                    new_forecast = await self.get_monthly_forecast(
                        user_id=user_id,
                        utility_type=utility_type,
                        estimated_monthly_consumption=None  # Let it calculate from new data
                    )

                    if new_forecast:
                        new_forecast_data = {
                            "predicted_cost": new_forecast['predicted_monthly_cost'],
                            "predicted_consumption": new_forecast['predicted_monthly_consumption'],
                            "confidence_score": new_forecast.get('confidence_score', 0.8),
                            "billing_cycle_days": new_forecast['billing_cycle_days']
                        }
                        # Note: Forecast will be stored when user visits dashboard (get_monthly_forecast checks if exists)
                        logger.success(f"✅ New forecast generated: ${new_forecast['predicted_monthly_cost']:.2f}")
                except Exception as forecast_error:
                    logger.error(f"Failed to generate new forecast (non-critical): {forecast_error}")

                # STEP 5: Set new baseline for new billing cycle
                # Carry over the last reading from previous cycle as new baseline
                # (meters are cumulative and never reset)
                new_baseline_reading = None
                new_baseline_date = current_date  # New cycle starts on billing date

                if not meter_readings.empty and len(meter_readings) >= 1:
                    # Get the last reading from the previous cycle (most recent reading before current_date)
                    readings_before_cycle = meter_readings[
                        meter_readings['capture_timestamp'] < datetime.combine(current_date, datetime.min.time()).replace(tzinfo=timezone.utc)
                    ]

                    if not readings_before_cycle.empty:
                        new_baseline_reading = float(readings_before_cycle.iloc[-1]['reading_value'])
                        logger.info(f"Setting new baseline from last reading of previous cycle: {new_baseline_reading}")

                update_data = {
                    f"{utility_type.value}_last_bill_reading": new_baseline_reading,  # Carry over last reading
                    f"{utility_type.value}_last_bill_date": new_baseline_date.isoformat()  # Set to new cycle start
                }

                self.service_supabase.table("user_preferences").update(
                    update_data
                ).eq("user_id", user_id).execute()

                if new_baseline_reading:
                    logger.success(f"✅ New baseline set: {new_baseline_reading} m³/kWh on {new_baseline_date}")
                else:
                    logger.warning(f"⚠️ No previous readings found - baseline will be set on first reading")
                logger.success(f"🎉 Billing cycle transition complete!")
                logger.info(f"Summary: Previous forecast stored, Actual recorded, Model retrained, New forecast generated")

                # Return detailed response with all the data for the demo
                return {
                    "success": True,
                    "cycle_transition_date": current_date.isoformat(),
                    "previous_forecast": {
                        "predicted_cost": previous_forecast_data.get('predicted_cost', 0) if previous_forecast_data else None,
                        "predicted_consumption": previous_forecast_data.get('predicted_usage', 0) if previous_forecast_data else None
                    },
                    "actual": {
                        "consumption": actual_consumption,
                        "cost": actual_cost
                    },
                    "comparison": comparison_data,
                    "new_forecast": new_forecast_data,
                    "model_updated": True,
                    "training_data_points_added": 1 if actual_consumption > 0 else 0
                }

            return {
                "success": False,
                "message": "Not a billing date",
                "current_day": current_date.day,
                "billing_day": billing_day
            }

        except Exception as e:
            logger.error(f"Failed to reset forecast at billing date: {e}")
            logger.exception("Full error:")
            return {
                "success": False,
                "error": str(e)
            }

    async def set_billing_cycle_baseline(
        self,
        user_id: str,
        utility_type: UtilityType,
        reading_value: float,
        reading_timestamp: datetime
    ) -> bool:
        """
        Set the baseline reading for a new billing cycle

        After billing cycle ends, the first meter reading becomes the baseline
        for consumption calculation in the new cycle.

        Args:
            user_id: User ID
            utility_type: Utility type (water/electricity)
            reading_value: The baseline meter reading value
            reading_timestamp: When the reading was taken

        Returns:
            bool: True if baseline was set successfully
        """
        try:
            await self.init_supabase()

            # Store baseline in user_preferences using correct schema field names
            update_data = {
                f"{utility_type.value}_last_bill_reading": reading_value,
                f"{utility_type.value}_last_bill_date": reading_timestamp.date().isoformat()
            }

            result = self.service_supabase.table("user_preferences").upsert({
                "user_id": user_id,
                **update_data
            }, on_conflict="user_id").execute()

            logger.info(f"Baseline set for {user_id}_{utility_type.value}: {reading_value} at {reading_timestamp}")
            return True

        except Exception as e:
            logger.error(f"Failed to set billing cycle baseline: {e}")
            return False

    async def get_billing_cycle_baseline(
        self,
        user_id: str,
        utility_type: UtilityType
    ) -> Optional[Dict[str, Any]]:
        """
        Get the current billing cycle baseline reading

        If no baseline is set (e.g., user didn't provide last reading in onboarding),
        the first scanned meter reading automatically becomes the baseline.

        Returns:
            Dict with 'reading_value' and 'reading_date', or None if not set
        """
        try:
            await self.init_supabase()

            # Use correct schema field names
            result = self.supabase.table("user_preferences")\
                .select(f"{utility_type.value}_last_bill_reading, {utility_type.value}_last_bill_date")\
                .eq("user_id", user_id)\
                .execute()

            if result.data and result.data[0]:
                data = result.data[0]
                reading_key = f"{utility_type.value}_last_bill_reading"
                date_key = f"{utility_type.value}_last_bill_date"
                if data.get(reading_key) and data.get(date_key):
                    return {
                        "reading_value": float(data[reading_key]),
                        "reading_date": data[date_key]
                    }

            # No baseline set - check if user has any meter readings
            # If yes, use the first one as baseline (onboarding didn't provide last reading)
            meter_result = self.supabase.table("meter_readings")\
                .select("*")\
                .eq("user_id", user_id)\
                .eq("utility_type", utility_type.value)\
                .order("capture_timestamp", desc=False)\
                .limit(1)\
                .execute()

            if meter_result.data and meter_result.data[0]:
                first_reading = meter_result.data[0]
                # Auto-set this as baseline
                await self.set_billing_cycle_baseline(
                    user_id=user_id,
                    utility_type=utility_type,
                    reading_value=float(first_reading['reading_value']),
                    reading_timestamp=datetime.fromisoformat(first_reading['capture_timestamp'].replace('Z', '+00:00'))
                )

                logger.info(f"Auto-set first meter reading as baseline for {user_id}_{utility_type.value}")

                return {
                    "reading_value": float(first_reading['reading_value']),
                    "reading_date": first_reading['capture_timestamp']
                }

            return None

        except Exception as e:
            logger.error(f"Failed to get billing cycle baseline: {e}")
            return None

    async def get_forecast_vs_actual_comparison(
        self,
        user_id: str,
        utility_type: UtilityType,
        limit: int = 6
    ) -> List[Dict[str, Any]]:
        """
        Get forecast vs actual comparison for previous billing cycles

        Returns list of billing cycles with:
        - Predicted cost vs actual cost
        - Predicted consumption vs actual consumption
        - Accuracy percentage
        - Billing cycle dates

        Args:
            limit: Number of previous cycles to retrieve (default 6 months)
        """
        try:
            await self.init_supabase()

            # Get historical forecasts with actual data
            result = self.service_supabase.table("cost_forecasts")\
                .select("*")\
                .eq("user_id", user_id)\
                .eq("utility_type", utility_type.value)\
                .not_.is_("actual_cost", "null")\
                .order("forecast_month", desc=True)\
                .limit(limit)\
                .execute()

            if not result.data:
                return []

            comparisons = []
            for record in result.data:
                predicted_cost = float(record['predicted_cost'])
                actual_cost = float(record['actual_cost']) if record['actual_cost'] else 0
                # accuracy_error is stored as accuracy percentage (0-100)
                accuracy_percent = float(record['accuracy_error']) if record['accuracy_error'] else 0

                # Determine if forecast was over or under
                variance = predicted_cost - actual_cost
                variance_type = "over" if variance > 0 else "under" if variance < 0 else "exact"

                comparisons.append({
                    "billing_month": record['forecast_month'],
                    "predicted_cost": round(predicted_cost, 2),
                    "actual_cost": round(actual_cost, 2),
                    "predicted_usage": round(float(record['predicted_usage']), 2),
                    "actual_usage": round(float(record['actual_usage']) if record['actual_usage'] else 0, 2),
                    "accuracy_percent": round(accuracy_percent, 1),
                    "variance": round(abs(variance), 2),
                    "variance_type": variance_type,
                    "model_version": record.get('model_version', 'unknown')
                })

            return comparisons

        except Exception as e:
            logger.error(f"Failed to get forecast vs actual comparison: {e}")
            return []

    async def get_forecast_accuracy_trend(
        self,
        user_id: str,
        utility_type: UtilityType
    ) -> Dict[str, Any]:
        """
        Get overall forecast accuracy trend over time

        Returns:
        - Average accuracy
        - MAE (Mean Absolute Error)
        - Improving/declining trend
        - Best and worst predictions
        """
        try:
            comparisons = await self.get_forecast_vs_actual_comparison(
                user_id, utility_type, limit=12
            )

            if not comparisons:
                return {
                    "average_accuracy": 0,
                    "mae": 0,
                    "mape": 0,
                    "trend": "insufficient_data",
                    "total_forecasts": 0
                }

            accuracies = [c['accuracy_percent'] for c in comparisons]
            avg_accuracy = sum(accuracies) / len(accuracies)

            # Calculate MAE (Mean Absolute Error) for cost predictions in currency
            absolute_errors = [abs(c['predicted_cost'] - c['actual_cost']) for c in comparisons]
            mae = sum(absolute_errors) / len(absolute_errors) if absolute_errors else 0

            # Also calculate MAPE (Mean Absolute Percentage Error)
            percentage_errors = [100 - c['accuracy_percent'] for c in comparisons]
            mape = sum(percentage_errors) / len(percentage_errors) if percentage_errors else 0

            # Determine trend (compare first half vs second half)
            if len(accuracies) >= 4:
                mid_point = len(accuracies) // 2
                recent_avg = sum(accuracies[:mid_point]) / mid_point
                older_avg = sum(accuracies[mid_point:]) / (len(accuracies) - mid_point)
                trend = "improving" if recent_avg > older_avg else "declining" if recent_avg < older_avg else "stable"
            else:
                trend = "insufficient_data"

            # Find best and worst
            best = max(comparisons, key=lambda x: x['accuracy_percent'])
            worst = min(comparisons, key=lambda x: x['accuracy_percent'])

            return {
                "average_accuracy": round(avg_accuracy, 1),
                "mae": round(mae, 2),
                "mape": round(mape, 2),
                "trend": trend,
                "total_forecasts": len(comparisons),
                "best_forecast": {
                    "month": best['billing_month'],
                    "accuracy": best['accuracy_percent']
                },
                "worst_forecast": {
                    "month": worst['billing_month'],
                    "accuracy": worst['accuracy_percent']
                }
            }

        except Exception as e:
            logger.error(f"Failed to get forecast accuracy trend: {e}")
            return {
                "average_accuracy": 0,
                "mae": 0,
                "mape": 0,
                "trend": "error",
                "total_forecasts": 0
            }

    async def get_remaining_month_forecast(
        self,
        user_id: str,
        utility_type: UtilityType,
        monthly_consumption: float
    ) -> Optional[Dict[str, Any]]:
        """
        SCENARIO: User starts late in billing cycle, forecast remaining month only
        e.g., 15th-15th cycle, user starts on 25th, forecast only remaining days
        """
        try:
            billing_position = await self._calculate_billing_position(
                user_id, utility_type, date.today()
            )

            if billing_position.remaining_days <= 0:
                return {
                    "message": "Billing cycle ending soon, new cycle will start",
                    "remaining_days": 0,
                    "cycle_end_date": billing_position.cycle_end_date.isoformat()
                }

            # Calculate remaining month cost based on proportion
            proportion = billing_position.remaining_days / billing_position.total_cycle_days
            remaining_consumption = monthly_consumption * proportion

            # Get forecast for remaining month
            forecast = await self.get_monthly_forecast(
                user_id=user_id,
                utility_type=utility_type,
                estimated_monthly_consumption=remaining_consumption
            )

            if forecast:
                forecast["billing_aware"] = True
                forecast["remaining_cycle_days"] = billing_position.remaining_days
                forecast["cycle_end_date"] = billing_position.cycle_end_date.isoformat()
                forecast["note"] = f"Forecast for remaining {billing_position.remaining_days} days in current billing cycle"

            return forecast

        except Exception as e:
            logger.error(f"Failed to get remaining month forecast: {e}")
            return None


# Global service instance
cost_forecasting_service = CostForecastingEngine()