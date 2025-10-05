"""
Meter readings API endpoints
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import JSONResponse

from app.models.schemas import (
    MeterReadingCreate,
    MeterReadingUpdate,
    MeterReadingResponse,
    CreateReadingResponse,
    UtilityType,
    UsageAnalytics,
    UsageAnalyticsResponse,
    ImageProcessRequest,
    ImageProcessResponse
)
from app.core.auth import get_current_user_id
from app.core.database import get_supabase
from app.services.meter_readings import meter_reading_service
from app.services.external_yolo_service import external_yolo_service
from loguru import logger

router = APIRouter()


@router.post("/", response_model=CreateReadingResponse, status_code=status.HTTP_201_CREATED)
async def create_reading(
    reading_data: MeterReadingCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new meter reading"""

    try:
        result = await meter_reading_service.create_reading(user_id, reading_data)

        # AUTOMATIC BILLING CYCLE CHECK
        # After creating reading, check if today is billing date
        # If yes, automatically trigger billing cycle reset (store forecast, compare, retrain)
        try:
            from app.services.cost_forecasting import cost_forecasting_service
            from datetime import date

            utility_type = reading_data.utility_type

            logger.info(f"Checking if billing cycle reset needed for {user_id}, {utility_type.value}")

            # This will check if today is billing date and handle all cycle-end operations
            billing_reset_triggered = await cost_forecasting_service.reset_forecast_at_billing_date(
                user_id=user_id,
                utility_type=utility_type,
                current_date=date.today()
            )

            if billing_reset_triggered:
                logger.info(f"✅ Billing cycle automatically reset for {user_id}, {utility_type.value}")

        except Exception as billing_error:
            # Don't fail the reading creation if billing cycle check fails
            logger.warning(f"Billing cycle check failed (non-critical): {billing_error}")

        # Handle both response formats from the service
        if isinstance(result, dict) and "reading" in result:
            # Service returned dict with reading and anomaly
            return CreateReadingResponse(
                reading=result["reading"],
                anomaly=result.get("anomaly")
            )
        else:
            # Service returned just the reading
            return CreateReadingResponse(
                reading=result,
                anomaly=None
            )

    except Exception as e:
        logger.error(f"Error creating reading: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=List[MeterReadingResponse])
async def get_readings(
    user_id: str = Depends(get_current_user_id),
    utility_type: Optional[UtilityType] = Query(None, description="Filter by utility type"),
    limit: int = Query(50, ge=1, le=100, description="Number of readings to return"),
    offset: int = Query(0, ge=0, description="Number of readings to skip"),
    start_date: Optional[datetime] = Query(None, description="Start date filter (ISO format)"),
    end_date: Optional[datetime] = Query(None, description="End date filter (ISO format)")
):
    """Get meter readings with optional filters"""
    
    try:
        readings = await meter_reading_service.get_readings(
            user_id=user_id,
            utility_type=utility_type,
            limit=limit,
            offset=offset,
            start_date=start_date,
            end_date=end_date
        )
        return readings
        
    except Exception as e:
        logger.error(f"Error getting readings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get readings"
        )


@router.get("/{reading_id}", response_model=MeterReadingResponse)
async def get_reading(
    reading_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific meter reading"""
    
    try:
        reading = await meter_reading_service.get_reading(user_id, reading_id)
        
        if not reading:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reading not found"
            )
        
        return reading
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting reading: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get reading"
        )


@router.put("/{reading_id}", response_model=MeterReadingResponse)
async def update_reading(
    reading_id: str,
    update_data: MeterReadingUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update a meter reading"""
    
    try:
        reading = await meter_reading_service.update_reading(user_id, reading_id, update_data)
        
        if not reading:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reading not found"
            )
        
        return reading
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating reading: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update reading"
        )


