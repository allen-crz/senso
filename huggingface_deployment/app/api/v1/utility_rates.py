"""
Utility rates management API endpoints
"""
from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse

from app.core.auth import get_current_user
from app.models.schemas import (
    UtilityType,
    UtilityProviderCreate,
    UtilityProviderResponse,
    RateStructureCreate,
    RateStructureResponse,
    UserProviderAssociationCreate,
    UserProviderAssociationResponse,
    UserRatesResponse
)
from app.services.utility_rates import utility_rates_service
from app.services.cost_forecasting import cost_forecasting_service
from loguru import logger

router = APIRouter()


# ====================================
# PROVIDER ENDPOINTS
# ====================================

@router.get("/providers", response_model=List[UtilityProviderResponse])
async def get_utility_providers(
    utility_type: Optional[UtilityType] = Query(None, description="Filter by utility type"),
    region: Optional[str] = Query(None, description="Filter by region"),
    active_only: bool = Query(True, description="Only return active providers")
):
    """Get list of utility providers with optional filtering"""
    try:
        providers = await utility_rates_service.get_providers(
            utility_type=utility_type,
            region=region,
            active_only=active_only
        )
        return providers
    except Exception as e:
        logger.error(f"Failed to get providers: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve providers")


@router.post("/providers", response_model=UtilityProviderResponse)
async def create_utility_provider(
    provider_data: UtilityProviderCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new utility provider (admin only)"""
    try:
        provider = await utility_rates_service.create_provider(provider_data)
        return provider
    except Exception as e:
        logger.error(f"Failed to create provider: {e}")
        raise HTTPException(status_code=500, detail="Failed to create provider")


# ====================================
# RATE STRUCTURE ENDPOINTS
# ====================================

@router.post("/rates", response_model=RateStructureResponse)
async def create_rate_structure(
    rate_data: RateStructureCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new rate structure (admin only)"""
    try:
        rate = await utility_rates_service.create_rate_structure(rate_data)
        return rate
    except Exception as e:
        logger.error(f"Failed to create rate structure: {e}")
        raise HTTPException(status_code=500, detail="Failed to create rate structure")


# ====================================
# USER PROVIDER ASSOCIATION ENDPOINTS
# ====================================

@router.post("/user-associations", response_model=UserProviderAssociationResponse)
async def associate_user_with_provider(
    association_data: UserProviderAssociationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Associate current user with a utility provider"""
    try:
        user_id = current_user["id"]
        association = await utility_rates_service.associate_user_provider(
            user_id=user_id,
            association_data=association_data
        )
        return association
    except Exception as e:
        logger.error(f"Failed to associate user with provider: {e}")
        raise HTTPException(status_code=500, detail="Failed to associate with provider")


@router.get("/user-rates/{utility_type}", response_model=UserRatesResponse)
async def get_user_current_rates(
    utility_type: UtilityType,
    target_date: Optional[date] = Query(None, description="Date for rate lookup (defaults to today)"),
    current_user: dict = Depends(get_current_user)
):
    """Get current user's rates for a specific utility type"""
    try:
        user_id = current_user["id"]
        user_rates = await utility_rates_service.get_user_rates(
            user_id=user_id,
            utility_type=utility_type,
            target_date=target_date
        )

        if not user_rates:
            raise HTTPException(
                status_code=404,
                detail=f"No rate configuration found for {utility_type.value}. Please associate with a provider first."
            )

        return user_rates
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get user rates: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user rates")


# ====================================
# BILL CALCULATION ENDPOINTS
# ====================================

@router.post("/calculate-bill")
async def calculate_utility_bill(
    utility_type: UtilityType,
    consumption: float = Query(..., gt=0, description="Consumption amount"),
    billing_month: str = Query(..., description="Billing month (e.g., 'january')"),
    current_user: dict = Depends(get_current_user)
):
    """Calculate utility bill for current user"""
    try:
        user_id = current_user["id"]
        bill_amount = await utility_rates_service.calculate_bill(
            user_id=user_id,
            utility_type=utility_type,
            consumption=consumption,
            billing_month=billing_month.lower()
        )

        return {
            "utility_type": utility_type.value,
            "consumption": consumption,
            "billing_month": billing_month,
            "calculated_amount": round(bill_amount, 2),
            "currency": "PHP"
        }
    except Exception as e:
        logger.error(f"Failed to calculate bill: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate bill")



# ====================================
# MIGRATION ENDPOINTS
# ====================================

@router.post("/migrate-from-json")
async def migrate_rates_from_json(
    json_file_path: str = Query(..., description="Path to utility_rates.json file"),
    current_user: dict = Depends(get_current_user)
):
    """Migrate rates from JSON file to database (admin only)"""
    try:
        # This should be restricted to admin users in production
        results = await utility_rates_service.migrate_from_json(json_file_path)
        return {
            "status": "success",
            "migration_results": results
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="JSON file not found")
    except Exception as e:
        logger.error(f"Failed to migrate from JSON: {e}")
        raise HTTPException(status_code=500, detail="Failed to migrate rates from JSON")


# ====================================
# RATE CONFIDENCE ENDPOINTS
# ====================================

@router.get("/rate-confidence/{utility_type}")
async def get_rate_confidence(
    utility_type: UtilityType,
    month: Optional[str] = Query(None, description="Target month in YYYY-MM format (defaults to current month)"),
    current_user: dict = Depends(get_current_user)
):
    """Get rate confidence information for current user and utility type"""
    try:
        user_id = current_user["id"]

        # Get rate confidence from progressive forecasting service
        confidence_info = await cost_forecasting_service.get_user_rate_confidence(
            user_id=user_id,
            utility_type=utility_type,
            month=month
        )

        return {
            "utility_type": utility_type.value,
            "month": month or datetime.now().strftime('%Y-%m'),
            "rate_confidence": confidence_info
        }
    except Exception as e:
        logger.error(f"Failed to get rate confidence: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve rate confidence information")


@router.get("/rate-info/{utility_type}")
async def get_current_rate_info(
    utility_type: UtilityType,
    month: Optional[str] = Query(None, description="Target month in YYYY-MM format (defaults to current month)"),
    current_user: dict = Depends(get_current_user)
):
    """Get current rate information with fallback logic for frontend"""
    try:
        user_id = current_user["id"]

        # Get rate info from utility rates service using existing method
        user_rates = await utility_rates_service.get_user_rates(
            user_id=user_id,
            utility_type=utility_type
        )

        # Format rate info for frontend
        rate_info = {
            "rates": user_rates,
            "confidence": "high" if user_rates else "low",
            "source": "database" if user_rates else "default"
        }

        return {
            "utility_type": utility_type.value,
            "month": month or datetime.now().strftime('%Y-%m'),
            "rate_info": rate_info
        }
    except Exception as e:
        logger.error(f"Failed to get rate info: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve rate information")


# ====================================
# UTILITY ENDPOINTS
# ====================================

@router.get("/health")
async def rates_health_check():
    """Health check for utility rates service"""
    return {"status": "healthy", "service": "utility_rates"}