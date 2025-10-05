"""
API v1 router initialization
"""
from fastapi import APIRouter

# Import all v1 endpoints
from app.api.v1 import (
    auth,
    readings,
    analytics,
    notifications,
    preferences,
    users,
    profile,
    geocoding,
    anomaly_detection,
    historical_data,
    utility_rates,
    cost_forecasting,
    demo_forecasting
)

# Create v1 router
api_v1_router = APIRouter()

# Include all routers with consistent prefixes
api_v1_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_v1_router.include_router(users.router, prefix="/users", tags=["user_profile"])
api_v1_router.include_router(profile.router, prefix="/profile", tags=["profile_creation"])
api_v1_router.include_router(readings.router, prefix="/readings", tags=["meter_readings"])
api_v1_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_v1_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_v1_router.include_router(preferences.router, prefix="/preferences", tags=["preferences"])
api_v1_router.include_router(geocoding.router, prefix="/geocoding", tags=["geocoding"])
api_v1_router.include_router(anomaly_detection.router, prefix="/anomaly-detection", tags=["anomaly-detection"])
api_v1_router.include_router(historical_data.router, prefix="/historical-data", tags=["historical-data", "forecasting"])
api_v1_router.include_router(utility_rates.router, prefix="/utility-rates", tags=["utility-rates", "billing"])
api_v1_router.include_router(cost_forecasting.router, prefix="/cost-forecasting", tags=["cost-forecasting", "prediction"])
api_v1_router.include_router(demo_forecasting.router, prefix="/cost-forecasting", tags=["demo", "forecasting"])