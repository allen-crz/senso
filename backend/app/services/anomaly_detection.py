"""
Anomaly detection service using Isolation Forest for utility consumption patterns
"""
import numpy as np
import pandas as pd
import statistics
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from decimal import Decimal
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib
from pathlib import Path
import asyncio
import threading
from collections import OrderedDict
import time
from functools import wraps
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import get_supabase, get_service_supabase
from app.models.schemas import UtilityType, AnomalySeverity, AnomalyDetectionResponse
from app.services.model_persistence import model_persistence_service
from loguru import logger


class LRUCache(OrderedDict):
    """Thread-safe LRU cache with TTL support"""
    
    def __init__(self, max_size=50, ttl_hours=24):
        super().__init__()
        self.max_size = max_size
        self.ttl_seconds = ttl_hours * 3600
        self._lock = threading.RLock()
        self._access_times = {}
    
    def get(self, key, default=None):
        with self._lock:
            if key not in self:
                return default
            
            # Check TTL
            if self._is_expired(key):
                self._remove_expired(key)
                return default
            
            # Move to end (most recently used)
            self.move_to_end(key)
            self._access_times[key] = time.time()
            return super().__getitem__(key)
    
    def put(self, key, value):
        with self._lock:
            current_time = time.time()
            
            if key in self:
                # Update existing key
                self[key] = value
                self.move_to_end(key)
            else:
                # Add new key
                self[key] = value
                
                # Remove oldest if over capacity
                while len(self) > self.max_size:
                    oldest_key = next(iter(self))
                    self._remove_expired(oldest_key)
            
            self._access_times[key] = current_time
    
    def _is_expired(self, key):
        return (time.time() - self._access_times.get(key, 0)) > self.ttl_seconds
    
    def _remove_expired(self, key):
        if key in self:
            del self[key]
            self._access_times.pop(key, None)
    
    def cleanup_expired(self):
        """Remove all expired entries"""
        with self._lock:
            expired_keys = [k for k in self if self._is_expired(k)]
            for key in expired_keys:
                self._remove_expired(key)
            return len(expired_keys)


class AdaptiveContaminationManager:
    """Manages adaptive contamination rates for progressive anomaly detection"""

    def __init__(self):
        self.contamination_history = {}
        self.performance_history = {}

    def get_adaptive_contamination_rate(
        self,
        data_size: int,
        utility_type: UtilityType,
        historical_anomalies: int = 0
    ) -> float:
        """
        Adaptive contamination rate based on dataset maturity and utility type
        """

        # Calculate actual contamination from history
        actual_contamination = historical_anomalies / data_size if data_size > 0 else 0

        # Stage-based contamination
        if data_size <= 3:
            # BOOTSTRAP STAGE: Use rule-based only
            return None  # Skip ML training

        elif data_size <= 10:
            # EARLY STAGE: Ultra-conservative, expect almost no anomalies
            base_rate = 0.005  # 0.5%

        elif data_size <= 20:
            # LEARNING STAGE: Conservative but learning
            base_rate = 0.02   # 2%

        elif data_size <= 50:
            # DEVELOPMENT STAGE: More realistic expectations
            base_rate = 0.05   # 5%

        else:
            # MATURE STAGE: Normal ML expectations
            base_rate = 0.10   # 10%

        # Utility-specific adjustments
        utility_multiplier = {
            UtilityType.WATER: 0.8,      # Water tends to be more stable
            UtilityType.ELECTRICITY: 1.2  # Electricity more variable
        }.get(utility_type, 1.0)

        adjusted_rate = base_rate * utility_multiplier

        # Blend with actual history (if available)
        if historical_anomalies > 0 and data_size >= 10:
            # Weight actual vs expected (70% actual, 30% expected)
            final_rate = (0.7 * actual_contamination) + (0.3 * adjusted_rate)
        else:
            final_rate = adjusted_rate

        # Safety bounds
        return max(0.001, min(0.15, final_rate))  # Between 0.1% and 15%

    def get_anomaly_threshold(self, data_size: int, model_performance: dict) -> float:
        """
        Dynamic anomaly threshold based on dataset size and model confidence
        """

        # Base threshold (more negative = stricter)
        # ADJUSTED: Made thresholds more lenient to reduce false positives
        if data_size <= 5:
            base_threshold = -0.02   # Extra lenient for very small datasets
        elif data_size <= 15:
            base_threshold = -0.05   # More lenient
        elif data_size <= 30:
            base_threshold = -0.15   # Moderately lenient
        else:
            base_threshold = -0.25   # Slightly more lenient than before

        # Adjust based on model performance
        model_accuracy = model_performance.get('accuracy', 0.5)
        if model_accuracy < 0.6:
            # Poor model = be more lenient
            base_threshold *= 0.5
        elif model_accuracy > 0.8:
            # Good model = can be stricter
            base_threshold *= 1.5

        return base_threshold

    def update_contamination_strategy(
        self,
        user_id: str,
        utility_type: UtilityType,
        new_data_size: int,
        recent_anomalies: list,
        model_performance: dict
    ) -> dict:
        """
        Update contamination strategy based on progressive learning
        """

        key = f"{user_id}_{utility_type.value}"

        # Get historical context
        history = self.contamination_history.get(key, {
            'total_readings': 0,
            'total_anomalies': 0,
            'false_positives': 0,
            'confirmed_anomalies': 0
        })

        # Update history
        history['total_readings'] = new_data_size
        history['total_anomalies'] += len(recent_anomalies)

        # Calculate new contamination rate
        contamination_rate = self.get_adaptive_contamination_rate(
            new_data_size,
            utility_type,
            history['confirmed_anomalies']
        )

        # Determine training strategy
        training_strategy = self._get_training_strategy(
            new_data_size,
            contamination_rate,
            model_performance
        )

        # Store updated history
        self.contamination_history[key] = history

        return {
            'contamination_rate': contamination_rate,
            'training_strategy': training_strategy,
            'use_ml': new_data_size >= 4,  # Minimum for ML
            'confidence_threshold': self.get_anomaly_threshold(new_data_size, model_performance),
            'stage': self._get_data_stage(new_data_size)
        }

    def _get_training_strategy(self, data_size: int, contamination: float, performance: dict) -> str:
        if data_size < 4:
            return 'rule_based_only'
        elif data_size < 15:
            return 'hybrid_conservative'  # Rules + ML with high threshold
        elif performance.get('f1_score', 0) < 0.3:
            return 'retrain_with_lower_contamination'
        else:
            return 'normal_ml'

    def _get_data_stage(self, data_size: int) -> str:
        if data_size <= 3: return 'bootstrap'
        elif data_size <= 10: return 'early'
        elif data_size <= 20: return 'learning'
        elif data_size <= 50: return 'development'
        else: return 'mature'


