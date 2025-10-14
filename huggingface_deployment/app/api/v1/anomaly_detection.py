"""
Enhanced Anomaly Detection API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.core.auth import get_current_user
from app.models.schemas import (
    UserResponse, 
    UtilityType, 
    AnomalyDetectionResponse,
    AnomalySeverity
)
from app.services.anomaly_detection import anomaly_detection_service, get_service_health
from pydantic import BaseModel
from loguru import logger

router = APIRouter()

# Request/Response models
class AnomalyDetectionRequest(BaseModel):
    reading_id: str

class AnomalyFeedbackRequest(BaseModel):
    anomaly_id: str
    feedback: str  # 'correct', 'false_positive', 'missed_anomaly'

class CleanDataRequest(BaseModel):
    utility_type: UtilityType
    days: Optional[int] = 30

class ConsumptionStatsResponse(BaseModel):
    daily_avg: float
    daily_max: float
    daily_min: float
    total_consumption: float
    trend: str
    readings_count: int
    clean_readings_count: int

class ServiceHealthResponse(BaseModel):
    status: str
    health_score: int
    issues: List[str]
    stats: dict
    timestamp: str

@router.post("/detect", response_model=Optional[AnomalyDetectionResponse])
async def detect_anomaly(
    request: AnomalyDetectionRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Detect anomaly for a specific reading using enhanced hybrid approach
    """
    try:
        result = await anomaly_detection_service.detect_anomaly(
            user_id=current_user["id"],
            reading_id=request.reading_id
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Anomaly detection failed: {str(e)}"
        )

@router.get("/user-anomalies/{utility_type}")
async def get_user_anomalies(
    utility_type: UtilityType,
    limit: int = 50,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> List[AnomalyDetectionResponse]:
    """
    Get recent anomalies for the current user
    """
    try:
        anomalies = await anomaly_detection_service.get_user_anomalies(
            user_id=current_user["id"],
            utility_type=utility_type,
            limit=limit
        )
        return anomalies
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user anomalies: {str(e)}"
        )

@router.post("/feedback")
async def provide_anomaly_feedback(
    request: AnomalyFeedbackRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Provide feedback on anomaly detection accuracy
    """
    try:
        success = await anomaly_detection_service.provide_feedback(
            user_id=current_user["id"],
            anomaly_id=request.anomaly_id,
            feedback=request.feedback
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Anomaly not found or feedback already provided"
            )
        return {"success": True, "message": "Feedback recorded successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record feedback: {str(e)}"
        )

@router.get("/clean-data/{utility_type}")
async def get_clean_data_for_forecasting(
    utility_type: UtilityType,
    days: int = 30,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get clean historical data for cost forecasting (excludes anomalous readings)
    """
    try:
        clean_data = await anomaly_detection_service.get_data_for_cost_forecasting(
            user_id=current_user["id"],
            utility_type=utility_type,
            days=days
        )
        
        # Convert DataFrame to list of dictionaries
        if not clean_data.empty:
            data_list = clean_data.to_dict('records')
            for record in data_list:
                # Ensure timestamps are serializable
                if 'capture_timestamp' in record:
                    record['capture_timestamp'] = record['capture_timestamp'].isoformat()
        else:
            data_list = []
        
        return {
            "data": data_list,
            "count": len(data_list),
            "days": days,
            "utility_type": utility_type.value,
            "excluded_anomalies": True
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get clean data: {str(e)}"
        )

@router.get("/consumption-stats/{utility_type}", response_model=ConsumptionStatsResponse)
async def get_consumption_statistics(
    utility_type: UtilityType,
    days: int = 30,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get consumption statistics using clean data for accurate analysis
    """
    try:
        stats = await anomaly_detection_service.get_consumption_statistics(
            user_id=current_user["id"],
            utility_type=utility_type,
            days=days
        )
        return ConsumptionStatsResponse(**stats)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get consumption statistics: {str(e)}"
        )

@router.get("/health", response_model=ServiceHealthResponse)
async def get_anomaly_detection_health():
    """
    Get anomaly detection service health status
    """
    try:
        health = get_service_health()
        return ServiceHealthResponse(**health)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get service health: {str(e)}"
        )


@router.get("/performance-stats")
async def get_performance_statistics():
    """
    Get detailed performance statistics for monitoring
    """
    try:
        stats = anomaly_detection_service.get_performance_stats()
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get performance stats: {str(e)}"
        )


@router.post("/force-cleanup")
async def force_memory_cleanup():
    """
    Force cleanup of stale models and features (admin endpoint)
    """
    try:
        result = anomaly_detection_service.force_cleanup()
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to force cleanup: {str(e)}"
        )

@router.post("/reset-circuit-breaker")
async def reset_circuit_breaker():
    """
    Manually reset the database circuit breaker (admin endpoint)
    """
    try:
        success = anomaly_detection_service.reset_circuit_breaker()
        return {"success": success, "message": "Circuit breaker reset successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset circuit breaker: {str(e)}"
        )