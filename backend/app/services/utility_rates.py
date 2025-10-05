"""
Utility rate management service for dynamic rate storage and retrieval
"""
import json
from typing import List, Optional, Dict, Any, Tuple
from datetime import date, datetime
from decimal import Decimal

from app.core.database import get_supabase, get_service_supabase
from app.models.schemas import (
    UtilityType,
    UtilityProviderCreate,
    UtilityProviderResponse,
    RateStructureCreate,
    RateStructureResponse,
    UserProviderAssociationCreate,
    UserProviderAssociationResponse,
    RateStructureBulkCreate,
    UserRatesResponse
)
from app.utils.database_bill_calculator import DatabaseUtilityCalculator
from loguru import logger
from app.core.logging_config import log_rate_warning, log_db_operation


class UtilityRatesService:
    """Service for managing utility providers, rates, and user associations"""

    def __init__(self):
        self.supabase = None
        self.service_supabase = None
        self.utility_calculator = None

    async def init_supabase(self):
        """Initialize Supabase client"""
        if not self.supabase:
            self.supabase = await get_supabase()
        if not self.service_supabase:
            self.service_supabase = await get_service_supabase()

        # Initialize utility calculator if not already done
        if not self.utility_calculator:
            self.utility_calculator = DatabaseUtilityCalculator()

    # ====================================
    # PROVIDER MANAGEMENT
    # ====================================

    async def create_provider(self, provider_data: UtilityProviderCreate) -> UtilityProviderResponse:
        """Create a new utility provider"""
        await self.init_supabase()

        try:
            result = self.supabase.table("utility_providers").insert({
                "name": provider_data.name,
                "utility_type": provider_data.utility_type.value,
                "region": provider_data.region,
                "service_area": provider_data.service_area,
                "is_active": provider_data.is_active
            }).execute()

            if not result.data:
                raise Exception("Failed to create provider")

            return UtilityProviderResponse(**result.data[0])

        except Exception as e:
            logger.error(f"Failed to create provider: {e}")
            raise

    async def get_providers(
        self,
        utility_type: Optional[UtilityType] = None,
        region: Optional[str] = None,
        active_only: bool = True
    ) -> List[UtilityProviderResponse]:
        """Get utility providers with optional filtering"""
        await self.init_supabase()

        try:
            query = self.supabase.table("utility_providers").select("*")

            if utility_type:
                query = query.eq("utility_type", utility_type.value)
            if region:
                query = query.eq("region", region)
            if active_only:
                query = query.eq("is_active", True)

            result = query.order("name").execute()

            return [UtilityProviderResponse(**provider) for provider in result.data]

        except Exception as e:
            logger.error(f"Failed to get providers: {e}")
            raise

    # ====================================
    # RATE STRUCTURE MANAGEMENT
    # ====================================

    async def create_rate_structure(self, rate_data: RateStructureCreate) -> RateStructureResponse:
        """Create a new rate structure"""
        await self.init_supabase()

        try:
            result = self.supabase.table("utility_rate_structures").insert({
                "provider_id": rate_data.provider_id,
                "rate_type": rate_data.rate_type,
                "effective_date": rate_data.effective_date.isoformat(),
                "end_date": rate_data.end_date.isoformat() if rate_data.end_date else None,
                "rate_value": rate_data.rate_value,
                "rate_unit": rate_data.rate_unit,
                "tier_min": rate_data.tier_min,
                "tier_max": rate_data.tier_max,
                "month_applicable": rate_data.month_applicable,
                "description": rate_data.description
            }).execute()

            if not result.data:
                raise Exception("Failed to create rate structure")

            return RateStructureResponse(**result.data[0])

        except Exception as e:
            logger.error(f"Failed to create rate structure: {e}")
            raise

    async def get_user_rates(
        self,
        user_id: str,
        utility_type: UtilityType,
        target_date: Optional[date] = None
    ) -> Optional[UserRatesResponse]:
        """Get user's current rates for a utility type"""
        await self.init_supabase()

        if not target_date:
            target_date = date.today()

        try:
            # Get user's provider association
            provider_result = self.supabase.table("user_utility_providers").select(
                "*, utility_providers(*)"
            ).eq("user_id", user_id).eq("utility_type", utility_type.value).eq("is_active", True).execute()

            if not provider_result.data:
                logger.debug(f"No provider configured for user {user_id}, utility {utility_type.value}")
                return None

            association = provider_result.data[0]
            provider_id = association["provider_id"]

            # Get rates with smart fallback to previous months
            active_rates = await self._get_rates_with_fallback(provider_id, target_date)

            if not active_rates:
                log_rate_warning(provider_id, utility_type.value)
                return None

            return UserRatesResponse(
                utility_type=utility_type,
                provider=UtilityProviderResponse(**association["utility_providers"]),
                rates=active_rates,
                last_updated=datetime.utcnow()
            )

        except Exception as e:
            logger.error(f"Failed to get user rates: {e}")
            raise

    async def _get_rates_with_fallback(self, provider_id: str, target_date: date) -> List[RateStructureResponse]:
        """
        Get rates with smart fallback to previous months.

        Logic:
        1. Try target month (e.g., October 2025)
        2. If not found, try previous month (September 2025)
        3. Continue up to 12 months back
        4. Return the most recent available rates
        """
        from dateutil.relativedelta import relativedelta

        current_search_date = target_date

        # Try up to 12 months back
        for months_back in range(12):
            try:
                # Search for rates effective on or before this date
                rates_result = self.supabase.table("utility_rate_structures").select("*").eq(
                    "provider_id", provider_id
                ).lte("effective_date", current_search_date.isoformat()).execute()

                if rates_result.data:
                    # Filter to get only active rates (no end_date or end_date > target_date)
                    active_rates = []
                    for rate in rates_result.data:
                        if not rate["end_date"] or datetime.fromisoformat(rate["end_date"]).date() > target_date:
                            active_rates.append(RateStructureResponse(**rate))

                    if active_rates:
                        if months_back > 0:
                            search_month = current_search_date.strftime('%B %Y')
                            target_month = target_date.strftime('%B %Y')
                            logger.info(f"Using {search_month} rates for {target_month} (fallback: {months_back} months)")
                        return active_rates

                # Move to previous month
                current_search_date = current_search_date - relativedelta(months=1)

            except Exception as e:
                logger.warning(f"Error searching rates for {current_search_date}: {e}")
                current_search_date = current_search_date - relativedelta(months=1)
                continue

        # No rates found even with fallback
        logger.error(f"No rates found for provider {provider_id} even with 12-month fallback from {target_date}")
        return []

    # ====================================
    # USER-PROVIDER ASSOCIATIONS
    # ====================================

    async def associate_user_provider(
        self,
        user_id: str,
        association_data: UserProviderAssociationCreate
    ) -> UserProviderAssociationResponse:
        """Associate user with a utility provider"""
        await self.init_supabase()

        try:
            # Deactivate existing association for this utility type
            self.service_supabase.table("user_utility_providers").update({
                "is_active": False
            }).eq("user_id", user_id).eq("utility_type", association_data.utility_type.value).execute()

            # Create new association
            result = self.service_supabase.table("user_utility_providers").insert({
                "user_id": user_id,
                "provider_id": association_data.provider_id,
                "utility_type": association_data.utility_type.value,
                "account_number": association_data.account_number,
                "is_active": True
            }).execute()

            if not result.data:
                raise Exception("Failed to create user-provider association")

            # Get full association with provider details
            full_result = self.supabase.table("user_utility_providers").select(
                "*, utility_providers(*)"
            ).eq("id", result.data[0]["id"]).execute()

            association = full_result.data[0]
            return UserProviderAssociationResponse(
                **{**association, "provider": UtilityProviderResponse(**association["utility_providers"])}
            )

        except Exception as e:
            logger.error(f"Failed to associate user with provider: {e}")
            raise

    # ====================================
    # RATE CALCULATION
    # ====================================

    async def calculate_bill(
        self,
        user_id: str,
        utility_type: UtilityType,
        consumption: float,
        billing_month: str
    ) -> float:
        """Calculate bill using database rates and accurate billing formulas"""
        await self.init_supabase()

        try:
            if utility_type == UtilityType.ELECTRICITY:
                # Initialize the database calculator
                await self.utility_calculator.init_supabase()

                # Try to get user's provider first
                user_rates = await self.get_user_rates(user_id, utility_type)
                if user_rates and user_rates.provider:
                    # Use user's specific provider
                    result = await self.utility_calculator.calculate_simple_bill_from_db(
                        user_rates.provider.id, billing_month, consumption
                    )
                    return result
                else:
                    # Fallback to MERALCO as default
                    meralco_result = await self.utility_calculator.calculate_meralco_bill(billing_month, consumption)
                    return meralco_result['totalBill']
            else:
                # Get user's rates for water
                user_rates = await self.get_user_rates(user_id, utility_type)
                if user_rates:
                    return self._calculate_water_bill(consumption, billing_month, user_rates.rates)
                else:
                    return consumption * 15.0  # Fallback for water

        except Exception as e:
            logger.error(f"Failed to calculate bill: {e}")
            # Fallback calculation
            return consumption * (10.0 if utility_type == UtilityType.ELECTRICITY else 15.0)


    def _calculate_water_bill(self, cubic_meters: float, month: str, rates: List[RateStructureResponse]) -> float:
        """Calculate water bill using database rates"""

        try:
            total_bill = 0.0

            # Group rates by type
            rate_map = {}
            for rate in rates:
                if rate.month_applicable in ['all', month]:
                    rate_map[rate.rate_type] = rate.rate_value

            # Base rate
            total_bill += cubic_meters * rate_map.get('base_rate_per_cubic_meter', 15.0)

            # Additional charges
            total_bill += cubic_meters * rate_map.get('sewerage_charge', 2.5)
            total_bill += cubic_meters * rate_map.get('environmental_fee', 1.0)
            total_bill += rate_map.get('maintenance_charge', 5.0)  # Fixed charge

            return max(0, total_bill)

        except Exception as e:
            logger.error(f"Error in water bill calculation: {e}")
            return cubic_meters * 15.0  # Fallback

    # ====================================
    # MIGRATION UTILITIES
    # ====================================

    async def migrate_from_json(self, json_file_path: str) -> Dict[str, Any]:
        """Migrate rates from JSON file to database"""
        await self.init_supabase()

        try:
            with open(json_file_path, 'r') as f:
                rates_data = json.load(f)

            migration_results = {
                "providers_created": 0,
                "rates_created": 0,
                "errors": []
            }

            # Create default providers if they don't exist
            for utility_type in ['electricity', 'water']:
                if utility_type in rates_data:
                    try:
                        # Create default provider
                        provider = await self.create_provider(UtilityProviderCreate(
                            name=f"Default {utility_type.title()} Provider",
                            utility_type=UtilityType(utility_type),
                            region="default",
                            service_area="Philippines"
                        ))
                        migration_results["providers_created"] += 1

                        # Migrate rates for this provider
                        utility_rates = rates_data[utility_type]
                        rates_created = await self._migrate_utility_rates(provider.id, utility_rates)
                        migration_results["rates_created"] += rates_created

                    except Exception as e:
                        migration_results["errors"].append(f"Error migrating {utility_type}: {e}")

            return migration_results

        except Exception as e:
            logger.error(f"Failed to migrate from JSON: {e}")
            raise

    async def _migrate_utility_rates(self, provider_id: str, rates_data: Dict[str, Any]) -> int:
        """Migrate rates for a specific utility provider"""
        rates_created = 0

        for rate_type, rate_values in rates_data.items():
            if isinstance(rate_values, dict) and 'january' in rate_values:
                # Monthly rates
                for month, value in rate_values.items():
                    try:
                        await self.create_rate_structure(RateStructureCreate(
                            provider_id=provider_id,
                            rate_type=rate_type,
                            effective_date=date.today(),
                            rate_value=float(value),
                            rate_unit="per_kwh" if "kwh" in rate_type else "per_unit",
                            month_applicable=month
                        ))
                        rates_created += 1
                    except Exception as e:
                        logger.error(f"Failed to create rate {rate_type} for {month}: {e}")

            elif rate_type == 'distribution_tiers':
                # Handle tiered distribution rates
                for month, tiers in rate_values.items():
                    for tier_name, tier_value in tiers.items():
                        try:
                            tier_min, tier_max = self._parse_tier_range(tier_name)
                            await self.create_rate_structure(RateStructureCreate(
                                provider_id=provider_id,
                                rate_type="distribution_charge",
                                effective_date=date.today(),
                                rate_value=float(tier_value),
                                rate_unit="per_kwh",
                                tier_min=tier_min,
                                tier_max=tier_max,
                                month_applicable=month,
                                description=f"Distribution tier: {tier_name}"
                            ))
                            rates_created += 1
                        except Exception as e:
                            logger.error(f"Failed to create tier rate {tier_name}: {e}")

        return rates_created

    def _parse_tier_range(self, tier_name: str) -> Tuple[float, float]:
        """Parse tier name to get min/max values"""
        if "tier1_0_200" in tier_name:
            return 0, 200
        elif "tier2_201_300" in tier_name:
            return 201, 300
        elif "tier3_301_400" in tier_name:
            return 301, 400
        elif "tier4_400_plus" in tier_name:
            return 401, 0  # 0 means no upper limit
        else:
            return 0, 0


# Global service instance
utility_rates_service = UtilityRatesService()