class AnomalyDetectionService:
    """Service for detecting anomalies in utility consumption using Isolation Forest

    Maintains one model per user per utility type with improved caching and performance.
    """

    def __init__(self):
        # Thread-safe LRU cache for models (ONE MODEL PER USER PER UTILITY)
        self.models = LRUCache(max_size=100, ttl_hours=24)  # Increased capacity

        # Feature cache for performance optimization
        self.feature_cache = LRUCache(max_size=500, ttl_hours=6)  # Shorter TTL for features

        # Adaptive contamination manager
        self.contamination_manager = AdaptiveContaminationManager()

        self.supabase = None
        self._supabase_lock = threading.Lock()
        
        # Performance tracking and circuit breaker state
        self.performance_metrics = {
            'cache_hits': 0,
            'cache_misses': 0,
            'total_predictions': 0,
            'successful_predictions': 0,
            'failed_predictions': 0,
            'avg_prediction_time': 0,
            'training_count': 0,
            'db_failures': 0,
            'circuit_breaker_trips': 0
        }
        
        # Circuit breaker for database operations
        self.db_circuit_breaker = {
            'failure_count': 0,
            'last_failure_time': None,
            'failure_threshold': 5,  # Trip after 5 consecutive failures
            'recovery_timeout': 300,  # 5 minutes
            'is_open': False
        }
        
        self.last_cleanup = datetime.utcnow()
        
    async def init_supabase(self):
        """Thread-safe Supabase client initialization"""
        if not self.supabase:
            with self._supabase_lock:
                if not self.supabase:  # Double-check pattern
                    from app.core.database import get_service_supabase
                    self.supabase = await get_service_supabase()

    def invalidate_cache(self, user_id: str, utility_type: UtilityType) -> None:
        """Invalidate cached historical data when new reading is added

        This ensures that anomaly detection always works with fresh data.
        """
        # Invalidate all cache entries for this user+utility combination
        # since we don't know which exact cache key was used (could be with/without time window)
        cache_prefix = f"clean_hist_{user_id}_{utility_type.value}"

        # Clear matching cache entries
        # LRUCache extends OrderedDict, so iterate directly on it
        keys_to_remove = [key for key in self.feature_cache.keys() if key.startswith(cache_prefix)]
        for key in keys_to_remove:
            self.feature_cache.pop(key, None)

        logger.info(f"Invalidated {len(keys_to_remove)} cache entries for {user_id}_{utility_type.value}")

    def _cleanup_stale_models(self) -> None:
        """Cleanup expired models and features from cache"""
        now = datetime.utcnow()
        
        # Only run cleanup periodically to avoid overhead
        if (now - self.last_cleanup).total_seconds() < 1800:  # 30 minutes
            return
        
        self.last_cleanup = now
        
        # Cleanup both model and feature caches
        model_cleanup_count = self.models.cleanup_expired()
        feature_cleanup_count = self.feature_cache.cleanup_expired()
        
        if model_cleanup_count > 0 or feature_cleanup_count > 0:
            logger.info(f"Memory cleanup: removed {model_cleanup_count} models, {feature_cleanup_count} feature caches")
    
    def _should_skip_db_operation(self) -> bool:
        """Circuit breaker: check if database operations should be skipped"""
        breaker = self.db_circuit_breaker
        
        if not breaker['is_open']:
            return False
        
        # Check if recovery timeout has passed
        if breaker['last_failure_time']:
            time_since_failure = time.time() - breaker['last_failure_time']
            if time_since_failure > breaker['recovery_timeout']:
                # Reset circuit breaker for testing
                breaker['is_open'] = False
                breaker['failure_count'] = 0
                logger.info("Circuit breaker reset - attempting database operations")
                return False
        
        return True
    
    def _record_db_failure(self):
        """Record a database failure for circuit breaker"""
        breaker = self.db_circuit_breaker
        breaker['failure_count'] += 1
        breaker['last_failure_time'] = time.time()
        self.performance_metrics['db_failures'] += 1
        
        if breaker['failure_count'] >= breaker['failure_threshold']:
            breaker['is_open'] = True
            self.performance_metrics['circuit_breaker_trips'] += 1
            logger.error(f"Circuit breaker tripped after {breaker['failure_count']} failures")
    
    def _record_db_success(self):
        """Record a successful database operation"""
        # Reset failure count on success
        self.db_circuit_breaker['failure_count'] = 0
    
    @asynccontextmanager
    async def _safe_db_operation(self):
        """Context manager for safe database operations with circuit breaker"""
        if self._should_skip_db_operation():
            raise Exception("Database circuit breaker is open")
        
        try:
            yield
            self._record_db_success()
        except Exception as e:
            self._record_db_failure()
            raise e
    
    async def detect_anomaly(self, user_id: str, reading_id: str) -> Optional[AnomalyDetectionResponse]:
        """Detect anomaly for a specific reading"""
        
        start_time = time.time()
        self.performance_metrics['total_predictions'] += 1
        
        try:
            await self.init_supabase()
            
            # Perform periodic cleanup
            self._cleanup_stale_models()
            
            # Get the reading with circuit breaker protection
            async with self._safe_db_operation():
                reading_result = self.supabase.table("meter_readings")\
                    .select("*")\
                    .eq("id", reading_id)\
                    .single()\
                    .execute()
            
            if not reading_result.data:
                logger.error(f"Reading {reading_id} not found")
                return None
            
            reading = reading_result.data
            utility_type = UtilityType(reading["utility_type"])
            
            # Get historical data for training (exclude current reading) with error handling
            # Use ALL data (including anomalous) for threshold counting and context
            # For early detection, bypass time window to ensure we get all readings
            try:
                all_historical_data = await self._get_historical_data(user_id, utility_type, bypass_time_window=True)
            except Exception as e:
                logger.error(f"Failed to get historical data for {user_id}: {e}")
                return None

            # Remove current reading from historical data to prevent including it in comparison
            logger.info(f"All historical data before filtering: {len(all_historical_data)} readings")
            if not all_historical_data.empty:
                logger.info(f"Current reading ID: {reading_id}")
                logger.info(f"Historical reading IDs: {all_historical_data['id'].tolist()}")
                all_historical_data = all_historical_data[all_historical_data['id'] != reading_id]
                logger.info(f"All historical data after filtering: {len(all_historical_data)} readings")

            # SMART PATTERN LEARNING: User-pattern based detection for early users (before ML model)
            # This learns from user's actual patterns without hardcoded assumptions
            # Use ALL data count (including anomalous) for threshold decision
            logger.info(f"🔍 DECISION POINT: Historical data count = {len(all_historical_data)}")
            if len(all_historical_data) <= 3:  # Use smart pattern detection for 3 or fewer readings
                logger.info(f"✅ USING SMART PATTERN DETECTION for user {user_id}, utility {utility_type} ({len(all_historical_data)} readings)")
                result = await self._smart_pattern_detection(user_id, reading, all_historical_data)
                logger.info(f"🎯 Smart pattern detection result: {result}")
                if result:
                    logger.info(f"🚨 ANOMALY DETECTED: {result.is_anomaly}, severity: {result.severity}")
                else:
                    logger.info("✅ No anomaly detected by smart pattern detection")
                return result
            else:
                logger.info(f"❌ SKIPPING smart pattern detection - too many readings ({len(all_historical_data)}), using ML model")
            
            # Check if we should use rule-based detection for small datasets
            recent_anomalies = []  # TODO: Get from database if needed
            current_performance = {'accuracy': 0.5, 'f1_score': 0.0}

            contamination_config = self.contamination_manager.update_contamination_strategy(
                user_id, utility_type, len(all_historical_data) + 1, recent_anomalies, current_performance
            )

            # Use rule-based detection for very small datasets
            if not contamination_config['use_ml']:
                logger.info(f"🔧 Using rule-based detection for small dataset ({len(all_historical_data)} readings)")
                rule_result = await self._rule_based_anomaly_detection(user_id, reading)
                if rule_result:
                    return await self._save_anomaly_detection(user_id, reading_id, rule_result)
                else:
                    # No anomaly detected by rules
                    return None

            # Continue with full ML model for users with sufficient data

            # ONE MODEL PER USER: Load or train user-specific model using smart retraining logic
            model_key = f"{user_id}_{utility_type.value}"
            current_readings_count = len(all_historical_data)
            
            logger.info(f"Using personalized ML model for user {user_id}, utility {utility_type} ({current_readings_count} historical readings)")
            
            # Check cache first (performance optimization)
            cached_model = self.models.get(model_key)
            should_retrain = False
            
            if cached_model:
                self.performance_metrics['cache_hits'] += 1
                logger.info(f"🎯 Found cached model for {user_id}_{utility_type.value}")
                # Check if model needs retraining based on new data
                try:
                    should_retrain = await model_persistence_service.should_retrain_model(
                        user_id, utility_type, current_readings_count
                    )
                    logger.info(f"🔄 Cached model retrain check result: {should_retrain}")
                except Exception as e:
                    logger.error(f"Model persistence error, keeping cached model: {e}")
                    should_retrain = False
            else:
                self.performance_metrics['cache_misses'] += 1
                logger.info(f"❌ No cached model for {user_id}_{utility_type.value}, checking database...")
                # Try to load from database first
                try:
                    loaded_model = await model_persistence_service.load_model(user_id, utility_type)
                    if loaded_model:
                        isolation_forest, scaler, metadata = loaded_model
                        model_data = {
                            "model": isolation_forest,
                            "scaler": scaler,
                            "training_timestamp": datetime.utcnow(),
                            **metadata
                        }
                        self.models.put(model_key, model_data)
                        logger.info(f"📥 Loaded personalized model from database for {user_id}_{utility_type.value}")
                    else:
                        logger.info(f"💾 No model in database for {user_id}_{utility_type.value}")
                        should_retrain = True
                except Exception as e:
                    logger.error(f"Failed to load model from database: {e}")
                    should_retrain = True

            # Train new model if needed (maintaining one model per user)
            if should_retrain:
                logger.info(f"🚀 TRAINING TRIGGERED for {user_id}_{utility_type.value} (readings: {current_readings_count})")
                try:
                    await self._train_personalized_model(user_id, utility_type, all_historical_data)
                    self.performance_metrics['training_count'] += 1
                    logger.info(f"✅ Training completed successfully for {user_id}_{utility_type.value}")
                except Exception as e:
                    logger.error(f"❌ Personalized model training failed: {e}")
                    # Continue with rollback detection even if training fails
            else:
                logger.info(f"⏸️ No training needed for {user_id}_{utility_type.value}")

            # CRITICAL: Check for meter rollback FIRST - meters should never go backwards
            # This is a simple, reliable check that catches ANY backward movement
            rollback_anomaly = await self._check_simple_rollback(reading, all_historical_data)
            if rollback_anomaly:
                logger.critical(f"🚨 CRITICAL ROLLBACK DETECTED for reading {reading_id}")
                return rollback_anomaly

            # Enhanced rollback check using clean data (for edge cases)
            enhanced_rollback = await self._check_meter_rollback_enhanced(user_id, reading, all_historical_data)
            if enhanced_rollback:
                return enhanced_rollback
            
            # Predict anomaly using ML model
            anomaly_result = await self._predict_anomaly(reading, model_key)
            
            if anomaly_result:
                # Save anomaly detection result
                return await self._save_anomaly_detection(user_id, reading_id, anomaly_result)
            
            # Record successful prediction
            self.performance_metrics['successful_predictions'] += 1
            
            # Update average prediction time
            prediction_time = time.time() - start_time
            current_avg = self.performance_metrics['avg_prediction_time']
            total_predictions = self.performance_metrics['total_predictions']
            self.performance_metrics['avg_prediction_time'] = (
                (current_avg * (total_predictions - 1) + prediction_time) / total_predictions
            )
            
            return None
            
        except Exception as e:
            # Record failed prediction
            self.performance_metrics['failed_predictions'] += 1
            
            # Log different types of errors appropriately
            if "circuit breaker" in str(e).lower():
                logger.warning(f"Anomaly detection skipped due to circuit breaker: {e}")
            else:
                logger.error(f"Anomaly detection failed: {e}")
            
            return None
    
    async def _get_clean_historical_data(self, user_id: str, utility_type: UtilityType, days: int = None, exclude_anomalous: bool = True, bypass_time_window: bool = False) -> pd.DataFrame:
        """Get historical readings with option to exclude anomalous data

        Args:
            user_id: User identifier
            utility_type: Type of utility (water/electricity)
            days: Number of days to look back
            exclude_anomalous: If True, excludes readings marked as anomalous
            bypass_time_window: If True, gets ALL readings regardless of time window

        Returns:
            Clean DataFrame suitable for forecasting and analysis
        """

        if days is None and not bypass_time_window:
            days = settings.TRAINING_WINDOW_DAYS

        # Cache key includes bypass flag
        cache_key = f"clean_hist_{user_id}_{utility_type.value}_{days}_{exclude_anomalous}_{bypass_time_window}"

        # Check cache first
        cached_data = self.feature_cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        # For bypass mode, don't apply time window restriction
        if not bypass_time_window:
            start_date = datetime.utcnow() - timedelta(days=days)
        else:
            logger.info(f"🚀 BYPASS MODE: Getting ALL readings for user {user_id} (no time window)")

        try:
            # Ensure Supabase client is initialized
            await self.init_supabase()
            if exclude_anomalous:
                # Query that excludes anomalous readings using LEFT JOIN
                # This ensures we get clean data for cost forecasting
                if bypass_time_window:
                    # Get ALL readings without time restriction
                    result = await self._execute_clean_data_query(
                        user_id, utility_type.value, None  # No start_date restriction
                    )
                else:
                    # Use time window
                    result = await self._execute_clean_data_query(
                        user_id, utility_type.value, start_date.isoformat()
                    )
            else:
                # Original query that includes all readings
                query = self.supabase.table("meter_readings")\
                    .select("id,reading_value,capture_timestamp,utility_type")\
                    .eq("user_id", user_id)\
                    .eq("utility_type", utility_type.value)

                # Apply time window only if not bypassed
                if not bypass_time_window:
                    query = query.gte("capture_timestamp", start_date.isoformat())

                result = query.order("capture_timestamp")\
                    .limit(1000)\
                    .execute()
            
            if not result or (hasattr(result, 'data') and not result.data):
                empty_df = pd.DataFrame()
                self.feature_cache.put(cache_key, empty_df)
                return empty_df
            
            # Handle different result formats
            data = result.data if hasattr(result, 'data') else result
            
            # Convert to DataFrame with optimized dtypes
            df = pd.DataFrame(data)
            if not df.empty:
                df['capture_timestamp'] = pd.to_datetime(df['capture_timestamp'], utc=True)
                df['reading_value'] = pd.to_numeric(df['reading_value'], errors='coerce')
                
                # Remove any rows with invalid data
                df = df.dropna(subset=['reading_value'])
            
            # Cache the result
            self.feature_cache.put(cache_key, df)
            
            logger.info(f"Retrieved {'clean' if exclude_anomalous else 'all'} historical data: {len(df)} readings")
            return df
            
        except Exception as e:
            logger.error(f"Failed to get {'clean' if exclude_anomalous else 'all'} historical data: {e}")
            # Return empty DataFrame and cache it to avoid repeated failures
            empty_df = pd.DataFrame()
            self.feature_cache.put(cache_key, empty_df)
            return empty_df
    
    async def _execute_clean_data_query(self, user_id: str, utility_type: str, start_date: str = None) -> list:
        """Execute SQL query to get clean data excluding anomalous readings"""
        try:
            # Ensure Supabase client is initialized
            await self.init_supabase()
            # For now, fall back to filtering after query since supabase RPC might be needed
            # Get all readings first
            query = self.supabase.table("meter_readings")\
                .select("id,reading_value,capture_timestamp,utility_type")\
                .eq("user_id", user_id)\
                .eq("utility_type", utility_type)

            # Apply time filter only if start_date is provided
            if start_date is not None:
                query = query.gte("capture_timestamp", start_date)

            all_readings = query.order("capture_timestamp")\
                .limit(1000)\
                .execute()
            
            if not all_readings.data:
                return []
            
            # Get anomalous reading IDs
            anomalous_readings = self.supabase.table("anomaly_detections")\
                .select("reading_id")\
                .eq("user_id", user_id)\
                .eq("utility_type", utility_type)\
                .eq("is_anomaly", True)\
                .execute()
            
            anomalous_ids = {item['reading_id'] for item in anomalous_readings.data} if anomalous_readings.data else set()
            
            # Filter out anomalous readings
            clean_readings = [reading for reading in all_readings.data if reading['id'] not in anomalous_ids]
            
            return type('Result', (), {'data': clean_readings})()
            
        except Exception as e:
            logger.error(f"Clean data query failed: {e}")
            raise
    
    async def _get_historical_data(self, user_id: str, utility_type: UtilityType, days: int = None, bypass_time_window: bool = False) -> pd.DataFrame:
        """Get ALL historical readings (including anomalous) - Legacy method

        Use _get_clean_historical_data() for cost forecasting and analysis.
        This method is kept for backward compatibility and audit purposes.
        """
        return await self._get_clean_historical_data(user_id, utility_type, days, exclude_anomalous=False, bypass_time_window=bypass_time_window)
    
    async def get_data_for_cost_forecasting(self, user_id: str, utility_type: UtilityType, days: int = None) -> pd.DataFrame:
        """Get clean historical data specifically for cost forecasting
        
        This method excludes anomalous readings to prevent inflated cost predictions.
        Use this for all financial calculations and user-facing forecasts.
        """
        return await self._get_clean_historical_data(user_id, utility_type, days, exclude_anomalous=True)
    
    async def _inject_baseline_reading_if_needed(
        self,
        user_id: str,
        utility_type: UtilityType,
        readings_df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Inject baseline reading from user preferences if:
        1. User has a last_bill_reading configured
        2. User's first reading is after the billing cycle start
        3. This provides context for mid-cycle joiners
        """
        try:
            from app.services.cost_forecasting import cost_forecasting_service

            # Get baseline from user preferences
            baseline = await cost_forecasting_service.get_billing_cycle_baseline(
                user_id, utility_type
            )

            if not baseline:
                return readings_df

            baseline_value = baseline.get('reading_value')
            baseline_date = baseline.get('reading_date')

            if not baseline_value or not baseline_date:
                return readings_df

            # Check if we already have a reading at or before baseline date
            if not readings_df.empty:
                baseline_timestamp = pd.to_datetime(baseline_date, utc=True)
                earliest_reading = pd.to_datetime(readings_df['capture_timestamp'].min(), utc=True)

                # Only inject if first reading is AFTER baseline date
                if earliest_reading <= baseline_timestamp:
                    logger.info(f"Baseline already covered by readings, skipping injection")
                    return readings_df

                logger.info(f"Injecting baseline reading: {baseline_value} at {baseline_date} for mid-cycle user")

                # Create baseline reading row
                baseline_row = pd.DataFrame([{
                    'id': f"baseline_{user_id}_{utility_type.value}",
                    'reading_value': float(baseline_value),
                    'capture_timestamp': baseline_timestamp,
                    'utility_type': utility_type.value
                }])

                # Prepend baseline to readings
                readings_df = pd.concat([baseline_row, readings_df], ignore_index=True)
                readings_df = readings_df.sort_values('capture_timestamp').reset_index(drop=True)

                logger.info(f"✅ Baseline injected. Total readings now: {len(readings_df)}")

            return readings_df

        except Exception as e:
            logger.warning(f"Could not inject baseline reading: {e}")
            return readings_df

    async def get_data_for_analysis(self, user_id: str, utility_type: UtilityType, days: int = None) -> pd.DataFrame:
        """Get clean historical data for statistical analysis and pattern detection

        Excludes anomalous readings to ensure accurate trend analysis and model training.
        Automatically includes baseline reading if user joined mid-cycle.
        """
        readings_df = await self._get_clean_historical_data(user_id, utility_type, days, exclude_anomalous=True)

        # Inject baseline reading for mid-cycle users
        readings_df = await self._inject_baseline_reading_if_needed(user_id, utility_type, readings_df)

        return readings_df
    
    async def get_last_known_good_reading(self, user_id: str, utility_type: UtilityType, before_timestamp: datetime = None) -> Optional[Dict[str, Any]]:
        """Get the most recent non-anomalous reading for rollback detection
        
        Args:
            user_id: User identifier
            utility_type: Type of utility
            before_timestamp: Only consider readings before this time
            
        Returns:
            Dictionary with reading data or None if no good reading found
        """
        try:
            # Get clean data (excludes anomalous readings)
            clean_data = await self._get_clean_historical_data(user_id, utility_type, days=30, exclude_anomalous=True)
            
            if clean_data.empty:
                return None
            
            # Filter by timestamp if provided
            if before_timestamp:
                clean_data = clean_data[clean_data['capture_timestamp'] < before_timestamp]
            
            if clean_data.empty:
                return None
            
            # Get the most recent clean reading
            latest_clean = clean_data.iloc[-1]
            
            return {
                'id': latest_clean['id'],
                'reading_value': float(latest_clean['reading_value']),
                'capture_timestamp': latest_clean['capture_timestamp'],
                'utility_type': latest_clean['utility_type']
            }
            
        except Exception as e:
            logger.error(f"Failed to get last known good reading: {e}")
            return None
    
    async def get_consumption_statistics(self, user_id: str, utility_type: UtilityType, days: int = 30) -> Dict[str, float]:
        """Get consumption statistics using clean data for accurate analysis
        
        Returns statistics based on non-anomalous readings only.
        Use this for user dashboards and consumption insights.
        """
        try:
            clean_data = await self.get_data_for_analysis(user_id, utility_type, days)
            
            if len(clean_data) < 2:
                return {
                    'daily_avg': 0.0,
                    'daily_max': 0.0,
                    'daily_min': 0.0,
                    'total_consumption': 0.0,
                    'trend': 'insufficient_data',
                    'readings_count': len(clean_data),
                    'clean_readings_count': len(clean_data)
                }
            
            # Calculate daily consumption from clean data
            clean_data = clean_data.sort_values('capture_timestamp')
            daily_consumption = clean_data['reading_value'].diff().dropna()
            daily_consumption = daily_consumption[daily_consumption >= 0]  # Remove negative values
            
            if daily_consumption.empty:
                return {
                    'daily_avg': 0.0,
                    'daily_max': 0.0,
                    'daily_min': 0.0,
                    'total_consumption': 0.0,
                    'trend': 'no_valid_consumption',
                    'readings_count': len(clean_data),
                    'clean_readings_count': len(clean_data)
                }
            
            # Calculate trend (simple linear regression on recent data)
            recent_readings = clean_data.tail(7) if len(clean_data) >= 7 else clean_data
            if len(recent_readings) >= 3:
                x = np.arange(len(recent_readings))
                y = recent_readings['reading_value'].values
                trend_slope = np.polyfit(x, y, 1)[0]
                
                if trend_slope > 5:  # Increasing
                    trend = 'increasing'
                elif trend_slope < -5:  # Decreasing
                    trend = 'decreasing'
                else:
                    trend = 'stable'
            else:
                trend = 'insufficient_data'
            
            return {
                'daily_avg': float(daily_consumption.mean()),
                'daily_max': float(daily_consumption.max()),
                'daily_min': float(daily_consumption.min()),
                'total_consumption': float(daily_consumption.sum()),
                'trend': trend,
                'readings_count': len(clean_data),
                'clean_readings_count': len(clean_data)
            }
            
        except Exception as e:
            logger.error(f"Failed to calculate consumption statistics: {e}")
            return {
                'daily_avg': 0.0,
                'daily_max': 0.0,
                'daily_min': 0.0,
                'total_consumption': 0.0,
                'trend': 'error',
                'readings_count': 0,
                'clean_readings_count': 0
            }
        
        if days is None:
            days = settings.TRAINING_WINDOW_DAYS
        
        # Cache key for historical data
        cache_key = f"hist_{user_id}_{utility_type.value}_{days}"
        
        # Check cache first
        cached_data = self.feature_cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        try:
            # Optimized query: select only needed columns and add limit
            result = self.supabase.table("meter_readings")\
                .select("id,reading_value,capture_timestamp,utility_type")\
                .eq("user_id", user_id)\
                .eq("utility_type", utility_type.value)\
                .gte("capture_timestamp", start_date.isoformat())\
                .order("capture_timestamp")\
                .limit(1000)\
                .execute()
            
            if not result.data:
                empty_df = pd.DataFrame()
                self.feature_cache.put(cache_key, empty_df)
                return empty_df
            
            # Convert to DataFrame with optimized dtypes
            df = pd.DataFrame(result.data)
            df['capture_timestamp'] = pd.to_datetime(df['capture_timestamp'], utc=True)
            df['reading_value'] = pd.to_numeric(df['reading_value'], errors='coerce')
            
            # Remove any rows with invalid data
            df = df.dropna(subset=['reading_value'])
            
            # Cache the result
            self.feature_cache.put(cache_key, df)
            
            return df
            
        except Exception as e:
            logger.error(f"Failed to get historical data: {e}")
            # Return empty DataFrame and cache it to avoid repeated failures
            empty_df = pd.DataFrame()
            self.feature_cache.put(cache_key, empty_df)
            return empty_df
    
    async def _smart_pattern_detection(self, user_id: str, current_reading: Dict, historical_data: pd.DataFrame) -> Optional[AnomalyDetectionResponse]:
        """Smart pattern learning detection for new users (0-3 readings)

        Uses user's actual patterns without hardcoded assumptions.
        Learns from statistical deviations and user feedback.
        """

        current_value = float(current_reading['reading_value'])
        utility_type = UtilityType(current_reading['utility_type'])
        reading_id = current_reading['id']
        readings_count = len(historical_data)

        try:
            logger.info(f"🔄 SMART PATTERN DETECTION: user {user_id} with {readings_count} historical readings")
            logger.info(f"📊 Current reading value: {current_value}")
            logger.info(f"📋 Historical data shape: {historical_data.shape if not historical_data.empty else 'EMPTY'}")

            # Handle different scenarios based on number of historical readings
            if readings_count == 0:
                logger.info("🎯 FIRST READING - using _detect_first_reading()")
                return await self._detect_first_reading(current_value, reading_id, user_id)
            elif readings_count == 1:
                logger.info("🎯 SECOND READING - using _detect_second_reading()")
                return await self._detect_second_reading(current_value, historical_data, reading_id, user_id)
            elif readings_count == 2:
                logger.info("🎯 THIRD READING - using _detect_third_reading()")
                return await self._detect_third_reading(current_value, historical_data, reading_id, user_id, utility_type)
            elif readings_count == 3:
                logger.info("🎯 FOURTH READING - using _detect_fourth_reading()")
                return await self._detect_fourth_reading(current_value, historical_data, reading_id, user_id, utility_type)
            else:
                logger.warning(f"❌ Smart pattern detection called with {readings_count} readings - should use ML model")
                return None

        except Exception as e:
            logger.error(f"Smart pattern detection failed: {e}")
            return None

    async def _detect_first_reading(self, current_value: float, reading_id: str, user_id: str) -> Optional[AnomalyDetectionResponse]:
        """First reading - accept any non-negative baseline"""
        if current_value < 0:
            anomaly_data = {
                "is_anomaly": True,
                "anomaly_score": 1.0,
                "severity": AnomalySeverity.HIGH,
                "threshold_used": 0.0,
                "contributing_factors": {
                    "reason": "Negative meter reading impossible",
                    "explanation": "Meter readings cannot be negative",
                    "detection_method": "first_reading_validation"
                },
                "model_version": settings.MODEL_VERSION
            }
            return await self._save_anomaly_detection(user_id, reading_id, anomaly_data)

        logger.info(f"First reading accepted as baseline: {current_value}")
        return None

    async def _detect_second_reading(self, current_value: float, historical_data: pd.DataFrame, reading_id: str, user_id: str) -> Optional[AnomalyDetectionResponse]:
        """Second reading - only rollback detection"""
        baseline_value = float(historical_data.iloc[0]['reading_value'])
        consumption = current_value - baseline_value

        # Simple rollback detection - meters are cumulative
        if consumption < 0:
            anomaly_data = {
                "is_anomaly": True,
                "anomaly_score": 0.9,
                "severity": AnomalySeverity.HIGH,
                "threshold_used": baseline_value,
                "contributing_factors": {
                    "reason": "Meter rollback detected",
                    "explanation": f"Reading decreased from {baseline_value} to {current_value}",
                    "detection_method": "rollback_detection",
                    "consumption": float(consumption)
                },
                "model_version": settings.MODEL_VERSION
            }
            return await self._save_anomaly_detection(user_id, reading_id, anomaly_data)

        logger.info(f"Second reading accepted, consumption: {consumption}")
        return None

    async def _detect_third_reading(self, current_value: float, historical_data: pd.DataFrame, reading_id: str, user_id: str, utility_type: UtilityType) -> Optional[AnomalyDetectionResponse]:
        """Third reading - ratio analysis vs user's clean pattern"""
        logger.info(f"🔍 THIRD READING DETECTION: current={current_value}, user={user_id}")

        # Get clean historical data (excluding anomalous readings)
        # For early detection, bypass time window to ensure we get all readings
        logger.info(f"📡 Fetching clean data for analysis (bypass time window)...")
        clean_data = await self._get_clean_historical_data(user_id, utility_type, days=30, exclude_anomalous=True, bypass_time_window=True)
        logger.info(f"📊 Clean data retrieved: {len(clean_data)} readings")

        # If no clean data available, use all historical data as fallback
        if clean_data.empty:
            logger.warning(f"⚠️ No clean data found, using historical data as fallback")
            clean_data = historical_data
        else:
            logger.info(f"✅ Using clean data for pattern analysis")

        readings = clean_data.sort_values('capture_timestamp')
        logger.info(f"📋 Sorted readings: {len(readings)} readings")

        # Get the most recent clean reading for comparison
        if len(readings) == 0:
            logger.warning(f"⚠️ No clean readings available - using historical data")
            readings = historical_data.sort_values('capture_timestamp')

        previous_value = float(readings.iloc[-1]['reading_value'])
        consumption = current_value - previous_value
        logger.info(f"🧮 CALCULATION: current={current_value}, previous={previous_value}, consumption={consumption}")

        # Rollback check
        if consumption < 0:
            anomaly_data = {
                "is_anomaly": True,
                "anomaly_score": 0.9,
                "severity": AnomalySeverity.HIGH,
                "threshold_used": previous_value,
                "contributing_factors": {
                    "reason": "Meter rollback detected",
                    "explanation": f"Reading decreased from {previous_value} to {current_value}",
                    "detection_method": "rollback_detection"
                },
                "model_version": settings.MODEL_VERSION
            }
            return await self._save_anomaly_detection(user_id, reading_id, anomaly_data)

        # Smart ratio analysis using user's clean consumption pattern
        logger.info(f"🎯 PATTERN ANALYSIS: analyzing {len(readings)} readings for pattern")
        if len(readings) >= 2:
            # Calculate clean consumption patterns only
            clean_consumptions = []
            reading_values = readings['reading_value'].tolist()
            logger.info(f"📊 Reading values for pattern: {reading_values}")

            for i in range(1, len(reading_values)):
                clean_consumption = reading_values[i] - reading_values[i-1]
                if clean_consumption >= 0:  # Only positive consumptions
                    clean_consumptions.append(clean_consumption)
                    logger.info(f"✅ Clean consumption {i}: {clean_consumption}")

            logger.info(f"📈 All clean consumptions: {clean_consumptions}")

            if clean_consumptions:
                avg_clean_consumption = sum(clean_consumptions) / len(clean_consumptions)
                logger.info(f"🧮 Average clean consumption: {avg_clean_consumption}")

                if avg_clean_consumption > 0:  # Avoid division by zero
                    ratio = consumption / avg_clean_consumption
                    logger.info(f"🔥 RATIO CALCULATION: {consumption} / {avg_clean_consumption} = {ratio}")

                    if ratio > 4.0:
                        logger.info(f"🚨 HIGH ANOMALY DETECTED: ratio {ratio} > 4.0")
                        severity = AnomalySeverity.HIGH
                        score = 0.85
                    elif ratio > 2.5:
                        logger.info(f"⚠️ MEDIUM ANOMALY DETECTED: ratio {ratio} > 2.5")
                        severity = AnomalySeverity.MEDIUM
                        score = 0.7
                    elif ratio > 1.8:
                        logger.info(f"⚡ LOW ANOMALY DETECTED: ratio {ratio} > 1.8")
                        severity = AnomalySeverity.LOW
                        score = 0.55
                    else:
                        logger.info(f"✅ NO ANOMALY: ratio {ratio} <= 1.8")
                        return None  # No anomaly

                    anomaly_data = {
                        "is_anomaly": True,
                        "anomaly_score": score,
                        "severity": severity,
                        "threshold_used": avg_clean_consumption,
                        "contributing_factors": {
                            "reason": f"Usage {ratio:.1f}x higher than your clean pattern",
                            "explanation": f"Current consumption: {consumption}, clean average: {avg_clean_consumption:.1f}",
                            "detection_method": "clean_pattern_ratio_analysis",
                            "consumption_ratio": float(ratio),
                            "clean_readings_used": len(clean_consumptions)
                        },
                        "model_version": settings.MODEL_VERSION
                    }
                    return await self._save_anomaly_detection(user_id, reading_id, anomaly_data)

        return None

    async def _improved_early_detection(self, user_id: str, reading_id: str, current_value: float,
                                       historical_data: pd.DataFrame, utility_type: UtilityType) -> Optional[AnomalyDetectionResponse]:
        """
        Improved multi-threshold detection for early readings (4th+ reading)
        Uses median/mode for baseline and multiple detection thresholds
        """
        try:
            # Get clean data for accurate baseline
            clean_data = await self.get_data_for_analysis(user_id, utility_type, days=30)

            if clean_data.empty:
                clean_data = historical_data

            readings = clean_data.sort_values('capture_timestamp')

            # Rollback check first
            if len(readings) > 0:
                last_clean_value = float(readings.iloc[-1]['reading_value'])
                current_consumption = current_value - last_clean_value

                if current_consumption < 0:
                    rollback_amount = last_clean_value - current_value
                    anomaly_data = {
                        "is_anomaly": True,
                        "anomaly_score": 0.95,
                        "severity": AnomalySeverity.CRITICAL,
                        "threshold_used": last_clean_value,
                        "confidence": "high",
                        "contributing_factors": {
                            "reason": "Meter rollback detected",
                            "current_reading": current_value,
                            "previous_reading": last_clean_value,
                            "rollback_amount": float(rollback_amount),
                            "explanation": f"Reading decreased from {last_clean_value} to {current_value}",
                            "detection_method": "rollback_detection",
                            "detection_type": "critical"
                        },
                        "model_version": settings.MODEL_VERSION
                    }
                    return await self._save_anomaly_detection(user_id, reading_id, anomaly_data)
            else:
                return None

            # Calculate consumption patterns
            if len(readings) >= 2:
                clean_consumptions = []
                reading_values = readings['reading_value'].tolist()

                for i in range(1, len(reading_values)):
                    consumption = reading_values[i] - reading_values[i-1]
                    if consumption >= 0:
                        clean_consumptions.append(consumption)

                if len(clean_consumptions) < 2:
                    return None

                # IMPROVED: Use median for robust baseline (resistant to outliers)
                import statistics
                median_consumption = statistics.median(clean_consumptions)
                mean_consumption = statistics.mean(clean_consumptions)

                # Calculate mode (most frequent pattern) if we have enough data
                if len(clean_consumptions) >= 3:
                    # Group consumptions into bins to find mode
                    from collections import Counter
                    # Round to nearest 5 for binning
                    binned = [round(c / 5) * 5 for c in clean_consumptions]
                    mode_bin = Counter(binned).most_common(1)[0][0]
                    mode_consumption = mode_bin
                else:
                    mode_consumption = median_consumption

                std_consumption = statistics.stdev(clean_consumptions) if len(clean_consumptions) > 1 else 0

                logger.info(f"📊 Baseline stats: median={median_consumption:.2f}, mean={mean_consumption:.2f}, mode={mode_consumption:.2f}, std={std_consumption:.2f}")
                logger.info(f"📊 Current consumption: {current_consumption:.2f}")

                # MULTI-THRESHOLD DETECTION

                # Threshold 1: SPIKE Detection (Sudden massive jump)
                # 5x the mode or median (whichever is more conservative)
                baseline_for_spike = max(mode_consumption, median_consumption)
                spike_threshold = baseline_for_spike * 5

                if current_consumption > spike_threshold and baseline_for_spike > 0:
                    anomaly_data = {
                        "is_anomaly": True,
                        "anomaly_score": 0.85,
                        "severity": AnomalySeverity.HIGH,
                        "threshold_used": float(spike_threshold),
                        "confidence": "medium",  # Medium confidence due to limited data
                        "contributing_factors": {
                            "reason": "Sudden consumption spike detected",
                            "explanation": f"Consumption jumped to {current_consumption:.1f}, which is {current_consumption/baseline_for_spike:.1f}x your typical usage",
                            "current_consumption": float(current_consumption),
                            "typical_consumption": float(baseline_for_spike),
                            "spike_ratio": float(current_consumption / baseline_for_spike),
                            "detection_method": "spike_detection",
                            "detection_type": "spike",
                            "baseline_type": "median" if baseline_for_spike == median_consumption else "mode"
                        },
                        "model_version": settings.MODEL_VERSION
                    }
                    logger.info(f"🚨 SPIKE DETECTED: {current_consumption:.1f} > {spike_threshold:.1f} (5x baseline)")
                    return await self._save_anomaly_detection(user_id, reading_id, anomaly_data)

                # Threshold 2: SIGNIFICANT INCREASE (3x mode/median)
                significant_threshold = baseline_for_spike * 3

                if current_consumption > significant_threshold and baseline_for_spike > 0:
                    anomaly_data = {
                        "is_anomaly": True,
                        "anomaly_score": 0.70,
                        "severity": AnomalySeverity.MEDIUM,
                        "threshold_used": float(significant_threshold),
                        "confidence": "medium",
                        "contributing_factors": {
                            "reason": "Significant consumption increase",
                            "explanation": f"Consumption is {current_consumption/baseline_for_spike:.1f}x higher than typical",
                            "current_consumption": float(current_consumption),
                            "typical_consumption": float(baseline_for_spike),
                            "increase_ratio": float(current_consumption / baseline_for_spike),
                            "detection_method": "threshold_detection",
                            "detection_type": "increase",
                            "note": "This may be seasonal usage or new appliance. Please verify."
                        },
                        "model_version": settings.MODEL_VERSION
                    }
                    logger.info(f"⚠️  INCREASE DETECTED: {current_consumption:.1f} > {significant_threshold:.1f} (3x baseline)")
                    return await self._save_anomaly_detection(user_id, reading_id, anomaly_data)

                # Threshold 3: STATISTICAL OUTLIER (median + 3*std)
                # More robust than mean + 3*std
                if std_consumption > 0:
                    statistical_threshold = median_consumption + (3 * std_consumption)

                    if current_consumption > statistical_threshold:
                        anomaly_data = {
                            "is_anomaly": True,
                            "anomaly_score": 0.60,
                            "severity": AnomalySeverity.MEDIUM,
                            "threshold_used": float(statistical_threshold),
                            "confidence": "low",  # Low confidence with limited data
                            "contributing_factors": {
                                "reason": "Statistical outlier detected",
                                "explanation": f"Consumption deviates significantly from your pattern",
                                "current_consumption": float(current_consumption),
                                "median_consumption": float(median_consumption),
                                "std_deviation": float(std_consumption),
                                "z_score": float((current_consumption - median_consumption) / std_consumption) if std_consumption > 0 else 0,
                                "detection_method": "statistical_outlier",
                                "detection_type": "outlier",
                                "note": "Based on limited data. Pattern will be confirmed with more readings."
                            },
                            "model_version": settings.MODEL_VERSION
                        }
                        logger.info(f"📈 OUTLIER DETECTED: {current_consumption:.1f} > {statistical_threshold:.1f} (median + 3σ)")
                        return await self._save_anomaly_detection(user_id, reading_id, anomaly_data)

            # No anomaly detected
            logger.info(f"✅ No anomaly: consumption {current_consumption:.1f} is within normal range")
            return None

        except Exception as e:
            logger.error(f"Improved early detection failed: {e}")
            return None

    async def _detect_fourth_reading(self, current_value: float, historical_data: pd.DataFrame, reading_id: str, user_id: str, utility_type: UtilityType) -> Optional[AnomalyDetectionResponse]:
        """Fourth reading - use improved detection"""
        return await self._improved_early_detection(user_id, reading_id, current_value, historical_data, utility_type)

    async def _check_physical_limits(self, user_id: str, current_reading: Dict, historical_data: pd.DataFrame, utility_type: UtilityType) -> Optional[Dict[str, Any]]:
        """Check for physically impossible consumption rates (not absolute readings)

        This method now properly checks consumption between readings rather than absolute meter values.
        For new users with no history, we allow any reasonable baseline reading.
        """

        current_value = float(current_reading['reading_value'])
        reading_id = current_reading['id']

        # For new users (no historical data), don't flag baseline readings
        if len(historical_data) == 0:
            logger.info(f"New user - skipping physical limits check for baseline reading: {current_value}")
            return None

        # Calculate consumption since last reading
        try:
            # Get the most recent historical reading
            last_reading = historical_data.iloc[-1]
            last_value = float(last_reading['reading_value'])

            # Calculate time difference
            current_time = pd.to_datetime(current_reading['capture_timestamp'], utc=True)
            last_time = pd.to_datetime(last_reading['capture_timestamp'], utc=True)
            time_diff_hours = (current_time - last_time).total_seconds() / 3600

            # Prevent division by zero and handle negative time differences
            if time_diff_hours <= 0:
                logger.warning(f"Invalid time difference: {time_diff_hours} hours")
                return None

            # Check for meter rollback (should be handled elsewhere, but safety check)
            if current_value < last_value:
                logger.info(f"Meter rollback detected in physical limits: {current_value} < {last_value}")
                # Don't flag here as rollback is handled by specific rollback detection
                return None

            # Calculate consumption
            consumption = current_value - last_value

            logger.info(f"Physical limits check - consumption: {consumption}, time_diff: {time_diff_hours}h")

            # IMPROVED LOGIC: Use adaptive thresholds based on time period and user patterns
            # Get user's historical consumption patterns for context
            try:
                clean_historical = await self.get_data_for_analysis(user_id, utility_type, days=30)
                if not clean_historical.empty and len(clean_historical) >= 5:
                    # Calculate user's typical daily consumption from clean data
                    clean_historical = clean_historical.sort_values('capture_timestamp')
                    daily_consumption_hist = clean_historical['reading_value'].diff().dropna()
                    daily_consumption_hist = daily_consumption_hist[daily_consumption_hist >= 0]

                    if len(daily_consumption_hist) > 0:
                        user_avg_daily = daily_consumption_hist.mean()
                        user_max_daily = daily_consumption_hist.quantile(0.95)  # 95th percentile
                    else:
                        user_avg_daily = None
                        user_max_daily = None
                else:
                    user_avg_daily = None
                    user_max_daily = None
            except Exception as e:
                logger.warning(f"Could not get user consumption patterns: {e}")
                user_avg_daily = None
                user_max_daily = None

            if time_diff_hours <= 6:
                # SHORT PERIODS (≤6 hours): Use actual consumption limits with user context
                if utility_type == UtilityType.WATER:
                    # Adaptive limit based on user patterns or fallback to conservative limit
                    if user_max_daily is not None:
                        # Allow up to 2x user's 95th percentile for short periods (burst usage)
                        adaptive_limit = max(1500, user_max_daily * 2.0)  # Minimum 1500L for safety
                    else:
                        adaptive_limit = 2000  # Increased from 1000L - more lenient for new users

                    if consumption > adaptive_limit:
                        return {
                            "is_anomaly": True,
                            "anomaly_score": 0.85,  # Reduced from 0.9
                            "severity": AnomalySeverity.HIGH,  # Reduced from CRITICAL
                            "threshold_used": adaptive_limit,
                            "contributing_factors": {
                                "reason": "High water consumption detected",
                                "actual_consumption": float(consumption),
                                "time_period_hours": float(time_diff_hours),
                                "current_reading": current_value,
                                "previous_reading": last_value,
                                "user_avg_daily": float(user_avg_daily) if user_avg_daily else None,
                                "adaptive_threshold": True,
                                "explanation": f"Consumed {consumption:.1f} liters in {time_diff_hours:.1f} hours - exceeds user-adapted threshold",
                                "detection_method": "adaptive_consumption_limits",
                                "threshold_type": "actual_consumption"
                            },
                            "model_version": settings.MODEL_VERSION
                        }

                elif utility_type == UtilityType.ELECTRICITY:
                    # Adaptive limit based on user patterns
                    if user_max_daily is not None:
                        # Allow up to 2x user's 95th percentile for short periods
                        adaptive_limit = max(80, user_max_daily * 2.0)  # Minimum 80kWh for safety
                    else:
                        adaptive_limit = 120  # Increased from 60kWh - more lenient for new users

                    if consumption > adaptive_limit:
                        return {
                            "is_anomaly": True,
                            "anomaly_score": 0.85,  # Reduced from 0.9
                            "severity": AnomalySeverity.HIGH,  # Reduced from CRITICAL
                            "threshold_used": adaptive_limit,
                            "contributing_factors": {
                                "reason": "High electricity consumption detected",
                                "actual_consumption": float(consumption),
                                "time_period_hours": float(time_diff_hours),
                                "current_reading": current_value,
                                "previous_reading": last_value,
                                "user_avg_daily": float(user_avg_daily) if user_avg_daily else None,
                                "adaptive_threshold": True,
                                "explanation": f"Consumed {consumption:.1f} kWh in {time_diff_hours:.1f} hours - exceeds user-adapted threshold",
                                "detection_method": "adaptive_consumption_limits",
                                "threshold_type": "actual_consumption"
                            },
                            "model_version": settings.MODEL_VERSION
                        }

            elif 6 < time_diff_hours <= 12:
                # MEDIUM PERIODS (6-12 hours): Use dampened extrapolation to reduce sensitivity
                # Apply dampening factor to account for non-linear usage patterns
                dampening_factor = 0.7  # Reduce extrapolation by 30%
                daily_consumption = consumption * (24 / time_diff_hours) * dampening_factor

                if utility_type == UtilityType.WATER:
                    # Use user-adaptive threshold or higher fallback
                    if user_max_daily is not None:
                        rate_limit = max(4000, user_max_daily * 3.0)  # 3x user's max with minimum
                    else:
                        rate_limit = 5000  # Increased from 3000L - much more lenient

                    if daily_consumption > rate_limit:
                        return {
                            "is_anomaly": True,
                            "anomaly_score": 0.7,  # Reduced from 0.8
                            "severity": AnomalySeverity.MEDIUM,  # Reduced from HIGH
                            "threshold_used": rate_limit,
                            "contributing_factors": {
                                "reason": "Elevated water consumption rate detected",
                                "daily_consumption": float(daily_consumption),
                                "actual_consumption": float(consumption),
                                "time_period_hours": float(time_diff_hours),
                                "current_reading": current_value,
                                "previous_reading": last_value,
                                "dampening_factor": dampening_factor,
                                "user_avg_daily": float(user_avg_daily) if user_avg_daily else None,
                                "explanation": f"Dampened usage rate of {daily_consumption:.1f} liters/day exceeds adaptive threshold",
                                "detection_method": "dampened_extrapolation_limits",
                                "threshold_type": "dampened_daily_rate"
                            },
                            "model_version": settings.MODEL_VERSION
                        }

                elif utility_type == UtilityType.ELECTRICITY:
                    # Use user-adaptive threshold or higher fallback
                    if user_max_daily is not None:
                        rate_limit = max(200, user_max_daily * 3.0)  # 3x user's max with minimum
                    else:
                        rate_limit = 250  # Increased from 150kWh - much more lenient

                    if daily_consumption > rate_limit:
                        return {
                            "is_anomaly": True,
                            "anomaly_score": 0.7,  # Reduced from 0.8
                            "severity": AnomalySeverity.MEDIUM,  # Reduced from HIGH
                            "threshold_used": rate_limit,
                            "contributing_factors": {
                                "reason": "Elevated electricity consumption rate detected",
                                "daily_consumption": float(daily_consumption),
                                "actual_consumption": float(consumption),
                                "time_period_hours": float(time_diff_hours),
                                "current_reading": current_value,
                                "previous_reading": last_value,
                                "dampening_factor": dampening_factor,
                                "user_avg_daily": float(user_avg_daily) if user_avg_daily else None,
                                "explanation": f"Dampened usage rate of {daily_consumption:.1f} kWh/day exceeds adaptive threshold",
                                "detection_method": "dampened_extrapolation_limits",
                                "threshold_type": "dampened_daily_rate"
                            },
                            "model_version": settings.MODEL_VERSION
                        }

            else:
                # LONG PERIODS (>12 hours): Use heavily dampened extrapolation
                # Even more conservative for long periods to prevent false positives
                dampening_factor = 0.5  # Reduce extrapolation by 50% for long periods
                daily_consumption = consumption * (24 / time_diff_hours) * dampening_factor

                logger.info(f"Long period dampened extrapolation - daily_rate: {daily_consumption} (factor: {dampening_factor})")

                if utility_type == UtilityType.WATER:
                    # Use user-adaptive threshold or very high fallback
                    if user_max_daily is not None:
                        rate_limit = max(6000, user_max_daily * 4.0)  # 4x user's max for long periods
                    else:
                        rate_limit = 8000  # Increased from 2000L - very lenient for long periods

                    if daily_consumption > rate_limit:
                        return {
                            "is_anomaly": True,
                            "anomaly_score": 0.75,  # Reduced from 0.9
                            "severity": AnomalySeverity.MEDIUM,  # Reduced from CRITICAL
                            "threshold_used": rate_limit,
                            "contributing_factors": {
                                "reason": "Very high water consumption rate detected",
                                "daily_consumption": float(daily_consumption),
                                "actual_consumption": float(consumption),
                                "time_period_hours": float(time_diff_hours),
                                "current_reading": current_value,
                                "previous_reading": last_value,
                                "dampening_factor": dampening_factor,
                                "user_avg_daily": float(user_avg_daily) if user_avg_daily else None,
                                "explanation": f"Heavily dampened rate of {daily_consumption:.1f} liters/day exceeds conservative threshold",
                                "detection_method": "conservative_extrapolation_limits",
                                "threshold_type": "conservative_daily_rate"
                            },
                            "model_version": settings.MODEL_VERSION
                        }

                elif utility_type == UtilityType.ELECTRICITY:
                    # Use user-adaptive threshold or very high fallback
                    if user_max_daily is not None:
                        rate_limit = max(300, user_max_daily * 4.0)  # 4x user's max for long periods
                    else:
                        rate_limit = 400  # Increased from 100kWh - very lenient for long periods

                    if daily_consumption > rate_limit:
                        return {
                            "is_anomaly": True,
                            "anomaly_score": 0.75,  # Reduced from 0.9
                            "severity": AnomalySeverity.MEDIUM,  # Reduced from CRITICAL
                            "threshold_used": rate_limit,
                            "contributing_factors": {
                                "reason": "Very high electricity consumption rate detected",
                                "daily_consumption": float(daily_consumption),
                                "actual_consumption": float(consumption),
                                "time_period_hours": float(time_diff_hours),
                                "current_reading": current_value,
                                "previous_reading": last_value,
                                "dampening_factor": dampening_factor,
                                "user_avg_daily": float(user_avg_daily) if user_avg_daily else None,
                                "explanation": f"Heavily dampened rate of {daily_consumption:.1f} kWh/day exceeds conservative threshold",
                                "detection_method": "conservative_extrapolation_limits",
                                "threshold_type": "conservative_daily_rate"
                            },
                            "model_version": settings.MODEL_VERSION
                        }

            return None

        except Exception as e:
            logger.error(f"Failed to check physical limits: {e}")
            return None
    
    async def _progressive_pattern_detection(self, user_id: str, reading_id: str, current_value: float, 
                                           historical_data: pd.DataFrame, utility_type: UtilityType) -> Optional[AnomalyDetectionResponse]:
        """Pattern-based detection using user's own early data"""
        
        try:
            # Calculate daily consumption differences
            readings = historical_data['reading_value'].tolist() + [current_value]
            daily_consumptions = []
            
            for i in range(1, len(readings)):
                consumption = readings[i] - readings[i-1]
                if consumption >= 0:  # Valid consumption (meter went forward)
                    daily_consumptions.append(consumption)
            
            if len(daily_consumptions) < 2:
                return None
            
            # Calculate basic statistics from user's own data
            mean_consumption = np.mean(daily_consumptions)
            std_consumption = np.std(daily_consumptions)
            current_consumption = current_value - readings[-2] if len(readings) >= 2 else 0
            
            # Flag if current consumption is > mean + 3*std (99.7% confidence)
            if std_consumption > 0 and current_consumption > mean_consumption + (3 * std_consumption):
                anomaly_score = min(0.8, (current_consumption - mean_consumption) / (4 * std_consumption))
                
                severity = AnomalySeverity.HIGH if anomaly_score > 0.7 else AnomalySeverity.MEDIUM
                
                anomaly_data = {
                    "is_anomaly": True,
                    "anomaly_score": float(anomaly_score),
                    "severity": severity,
                    "threshold_used": float(mean_consumption + (3 * std_consumption)),
                    "contributing_factors": {
                        "reason": "Unusual consumption pattern detected",
                        "current_consumption": float(current_consumption),
                        "typical_consumption": float(mean_consumption),
                        "consumption_std": float(std_consumption),
                        "readings_analyzed": len(daily_consumptions),
                        "detection_method": "progressive_pattern"
                    },
                    "model_version": settings.MODEL_VERSION
                }
                
                return await self._save_anomaly_detection(user_id, reading_id, anomaly_data)
            
            return None
            
        except Exception as e:
            logger.error(f"Progressive pattern detection failed: {e}")
            return None
    
    async def _check_simple_rollback(self, current_reading: Dict, historical_data: pd.DataFrame) -> Optional[AnomalyDetectionResponse]:
        """Simple but reliable rollback detection - catches ANY backward movement

        This runs FIRST before any ML models to ensure rollbacks are always caught
        and marked as CRITICAL, regardless of user patterns or model state.
        """
        if historical_data.empty:
            return None

        try:
            current_value = float(current_reading['reading_value'])
            reading_id = current_reading['id']
            user_id = current_reading['user_id']

            # Get the most recent reading (last one in sorted data)
            last_reading = historical_data.iloc[-1]
            last_value = float(last_reading['reading_value'])

            # Simple rule: meter values should NEVER decrease
            # Even 0.1 unit decrease is a rollback (could be meter replacement, reset, or tampering)
            if current_value < last_value:
                rollback_amount = last_value - current_value
                logger.critical(f"🚨 ROLLBACK: {current_value} < {last_value} (rollback: -{rollback_amount})")

                anomaly_data = {
                    "is_anomaly": True,
                    "anomaly_score": 1.0,  # Maximum confidence - this is a definite rollback
                    "severity": AnomalySeverity.CRITICAL,  # ALWAYS critical
                    "threshold_used": last_value,
                    "contributing_factors": {
                        "reason": "Meter rollback detected - meter reading decreased",
                        "current_reading": current_value,
                        "previous_reading": last_value,
                        "rollback_amount": float(rollback_amount),
                        "detection_method": "simple_rollback_detection",
                        "alert": "CRITICAL: Cumulative meters should never decrease. This may indicate meter replacement, reset, tampering, or data error.",
                        "insights": [
                            "Meter reading went backwards",
                            "Possible meter replacement or reset",
                            "Could indicate tampering or system error",
                            "Requires immediate investigation"
                        ]
                    },
                    "model_version": settings.MODEL_VERSION
                }

                return await self._save_anomaly_detection(user_id, reading_id, anomaly_data)

            return None

        except Exception as e:
            logger.error(f"Simple rollback detection failed: {e}")
            return None

    async def _detect_progressive_rollback(self, user_id: str, current_reading: Dict, historical_data: pd.DataFrame) -> Optional[AnomalyDetectionResponse]:
        """Enhanced rollback detection using last known good reading
        
        Prevents false rollbacks caused by comparing against anomalous readings.
        """
        try:
            current_value = float(current_reading['reading_value'])
            utility_type = UtilityType(current_reading['utility_type'])
            reading_id = current_reading['id']
            current_timestamp = pd.to_datetime(current_reading['capture_timestamp'], utc=True)
            
            # Get last known good reading (non-anomalous)
            last_good_reading = await self.get_last_known_good_reading(
                user_id, utility_type, before_timestamp=current_timestamp
            )
            
            if not last_good_reading:
                # No clean reference point available - use fallback method
                return await self._fallback_rollback_detection(user_id, current_reading, historical_data)
            
            previous_value = last_good_reading['reading_value']
            previous_id = last_good_reading['id']
            
            logger.info(f"Enhanced rollback check: current={current_value} (ID: {reading_id}), last_good={previous_value} (ID: {previous_id})")
            
            if current_value < previous_value:
                # True rollback detected using clean reference
                logger.warning(f"ROLLBACK DETECTED (clean): {current_value} < {previous_value}")
                
                anomaly_data = {
                    "is_anomaly": True,
                    "anomaly_score": 0.98,  # Very high confidence
                    "severity": AnomalySeverity.CRITICAL,
                    "threshold_used": 0.0,
                    "contributing_factors": {
                        "reason": "Meter rollback detected",
                        "current_reading": current_value,
                        "last_good_reading": previous_value,
                        "rollback_amount": float(previous_value - current_value),
                        "detection_method": "enhanced_rollback_detection",
                        "reference_reading_id": previous_id,
                        "used_clean_reference": True
                    },
                    "model_version": settings.MODEL_VERSION
                }
                
                return await self._save_anomaly_detection(user_id, reading_id, anomaly_data)
            
            return None
            
        except Exception as e:
            logger.error(f"Enhanced rollback detection failed: {e}")
            return None
    
    async def _fallback_rollback_detection(self, user_id: str, current_reading: Dict, historical_data: pd.DataFrame) -> Optional[AnomalyDetectionResponse]:
        """Fallback rollback detection when no clean reference is available"""
        if len(historical_data) == 0:
            return None
            
        try:
            current_value = float(current_reading['reading_value'])
            reading_id = current_reading['id']
            
            # Use median of recent readings as reference to reduce impact of outliers
            recent_readings = historical_data.tail(5)['reading_value']
            median_reference = recent_readings.median()
            
            logger.info(f"Fallback rollback check: current={current_value}, median_reference={median_reference}")
            
            # More conservative threshold using median
            if current_value < median_reference * 0.8:  # 20% below median suggests rollback
                logger.warning(f"POTENTIAL ROLLBACK DETECTED (fallback): {current_value} << {median_reference}")
                
                anomaly_data = {
                    "is_anomaly": True,
                    "anomaly_score": 0.85,  # Lower confidence for fallback method
                    "severity": AnomalySeverity.HIGH,  # High but not critical
                    "threshold_used": float(median_reference * 0.8),
                    "contributing_factors": {
                        "reason": "Potential meter rollback (fallback detection)",
                        "current_reading": current_value,
                        "median_reference": float(median_reference),
                        "threshold_factor": 0.8,
                        "detection_method": "fallback_rollback_detection",
                        "used_clean_reference": False,
                        "note": "No clean reference available - using conservative threshold"
                    },
                    "model_version": settings.MODEL_VERSION
                }
                
                return await self._save_anomaly_detection(user_id, reading_id, anomaly_data)
            
            return None
            
        except Exception as e:
            logger.error(f"Fallback rollback detection failed: {e}")
            return None
    
    async def _check_meter_rollback_enhanced(self, user_id: str, current_reading: Dict, historical_data: pd.DataFrame) -> Optional[AnomalyDetectionResponse]:
        """Enhanced meter rollback check for full ML model context"""
        return await self._detect_progressive_rollback(user_id, current_reading, historical_data)
    
    async def _calculate_adaptive_contamination(self, user_id: str, utility_type: UtilityType, data: pd.DataFrame) -> float:
        """Calculate adaptive contamination rate based on user feedback and usage patterns"""
        
        base_contamination = settings.ISOLATION_FOREST_CONTAMINATION
        
        try:
            # Factor 1: User Feedback Analysis
            feedback_stats = await self._get_user_feedback_stats(user_id, utility_type)
            feedback_adjustment = 0.0
            
            if feedback_stats['total_feedback'] >= 3:  # Need minimum feedback for adjustment (lowered for 1-month study)
                false_positive_rate = feedback_stats['false_positive_rate']
                missed_anomaly_rate = feedback_stats['missed_anomaly_rate']
                
                # Adjust based on feedback
                if false_positive_rate > 0.3:  # Too many false positives
                    feedback_adjustment -= 0.03  # Decrease contamination (stricter detection)
                elif false_positive_rate > 0.15:
                    feedback_adjustment -= 0.01
                
                if missed_anomaly_rate > 0.2:  # Missing real anomalies
                    feedback_adjustment += 0.03  # Increase contamination (more lenient detection)
                elif missed_anomaly_rate > 0.1:
                    feedback_adjustment += 0.01
            
            # Factor 2: Usage Stability (Coefficient of Variation)
            stability_adjustment = 0.0
            if len(data) >= 7:
                daily_consumption = data['reading_value'].diff().dropna()
                if len(daily_consumption) > 0 and daily_consumption.mean() > 0:
                    cv = daily_consumption.std() / daily_consumption.mean()
                    
                    if cv < 0.2:  # Very stable usage
                        stability_adjustment = -0.02  # Lower contamination for stable users
                    elif cv > 0.8:  # Highly variable usage
                        stability_adjustment = 0.02   # Higher contamination for variable users
            
            # Factor 3: Weekly Pattern Variance (since 1-month study has limited seasonal data)
            pattern_adjustment = 0.0
            if len(data) >= 14:  # Need at least 2 weeks of data for pattern analysis
                pattern_variance = self._calculate_weekly_pattern_variance(data)
                pattern_adjustment = min(0.015, pattern_variance / 15)  # Cap at 1.5% for weekly patterns
            
            # Calculate final contamination rate
            final_contamination = base_contamination + feedback_adjustment + stability_adjustment + pattern_adjustment
            
            # Bounds: 2% to 25%
            final_contamination = max(0.02, min(0.25, final_contamination))
            
            logger.info(f"Adaptive contamination for {user_id}_{utility_type.value}: "
                       f"base={base_contamination}, feedback={feedback_adjustment}, "
                       f"stability={stability_adjustment}, pattern={pattern_adjustment}, "
                       f"final={final_contamination}")
            
            return final_contamination
            
        except Exception as e:
            logger.error(f"Failed to calculate adaptive contamination: {e}")
            return base_contamination
    
    async def _get_user_feedback_stats(self, user_id: str, utility_type: UtilityType) -> Dict[str, float]:
        """Get user feedback statistics for threshold adjustment"""
        
        try:
            # Get feedback from last 30 days (1 month study period)
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            
            result = self.supabase.table("anomaly_detections")\
                .select("user_feedback")\
                .eq("user_id", user_id)\
                .eq("utility_type", utility_type.value)\
                .gte("detected_at", thirty_days_ago.isoformat())\
                .not_.is_("user_feedback", "null")\
                .execute()
            
            if not result.data:
                return {
                    'false_positive_rate': 0.0,
                    'missed_anomaly_rate': 0.0,
                    'correct_rate': 0.0,
                    'total_feedback': 0
                }
            
            feedbacks = [item['user_feedback'] for item in result.data]
            total = len(feedbacks)
            
            false_positives = sum(1 for f in feedbacks if f == 'false_positive')
            missed_anomalies = sum(1 for f in feedbacks if f == 'missed_anomaly')
            correct = sum(1 for f in feedbacks if f == 'correct')
            
            return {
                'false_positive_rate': false_positives / total if total > 0 else 0.0,
                'missed_anomaly_rate': missed_anomalies / total if total > 0 else 0.0,
                'correct_rate': correct / total if total > 0 else 0.0,
                'total_feedback': total
            }
            
        except Exception as e:
            logger.error(f"Failed to get user feedback stats: {e}")
            return {
                'false_positive_rate': 0.0,
                'missed_anomaly_rate': 0.0, 
                'correct_rate': 0.0,
                'total_feedback': 0
            }
    
    def _calculate_weekly_pattern_variance(self, data: pd.DataFrame) -> float:
        """Calculate weekly pattern variance in usage (suitable for 1-month studies)"""
        
        try:
            # Calculate daily consumption
            data['daily_consumption'] = data['reading_value'].diff()
            
            # Group by day of week and calculate variance
            data['day_of_week'] = pd.to_datetime(data['capture_timestamp'], utc=True).dt.dayofweek
            daily_avg = data.groupby('day_of_week')['daily_consumption'].mean()
            
            if len(daily_avg) >= 3:  # Need at least 3 different days
                return float(daily_avg.std() / max(daily_avg.mean(), 0.001))
            
            return 0.0
            
        except Exception as e:
            logger.error(f"Failed to calculate weekly pattern variance: {e}")
            return 0.0
    
    async def _calculate_ml_performance_metrics(self, user_id: str, utility_type: UtilityType) -> Dict[str, float]:
        """Calculate F1, precision, recall from user feedback"""
        
        try:
            # Get anomaly detections with feedback from last 30 days (1 month study period)
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            
            result = self.supabase.table("anomaly_detections")\
                .select("is_anomaly, user_feedback")\
                .eq("user_id", user_id)\
                .eq("utility_type", utility_type.value)\
                .gte("detected_at", thirty_days_ago.isoformat())\
                .not_.is_("user_feedback", "null")\
                .execute()
            
            if not result.data or len(result.data) < 5:  # Need minimum feedback for reliable metrics (lowered for 1-month study)
                return {
                    "precision": 0.0,
                    "recall": 0.0,
                    "f1_score": 0.0,
                    "feedback_samples": len(result.data) if result.data else 0
                }
            
            # Convert feedback to ground truth labels
            y_true = []  # Ground truth from user feedback
            y_pred = []  # Model predictions
            
            for detection in result.data:
                model_predicted_anomaly = detection['is_anomaly']
                user_feedback = detection['user_feedback']
                
                # Convert user feedback to ground truth
                if user_feedback == 'correct':
                    # Model was right
                    y_true.append(model_predicted_anomaly)
                    y_pred.append(model_predicted_anomaly)
                elif user_feedback == 'false_positive':
                    # Model said anomaly, but user says normal
                    y_true.append(False)
                    y_pred.append(True)
                elif user_feedback == 'missed_anomaly':
                    # Model said normal, but user says anomaly
                    y_true.append(True)
                    y_pred.append(False)
            
            if len(y_true) < 3:  # Too few samples for reliable metrics (lowered for 1-month study)
                return {
                    "precision": 0.0,
                    "recall": 0.0,
                    "f1_score": 0.0,
                    "feedback_samples": len(y_true)
                }
            
            # Calculate confusion matrix elements
            true_positives = sum(1 for true, pred in zip(y_true, y_pred) if true and pred)
            false_positives = sum(1 for true, pred in zip(y_true, y_pred) if not true and pred)
            false_negatives = sum(1 for true, pred in zip(y_true, y_pred) if true and not pred)
            
            # Calculate precision, recall, F1
            precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0.0
            recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0.0
            f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
            
            return {
                "precision": float(precision),
                "recall": float(recall),
                "f1_score": float(f1_score),
                "feedback_samples": len(y_true),
                "true_positives": true_positives,
                "false_positives": false_positives,
                "false_negatives": false_negatives
            }
            
        except Exception as e:
            logger.error(f"Failed to calculate ML performance metrics: {e}")
            return {
                "precision": 0.0,
                "recall": 0.0,
                "f1_score": 0.0,
                "feedback_samples": 0
            }
    
    
    async def _train_personalized_model(self, user_id: str, utility_type: UtilityType, data: pd.DataFrame):
        """Train personalized Isolation Forest model for user-specific anomaly detection

        OPTIMIZED VERSION with debug logging and performance improvements.
        """
        import time
        start_time = time.time()
        training_log_id = None

        try:
            logger.info(f"🚀 TRAINING START: user={user_id}, utility={utility_type}, data_size={len(data)}")

            # OPTIMIZATION: Early exit for very small datasets
            if len(data) < 3:
                logger.warning(f"⚠️ SKIP TRAINING: Only {len(data)} readings, insufficient for ML model")
                return

            # STEP 1: Create training log
            step_start = time.time()
            training_log = {
                "user_id": user_id,
                "model_type": "isolation_forest",
                "utility_type": utility_type.value,
                "version": settings.MODEL_VERSION,
                "training_started_at": datetime.utcnow().isoformat(),
                "training_status": "running",
                "training_data_size": len(data)
            }

            log_result = self.supabase.table("model_training_logs").insert(training_log).execute()
            if not log_result.data:
                logger.error("❌ Failed to create training log entry")
                return
            training_log_id = log_result.data[0]["id"]
            logger.info(f"✅ STEP 1: Training log created ({time.time() - step_start:.2f}s)")

            # STEP 2: Get clean data for training (OPTIMIZED - reuse existing data if possible)
            step_start = time.time()

            # OPTIMIZATION: Skip additional database call if we already have clean data
            if len(data) == 3:  # If we only have 3 readings, they're likely all clean
                clean_data_for_training = data.copy()
                logger.info(f"🔧 OPTIMIZATION: Using provided data as clean data (3 readings)")
            else:
                clean_data_for_training = await self.get_data_for_analysis(user_id, utility_type, days=settings.TRAINING_WINDOW_DAYS)

            logger.info(f"✅ STEP 2: Data preparation ({time.time() - step_start:.2f}s) - clean_data={len(clean_data_for_training)}")

            # STEP 3: Feature engineering (SIMPLIFIED for small datasets)
            step_start = time.time()

            # Track which feature engineering method we use for consistency in prediction
            feature_method = "simple"  # Default to simple

            if len(clean_data_for_training) < 3:
                logger.warning(f"⚠️ Insufficient clean data: {len(clean_data_for_training)} readings, using all available data")
                features = self._engineer_features_simple(data)
                feature_method = "simple"
            else:
                # OPTIMIZATION: Use simplified feature engineering for small datasets
                if len(clean_data_for_training) <= 5:
                    features = self._engineer_features_simple(clean_data_for_training)
                    feature_method = "simple"
                    logger.info(f"🔧 OPTIMIZATION: Using simplified features for small dataset")
                else:
                    features = self._engineer_features(clean_data_for_training, exclude_current=True)
                    feature_method = "advanced"

                logger.info(f"📊 Training with clean data: {len(clean_data_for_training)} readings, feature_method={feature_method}")

            if features.empty:
                logger.warning("❌ No features available for training")
                return

            logger.info(f"✅ STEP 3: Feature engineering ({time.time() - step_start:.2f}s) - features_shape={features.shape}")

            # STEP 4: Model training (OPTIMIZED parameters for small datasets)
            step_start = time.time()

            X = features.values

            # Scale features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)

            # NEW: Use adaptive contamination manager
            recent_anomalies = []  # TODO: Get from database if needed
            current_performance = {'accuracy': 0.5, 'f1_score': 0.0}  # Default for new models

            contamination_config = self.contamination_manager.update_contamination_strategy(
                user_id, utility_type, len(data), recent_anomalies, current_performance
            )

            adaptive_contamination = contamination_config['contamination_rate']
            training_strategy = contamination_config['training_strategy']

            logger.info(f"🎯 ADAPTIVE CONTAMINATION: rate={adaptive_contamination:.4f}, strategy={training_strategy}, stage={contamination_config['stage']}")

            # Skip ML training for very small datasets
            if not contamination_config['use_ml']:
                logger.info(f"⚠️ Dataset too small ({len(data)} readings), skipping ML training")
                return

            # OPTIMIZATION: Reduced n_estimators for faster training on small datasets
            n_estimators = 50 if len(data) <= 5 else 100

            isolation_forest = IsolationForest(
                contamination=adaptive_contamination,
                random_state=42,
                n_estimators=n_estimators,  # Reduced for small datasets
                n_jobs=1  # Disable multiprocessing to prevent Windows spawn issues
            )

            isolation_forest.fit(X_scaled)
            logger.info(f"✅ STEP 4: Model training ({time.time() - step_start:.2f}s) - estimators={n_estimators}")

            # STEP 5: Performance metrics (SIMPLIFIED)
            step_start = time.time()

            train_predictions = isolation_forest.predict(X_scaled)
            train_scores = isolation_forest.score_samples(X_scaled)

            anomaly_count = np.sum(train_predictions == -1)
            anomaly_rate = anomaly_count / len(train_predictions) if len(train_predictions) > 0 else 0

            # OPTIMIZATION: Skip complex ML metrics for small datasets
            if len(data) <= 5:
                ml_metrics = {
                    "precision": 0.0,
                    "recall": 0.0,
                    "f1_score": 0.0,
                    "feedback_samples": 0
                }
                logger.info(f"🔧 OPTIMIZATION: Skipping ML metrics for small dataset")
            else:
                ml_metrics = await self._calculate_ml_performance_metrics(user_id, utility_type)

            performance_metrics = {
                "training_samples": len(X_scaled),
                "anomaly_count": int(anomaly_count),
                "anomaly_rate": float(anomaly_rate),
                "score_mean": float(np.mean(train_scores)),
                "score_std": float(np.std(train_scores)),
                "contamination_rate": float(adaptive_contamination),
                **ml_metrics
            }
            logger.info(f"✅ STEP 5: Performance metrics ({time.time() - step_start:.2f}s)")

            # STEP 6: Cache model
            step_start = time.time()
            model_key = f"{user_id}_{utility_type.value}"
            now = datetime.utcnow()
            model_data = {
                "model": isolation_forest,
                "scaler": scaler,
                "feature_columns": list(features.columns),
                "feature_method": feature_method,  # Store which feature engineering method was used
                "training_timestamp": now,
                "contamination": adaptive_contamination,
                "performance_metrics": performance_metrics
            }

            self.models.put(model_key, model_data)
            logger.info(f"✅ STEP 6: Model cached ({time.time() - step_start:.2f}s)")

            # STEP 7: Save to database with error handling
            step_start = time.time()
            model_saved = False
            try:
                await model_persistence_service.save_model(
                    user_id=user_id,
                    utility_type=utility_type,
                    isolation_forest=isolation_forest,
                    scaler=scaler,
                    feature_columns=list(features.columns),
                    contamination_rate=adaptive_contamination,
                    performance_metrics=performance_metrics,
                    readings_count=len(data),
                    model_version=settings.MODEL_VERSION
                )
                model_saved = True
                logger.info(f"✅ STEP 7: Model saved to database ({time.time() - step_start:.2f}s)")
            except Exception as save_error:
                logger.error(f"❌ STEP 7: Failed to save model to database: {save_error}")
                # Continue with training completion even if save fails
                # The model is still in memory cache and functional

            # STEP 8: Update training log with completion status
            step_start = time.time()
            try:
                training_status = "completed" if model_saved else "completed_with_save_error"

                self.supabase.table("model_training_logs").update({
                    "training_completed_at": datetime.utcnow().isoformat(),
                    "training_status": training_status,
                    "performance_metrics": performance_metrics,
                    "is_deployed": True,  # Model is deployed in cache even if DB save fails
                    "deployed_at": datetime.utcnow().isoformat()
                }).eq("id", training_log_id).execute()
                logger.info(f"✅ STEP 8: Training log updated ({time.time() - step_start:.2f}s) - Status: {training_status}")
            except Exception as update_error:
                logger.error(f"❌ Failed to update training log {training_log_id}: {update_error}")
                # Even if log update fails, training is still complete

            total_time = time.time() - start_time
            logger.info(f"🎉 TRAINING COMPLETED: Total time={total_time:.2f}s, user={user_id}, utility={utility_type}")

        except Exception as e:
            total_time = time.time() - start_time
            logger.error(f"❌ TRAINING FAILED: {e} (after {total_time:.2f}s)")

            # Update training log with error
            try:
                if training_log_id:
                    self.supabase.table("model_training_logs").update({
                        "training_status": "failed",
                        "error_message": str(e),
                        "training_completed_at": datetime.utcnow().isoformat()
                    }).eq("id", training_log_id).execute()
                    logger.info(f"✅ Training log updated to failed for {training_log_id}")
            except Exception as update_error:
                logger.error(f"❌ Failed to update training log with error: {update_error}")

    def _engineer_features_simple(self, data: pd.DataFrame) -> pd.DataFrame:
        """Simplified feature engineering for small datasets (≤5 readings)"""
        if data.empty:
            return pd.DataFrame()

        try:
            # Sort by timestamp
            data = data.sort_values('capture_timestamp').reset_index(drop=True)

            features = []
            for i in range(len(data)):
                row = data.iloc[i]
                feature_row = {
                    'reading_value': float(row['reading_value']),
                    'hour_of_day': row['capture_timestamp'].hour,
                    'day_of_week': row['capture_timestamp'].weekday(),
                }

                # Simple rolling features (only if we have previous readings)
                if i > 0:
                    prev_value = float(data.iloc[i-1]['reading_value'])
                    feature_row['consumption'] = feature_row['reading_value'] - prev_value
                    feature_row['consumption_rate'] = max(0, feature_row['consumption'])
                else:
                    feature_row['consumption'] = 0
                    feature_row['consumption_rate'] = 0

                features.append(feature_row)

            return pd.DataFrame(features)

        except Exception as e:
            logger.error(f"Error in simplified feature engineering: {e}")
            return pd.DataFrame()
    
    def _engineer_features_hybrid(self, clean_data: pd.DataFrame, all_data: pd.DataFrame, exclude_current: bool = False) -> pd.DataFrame:
        """Engineer features using clean data for statistics but all data for context
        
        Args:
            clean_data: Clean historical data (excluding anomalous readings)
            all_data: All historical data (including anomalous readings)
            exclude_current: If True, excludes the last reading from rolling calculations
        
        Returns:
            Feature DataFrame with robust statistics from clean data
        """
        try:
            if len(clean_data) < 2:
                # Fall back to regular feature engineering if insufficient clean data
                return self._engineer_features(all_data, exclude_current)
            
            # Sort by timestamp to ensure proper order
            clean_data = clean_data.sort_values('capture_timestamp').reset_index(drop=True)
            
            features = pd.DataFrame()
            
            # Basic reading value (from clean data)
            features['reading_value'] = clean_data['reading_value']
            
            # Calculate daily consumption from clean data only
            clean_data['prev_reading'] = clean_data['reading_value'].shift(1)
            clean_data['daily_consumption'] = clean_data['reading_value'] - clean_data['prev_reading']
            clean_data['daily_consumption'] = clean_data['daily_consumption'].clip(lower=0)
            
            features['daily_consumption'] = clean_data['daily_consumption'].fillna(0)
            
            # Time-based features
            clean_data['hour'] = clean_data['capture_timestamp'].dt.hour
            clean_data['day_of_week'] = clean_data['capture_timestamp'].dt.dayofweek
            clean_data['day_of_month'] = clean_data['capture_timestamp'].dt.day
            clean_data['month'] = clean_data['capture_timestamp'].dt.month
            
            features['hour'] = clean_data['hour']
            features['day_of_week'] = clean_data['day_of_week']
            features['day_of_month'] = clean_data['day_of_month']
            features['month'] = clean_data['month']
            
            # Rolling statistics from CLEAN data to prevent anomaly contamination
            consumption_series = clean_data['daily_consumption']
            
            if exclude_current and len(clean_data) > 1:
                consumption_for_rolling = consumption_series.iloc[:-1]
                
                window_7d = min(len(consumption_for_rolling), 7)
                window_30d = min(len(consumption_for_rolling), 30)
                
                if window_7d >= 1:
                    rolling_7d_mean = consumption_for_rolling.rolling(window=window_7d, min_periods=1).mean()
                    rolling_7d_std = consumption_for_rolling.rolling(window=window_7d, min_periods=1).std().fillna(0)
                    rolling_7d_max = consumption_for_rolling.rolling(window=window_7d, min_periods=1).max()

                    features['consumption_7d_mean'] = pd.concat([rolling_7d_mean, pd.Series([rolling_7d_mean.iloc[-1]])], ignore_index=True)
                    features['consumption_7d_std'] = pd.concat([rolling_7d_std, pd.Series([rolling_7d_std.iloc[-1]])], ignore_index=True)
                    features['consumption_7d_max'] = pd.concat([rolling_7d_max, pd.Series([rolling_7d_max.iloc[-1]])], ignore_index=True)
                else:
                    features['consumption_7d_mean'] = consumption_series
                    features['consumption_7d_std'] = 0
                    features['consumption_7d_max'] = consumption_series
                
                if window_30d >= 1:
                    rolling_30d_mean = consumption_for_rolling.rolling(window=window_30d, min_periods=1).mean()
                    rolling_30d_std = consumption_for_rolling.rolling(window=window_30d, min_periods=1).std().fillna(0)

                    features['consumption_30d_mean'] = pd.concat([rolling_30d_mean, pd.Series([rolling_30d_mean.iloc[-1]])], ignore_index=True)
                    features['consumption_30d_std'] = pd.concat([rolling_30d_std, pd.Series([rolling_30d_std.iloc[-1]])], ignore_index=True)
                else:
                    features['consumption_30d_mean'] = consumption_series
                    features['consumption_30d_std'] = 0
            else:
                window_7d = min(len(clean_data), 7)
                window_30d = min(len(clean_data), 30)
                
                if window_7d >= 1:
                    features['consumption_7d_mean'] = consumption_series.rolling(window=window_7d, min_periods=1).mean()
                    features['consumption_7d_std'] = consumption_series.rolling(window=window_7d, min_periods=1).std().fillna(0)
                    features['consumption_7d_max'] = consumption_series.rolling(window=window_7d, min_periods=1).max()
                else:
                    features['consumption_7d_mean'] = consumption_series
                    features['consumption_7d_std'] = 0
                    features['consumption_7d_max'] = consumption_series
                
                if window_30d >= 1:
                    features['consumption_30d_mean'] = consumption_series.rolling(window=window_30d, min_periods=1).mean()
                    features['consumption_30d_std'] = consumption_series.rolling(window=window_30d, min_periods=1).std().fillna(0)
                else:
                    features['consumption_30d_mean'] = consumption_series
                    features['consumption_30d_std'] = 0
            
            # Usage patterns from clean data
            weekend_mask = clean_data['day_of_week'].isin([5, 6])
            features['is_weekend'] = weekend_mask.astype(int)
            
            # Compare to same day of week average (using clean data)
            if len(clean_data) >= 7:
                day_of_week_avg = clean_data.groupby('day_of_week')['daily_consumption'].transform('mean')
                features['consumption_vs_dow_avg'] = clean_data['daily_consumption'] / (day_of_week_avg + 0.001)
            else:
                overall_avg = clean_data['daily_consumption'].mean()
                features['consumption_vs_dow_avg'] = clean_data['daily_consumption'] / (overall_avg + 0.001)
            
            # Clean up features
            features = features.fillna(0)
            features = features.replace([np.inf, -np.inf], 0)
            
            return features
            
        except Exception as e:
            logger.error(f"Hybrid feature engineering failed: {e}")
            # Fall back to regular feature engineering
            return self._engineer_features(all_data if len(all_data) > len(clean_data) else clean_data, exclude_current)
    
    def _engineer_features(self, data: pd.DataFrame, exclude_current: bool = False) -> pd.DataFrame:
        """Engineer features for anomaly detection with data leakage prevention
        
        Args:
            data: Historical data including current reading
            exclude_current: If True, excludes the last reading from rolling calculations
                           to prevent data leakage during training
        """
        
        try:
            if len(data) < 2:
                return pd.DataFrame()
            
            # Sort by timestamp to ensure proper order
            data = data.sort_values('capture_timestamp').reset_index(drop=True)
            
            features = pd.DataFrame()
            
            # Basic reading value
            features['reading_value'] = data['reading_value']
            
            # Calculate daily consumption (difference between consecutive readings)
            data['prev_reading'] = data['reading_value'].shift(1)
            data['daily_consumption'] = data['reading_value'] - data['prev_reading']
            data['daily_consumption'] = data['daily_consumption'].clip(lower=0)  # Remove negative values
            
            features['daily_consumption'] = data['daily_consumption'].fillna(0)
            
            # Time-based features
            data['hour'] = data['capture_timestamp'].dt.hour
            data['day_of_week'] = data['capture_timestamp'].dt.dayofweek
            data['day_of_month'] = data['capture_timestamp'].dt.day
            data['month'] = data['capture_timestamp'].dt.month
            
            features['hour'] = data['hour']
            features['day_of_week'] = data['day_of_week']
            features['day_of_month'] = data['day_of_month']
            features['month'] = data['month']
            
            # PREVENT DATA LEAKAGE: Rolling statistics with proper windowing
            # Exclude current reading from rolling calculations if specified
            consumption_series = data['daily_consumption']
            if exclude_current and len(data) > 1:
                # For training: exclude current reading from rolling calculations
                consumption_for_rolling = consumption_series.iloc[:-1]
                
                # Calculate rolling stats and forward-fill the last value
                window_7d = min(len(consumption_for_rolling), 7)
                window_30d = min(len(consumption_for_rolling), 30)
                
                if window_7d >= 1:
                    rolling_7d_mean = consumption_for_rolling.rolling(window=window_7d, min_periods=1).mean()
                    rolling_7d_std = consumption_for_rolling.rolling(window=window_7d, min_periods=1).std().fillna(0)
                    rolling_7d_max = consumption_for_rolling.rolling(window=window_7d, min_periods=1).max()

                    # Forward fill for the current reading - reset index to avoid duplicates
                    features['consumption_7d_mean'] = pd.concat([rolling_7d_mean, pd.Series([rolling_7d_mean.iloc[-1]])], ignore_index=True)
                    features['consumption_7d_std'] = pd.concat([rolling_7d_std, pd.Series([rolling_7d_std.iloc[-1]])], ignore_index=True)
                    features['consumption_7d_max'] = pd.concat([rolling_7d_max, pd.Series([rolling_7d_max.iloc[-1]])], ignore_index=True)
                else:
                    features['consumption_7d_mean'] = consumption_series
                    features['consumption_7d_std'] = 0
                    features['consumption_7d_max'] = consumption_series

                if window_30d >= 1:
                    rolling_30d_mean = consumption_for_rolling.rolling(window=window_30d, min_periods=1).mean()
                    rolling_30d_std = consumption_for_rolling.rolling(window=window_30d, min_periods=1).std().fillna(0)

                    # Forward fill for the current reading - reset index to avoid duplicates
                    features['consumption_30d_mean'] = pd.concat([rolling_30d_mean, pd.Series([rolling_30d_mean.iloc[-1]])], ignore_index=True)
                    features['consumption_30d_std'] = pd.concat([rolling_30d_std, pd.Series([rolling_30d_std.iloc[-1]])], ignore_index=True)
                else:
                    features['consumption_30d_mean'] = consumption_series
                    features['consumption_30d_std'] = 0
            else:
                # For prediction: use all available data
                window_7d = min(len(data), 7)
                window_30d = min(len(data), 30)
                
                if window_7d >= 1:
                    features['consumption_7d_mean'] = consumption_series.rolling(window=window_7d, min_periods=1).mean()
                    features['consumption_7d_std'] = consumption_series.rolling(window=window_7d, min_periods=1).std().fillna(0)
                    features['consumption_7d_max'] = consumption_series.rolling(window=window_7d, min_periods=1).max()
                else:
                    features['consumption_7d_mean'] = consumption_series
                    features['consumption_7d_std'] = 0
                    features['consumption_7d_max'] = consumption_series
                
                if window_30d >= 1:
                    features['consumption_30d_mean'] = consumption_series.rolling(window=window_30d, min_periods=1).mean()
                    features['consumption_30d_std'] = consumption_series.rolling(window=window_30d, min_periods=1).std().fillna(0)
                else:
                    features['consumption_30d_mean'] = consumption_series
                    features['consumption_30d_std'] = 0
            
            # Usage patterns (always create these features)
            # Weekend vs weekday pattern
            weekend_mask = data['day_of_week'].isin([5, 6])
            features['is_weekend'] = weekend_mask.astype(int)
            
            # Compare to same day of week average (adaptive to available data)
            if len(data) >= 7:  # Need at least a week of data for meaningful day-of-week averages
                day_of_week_avg = data.groupby('day_of_week')['daily_consumption'].transform('mean')
                features['consumption_vs_dow_avg'] = data['daily_consumption'] / (day_of_week_avg + 0.001)
            else:
                # Use overall average when insufficient day-of-week data
                overall_avg = data['daily_consumption'].mean()
                features['consumption_vs_dow_avg'] = data['daily_consumption'] / (overall_avg + 0.001)
            
            # Remove rows with NaN values
            features = features.fillna(0)
            
            # Remove infinite values
            features = features.replace([np.inf, -np.inf], 0)
            
            return features
            
        except Exception as e:
            logger.error(f"Feature engineering failed: {e}")
            return pd.DataFrame()
    
    async def _predict_anomaly(self, reading: Dict[str, Any], model_key: str) -> Optional[Dict[str, Any]]:
        """Predict if reading is anomalous"""
        
        try:
            if model_key not in self.models:
                logger.warning(f"Model not found for key: {model_key}")
                return None
            
            # Update access time
            self._update_model_access_time(model_key)
            model_data = self.models[model_key]
            isolation_forest = model_data["model"]
            scaler = model_data["scaler"]
            feature_method = model_data.get("feature_method", "advanced")  # Default to advanced for backward compatibility

            # Get recent readings for feature engineering
            user_id = reading["user_id"]
            utility_type = UtilityType(reading["utility_type"])

            # For prediction, we can use all data (including anomalous) for context
            # But we'll use clean data for rolling statistics to avoid contamination
            historical_data = await self._get_historical_data(user_id, utility_type, days=60)
            clean_historical_data = await self.get_data_for_analysis(user_id, utility_type, days=60)

            # Remove current reading from historical data to prevent duplication
            if not historical_data.empty:
                historical_data = historical_data[historical_data['id'] != reading['id']]

            if historical_data.empty:
                return None

            # Add current reading to both datasets
            current_reading_df = pd.DataFrame([{
                'reading_value': float(reading['reading_value']),
                'capture_timestamp': pd.to_datetime(reading['capture_timestamp'], utc=True),
                'id': reading['id']  # Include ID for consistency
            }])

            # Use the SAME feature engineering method that was used during training
            logger.info(f"🔧 Using feature_method={feature_method} for prediction (same as training)")

            if feature_method == "simple":
                # Use simple feature engineering
                combined_data = pd.concat([historical_data, current_reading_df], ignore_index=True)
                features = self._engineer_features_simple(combined_data)
            else:
                # Use advanced feature engineering (default for backward compatibility)
                if not clean_historical_data.empty:
                    combined_clean_data = pd.concat([clean_historical_data, current_reading_df], ignore_index=True)
                    features = self._engineer_features_hybrid(combined_clean_data, historical_data, exclude_current=False)
                else:
                    # Fallback to all data if no clean data available
                    combined_data = pd.concat([historical_data, current_reading_df], ignore_index=True)
                    features = self._engineer_features(combined_data, exclude_current=False)
            
            if features.empty:
                return None
            
            # Get features for current reading (last row)
            try:
                # Find which feature columns actually exist
                available_features = [col for col in model_data["feature_columns"] if col in features.columns]
                if not available_features:
                    logger.warning(f"No matching feature columns found. Model expects: {model_data['feature_columns']}, Got: {list(features.columns)}")
                    return None

                # Use only available features
                current_features = features.iloc[-1:][available_features]

                # If features are missing, we can't reliably predict
                if len(available_features) != len(model_data["feature_columns"]):
                    logger.warning(f"Feature mismatch - Expected: {len(model_data['feature_columns'])}, Available: {len(available_features)}")
                    return None

            except KeyError as e:
                logger.error(f"Missing feature columns in model: {e}")
                return None
            
            # Scale features
            current_features_scaled = scaler.transform(current_features.values)
            
            # Predict
            prediction = isolation_forest.predict(current_features_scaled)[0]
            anomaly_score = isolation_forest.score_samples(current_features_scaled)[0]

            # Use adaptive threshold instead of fixed prediction
            historical_data_size = len(historical_data) + 1  # +1 for current reading
            model_performance = model_data.get("performance_metrics", {'accuracy': 0.5, 'f1_score': 0.0})

            adaptive_threshold = self.contamination_manager.get_anomaly_threshold(
                historical_data_size, model_performance
            )

            # Make anomaly decision using adaptive threshold
            is_anomaly = anomaly_score < adaptive_threshold

            logger.debug(f"Anomaly decision: score={anomaly_score:.3f}, threshold={adaptive_threshold:.3f}, is_anomaly={is_anomaly}")

            # ADDITION: Check if consumption is within normal range even if ML flagged it
            # This reduces false positives for normal consumption increases
            if is_anomaly and len(historical_data) >= 3:
                current_value = float(reading['reading_value'])
                prev_value = float(historical_data.iloc[-1]['reading_value'])
                consumption = current_value - prev_value

                # Get IDs of anomalous readings from database to exclude them
                try:
                    anomaly_result = self.supabase.table("anomaly_detections").select("reading_id").eq("user_id", user_id).eq("utility_type", utility_type.value).eq("is_anomaly", True).execute()
                    anomalous_reading_ids = set([a['reading_id'] for a in anomaly_result.data]) if anomaly_result.data else set()
                except Exception:
                    anomalous_reading_ids = set()

                # Calculate normal consumption range from CLEAN historical data only
                consumptions = []
                for i in range(min(10, len(historical_data) - 1)):
                    current_idx = -(i+1)
                    prev_idx = -(i+2)

                    current_row = historical_data.iloc[current_idx]
                    prev_row = historical_data.iloc[prev_idx]

                    # Skip if either reading is marked as anomalous
                    if current_row['id'] not in anomalous_reading_ids and prev_row['id'] not in anomalous_reading_ids:
                        cons = float(current_row['reading_value']) - float(prev_row['reading_value'])
                        if cons > 0:  # Only positive consumptions
                            consumptions.append(cons)

                if len(consumptions) >= 3:  # Need at least 3 clean samples
                    mean_cons = np.mean(consumptions)
                    std_cons = np.std(consumptions)

                    # If current consumption is within 2.5 standard deviations of CLEAN data, it's likely normal
                    # Using 2.5 std (covers ~98.8% of normal distribution)
                    if std_cons > 0 and consumption <= mean_cons + (2.5 * std_cons):
                        logger.info(f"🔄 OVERRIDE: ML flagged as anomaly but consumption {consumption:.2f} is within normal range of clean data (mean={mean_cons:.2f}, std={std_cons:.2f}, samples={len(consumptions)})")
                        is_anomaly = False

            # Determine severity based on anomaly score
            severity = self._determine_severity(anomaly_score, model_data["performance_metrics"])
            
            # Calculate contributing factors
            contributing_factors = self._calculate_contributing_factors(
                current_features.iloc[0], 
                model_data.get("feature_importance", {})
            )
            
            return {
                "is_anomaly": is_anomaly,
                "anomaly_score": float(anomaly_score),
                "severity": severity,
                "threshold_used": model_data["contamination"],
                "contributing_factors": contributing_factors,
                "model_version": settings.MODEL_VERSION
            }
            
        except Exception as e:
            logger.error(f"Anomaly prediction failed: {e}")
            return None
    
    def _determine_severity(self, anomaly_score: float, performance_metrics: Dict[str, Any]) -> AnomalySeverity:
        """Determine anomaly severity based on score"""

        try:
            score_mean = performance_metrics.get("score_mean", 0)
            score_std = performance_metrics.get("score_std", 1)

            # Calculate z-score relative to training data
            z_score = (anomaly_score - score_mean) / max(score_std, 0.001)

            # ADJUSTED: Made severity classification stricter to reduce low severity false positives
            if z_score < -3.5:
                return AnomalySeverity.CRITICAL
            elif z_score < -2.8:
                return AnomalySeverity.HIGH
            elif z_score < -2.2:
                return AnomalySeverity.MEDIUM
            elif z_score < -1.8:
                return AnomalySeverity.LOW
            else:
                # If z-score is not low enough, don't classify as anomaly at all
                # This will be caught by the threshold check
                return AnomalySeverity.LOW

        except Exception:
            return AnomalySeverity.LOW  # Changed from MEDIUM to LOW for exceptions
    
    def _calculate_contributing_factors(self, features: pd.Series, feature_importance: Dict[str, float]) -> Dict[str, Any]:
        """Calculate which features contributed most to the anomaly"""
        
        try:
            factors = {}
            
            # Add feature values
            for feature_name, value in features.items():
                factors[feature_name] = {
                    "value": float(value) if pd.notna(value) else 0.0,
                    "importance": float(feature_importance.get(feature_name, 0.0))
                }
            
            # Add interpretable insights
            insights = []
            
            if features.get('daily_consumption', 0) > features.get('consumption_7d_mean', 0) * 2:
                insights.append("Daily consumption significantly higher than recent average")
            
            if features.get('hour', 12) in [2, 3, 4, 5]:  # Late night/early morning
                insights.append("Unusual consumption during late night hours")
            
            if features.get('is_weekend', 0) == 0 and features.get('consumption_vs_dow_avg', 1) > 1.5:
                insights.append("Higher than typical weekday consumption")
            
            factors["insights"] = insights
            
            return factors
            
        except Exception as e:
            logger.error(f"Failed to calculate contributing factors: {e}")
            return {}
    
    async def _save_anomaly_detection(self, user_id: str, reading_id: str, anomaly_result: Dict[str, Any]) -> AnomalyDetectionResponse:
        """Save anomaly detection result to database"""

        try:
            # First, check if an anomaly detection already exists for this reading
            existing_result = self.supabase.table("anomaly_detections")\
                .select("*")\
                .eq("reading_id", reading_id)\
                .execute()

            if existing_result.data and len(existing_result.data) > 0:
                # Return existing anomaly detection instead of creating duplicate
                logger.info(f"Anomaly detection already exists for reading {reading_id}, returning existing")
                return AnomalyDetectionResponse(**existing_result.data[0])

            # Get reading info
            reading_result = self.supabase.table("meter_readings").select("utility_type").eq("id", reading_id).single().execute()

            utility_type = reading_result.data["utility_type"] if reading_result.data else "unknown"

            detection_data = {
                "user_id": user_id,
                "reading_id": reading_id,
                "utility_type": utility_type,
                "anomaly_score": float(anomaly_result["anomaly_score"]),
                "is_anomaly": bool(anomaly_result["is_anomaly"]),
                "severity": anomaly_result["severity"].value,
                "threshold_used": float(anomaly_result["threshold_used"]),
                "contributing_factors": anomaly_result["contributing_factors"],
                "model_version": str(anomaly_result["model_version"]),
                "training_window_days": int(settings.TRAINING_WINDOW_DAYS),
                "detected_at": datetime.utcnow().isoformat()
            }

            result = self.supabase.table("anomaly_detections").insert(detection_data).execute()

            if result.data:
                return AnomalyDetectionResponse(**result.data[0])
            else:
                raise Exception("Failed to save anomaly detection")
                
        except Exception as e:
            logger.error(f"Failed to save anomaly detection: {e}")
            raise
    
    async def get_user_anomalies(self, user_id: str, utility_type: Optional[UtilityType] = None, limit: int = 50) -> List[AnomalyDetectionResponse]:
        """Get recent anomalies for a user"""

        await self.init_supabase()

        try:
            query = self.supabase.table("anomaly_detections").select("*").eq("user_id", user_id).eq("is_anomaly", True)

            if utility_type:
                # Handle both UtilityType enum and string
                utility_value = utility_type.value if hasattr(utility_type, 'value') else utility_type
                query = query.eq("utility_type", utility_value)

            result = query.order("detected_at", desc=True).limit(limit).execute()

            return [AnomalyDetectionResponse(**anomaly) for anomaly in result.data]

        except Exception as e:
            logger.error(f"Failed to get user anomalies: {e}")
            return []
    
    async def provide_feedback(self, user_id: str, anomaly_id: str, feedback: str) -> bool:
        """Provide feedback on anomaly detection accuracy"""
        
        await self.init_supabase()
        
        try:
            # First check if feedback already exists
            existing = self.supabase.table("anomaly_detections")\
                .select("user_feedback")\
                .eq("id", anomaly_id)\
                .eq("user_id", user_id)\
                .execute()
            
            if existing.data and existing.data[0].get('user_feedback'):
                logger.warning(f"Feedback already provided for anomaly {anomaly_id}")
                return False  # Feedback already exists
            
            # Provide new feedback
            result = self.supabase.table("anomaly_detections").update({
                "user_feedback": feedback,
                "user_feedback_at": datetime.utcnow().isoformat()
            }).eq("id", anomaly_id).eq("user_id", user_id).execute()
            
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Failed to save feedback: {e}")
            return False

    def get_performance_stats(self) -> Dict[str, Any]:
        """Get comprehensive performance and health statistics"""
        # Calculate cache hit rate
        total_cache_requests = self.performance_metrics['cache_hits'] + self.performance_metrics['cache_misses']
        cache_hit_rate = (self.performance_metrics['cache_hits'] / total_cache_requests * 100) if total_cache_requests > 0 else 0
        
        # Calculate success rate
        total_predictions = self.performance_metrics['total_predictions']
        success_rate = (self.performance_metrics['successful_predictions'] / total_predictions * 100) if total_predictions > 0 else 0
        
        # Memory usage stats
        total_models = len(self.models)
        total_features = len(self.feature_cache)
        
        return {
            "performance": {
                "total_predictions": total_predictions,
                "successful_predictions": self.performance_metrics['successful_predictions'],
                "failed_predictions": self.performance_metrics['failed_predictions'],
                "success_rate_percent": round(success_rate, 2),
                "avg_prediction_time_seconds": round(self.performance_metrics['avg_prediction_time'], 3),
                "training_count": self.performance_metrics['training_count']
            },
            "caching": {
                "cache_hits": self.performance_metrics['cache_hits'],
                "cache_misses": self.performance_metrics['cache_misses'],
                "cache_hit_rate_percent": round(cache_hit_rate, 2),
                "models_cached": total_models,
                "features_cached": total_features,
                "model_cache_capacity": self.models.max_size,
                "feature_cache_capacity": self.feature_cache.max_size
            },
            "database": {
                "db_failures": self.performance_metrics['db_failures'],
                "circuit_breaker_trips": self.performance_metrics['circuit_breaker_trips'],
                "circuit_breaker_open": self.db_circuit_breaker['is_open'],
                "failure_count": self.db_circuit_breaker['failure_count'],
                "failure_threshold": self.db_circuit_breaker['failure_threshold']
            },
            "memory": {
                "last_cleanup": self.last_cleanup.isoformat(),
                "cleanup_interval_minutes": 30
            }
        }
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """Get current memory usage statistics (legacy method)"""
        stats = self.get_performance_stats()
        return {
            "total_models_in_memory": stats["caching"]["models_cached"],
            "max_models_allowed": stats["caching"]["model_cache_capacity"],
            "memory_usage_percentage": (stats["caching"]["models_cached"] / stats["caching"]["model_cache_capacity"]) * 100,
            "last_cleanup": stats["memory"]["last_cleanup"]
        }

    def force_cleanup(self) -> Dict[str, Any]:
        """Force immediate cleanup of stale models and features"""
        models_before = len(self.models)
        features_before = len(self.feature_cache)
        
        # Force cleanup
        self.last_cleanup = datetime.min
        self._cleanup_stale_models()
        
        models_after = len(self.models)
        features_after = len(self.feature_cache)
        
        return {
            "models_before": models_before,
            "models_after": models_after,
            "models_removed": models_before - models_after,
            "features_before": features_before,
            "features_after": features_after,
            "features_removed": features_before - features_after
        }

    def clear_all_caches(self) -> Dict[str, int]:
        """Clear all models and features from memory (emergency cleanup)"""
        model_count = len(self.models)
        feature_count = len(self.feature_cache)
        
        self.models.clear()
        self.feature_cache.clear()
        
        # Reset performance metrics
        self.performance_metrics.update({
            'cache_hits': 0,
            'cache_misses': 0,
            'total_predictions': 0,
            'successful_predictions': 0,
            'failed_predictions': 0,
            'avg_prediction_time': 0,
            'training_count': 0,
            'db_failures': 0,
            'circuit_breaker_trips': 0
        })
        
        # Reset circuit breaker
        self.db_circuit_breaker.update({
            'failure_count': 0,
            'last_failure_time': None,
            'is_open': False
        })
        
        logger.warning(f"Emergency cleanup: cleared {model_count} models and {feature_count} feature caches")
        
        return {
            "models_cleared": model_count,
            "features_cleared": feature_count,
            "total_cleared": model_count + feature_count
        }
    
    def reset_circuit_breaker(self) -> bool:
        """Manually reset the database circuit breaker"""
        self.db_circuit_breaker.update({
            'failure_count': 0,
            'last_failure_time': None,
            'is_open': False
        })
        logger.info("Database circuit breaker manually reset")
        return True

    async def _rule_based_anomaly_detection(self, user_id: str, reading: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Rule-based anomaly detection for small datasets where ML is not viable
        """
        try:
            utility_type = UtilityType(reading["utility_type"])
            current_value = float(reading["reading_value"])

            # Get recent readings for context
            historical_data = await self._get_historical_data(user_id, utility_type, days=30)

            if historical_data.empty or len(historical_data) < 2:
                # Not enough data for any meaningful detection
                return None

            # Get previous reading
            previous_value = float(historical_data.iloc[-1]['reading_value'])
            daily_consumption = current_value - previous_value

            # Rule 1: Meter rollback (impossible)
            if daily_consumption < 0:
                return {
                    "is_anomaly": True,
                    "anomaly_score": -1.0,  # Very confident
                    "severity": AnomalySeverity.CRITICAL,
                    "contributing_factors": {
                        "reason": "Meter rollback detected",
                        "current_reading": current_value,
                        "previous_reading": previous_value,
                        "consumption_change": daily_consumption,
                        "detection_method": "rule_based_rollback"
                    }
                }

            # Rule 2: Static thresholds for extreme consumption
            if utility_type == UtilityType.WATER:
                max_reasonable_daily = 1000  # 1000 liters per day
            else:  # ELECTRICITY
                max_reasonable_daily = 100   # 100 kWh per day

            if daily_consumption > max_reasonable_daily:
                return {
                    "is_anomaly": True,
                    "anomaly_score": -0.8,
                    "severity": AnomalySeverity.HIGH,
                    "contributing_factors": {
                        "reason": "Extreme consumption detected",
                        "daily_consumption": daily_consumption,
                        "threshold": max_reasonable_daily,
                        "detection_method": "rule_based_threshold"
                    }
                }

            # Rule 3: Statistical outlier (if we have enough history)
            if len(historical_data) >= 5:
                recent_consumptions = []
                for i in range(1, min(len(historical_data), 8)):
                    prev_consumption = historical_data.iloc[-i-1]['reading_value']
                    curr_consumption = historical_data.iloc[-i]['reading_value']
                    recent_consumptions.append(curr_consumption - prev_consumption)

                if recent_consumptions:
                    mean_consumption = statistics.mean(recent_consumptions)
                    std_consumption = statistics.stdev(recent_consumptions) if len(recent_consumptions) > 1 else 0

                    if std_consumption > 0:
                        z_score = abs(daily_consumption - mean_consumption) / std_consumption
                        if z_score > 3.0:  # 3 standard deviations
                            return {
                                "is_anomaly": True,
                                "anomaly_score": -0.6,
                                "severity": AnomalySeverity.MEDIUM,
                                "contributing_factors": {
                                    "reason": "Statistical outlier",
                                    "z_score": z_score,
                                    "daily_consumption": daily_consumption,
                                    "mean_consumption": mean_consumption,
                                    "std_consumption": std_consumption,
                                    "detection_method": "rule_based_statistical"
                                }
                            }

            # No anomaly detected
            return None

        except Exception as e:
            logger.error(f"Error in rule-based anomaly detection: {e}")
            return None

    def _update_model_access_time(self, model_key: str):
        """Update the last access time for a cached model"""
        try:
            if model_key in self.models:
                model_data = self.models[model_key]
                model_data["last_accessed"] = datetime.utcnow()
                # Update in cache
                self.models[model_key] = model_data
                logger.debug(f"Updated access time for model: {model_key}")
        except Exception as e:
            logger.warning(f"Failed to update model access time: {e}")


# Global service instance with improved performance monitoring
anomaly_detection_service = AnomalyDetectionService()

# Health check function for monitoring
def get_service_health() -> Dict[str, Any]:
    """Get service health status for monitoring"""
    stats = anomaly_detection_service.get_performance_stats()
    
    # Determine health status
    health_score = 100
    issues = []
    
    # Check success rate
    if stats["performance"]["success_rate_percent"] < 90:
        health_score -= 20
        issues.append("Low prediction success rate")
    
    # Check circuit breaker
    if stats["database"]["circuit_breaker_open"]:
        health_score -= 30
        issues.append("Database circuit breaker is open")
    
    # Check cache performance
    if stats["caching"]["cache_hit_rate_percent"] < 70:
        health_score -= 10
        issues.append("Low cache hit rate")
    
    # Check prediction time
    if stats["performance"]["avg_prediction_time_seconds"] > 2.0:
        health_score -= 15
        issues.append("High prediction latency")
    
    status = "healthy" if health_score >= 80 else "degraded" if health_score >= 50 else "unhealthy"
    
    return {
        "status": status,
        "health_score": max(0, health_score),
        "issues": issues,
        "stats": stats,
        "timestamp": datetime.utcnow().isoformat()
    }