@router.delete("/{reading_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reading(
    reading_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a meter reading"""
    
    try:
        success = await meter_reading_service.delete_reading(user_id, reading_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reading not found"
            )
        
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content=None)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting reading: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete reading"
        )


@router.get("/latest/{utility_type}", response_model=MeterReadingResponse)
async def get_latest_reading(
    utility_type: UtilityType,
    user_id: str = Depends(get_current_user_id)
):
    """Get the latest reading for a utility type"""
    
    try:
        reading = await meter_reading_service.get_latest_reading(user_id, utility_type)
        
        if not reading:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No readings found for {utility_type}"
            )
        
        return reading
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting latest reading: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get latest reading"
        )


@router.post("/process-image", response_model=ImageProcessResponse)
async def process_meter_image(
    image_request: ImageProcessRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Process meter image with CNN to extract reading"""
    
    logger.info("=== API ENDPOINT process_meter_image called ===")
    logger.info(f"User ID: {user_id}")
    logger.info(f"Utility type: {image_request.utility_type}")

    try:
        # Use external YOLO service (will fallback to local if needed)
        result = await external_yolo_service.process_image(
            image_request.image_data,
            image_request.utility_type
        )
        
        logger.info(f"=== API RESULT: {result} ===")
        return result
        
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image processing failed: {str(e)}"
        )


@router.post("/test-process-image", response_model=ImageProcessResponse)
async def test_process_meter_image(
    image_request: ImageProcessRequest
):
    """Test endpoint - Process meter image with CNN to extract reading (NO AUTH)"""

    try:
        # Use external YOLO service (will fallback to local if needed)
        result = await external_yolo_service.process_image(
            image_request.image_data,
            image_request.utility_type
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image processing failed: {str(e)}"
        )


@router.get("/utility-price/{utility_type}")
async def get_current_utility_price(
    utility_type: UtilityType,
    region: Optional[str] = Query(None, description="Region for location-based pricing")
):
    """Get current utility price per unit (kWh/m³)
    
    Returns static pricing data since we don't have real utility provider APIs.
    In a real implementation, this would connect to utility company APIs or 
    a pricing database that's regularly updated.
    """
    
    # Static pricing configuration - would come from utility providers in real implementation
    pricing_config = {
        "electricity": {
            "base_rate": 9.50,
            "peak_rate": 11.50,  # 9AM-9PM
            "off_peak_rate": 8.00,  # 9PM-9AM
            "tiers": [
                {"description": "Peak Hours (9AM-9PM)", "rate": 11.50},
                {"description": "Off-Peak Hours", "rate": 8.00}
            ]
        },
        "water": {
            "base_rate": 25.50,
            "excess_rate": 28.00,  # Above 10m³
            "tiers": [
                {"description": "First 10m³", "rate": 25.50},
                {"description": "11m³ and above", "rate": 28.00}
            ]
        }
    }
    
    config = pricing_config.get(utility_type.value)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pricing not available for {utility_type.value}"
        )
    
    return {
        "utility_type": utility_type.value,
        "price_per_unit": config["base_rate"],
        "base_rate": config["base_rate"],
        "peak_rate": config.get("peak_rate"),
        "off_peak_rate": config.get("off_peak_rate"),
        "excess_rate": config.get("excess_rate"),
        "tiers": config.get("tiers"),
        "rate_type": "Base rate for residential",
        "effective_date": datetime.now().date().isoformat(),
        "region": region or "Metro Manila",
        "seasonal_multiplier": 1.0,
        "is_static": True,
        "note": "Static pricing - would integrate with utility provider APIs in production"
    }


@router.get("/usage/{utility_type}")
async def calculate_usage(
    utility_type: UtilityType,
    start_date: datetime = Query(..., description="Start date (ISO format)"),
    end_date: datetime = Query(..., description="End date (ISO format)"),
    user_id: str = Depends(get_current_user_id)
):
    """Calculate usage between two dates"""
    
    try:
        usage = await meter_reading_service.calculate_usage(
            user_id, utility_type, start_date, end_date
        )
        
        if usage is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Unable to calculate usage for the specified period"
            )
        
        return {
            "utility_type": utility_type,
            "start_date": start_date,
            "end_date": end_date,
            "usage": float(usage),
            "period_days": (end_date - start_date).days
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating usage: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate usage"
        )