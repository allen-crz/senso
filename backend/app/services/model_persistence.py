"""
Model persistence service for storing/loading trained models in Supabase
"""
import joblib
import io
import base64
import os

# Set joblib to use threading backend instead of multiprocessing to avoid Windows spawn issues
joblib.parallel_backend('threading', n_jobs=1)
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timezone

from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from loguru import logger

from app.core.database import get_supabase, get_service_supabase
from app.models.schemas import UtilityType


class ModelPersistenceService:
    """Service for persisting ML models in Supabase"""
    
    def __init__(self):
        self.supabase = None
    
    async def init_supabase(self):
        """Initialize Supabase client with service role to bypass RLS"""
        if not self.supabase:
            self.supabase = await get_service_supabase()
    
    def _serialize_model(self, model: Any) -> str:
        """Serialize model to base64 string"""
        buffer = io.BytesIO()
        # Use threading backend to avoid Windows multiprocessing spawn issues
        with joblib.parallel_backend('threading', n_jobs=1):
            joblib.dump(model, buffer, compress=False)
        return base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    def _deserialize_model(self, model_data: str) -> Any:
        """Deserialize model from base64 string"""
        buffer = io.BytesIO(base64.b64decode(model_data))
        # Use threading backend to avoid Windows multiprocessing spawn issues
        with joblib.parallel_backend('threading', n_jobs=1):
            return joblib.load(buffer)
    
    async def save_model(
        self,
        user_id: str,
        utility_type: UtilityType,
        isolation_forest: IsolationForest,
        scaler: StandardScaler,
        feature_columns: list,
        contamination_rate: float,
        performance_metrics: Dict[str, Any],
        readings_count: int,
        model_version: str
    ) -> bool:
        """Save trained model to database with enhanced error handling"""

        import time

        try:
            await self.init_supabase()
            logger.info(f"💾 Starting model save for user {user_id}, utility {utility_type}")

            # Serialize models with timing
            start_time = time.time()
            logger.info("🔄 Serializing isolation forest model...")
            model_data = self._serialize_model(isolation_forest)
            logger.info(f"✅ Isolation forest serialized ({time.time() - start_time:.2f}s)")

            start_time = time.time()
            logger.info("🔄 Serializing scaler...")
            scaler_data = self._serialize_model(scaler)
            logger.info(f"✅ Scaler serialized ({time.time() - start_time:.2f}s)")

            # Prepare model record
            model_record = {
                "user_id": user_id,
                "utility_type": utility_type.value,
                "model_data": model_data,
                "scaler_data": scaler_data,
                "feature_columns": feature_columns,
                "contamination_rate": contamination_rate,
                "performance_metrics": performance_metrics,
                "readings_count": readings_count,
                "last_trained_at": datetime.now(timezone.utc).isoformat(),
                "model_version": model_version,
                "is_active": True
            }

            # Upsert with timing
            start_time = time.time()
            logger.info("🔄 Upserting model to database...")
            result = self.supabase.table("user_isolation_models").upsert(
                model_record,
                on_conflict="user_id,utility_type"
            ).execute()
            logger.info(f"✅ Database upsert completed ({time.time() - start_time:.2f}s)")

            if result.data:
                logger.info(f"✅ Model successfully saved for user {user_id}, utility {utility_type}")
                return True
            else:
                logger.error("❌ Failed to save model - no data returned from upsert")
                return False

        except Exception as e:
            logger.error(f"❌ Error saving model for {user_id}_{utility_type}: {e}")
            logger.error(f"❌ Exception type: {type(e).__name__}")
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            return False
    
    async def load_model(
        self,
        user_id: str,
        utility_type: UtilityType
    ) -> Optional[Tuple[IsolationForest, StandardScaler, Dict[str, Any]]]:
        """Load trained model from database"""
        
        await self.init_supabase()
        
        try:
            result = self.supabase.table("user_isolation_models").select("*").eq(
                "user_id", user_id
            ).eq("utility_type", utility_type.value).eq("is_active", True).maybe_single().execute()

            if not result.data:
                logger.info(f"No saved model found for user {user_id}, utility {utility_type}")
                return None
            
            model_record = result.data
            
            # Deserialize models
            isolation_forest = self._deserialize_model(model_record["model_data"])
            scaler = self._deserialize_model(model_record["scaler_data"])
            
            metadata = {
                "feature_columns": model_record["feature_columns"],
                "contamination": model_record["contamination_rate"],
                "performance_metrics": model_record["performance_metrics"],
                "training_timestamp": model_record["last_trained_at"],
                "readings_count": model_record["readings_count"],
                "model_version": model_record["model_version"]
            }
            
            logger.info(f"Model loaded for user {user_id}, utility {utility_type}")
            return isolation_forest, scaler, metadata
            
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return None
    
    async def should_retrain_model(
        self,
        user_id: str,
        utility_type: UtilityType,
        current_readings_count: int
    ) -> bool:
        """Determine if model should be retrained using smart logic"""

        await self.init_supabase()

        try:
            logger.info(f"🔍 Checking retrain status for user {user_id}, utility {utility_type.value}, readings: {current_readings_count}")

            result = self.supabase.table("user_isolation_models").select("*").eq(
                "user_id", user_id
            ).eq("utility_type", utility_type.value).maybe_single().execute()

            if not result.data:
                logger.info(f"✅ No model exists for user {user_id} - SHOULD TRAIN")
                return True  # No model exists, need to train

            model_record = result.data
            last_trained_at = datetime.fromisoformat(model_record["last_trained_at"].replace('Z', '+00:00'))
            saved_readings_count = model_record["readings_count"]

            # Smart retraining logic matching your requirements
            new_readings = current_readings_count - saved_readings_count
            days_since_training = (datetime.now(timezone.utc).replace(tzinfo=last_trained_at.tzinfo) - last_trained_at).days

            logger.info(f"📊 Model exists: saved_count={saved_readings_count}, new_readings={new_readings}, days_since={days_since_training}")

            # < 7 readings: retrain on every new reading
            if current_readings_count < 7:
                should_train = new_readings > 0
                logger.info(f"🔄 <7 readings rule: new_readings={new_readings} > 0 = {should_train}")
                return should_train

            # 7-14 readings: weekly retraining
            elif current_readings_count < 14:
                should_train = days_since_training >= 7
                logger.info(f"📅 7-14 readings rule: days_since={days_since_training} >= 7 = {should_train}")
                return should_train

            # 14+ readings: bi-weekly retraining
            else:
                should_train = days_since_training >= 14
                logger.info(f"🗓️ 14+ readings rule: days_since={days_since_training} >= 14 = {should_train}")
                return should_train

        except Exception as e:
            logger.error(f"❌ Error checking retrain status: {e}")
            return True  # Default to retrain on error
    
    async def get_model_stats(
        self,
        user_id: str,
        utility_type: UtilityType
    ) -> Optional[Dict[str, Any]]:
        """Get model statistics"""
        
        await self.init_supabase()
        
        try:
            result = self.supabase.table("user_isolation_models").select("*").eq(
                "user_id", user_id
            ).eq("utility_type", utility_type.value).maybe_single().execute()

            if not result.data:
                return None
            
            model_record = result.data
            
            return {
                "user_id": user_id,
                "utility_type": utility_type.value,
                "readings_count": model_record["readings_count"],
                "last_trained_at": model_record["last_trained_at"],
                "model_version": model_record["model_version"],
                "contamination_rate": model_record["contamination_rate"],
                "performance_metrics": model_record["performance_metrics"],
                "feature_count": len(model_record["feature_columns"])
            }
            
        except Exception as e:
            logger.error(f"Error getting model stats: {e}")
            return None

    # ====================================
    # FORECASTING MODEL METHODS
    # ====================================

    async def save_forecasting_model(
        self,
        user_id: str,
        utility_type: UtilityType,
        linear_regression: LinearRegression,
        feature_names: list,
        performance_metrics: Dict[str, Any],
        training_data_size: int,
        scaler: Optional[StandardScaler] = None,
        training_features_std: Optional[Dict[str, float]] = None,
        model_version: str = "1.0"
    ) -> bool:
        """Save trained forecasting model to database"""

        await self.init_supabase()

        try:
            # Serialize LinearRegression model and scaler
            model_data = self._serialize_model(linear_regression)
            scaler_data = self._serialize_model(scaler) if scaler else None

            # Use pre-calculated feature importance from progressive forecasting or calculate fallback
            feature_importance = performance_metrics.get("feature_importance", {})
            predictor_strength = performance_metrics.get("predictor_strength", {})

            # Fallback calculation if not provided
            if not feature_importance and hasattr(linear_regression, 'coef_') and training_features_std:
                # Feature importance = |coefficient| * feature_std_deviation
                coefficients = linear_regression.coef_
                for i, feature_name in enumerate(feature_names):
                    if feature_name in training_features_std:
                        importance = abs(coefficients[i]) * training_features_std[feature_name]
                        feature_importance[feature_name] = float(importance)

                # Normalize to percentages
                total_importance = sum(feature_importance.values())
                if total_importance > 0:
                    feature_importance = {
                        name: (importance / total_importance) * 100
                        for name, importance in feature_importance.items()
                    }

            # Use predictor strength as feature importance if available (progressive forecasting provides better metrics)
            if predictor_strength and not feature_importance:
                feature_importance = predictor_strength

            # Enhanced performance metrics with predictor strengths - ensure JSON serializable
            def clean_for_json(obj):
                """Convert object to JSON serializable format"""
                if hasattr(obj, 'tolist'):  # numpy array
                    return obj.tolist()
                elif isinstance(obj, (int, float, str, bool, type(None))):
                    return obj
                elif isinstance(obj, dict):
                    return {str(k): clean_for_json(v) for k, v in obj.items()}
                elif isinstance(obj, (list, tuple)):
                    return [clean_for_json(item) for item in obj]
                else:
                    return str(obj)

            enhanced_metrics = clean_for_json({
                **performance_metrics,
                "feature_importance": feature_importance,
                "predictor_strength": predictor_strength if predictor_strength else feature_importance,  # Use actual predictor strength or fallback to feature importance
                "model_coefficients": linear_regression.coef_.tolist() if hasattr(linear_regression, 'coef_') else [],
                "intercept": float(linear_regression.intercept_) if hasattr(linear_regression, 'intercept_') else 0.0
            })

            # Note: Training log is already created by _create_training_log() and updated by _update_training_status()
            # No need to create duplicate logs here

            logger.info(f"Forecasting model saved for user {user_id}, utility {utility_type}")

            # Also store the serialized model (we could create a separate table or extend existing)
            # For now, store model data in the log record's performance_metrics
            # Create clean, JSON-serializable model record
            try:
                # Validate all components are JSON serializable
                import json
                test_enhanced_metrics = clean_for_json(enhanced_metrics)
                test_feature_names = clean_for_json(feature_names)

                # Test serialization
                json.dumps(test_enhanced_metrics)
                json.dumps(test_feature_names)

                logger.info("JSON serialization test passed")

            except Exception as json_error:
                logger.error(f"JSON serialization failed: {json_error}")
                # Create minimal fallback data
                test_enhanced_metrics = {
                    "r2_score": float(enhanced_metrics.get("r2_score", 0.0)) if enhanced_metrics.get("r2_score") is not None else 0.0,
                    "mae": float(enhanced_metrics.get("mae", 0.0)) if enhanced_metrics.get("mae") is not None else 0.0,
                    "training_phase": str(enhanced_metrics.get("training_phase", "unknown"))
                }
                test_feature_names = [str(name) for name in feature_names if name is not None]

            model_record = {
                "user_id": user_id,
                "utility_type": utility_type.value,
                "model_type": "linear_regression",
                "model_data": model_data,
                "scaler_data": scaler_data,
                "feature_names": test_feature_names,
                "performance_metrics": test_enhanced_metrics,
                "training_data_size": training_data_size,
                "model_version": model_version,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True
            }

            # Create user_forecasting_models table entry (if table exists)
            try:
                # Use upsert to update existing model instead of creating duplicates
                # This ensures we maintain ONE model per user per utility type
                self.supabase.table("user_forecasting_models").upsert(
                    model_record,
                    on_conflict="user_id,utility_type"
                ).execute()
                logger.info(f"Model upserted (updated/inserted) in user_forecasting_models for {user_id}")
            except Exception as table_error:
                logger.warning(f"user_forecasting_models table not found or upsert failed: {table_error}")

            return True

        except Exception as e:
            logger.error(f"Error saving forecasting model: {e}")
            return False

    async def load_forecasting_model(
        self,
        user_id: str,
        utility_type: UtilityType
    ) -> Optional[Dict[str, Any]]:
        """Load trained forecasting model from database"""

        await self.init_supabase()

        try:
            # Try to load from user_forecasting_models table first
            try:
                result = self.supabase.table("user_forecasting_models").select("*").eq(
                    "user_id", user_id
                ).eq("utility_type", utility_type.value).eq("is_active", True).order(
                    "created_at", desc=True
                ).limit(1).execute()

                if result.data and len(result.data) > 0:
                    model_record = result.data[0]

                    # Deserialize model and scaler
                    linear_regression = self._deserialize_model(model_record["model_data"])
                    scaler = None
                    if model_record.get("scaler_data"):
                        try:
                            scaler = self._deserialize_model(model_record["scaler_data"])
                        except Exception as scaler_error:
                            logger.warning(f"Failed to deserialize scaler: {scaler_error}")
                            # No scaler available - will handle in prediction
                            scaler = None

                    # Extract user_daily_avg from performance metrics if available
                    performance_metrics = model_record["performance_metrics"]
                    user_daily_avg = performance_metrics.get("user_daily_avg", 5.0)  # fallback

                    # Convert timestamp string to datetime object
                    trained_at_str = model_record["created_at"]
                    if isinstance(trained_at_str, str):
                        trained_at = datetime.fromisoformat(trained_at_str.replace('Z', '+00:00'))
                    else:
                        trained_at = datetime.now(timezone.utc)

                    # Return structure expected by cost_forecasting_service
                    model_data = {
                        "model": linear_regression,
                        "scaler": scaler,
                        "feature_names": model_record["feature_names"],
                        "performance": {
                            "r2_score": performance_metrics.get("r2_score", 0.0),
                            "mae": performance_metrics.get("mae", 0.0),
                            "training_samples": model_record["training_data_size"]
                        },
                        "feature_importance": performance_metrics.get("feature_importance", {}),
                        "predictor_strength": performance_metrics.get("predictor_strength", {}),
                        "trained_at": trained_at,
                        "user_daily_avg": user_daily_avg
                    }

                    return model_data

            except Exception as table_error:
                logger.warning(f"Could not load from user_forecasting_models: {table_error}")

            # Fallback: Load latest from unified model_training_logs
            # Load cost_forecasting models only
            result = self.supabase.table("model_training_logs").select("*").eq(
                "user_id", user_id
            ).eq("utility_type", utility_type.value).eq("training_status", "completed").eq(
                "model_type", "cost_forecasting_lr"
            ).order("training_completed_at", desc=True).limit(1).execute()

            if result.data and len(result.data) > 0:
                logger.info(f"Found forecasting model log for user {user_id}, but no serialized model data")
                return None  # Model exists in logs but no serialized data

            return None

        except Exception as e:
            logger.error(f"Error loading forecasting model: {e}")
            return None


# Global service instance
model_persistence_service = ModelPersistenceService()