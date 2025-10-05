"""
Cost Forecasting API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any
from datetime import date, datetime, timezone
from pydantic import BaseModel

from app.core.auth import get_current_user
from app.models.schemas import UtilityType
from app.services.cost_forecasting import cost_forecasting_service
from app.services.historical_data import historical_data_service
from loguru import logger

router = APIRouter()

class DailyCostPredictionRequest(BaseModel):
    utility_type: UtilityType
    daily_consumption: float
    target_date: Optional[str] = None
    cumulative_month_consumption: Optional[float] = None

class MonthlyForecastRequest(BaseModel):
    utility_type: UtilityType
    estimated_monthly_consumption: Optional[float] = None

class CostPredictionResponse(BaseModel):
    predicted_daily_cost: float
    confidence_score: float
    feature_values: Dict[str, Any]
    feature_importance: Dict[str, float]
    predictor_strength: Dict[str, float]
    performance_metrics: Dict[str, Any]
    prediction_date: str
    trained_at: str

class MonthlyForecastResponse(BaseModel):
    user_id: str
    utility_type: str
    billing_month: str
    predicted_monthly_cost: float
    predicted_monthly_consumption: float
    confidence_score: float
    billing_cycle_days: int
    elapsed_days: int
    remaining_days: int
    forecast_info: Dict[str, Any]
    generated_at: str

class ModelInfoResponse(BaseModel):
    user_id: str
    utility_type: str
    features: list[str]
    feature_importance: Dict[str, float]
    predictor_strength: Dict[str, Any]
    performance_metrics: Dict[str, Any]
    user_daily_average: float
    trained_at: str
    algorithm_type: str
    total_features: int

@router.post("/predict-daily-cost", response_model=CostPredictionResponse)
async def predict_daily_cost(
    request: DailyCostPredictionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Predict daily cost for given consumption using trained model
    """
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")

        # Parse target date if provided
        target_date = None
        if request.target_date:
            target_date = date.fromisoformat(request.target_date)

        # REQUIREMENT 5: Billing-aware prediction using NEW clean service
        target_date_obj = target_date if target_date else date.today()

        prediction = await cost_forecasting_service.predict_billing_aware_cost(
            user_id=user_id,
            utility_type=request.utility_type,
            daily_consumption=request.daily_consumption,
            target_date=target_date_obj
        )

        if not prediction:
            raise HTTPException(
                status_code=404,
                detail="Unable to generate prediction. Please ensure you have sufficient data (historical billing OR daily meter readings)."
            )

        # Convert BillingAwareForecast to API response format
        return CostPredictionResponse(
            predicted_daily_cost=prediction.predicted_cost,
            confidence_score=prediction.confidence_score,
            feature_values={
                "daily_consumption": request.daily_consumption,
                "billing_cycle_day": prediction.billing_position.elapsed_days,
                "month_number": target_date_obj.month,
                "elapsed_days": prediction.billing_position.elapsed_days,
                "remaining_days": prediction.billing_position.remaining_days
            },
            feature_importance=prediction.features_importance,
            predictor_strength={
                "billing_cycle_progress": prediction.billing_position.cycle_progress,
                "data_availability": prediction.days_of_data_used / 30.0
            },
            performance_metrics={
                "cycle_average_daily": prediction.cycle_average_daily,
                "projected_monthly_cost": prediction.projected_monthly_cost,
                "days_of_data_used": prediction.days_of_data_used
            },
            prediction_date=prediction.prediction_date.isoformat(),
            trained_at=prediction.prediction_date.isoformat()
        )

    except Exception as e:
        logger.error(f"Error predicting daily cost: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/monthly-forecast", response_model=MonthlyForecastResponse)
