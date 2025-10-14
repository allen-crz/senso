"""
Database-powered Philippine Utility Bill Calculator
Fetches rates from utility_rate_structures table instead of JSON
"""
from typing import Dict, Any, Optional
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from loguru import logger

from app.core.database import get_supabase
from app.models.schemas import UtilityType


class DatabaseUtilityCalculator:
    """Database-powered calculator for Philippine electricity and water bills"""

    def __init__(self):
        """Initialize calculator with database connection"""
        self.supabase = None
        self._rate_cache = {}  # Cache rates to avoid repeated DB calls

    async def init_supabase(self):
        """Initialize Supabase client"""
        if not self.supabase:
            self.supabase = await get_supabase()

    async def get_provider_rates(
        self,
        provider_id: str,
        target_date: Optional[date] = None,
        month: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get all rates for a provider from database"""
        await self.init_supabase()

        if not target_date:
            target_date = date.today()

        cache_key = f"{provider_id}_{target_date}_{month}"
        if cache_key in self._rate_cache:
            return self._rate_cache[cache_key]

        try:
            # Query rates for provider
            query = self.supabase.table("utility_rate_structures").select("*").eq(
                "provider_id", provider_id
            ).lte("effective_date", target_date.isoformat())

            result = query.execute()

            if not result.data:
                logger.warning(f"No rates found for provider {provider_id}")
                return {}

            # Filter active rates and organize by rate_type and month
            rates_dict = {}

            for rate in result.data:
                # Check if rate is still active (no end_date or end_date > target_date)
                if rate["end_date"] and date.fromisoformat(rate["end_date"]) <= target_date:
                    continue

                rate_type = rate["rate_type"]
                month_applicable = rate["month_applicable"]

                # Initialize rate_type if not exists
                if rate_type not in rates_dict:
                    rates_dict[rate_type] = {}

                # For tiered rates (like water), we need to store multiple tiers
                rate_entry = {
                    "rate_value": float(rate["rate_value"]),
                    "rate_unit": rate["rate_unit"],
                    "tier_min": float(rate["tier_min"]) if rate["tier_min"] else None,
                    "tier_max": float(rate["tier_max"]) if rate["tier_max"] else None,
                    "description": rate["description"]
                }

                # Store rate by month
                if month_applicable == "all":
                    # Apply to all months
                    months = ['january', 'february', 'march', 'april', 'may', 'june',
                             'july', 'august', 'september', 'october', 'november', 'december']
                    for m in months:
                        if m not in rates_dict[rate_type]:
                            rates_dict[rate_type][m] = []
                        rates_dict[rate_type][m].append(rate_entry)
                else:
                    # Apply to specific month
                    if month_applicable not in rates_dict[rate_type]:
                        rates_dict[rate_type][month_applicable] = []
                    rates_dict[rate_type][month_applicable].append(rate_entry)

            # Cache the result
            self._rate_cache[cache_key] = rates_dict
            return rates_dict

        except Exception as e:
            logger.error(f"Error fetching provider rates: {e}")
            return {}

    async def get_meralco_provider_id(self) -> Optional[str]:
        """Get MERALCO provider ID"""
        await self.init_supabase()

        try:
            result = self.supabase.table("utility_providers").select("id").eq(
                "name", "MERALCO"
            ).eq("utility_type", "electricity").eq("is_active", True).single().execute()

            return result.data["id"] if result.data else None

        except Exception as e:
            logger.error(f"Error fetching MERALCO provider ID: {e}")
            return None

    async def calculate_monthly_bill_from_db(
        self,
        provider_id: str,
        bill_month: str,
        kwh: float
    ) -> Dict[str, Any]:
        """Calculate monthly electricity bill using database rates"""

        bill_month = bill_month.lower()

        # Get provider rates from database
        rates_dict = await self.get_provider_rates(provider_id, month=bill_month)

        if not rates_dict:
            raise ValueError(f"No rates found for provider {provider_id}")

        # Extract month-specific rates (similar to JSON structure)
        month_rates = self._extract_month_rates_from_db(bill_month, rates_dict)

        # Use the same calculation logic as the original calculator
        return self._calculate_bill_breakdown(bill_month, kwh, month_rates)

    def _extract_month_rates_from_db(self, month: str, rates_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Extract electricity rates for a specific month from database structure"""

        extracted_rates = {}

        # Single-value rates
        single_rates = [
            'generation_charge', 'transmission_charge', 'system_loss_charge',
            'fixed_metering_charge', 'metering_charge', 'fixed_supply_charge',
            'supply_charge', 'awat', 'regulatory_fee', 'lifeline_subsidy',
            'senior_citizen_subsidy', 'uc_me_npc_spug', 'uc_me_red_ci', 'uc_sd',
            'current_rpt_charge', 'fit_all', 'local_franchise_fee_rate',
            'vat_transmission', 'vat_generation', 'vat_system_loss',
            'vat_distribution', 'vat_current_rpt', 'vat_subsidies'
        ]

        for rate_type in single_rates:
            if rate_type in rates_dict and month in rates_dict[rate_type]:
                # rates_dict[rate_type][month] is a list, get the first entry's rate_value
                month_data = rates_dict[rate_type][month]
                if isinstance(month_data, list) and len(month_data) > 0:
                    extracted_rates[rate_type] = month_data[0]["rate_value"]
                elif isinstance(month_data, dict):
                    extracted_rates[rate_type] = month_data["rate_value"]
                else:
                    extracted_rates[rate_type] = self._get_default_rate_value(rate_type)
            else:
                # Fallback to default values
                extracted_rates[rate_type] = self._get_default_rate_value(rate_type)

        # Distribution tiers (handle both new database structure and existing formats)
        distribution_tiers = []
        for rate_type in rates_dict:
            if rate_type == 'distribution_charge' or rate_type.startswith('distribution_tier'):
                if month in rates_dict[rate_type]:
                    month_tier_data = rates_dict[rate_type][month]

                    # Handle list of tier entries
                    if isinstance(month_tier_data, list):
                        for tier_data in month_tier_data:
                            tier_min = tier_data.get("tier_min")
                            tier_max = tier_data.get("tier_max")

                            # Only add if it has proper tier structure
                            if tier_min is not None:
                                distribution_tiers.append({
                                    "min": tier_min,
                                    "max": tier_max,  # None means no upper limit
                                    "rate": tier_data["rate_value"]
                                })
                    # Handle single tier entry (backward compatibility)
                    elif isinstance(month_tier_data, dict):
                        tier_min = month_tier_data.get("tier_min")
                        tier_max = month_tier_data.get("tier_max")

                        # Only add if it has proper tier structure
                        if tier_min is not None:
                            distribution_tiers.append({
                                "min": tier_min,
                                "max": tier_max,  # None means no upper limit
                                "rate": month_tier_data["rate_value"]
                            })

        # Sort tiers by minimum value
        distribution_tiers.sort(key=lambda x: x["min"])

        # Fallback to default tiers if no database tiers found
        if not distribution_tiers:
            distribution_tiers = [
                {"min": 0, "max": 200, "rate": 0.9803},
                {"min": 201, "max": 300, "rate": 1.2908},
                {"min": 301, "max": 400, "rate": 1.5837},
                {"min": 401, "max": None, "rate": 2.0941}
            ]

        extracted_rates['distribution_tiers'] = distribution_tiers

        return extracted_rates

    def _get_default_rate_value(self, rate_type: str) -> float:
        """Get default rate values for fallback"""
        defaults = {
            'generation_charge': 7.8105,
            'transmission_charge': 1.1248,
            'system_loss_charge': 0.6873,
            'fixed_metering_charge': 5.00,
            'metering_charge': 0.3350,
            'fixed_supply_charge': 16.38,
            'supply_charge': 0.4979,
            'awat': 0.2024,
            'regulatory_fee': 0.0023,
            'lifeline_subsidy': 0.0024,
            'senior_citizen_subsidy': 0.0001,
            'uc_me_npc_spug': 0.1949,
            'uc_me_red_ci': 0.0044,
            'uc_sd': 0.0428,
            'current_rpt_charge': 0.0057,
            'fit_all': 0.1189,
            'local_franchise_fee_rate': 0.0000,
            'vat_transmission': 0.12,
            'vat_generation': 0.12,
            'vat_system_loss': 0.12,
            'vat_distribution': 0.12,
            'vat_current_rpt': 0.00,
            'vat_subsidies': 0.12
        }
        return defaults.get(rate_type, 0.0)

    def _calculate_bill_breakdown(self, bill_month: str, kwh: float, month_rates: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate bill breakdown using exact JavaScript formula"""

        # 1. Per-kWh charges
        generation = month_rates['generation_charge'] * kwh
        transmission = month_rates['transmission_charge'] * kwh
        system_loss = month_rates['system_loss_charge'] * kwh

        # 2. Distribution charge (tier rate × total kwh)
        distribution_rate = self._get_distribution_rate(kwh, month_rates['distribution_tiers'])
        distribution_base = distribution_rate * kwh
        fixed_metering = month_rates['fixed_metering_charge']
        metering_charge = month_rates['metering_charge'] * kwh
        fixed_supply = month_rates['fixed_supply_charge']
        supply_charge = month_rates['supply_charge'] * kwh
        awat = month_rates['awat'] * kwh
        regulatory_fee = month_rates['regulatory_fee'] * kwh

        # Distribution total (exact JS formula)
        distribution = (distribution_base + fixed_metering + metering_charge +
                       fixed_supply + supply_charge - awat - regulatory_fee)

        # 3. Subsidies and universal charges
        lifeline = month_rates['lifeline_subsidy'] * kwh
        senior_citizen = month_rates['senior_citizen_subsidy'] * kwh
        uc_me_npc_spug = month_rates['uc_me_npc_spug'] * kwh
        uc_me_red_ci = month_rates['uc_me_red_ci'] * kwh
        uc_sd = month_rates['uc_sd'] * kwh
        current_rpt = month_rates['current_rpt_charge'] * kwh
        fit_all = month_rates['fit_all'] * kwh

        # 4. Subtotal before franchise fee (exact JS formula)
        subtotal_before_franchise = (generation + transmission + system_loss + distribution +
                                   lifeline + senior_citizen + uc_me_npc_spug + uc_me_red_ci +
                                   uc_sd + current_rpt + fit_all)

        # 5. Local franchise fee (percentage of subtotal before franchise)
        local_franchise_fee = subtotal_before_franchise * month_rates['local_franchise_fee_rate']

        # 6. VAT calculations (applied to specific components)
        vat_transmission = transmission * month_rates['vat_transmission']
        vat_generation = generation * month_rates['vat_generation']
        vat_system_loss = system_loss * month_rates['vat_system_loss']
        vat_distribution = distribution * month_rates['vat_distribution']
        vat_current_rpt = current_rpt * month_rates['vat_current_rpt']
        vat_subsidies = (lifeline + senior_citizen) * month_rates['vat_subsidies']

        # 7. Final totals (exact JS formula)
        subtotal = subtotal_before_franchise + local_franchise_fee

        total_vat = (vat_transmission + vat_generation + vat_system_loss +
                    vat_distribution + vat_current_rpt + vat_subsidies)

        total_bill = subtotal + total_vat

        # Return detailed breakdown (same format as original)
        return {
            "breakdown": {
                "generation": round(generation, 2),
                "transmission": round(transmission, 2),
                "systemLoss": round(system_loss, 2),
                "distribution": {
                    "total": round(distribution, 2),
                    "components": {
                        "distributionCharge": round(distribution_base, 2),
                        "fixedMeteringCharge": round(fixed_metering, 2),
                        "meteringCharge": round(metering_charge, 2),
                        "supplyCharge": round(supply_charge, 2),
                        "awat": round(-awat, 2),
                        "regulatoryFee": round(-regulatory_fee, 2)
                    }
                },
                "lifeline": round(lifeline, 2),
                "seniorCitizen": round(senior_citizen, 2),
                "ucMeNpcSpug": round(uc_me_npc_spug, 2),
                "ucMeRedCi": round(uc_me_red_ci, 2),
                "ucSd": round(uc_sd, 2),
                "currentRpt": round(current_rpt, 2),
                "fitAll": round(fit_all, 2),
                "localFranchiseFee": round(local_franchise_fee, 2),
                "vat": {
                    "vatTransmission": round(vat_transmission, 2),
                    "vatGeneration": round(vat_generation, 2),
                    "vatSystemLoss": round(vat_system_loss, 2),
                    "vatDistribution": round(vat_distribution, 2),
                    "vatCurrentRpt": round(vat_current_rpt, 2),
                    "vatSubsidies": round(vat_subsidies, 2),
                    "total": round(total_vat, 2)
                }
            },
            "subtotal": round(subtotal, 2),
            "totalVat": round(total_vat, 2),
            "totalBill": round(total_bill, 2),
            "month": bill_month,
            "consumption": kwh,
            "source": "database"
        }


    def _get_distribution_rate(self, kwh: float, tiers) -> float:
        """Get distribution rate based on consumption tier using database tier structure"""

        # Handle both old dict format and new list format
        if isinstance(tiers, dict):
            # Legacy format - convert to new format
            tier_list = []
            if 'tier1_0_200' in tiers:
                tier_list = [
                    {"min": 0, "max": 200, "rate": tiers.get('tier1_0_200', 0.9803)},
                    {"min": 201, "max": 300, "rate": tiers.get('tier2_201_300', 1.2908)},
                    {"min": 301, "max": 400, "rate": tiers.get('tier3_301_400', 1.5837)},
                    {"min": 401, "max": None, "rate": tiers.get('tier4_400_plus', 2.0941)}
                ]
            tiers = tier_list

        # New list format with dynamic tier ranges
        for tier in tiers:
            tier_min = tier["min"]
            tier_max = tier["max"]

            # Check if consumption falls within this tier
            if kwh >= tier_min:
                if tier_max is None or kwh <= tier_max:
                    return tier["rate"]

        # Fallback to last tier if no match (highest consumption)
        if tiers:
            return tiers[-1]["rate"]

        # Ultimate fallback
        return 2.0941

    async def calculate_simple_bill_from_db(
        self,
        provider_id: str,
        bill_month: str,
        kwh: float
    ) -> float:
        """Calculate total bill amount only (for forecasting)"""
        result = await self.calculate_monthly_bill_from_db(provider_id, bill_month, kwh)
        return result['totalBill']

    async def calculate_meralco_bill(self, bill_month: str, kwh: float) -> Dict[str, Any]:
        """Calculate MERALCO bill using database rates"""
        meralco_id = await self.get_meralco_provider_id()

        if not meralco_id:
            raise ValueError("MERALCO provider not found in database")

        return await self.calculate_monthly_bill_from_db(meralco_id, bill_month, kwh)

    async def get_maynilad_provider_id(self) -> Optional[str]:
        """Get Maynilad provider ID"""
        await self.init_supabase()

        try:
            result = self.supabase.table("utility_providers").select("id").ilike(
                "name", "%Maynilad%"
            ).eq("utility_type", "water").eq("is_active", True).single().execute()

            return result.data["id"] if result.data else None

        except Exception as e:
            logger.error(f"Error fetching Maynilad provider ID: {e}")
            return None

    async def calculate_maynilad_bill(self, bill_month: str, consumption: float) -> float:
        """Calculate Maynilad water bill using database rates"""
        maynilad_id = await self.get_maynilad_provider_id()

        if not maynilad_id:
            raise ValueError("Maynilad provider not found in database")

        result = await self.calculate_water_bill_from_db(maynilad_id, bill_month, consumption)
        return result['totalBasicCharge']

    async def calculate_water_bill_from_db(
        self,
        provider_id: str,
        bill_month: str,
        consumption_cum: float
    ) -> Dict[str, Any]:
        """Calculate monthly water bill using database tiered rates"""

        bill_month = bill_month.lower()

        # Get provider rates from database
        rates_dict = await self.get_provider_rates(provider_id, month=bill_month)

        if not rates_dict:
            raise ValueError(f"No rates found for provider {provider_id}")

        # Extract water tier rates for basic charge calculation
        water_tiers = self._extract_water_tiers_from_db(bill_month, rates_dict)

        if not water_tiers:
            raise ValueError(f"No water tier rates found for provider {provider_id}")

        # Calculate basic charge using progressive tiered billing
        basic_charge = self._calculate_water_basic_charge(consumption_cum, water_tiers)

        return {
            "breakdown": {
                "basicCharge": round(basic_charge, 2),
                "consumption": consumption_cum,
                "tierCalculation": self._get_tier_breakdown(consumption_cum, water_tiers)
            },
            "totalBasicCharge": round(basic_charge, 2),
            "month": bill_month,
            "consumption": consumption_cum,
            "source": "database",
            "utility_type": "water"
        }

    def _extract_water_tiers_from_db(self, month: str, rates_dict: Dict[str, Any]) -> list:
        """Extract water tier rates from database structure"""

        water_tiers = []

        # Look for basic_charge rate type - the structure from get_provider_rates is now:
        # rates_dict = {"basic_charge": {"january": [{"rate_value": ..., "tier_min": ..., etc}, ...]}}

        if "basic_charge" in rates_dict and month in rates_dict["basic_charge"]:
            tier_entries = rates_dict["basic_charge"][month]

            # Handle both list and single dict structures for backward compatibility
            if isinstance(tier_entries, list):
                for tier_info in tier_entries:
                    tier_min = tier_info.get("tier_min")
                    tier_max = tier_info.get("tier_max")
                    rate_value = tier_info.get("rate_value")
                    rate_unit = tier_info.get("rate_unit")

                    # tier_min can be None for the first tier (treat as 0)
                    if rate_value is not None:
                        water_tiers.append({
                            "min": tier_min if tier_min is not None else 0,  # Default to 0 if None
                            "max": tier_max if tier_max != 999999 else None,  # Convert large number to None
                            "rate": rate_value,
                            "unit": rate_unit
                        })
            elif isinstance(tier_entries, dict):
                # Single tier entry (backward compatibility)
                tier_min = tier_entries.get("tier_min")
                tier_max = tier_entries.get("tier_max")
                rate_value = tier_entries.get("rate_value")
                rate_unit = tier_entries.get("rate_unit")

                if tier_min is not None and rate_value is not None:
                    water_tiers.append({
                        "min": tier_min,
                        "max": tier_max if tier_max != 999999 else None,
                        "rate": rate_value,
                        "unit": rate_unit
                    })

        # Sort tiers by minimum value
        water_tiers.sort(key=lambda x: x["min"])

        return water_tiers

    def _calculate_water_basic_charge(self, consumption: float, tiers: list) -> float:
        """Calculate water basic charge using progressive tiered billing"""

        total_cost = 0.0

        for tier in tiers:
            tier_min = tier["min"]
            tier_max = tier["max"]
            rate = tier["rate"]
            unit = tier.get("unit", "PHP_per_cum")

            # Check if consumption reaches this tier
            if consumption <= tier_min:
                # Consumption doesn't reach this tier
                continue

            # Calculate cost for this tier
            if unit == "PHP":
                # Fixed charge (e.g., first 10 cu.m.)
                # This is a minimum charge - just add it once
                tier_cost = rate
            else:
                # Per cubic meter charge
                # Calculate how much consumption falls in this tier
                # For tier 11-20: if consumption is 27, we want 10 m³ (20 - 11 + 1)
                #                 if consumption is 15, we want 5 m³ (15 - 11 + 1)
                if tier_max is None:
                    # No upper limit - all consumption above tier_min
                    consumption_in_tier = consumption - tier_min
                else:
                    # Consumption within this tier range
                    #  Example: tier 11-20, consumption 27
                    #  min(27, 20) = 20
                    #  20 - 11 + 1 = 10 ✓
                    consumption_in_tier = min(consumption, tier_max) - tier_min + 1

                if consumption_in_tier > 0:
                    tier_cost = consumption_in_tier * rate
                else:
                    continue

            total_cost += tier_cost

        return total_cost

    def _get_tier_breakdown(self, consumption: float, tiers: list) -> list:
        """Get detailed breakdown of tier calculations for transparency"""

        breakdown = []

        for tier in tiers:
            tier_min = tier["min"]
            tier_max = tier["max"]
            rate = tier["rate"]
            unit = tier.get("unit", "PHP_per_cum")

            # Check if consumption reaches this tier
            if consumption <= tier_min:
                continue

            # Calculate tier label
            if tier_max is None:
                tier_label = f"Above {tier_min} cu.m."
            else:
                tier_label = f"{tier_min}-{tier_max} cu.m."

            # Calculate cost for this tier
            if unit == "PHP":
                # Fixed charge
                tier_cost = rate
                tier_consumption = tier_max - tier_min + 1 if tier_max else 0
                calculation = f"₱{rate} (minimum charge)"
            else:
                # Per cubic meter charge
                if tier_max is None:
                    # No upper limit
                    tier_consumption = consumption - tier_min
                else:
                    # Consumption within this tier range
                    tier_consumption = min(consumption, tier_max) - tier_min + 1

                if tier_consumption > 0:
                    tier_cost = tier_consumption * rate
                    calculation = f"{tier_consumption} × ₱{rate} = ₱{tier_cost:.2f}"
                else:
                    continue

            breakdown.append({
                "tier": tier_label,
                "consumption": tier_consumption,
                "rate": rate,
                "unit": unit,
                "cost": round(tier_cost, 2),
                "calculation": calculation
            })

        return breakdown

    async def calculate_water_bill_simple(
        self,
        provider_id: str,
        bill_month: str,
        consumption_cum: float
    ) -> float:
        """Calculate water basic charge only (for forecasting)"""
        result = await self.calculate_water_bill_from_db(provider_id, bill_month, consumption_cum)
        return result['totalBasicCharge']


# Global service instance
database_utility_calculator = DatabaseUtilityCalculator()