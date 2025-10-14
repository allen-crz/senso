"""
Analytics API endpoints for anomaly detection
"""
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.models.schemas import (
    UtilityType,
    AnomalyDetectionResponse,
    AnomalyFeedback,
    UsageAnalyticsResponse
)
from app.core.auth import get_current_user_id
from app.services.anomaly_detection import anomaly_detection_service
from app.services.meter_readings import meter_reading_service
from loguru import logger

router = APIRouter()


# Note: Anomaly detection endpoints moved to /anomaly-detection for enhanced functionality


# Usage Analytics Endpoints

@router.get("/usage", response_model=UsageAnalyticsResponse)
async def get_usage_analytics(
    utility_type: UtilityType,
    period: str = Query(..., pattern="^(daily|weekly|monthly|yearly)$", description="Analysis period"),
    start_date: datetime = Query(..., description="Start date for analysis"),
    end_date: datetime = Query(..., description="End date for analysis"),
    user_id: str = Depends(get_current_user_id)
):
    """Get usage analytics for a specific period"""
    
    try:
        # Validate date range
        if end_date <= start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be after start date"
            )
        
        # Limit analysis period to prevent excessive processing
        max_days = 365 if period == "yearly" else 180
        if (end_date - start_date).days > max_days:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Analysis period too long. Maximum {max_days} days allowed."
            )
        
        # Get readings for the period
        readings = await meter_reading_service.get_readings(
            user_id=user_id,
            utility_type=utility_type,
            start_date=start_date,
            end_date=end_date,
            limit=1000  # High limit for analytics
        )
        
        if not readings:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No readings found for the specified period"
            )
        
        # Calculate usage analytics
        analytics = await _calculate_usage_analytics(
            readings, utility_type, period, start_date, end_date, user_id
        )
        
        return analytics
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting usage analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get usage analytics"
        )


@router.get("/usage/summary")
async def get_usage_summary(
    user_id: str = Depends(get_current_user_id),
    days: int = Query(30, ge=7, le=365, description="Number of days to analyze")
):
    """Get usage summary for dashboard"""
    
    try:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        summary = {}
        
        for utility_type in [UtilityType.ELECTRICITY, UtilityType.WATER]:
            # Get recent readings
            readings = await meter_reading_service.get_readings(
                user_id=user_id,
                utility_type=utility_type,
                start_date=start_date,
                end_date=end_date,
                limit=100
            )
            
            if readings:
                # Calculate basic stats
                latest_reading = readings[0] if readings else None
                total_usage = await meter_reading_service.calculate_usage(
                    user_id, utility_type, start_date, end_date
                )
                
                # Get recent anomalies
                anomalies = await anomaly_detection_service.get_user_anomalies(
                    user_id=user_id,
                    utility_type=utility_type,
                    limit=10
                )
                
                recent_anomalies = [a for a in anomalies if (datetime.utcnow() - a.detected_at).days <= days]
                
                summary[utility_type.value] = {
                    "latest_reading": latest_reading.reading_value if latest_reading else None,
                    "latest_reading_date": latest_reading.capture_timestamp if latest_reading else None,
                    "total_usage": float(total_usage) if total_usage else None,
                    "total_readings": len(readings),
                    "anomaly_count": len(recent_anomalies),
                    "high_severity_anomalies": len([a for a in recent_anomalies if a.severity in ["high", "critical"]])
                }
            else:
                summary[utility_type.value] = {
                    "latest_reading": None,
                    "latest_reading_date": None,
                    "total_usage": None,
                    "total_readings": 0,
                    "anomaly_count": 0,
                    "high_severity_anomalies": 0
                }
        
        return summary

    except Exception as e:
        logger.error(f"Error getting usage summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get usage summary"
        )