async def get_monthly_forecast(
    request: MonthlyForecastRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate monthly cost forecast for current billing cycle
    """
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")

        # Get forecast from service
        forecast = await cost_forecasting_service.get_monthly_forecast(
            user_id=user_id,
            utility_type=request.utility_type,
            estimated_monthly_consumption=request.estimated_monthly_consumption
        )

        if not forecast:
            raise HTTPException(
                status_code=404,
                detail="Unable to generate forecast. Please ensure you have sufficient data (historical billing OR meter readings)."
            )

        return MonthlyForecastResponse(**forecast)

    except Exception as e:
        logger.error(f"Error generating monthly forecast: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/model-info/{utility_type}", response_model=ModelInfoResponse)
async def get_model_info(
    utility_type: UtilityType,
    current_user: dict = Depends(get_current_user)
):
    """
    Get information about user's trained forecasting model
    """
    try:
        user_id = current_user.get("id")

        if not user_id:
            logger.error("❌ User ID not found in current_user")
            raise HTTPException(status_code=401, detail="User ID not found")

        # Get model info from service
        model_info = await cost_forecasting_service.get_model_info(
            user_id=user_id,
            utility_type=utility_type
        )

        if not model_info:
            raise HTTPException(
                status_code=404,
                detail=f"No trained model found for {utility_type.value}. Please add historical billing data OR capture daily meter readings, then trigger training."
            )

        return ModelInfoResponse(**model_info)

    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/model-status/{utility_type}")
async def get_model_status(
    utility_type: UtilityType,
    current_user: dict = Depends(get_current_user)
):
    """
    Check model training status without triggering training.
    Returns: ready, training, not_started, insufficient_data
    """
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")

        model_key = f"{user_id}_{utility_type.value}"

        # Check if training is currently in progress
        is_training = cost_forecasting_service._training_locks.get(model_key, False)

        # Check if model exists in memory
        has_cached_model = model_key in cost_forecasting_service.models

        # Check if model exists in database (without loading it)
        await cost_forecasting_service.init_supabase()
        db_result = cost_forecasting_service.supabase.table("user_forecasting_models").select("id").eq(
            "user_id", user_id
        ).eq("utility_type", utility_type.value).eq("is_active", True).execute()

        has_db_model = bool(db_result.data)

        # Get data count using new clean service
        data_count = await historical_data_service.count_records(user_id, utility_type)

        # Determine status
        if is_training:
            status = "training"
        elif has_cached_model or has_db_model:
            status = "ready"
        elif data_count < 3:
            status = "insufficient_data"
        else:
            status = "not_started"

        return {
            "status": status,
            "has_cached_model": has_cached_model,
            "has_db_model": has_db_model,
            "historical_data_count": data_count,
            "is_training": is_training,
            "utility_type": utility_type.value,
            "training_data_breakdown": {"historical_records": data_count}  # Simple breakdown
        }

    except Exception as e:
        logger.error(f"Error checking model status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/train-model/{utility_type}")
async def train_model(
    utility_type: UtilityType,
    current_user: dict = Depends(get_current_user)
):
    """
    Manually trigger model training for a utility type
    """
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")

        # Trigger model training using new clean service
        result = await cost_forecasting_service.train_initial_model(
            user_id=user_id,
            utility_type=utility_type
        )
        success = result.status.value == "ready"

        if not success:
            raise HTTPException(
                status_code=400,
                detail="Model training failed. Please ensure you have sufficient historical data (3+ months billing data OR 5+ daily meter readings)."
            )

        return {
            "message": f"Model training completed successfully for {utility_type.value}",
            "user_id": user_id,
            "utility_type": utility_type.value
        }

    except Exception as e:
        logger.error(f"Error training model: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clear-fallback-data/{utility_type}")
async def clear_fallback_data(
    utility_type: UtilityType,
    current_user: dict = Depends(get_current_user)
):
    """
    Clear cached forecasts and models that use fallback values (5.0 daily avg)
    """
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")

        await cost_forecasting_service.init_supabase()

        # Clear cached forecasts
        forecast_result = cost_forecasting_service.supabase.table("cost_forecasts").delete().eq(
            "user_id", user_id
        ).eq("utility_type", utility_type.value).execute()

        # Clear models with fallback daily averages
        model_result = cost_forecasting_service.supabase.table("user_forecasting_models").delete().eq(
            "user_id", user_id
        ).eq("utility_type", utility_type.value).execute()

        # Clear in-memory models
        model_key = f"{user_id}_{utility_type.value}"
        if model_key in cost_forecasting_service.models:
            del cost_forecasting_service.models[model_key]

        return {
            "message": f"Cleared fallback data for {utility_type.value}",
            "cached_forecasts_deleted": len(forecast_result.data) if forecast_result.data else 0,
            "models_deleted": len(model_result.data) if model_result.data else 0,
            "memory_model_cleared": model_key in cost_forecasting_service.models
        }

    except Exception as e:
        logger.error(f"Error clearing fallback data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/debug/{utility_type}")
async def debug_forecast_data(
    utility_type: UtilityType,
    current_user: dict = Depends(get_current_user)
):
    """
    Debug endpoint to check what data exists for forecasting
    """
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")

        await cost_forecasting_service.init_supabase()

        # Get historical data count using new clean service
        historical_count = await historical_data_service.count_records(user_id, utility_type)

        # Check meter readings
        meter_readings = cost_forecasting_service.supabase.table("meter_readings").select("*").eq(
            "user_id", user_id
        ).eq("utility_type", utility_type.value).execute()
        meter_count = len(meter_readings.data) if meter_readings.data else 0

        # Check cached forecasts
        cached_forecasts = cost_forecasting_service.supabase.table("cost_forecasts").select("*").eq(
            "user_id", user_id
        ).eq("utility_type", utility_type.value).order("forecast_created_at", desc=True).limit(5).execute()

        # Check model status
        model_key = f"{user_id}_{utility_type.value}"
        has_memory_model = model_key in cost_forecasting_service.models

        # Check database model
        db_model = cost_forecasting_service.supabase.table("user_forecasting_models").select("*").eq(
            "user_id", user_id
        ).eq("utility_type", utility_type.value).eq("is_active", True).execute()

        # NEW DEBUG INFO: Billing cycle details
        from datetime import date
        today = date.today()

        billing_day = await cost_forecasting_service._get_user_billing_date(user_id, utility_type)
        billing_position = await cost_forecasting_service._calculate_billing_position(
            user_id, utility_type, today
        )

        # Get user preferences to verify billing date setting
        preferences = cost_forecasting_service.supabase.table("user_preferences").select("*").eq(
            "user_id", user_id
        ).execute()

        # Model training status
        model_status = await cost_forecasting_service.get_model_training_status(user_id, utility_type)

        return {
            "user_id": user_id,
            "utility_type": utility_type.value,
            "today": today.isoformat(),

            # NEW: Billing cycle debugging
            "billing_cycle": {
                "billing_day": billing_day,
                "cycle_start": billing_position.cycle_start_date.isoformat(),
                "cycle_end": billing_position.cycle_end_date.isoformat(),
                "elapsed_days": billing_position.elapsed_days,
                "remaining_days": billing_position.remaining_days,
                "total_cycle_days": billing_position.total_cycle_days,
                "cycle_progress": billing_position.cycle_progress
            },

            # Data sources
            "data_sources": {
                "historical_records": historical_count,
                "meter_readings": meter_count,
                "preferences_found": len(preferences.data) > 0 if preferences.data else False
            },

            # Model status using new implementation
            "model_status": {
                "has_memory_model": has_memory_model,
                "has_database_model": len(db_model.data) > 0 if db_model.data else False,
                "training_status": model_status,
                "model_version": "2.0_clean_implementation"
            },

            # Debug raw preferences to see billing date
            "raw_preferences": preferences.data[0] if preferences.data else None,

            "implementation": "NEW_CLEAN_COST_FORECASTING_ENGINE"
        }

    except Exception as e:
        logger.error(f"Error in debug endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check-retrain/{utility_type}")
async def check_retrain_conditions(
    utility_type: UtilityType,
    current_user: dict = Depends(get_current_user)
):
    """
    NEW ENDPOINT: Check if model should be retrained based on enhanced conditions
    """
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")

        # Check if model should be retrained
        should_retrain = await cost_forecasting_service.should_retrain_model(user_id, utility_type)

        # Get training data count for analysis
        historical_count = await historical_data_service.count_records(user_id, utility_type)

        # Check if model needs retraining
        model_status = await cost_forecasting_service.get_model_training_status(user_id, utility_type)

        return {
            "user_id": user_id,
            "utility_type": utility_type.value,
            "should_retrain": should_retrain,
            "historical_records_count": historical_count,
            "model_status": model_status,
            "check_timestamp": datetime.now(timezone.utc).isoformat(),
            "retraining_logic": "enhanced_with_daily_reactivity"
        }

    except Exception as e:
        logger.error(f"Error checking retrain conditions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/billing-aware-forecast")
async def get_billing_aware_forecast(
    request: MonthlyForecastRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    NEW ENDPOINT: Get forecast with billing-cycle-aware monthly prediction
    """
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")

        # Get monthly forecast
        forecast = await cost_forecasting_service.get_monthly_forecast(
            user_id=user_id,
            utility_type=request.utility_type,
            estimated_monthly_consumption=request.estimated_monthly_consumption
        )

        if not forecast:
            raise HTTPException(
                status_code=404,
                detail="Unable to generate billing-aware forecast. Please ensure you have sufficient data."
            )

        # Add billing context to response
        forecast["billing_aware"] = True
        forecast["reason"] = "Monthly forecast aligned with billing cycle"

        return MonthlyForecastResponse(**forecast)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating billing-aware forecast: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/forecast-comparison/{utility_type}")
async def get_forecast_comparison(
    utility_type: UtilityType,
    limit: int = 6,
    current_user: dict = Depends(get_current_user)
):
    """
    Get forecast vs actual comparison for previous billing cycles
    """
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")

        comparisons = await cost_forecasting_service.get_forecast_vs_actual_comparison(
            user_id=user_id,
            utility_type=utility_type,
            limit=limit
        )

        return {
            "user_id": user_id,
            "utility_type": utility_type.value,
            "comparisons": comparisons,
            "total_records": len(comparisons)
        }

    except Exception as e:
        logger.error(f"Error getting forecast comparison: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/forecast-accuracy/{utility_type}")
async def get_forecast_accuracy(
    utility_type: UtilityType,
    current_user: dict = Depends(get_current_user)
):
    """
    Get overall forecast accuracy trend
    """
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")

        accuracy = await cost_forecasting_service.get_forecast_accuracy_trend(
            user_id=user_id,
            utility_type=utility_type
        )

        return {
            "user_id": user_id,
            "utility_type": utility_type.value,
            **accuracy
        }

    except Exception as e:
        logger.error(f"Error getting forecast accuracy: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/billing-cycle-reset/{utility_type}")
async def reset_billing_cycle(
    utility_type: UtilityType,
    current_user: dict = Depends(get_current_user)
):
    """
    Trigger billing cycle reset and comparison

    This endpoint handles end-of-billing-cycle operations:
    1. Store the previous forecast
    2. Calculate actual consumption and cost from meter readings
    3. Compare forecast vs actual and store results
    4. Retrain model with new billing cycle data
    5. Reset baseline for new billing cycle

    Can be called manually or automatically when billing date is reached.
    """
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")

        logger.info(f"Billing cycle reset requested for user {user_id}, utility {utility_type.value}")

        # Trigger billing cycle reset
        success = await cost_forecasting_service.reset_forecast_at_billing_date(
            user_id=user_id,
            utility_type=utility_type,
            current_date=date.today()
        )

        if not success:
            return {
                "message": "Not billing date yet or no data to process",
                "user_id": user_id,
                "utility_type": utility_type.value,
                "billing_cycle_reset": False
            }

        # Get the comparison to return to frontend
        comparison = await cost_forecasting_service.get_forecast_vs_actual_comparison(
            user_id=user_id,
            utility_type=utility_type,
            limit=1
        )

        return {
            "message": "Billing cycle reset completed successfully",
            "user_id": user_id,
            "utility_type": utility_type.value,
            "billing_cycle_reset": True,
            "latest_comparison": comparison[0] if comparison else None,
            "actions_completed": [
                "Stored previous forecast",
                "Calculated actual consumption and cost",
                "Compared forecast vs actual",
                "Retrained model with new data",
                "Reset billing cycle baseline"
            ]
        }

    except Exception as e:
        logger.error(f"Error resetting billing cycle: {e}")
        raise HTTPException(status_code=500, detail=str(e))
async def admin_trigger_daily_billing_check(
    current_user: dict = Depends(get_current_user)
):
    """
    🔧 ADMIN ENDPOINT: Manually trigger the daily billing cycle check for all users

    This endpoint allows you to test the automatic billing cycle scheduler without waiting.
    It runs the same process that executes automatically every day at midnight.
    """
    try:
        from app.services.billing_scheduler import billing_scheduler_service

        logger.info(f"🔧 ADMIN: Manual trigger of daily billing cycle check by user {current_user.get('id')}")

        # Run the daily billing cycle check
        await billing_scheduler_service.process_daily_billing_cycles()

        return {
            "success": True,
            "message": "✅ Daily billing cycle check completed",
            "triggered_by": current_user.get("id"),
            "info": "Check logs for detailed processing information"
        }

    except Exception as e:
        logger.error(f"❌ ADMIN Error: Failed to trigger daily billing check: {e}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=f"Failed to trigger billing check: {str(e)}")