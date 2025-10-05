"""
Demo Forecasting Endpoints

These endpoints are ONLY for demonstration purposes to bypass time-based restrictions.
They allow testing the full billing cycle flow without waiting for actual billing dates.

The demo endpoints call the exact same service functions as production,
just with demo_mode=True to bypass date checks.
"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import date
from loguru import logger

from app.core.auth import get_current_user
from app.models.schemas import UtilityType
from app.services.cost_forecasting import cost_forecasting_service
from app.services.billing_scheduler import billing_scheduler_service


router = APIRouter(prefix="/demo", tags=["Demo - Forecasting"])


@router.post("/trigger-forecast-reset/{utility_type}")
async def demo_trigger_forecast_reset(
    utility_type: UtilityType,
    current_user: dict = Depends(get_current_user)
):
    """
    DEMO: Force immediate billing cycle transition

    Bypasses billing date check to demonstrate:
    1. Previous forecast storage with actual values
    2. Actual vs predicted comparison
    3. Model retraining with new data point
    4. New forecast generation
    5. Frontend updates

    This is the SAME function that runs automatically at midnight on billing dates,
    just with demo_mode=True to bypass the date check.
    """
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")

        logger.info(f"DEMO: Force forecast reset for {user_id}_{utility_type.value}")

        # Call the REAL billing cycle transition function with demo_mode=True
        result = await cost_forecasting_service.reset_forecast_at_billing_date(
            user_id=user_id,
            utility_type=utility_type,
            current_date=date.today(),
            demo_mode=True  # Only difference from production - bypasses date check
        )

        # Get comparison for frontend
        comparison = await cost_forecasting_service.get_forecast_vs_actual_comparison(
            user_id=user_id,
            utility_type=utility_type,
            limit=1
        )

        # Get new forecast
        new_forecast = await cost_forecasting_service.get_monthly_forecast(
            user_id=user_id,
            utility_type=utility_type
        )

        return {
            "success": result.get("success", False),
            "message": "Billing cycle transition completed (demo mode)",
            "new_forecast": new_forecast,
            "previous_vs_actual": comparison[0] if comparison else None,
            "trigger_frontend_refetch": True
        }

    except Exception as e:
        logger.error(f"Demo forecast reset failed: {e}")
        raise HTTPException(status_code=500, detail=f"Demo forecast reset failed: {str(e)}")


@router.post("/force-model-retrain/{utility_type}")
async def demo_force_model_retrain(
    utility_type: UtilityType,
    current_user: dict = Depends(get_current_user)
):
    """
    DEMO: Force immediate model retraining

    Forces model to retrain with current historical data.
    Useful for testing after adding historical records.
    """
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")

        logger.info(f"DEMO: Force model retrain for {user_id}_{utility_type.value}")

        # Retrain model
        result = await cost_forecasting_service.train_initial_model(
            user_id=user_id,
            utility_type=utility_type
        )

        # Get model info
        model_info = await cost_forecasting_service.get_model_info(
            user_id=user_id,
            utility_type=utility_type
        )

        return {
            "success": True,
            "message": "Model retrained (demo mode)",
            "training_status": result.status.value,
            "model_info": model_info
        }

    except Exception as e:
        logger.error(f"Demo model retrain failed: {e}")
        raise HTTPException(status_code=500, detail=f"Demo model retrain failed: {str(e)}")


@router.get("/forecast-lifecycle/{utility_type}")
async def demo_get_forecast_lifecycle(
    utility_type: UtilityType,
    current_user: dict = Depends(get_current_user)
):
    """
    DEMO: Get complete forecast lifecycle data

    Returns all data for demo dashboard:
    - Current forecast
    - Previous forecast vs actual
    - Comparison history
    - Model info
    """
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found")

        logger.info(f"DEMO: Get forecast lifecycle for {user_id}_{utility_type.value}")

        # Get all data
        current_forecast = await cost_forecasting_service.get_monthly_forecast(
            user_id=user_id,
            utility_type=utility_type
        )

        comparisons = await cost_forecasting_service.get_forecast_vs_actual_comparison(
            user_id=user_id,
            utility_type=utility_type,
            limit=6
        )

        model_info = await cost_forecasting_service.get_model_info(
            user_id=user_id,
            utility_type=utility_type
        )

        return {
            "current_forecast": current_forecast,
            "previous_vs_actual": comparisons[0] if comparisons else None,
            "comparison_history": comparisons,
            "model_info": model_info
        }

    except Exception as e:
        logger.error(f"Demo lifecycle fetch failed: {e}")
        raise HTTPException(status_code=500, detail=f"Demo lifecycle fetch failed: {str(e)}")


@router.post("/admin/trigger-daily-billing-check")
async def demo_admin_trigger_daily_billing_check(
    current_user: dict = Depends(get_current_user)
):
    """
    DEMO: Manually trigger the daily billing check for all users

    This is the SAME function that runs automatically at midnight via scheduler.
    Checks all users and processes any whose billing date matches today.
    """
    try:
        logger.info("DEMO: Manual trigger of daily billing check")

        # Run the REAL scheduler function (same one that runs at midnight)
        await billing_scheduler_service.process_daily_billing_cycles()

        return {
            "success": True,
            "message": "Daily billing check completed (demo mode)"
        }

    except Exception as e:
        logger.error(f"Demo billing check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Demo billing check failed: {str(e)}")