@router.get("/current-cycle-consumption/{utility_type}")
async def get_current_cycle_consumption(
    utility_type: UtilityType,
    user_id: str = Depends(get_current_user_id)
):
    """
    Get consumption since the start of current billing cycle

    Uses last_bill_reading as baseline if available, providing accurate
    cycle-to-date consumption even for mid-cycle users.
    """
    try:
        from app.services.cost_forecasting import cost_forecasting_service

        # Get baseline reading (from last bill or first reading)
        baseline = await cost_forecasting_service.get_billing_cycle_baseline(
            user_id, utility_type
        )

        if not baseline:
            # Get billing position even without baseline (for cycle dates)
            from datetime import date
            billing_position = await cost_forecasting_service._calculate_billing_position(
                user_id, utility_type, date.today()
            )

            return {
                "utility_type": utility_type.value,
                "has_baseline": False,
                "message": "No baseline reading available. Please scan your first meter reading.",
                "cycle_consumption": None,
                "baseline_reading": None,
                "latest_reading": None,
                "baseline_date": None,
                "billing_cycle": {
                    "start_date": billing_position.cycle_start_date.isoformat(),
                    "end_date": billing_position.cycle_end_date.isoformat(),
                    "elapsed_days": 0,  # No baseline = no elapsed days tracked
                    "remaining_days": billing_position.total_cycle_days,
                    "total_days": billing_position.total_cycle_days
                },
                "daily_average": 0
            }

        # Get latest reading
        latest_reading = await meter_reading_service.get_latest_reading(
            user_id, utility_type
        )

        if not latest_reading:
            # Get billing position
            from datetime import date
            billing_position = await cost_forecasting_service._calculate_billing_position(
                user_id, utility_type, date.today()
            )

            return {
                "utility_type": utility_type.value,
                "has_baseline": True,
                "message": "Baseline set, but no meter readings yet.",
                "cycle_consumption": 0,
                "baseline_reading": baseline['reading_value'],
                "latest_reading": None,
                "baseline_date": baseline['reading_date'],
                "billing_cycle": {
                    "start_date": billing_position.cycle_start_date.isoformat(),
                    "end_date": billing_position.cycle_end_date.isoformat(),
                    "elapsed_days": billing_position.elapsed_days,
                    "remaining_days": billing_position.remaining_days,
                    "total_days": billing_position.total_cycle_days
                },
                "daily_average": 0
            }

        # Calculate consumption since baseline
        cycle_consumption = float(latest_reading.reading_value) - float(baseline['reading_value'])

        # Get billing position
        from datetime import date
        billing_position = await cost_forecasting_service._calculate_billing_position(
            user_id, utility_type, date.today()
        )

        return {
            "utility_type": utility_type.value,
            "has_baseline": True,
            "cycle_consumption": round(cycle_consumption, 3),
            "baseline_reading": float(baseline['reading_value']),
            "latest_reading": float(latest_reading.reading_value),
            "baseline_date": baseline['reading_date'],
            "latest_reading_date": latest_reading.capture_timestamp.isoformat(),
            "billing_cycle": {
                "start_date": billing_position.cycle_start_date.isoformat(),
                "end_date": billing_position.cycle_end_date.isoformat(),
                "elapsed_days": billing_position.elapsed_days,
                "remaining_days": billing_position.remaining_days,
                "total_days": billing_position.total_cycle_days
            },
            "daily_average": round(cycle_consumption / billing_position.elapsed_days, 3) if billing_position.elapsed_days > 0 else 0
        }

    except Exception as e:
        logger.error(f"Error getting current cycle consumption: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get current cycle consumption: {str(e)}"
        )


async def _calculate_usage_analytics(
    readings: List,
    utility_type: UtilityType,
    period: str,
    start_date: datetime,
    end_date: datetime,
    user_id: str
) -> UsageAnalyticsResponse:
    """Calculate detailed usage analytics"""
    
    import pandas as pd
    import numpy as np
    
    try:
        # Convert readings to DataFrame for analysis
        data = []
        for reading in readings:
            data.append({
                'timestamp': reading.capture_timestamp,
                'reading_value': float(reading.reading_value),
                'is_manual': reading.is_manual
            })
        
        df = pd.DataFrame(data)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        # Calculate consumption (difference between consecutive readings)
        df['consumption'] = df['reading_value'].diff().clip(lower=0)
        df = df.dropna()  # Remove first row with NaN consumption
        
        # Group data by period
        if period == "daily":
            df['period'] = df['timestamp'].dt.date
            period_format = "%Y-%m-%d"
        elif period == "weekly":
            df['period'] = df['timestamp'].dt.to_period('W').apply(lambda x: x.start_time.date())
            period_format = "%Y-W%U"
        elif period == "monthly":
            df['period'] = df['timestamp'].dt.tz_localize(None).dt.to_period('M').apply(lambda x: x.start_time.date())
            period_format = "%Y-%m"
        else:  # yearly
            df['period'] = df['timestamp'].dt.year
            period_format = "%Y"
        
        # Aggregate by period
        period_data = df.groupby('period').agg({
            'consumption': ['sum', 'mean', 'count'],
            'is_manual': 'sum'
        }).round(3)
        
        period_data.columns = ['total_consumption', 'avg_consumption', 'reading_count', 'manual_readings']
        
        # Calculate total usage and average
        total_usage = df['consumption'].sum()
        average_usage = df['consumption'].mean()
        
        # Handle NaN values
        if pd.isna(total_usage):
            total_usage = 0.0
        if pd.isna(average_usage):
            average_usage = 0.0
        
        # Estimate cost (simplified)
        default_price = 10.0 if utility_type == UtilityType.ELECTRICITY else 15.0
        estimated_cost = total_usage * default_price
        
        # Get anomaly count for period
        anomalies = await anomaly_detection_service.get_user_anomalies(user_id, utility_type, limit=100)
        period_anomalies = [
            a for a in anomalies 
            if start_date <= a.detected_at <= end_date
        ]
        
        # Create data points for visualization
        data_points = []
        for period_val, row in period_data.iterrows():
            data_points.append({
                "period": str(period_val),
                "consumption": row['total_consumption'],
                "average": row['avg_consumption'],
                "reading_count": int(row['reading_count']),
                "manual_readings": int(row['manual_readings'])
            })
        
        return UsageAnalyticsResponse(
            utility_type=utility_type,
            period=period,
            total_usage=round(total_usage, 3),
            average_usage=round(average_usage, 3),
            cost_estimate=round(estimated_cost, 2),
            anomaly_count=len(period_anomalies),
            data_points=data_points
        )
        
    except Exception as e:
        logger.error(f"Failed to calculate usage analytics: {e}")
        raise Exception("Analytics calculation failed")