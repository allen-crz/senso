"""
Philippine Utility Bill Calculator
Handles both electricity and water bill calculations
"""
import json
from typing import Dict, Any, Union
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP
from loguru import logger


class PhilippineUtilityCalculator:
    """Calculator for Philippine electricity and water bills"""

    def __init__(self, rates_data: Dict[str, Any] = None):
        """Initialize calculator with rate data

        Args:
            rates_data: Dictionary containing utility rates, or None to load from file
        """
        self.rates_data = rates_data
        if not self.rates_data:
            self.load_rates_from_file()

    def load_rates_from_file(self):
        """Load rates from utility_rates.json file"""
        import os

        # Get the directory of the current file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        backend_root = os.path.dirname(os.path.dirname(current_dir))  # Go up to backend root

        possible_paths = [
            os.path.join(current_dir, "..", "..", "data", "utility_rates.json"),  # backend/data/
            os.path.join(backend_root, "data", "utility_rates.json"),  # backend/data/
            os.path.join(backend_root, "..", "utility_rates.json"),  # senso root
            "utility_rates.json",  # Current directory fallback
            "/app/data/utility_rates.json"  # Docker container path
        ]

        for path in possible_paths:
            try:
                with open(path, 'r') as f:
                    data = json.load(f)
                    # Load full utility rates structure (electricity + water)
                    self.rates_data = data
                    logger.info(f"Loaded utility rates from {path}")
                    return
            except FileNotFoundError:
                continue

        # Default rates if file not found
        logger.warning("Could not load utility_rates.json, using default rates")
        self.rates_data = self._get_default_rates()

    def _get_default_rates(self) -> Dict[str, Any]:
        """Get default utility rates (electricity + water) for all months"""
        # Generate rates for all months (using September rates as baseline)
        months = ['january', 'february', 'march', 'april', 'may', 'june',
                 'july', 'august', 'september', 'october', 'november', 'december']

        # Base rates (September 2024)
        base_generation = 7.8105
        base_transmission = 1.1248
        base_system_loss = 0.6873

        electricity_rates = {}
        for rate_type in ['generation_charge', 'transmission_charge', 'system_loss_charge']:
            electricity_rates[rate_type] = {}
            base_rate = base_generation if rate_type == 'generation_charge' else \
                       base_transmission if rate_type == 'transmission_charge' else base_system_loss
            for month in months:
                electricity_rates[rate_type][month] = base_rate

        # Tiered distribution rates (same for all months)
        electricity_rates['distribution_tiers'] = {}
        for month in months:
            electricity_rates['distribution_tiers'][month] = {
                "tier1_0_200": 0.9803,
                "tier2_201_300": 1.2908,
                "tier3_301_400": 1.5837,
                "tier4_400_plus": 2.0941
            }

        # Fixed charges (same for all months)
        fixed_charges = {
            "fixed_metering_charge": 5.00,
            "metering_charge": 0.3350,
            "fixed_supply_charge": 16.38,
            "supply_charge": 0.4979,
            "awat": 0.2024,
            "regulatory_fee": 0.0023,
            "lifeline_subsidy": 0.0024,
            "senior_citizen_subsidy": 0.0001,
            "uc_me_npc_spug": 0.1949,
            "uc_me_red_ci": 0.0044,
            "uc_sd": 0.0428,
            "current_rpt_charge": 0.0057,
            "fit_all": 0.1189,
            "local_franchise_fee_rate": 0.0000,
            "vat_transmission": 0.12,
            "vat_generation": 0.12,
            "vat_system_loss": 0.12,
            "vat_distribution": 0.12,
            "vat_current_rpt": 0.00,
            "vat_subsidies": 0.12
        }

        for charge_type, rate in fixed_charges.items():
            electricity_rates[charge_type] = {}
            for month in months:
                electricity_rates[charge_type][month] = rate

        # Water rates (same for all months)
        water_rates = {}
        water_charges = {
            "base_rate_per_cubic_meter": 15.00,
            "sewerage_charge": 2.50,
            "environmental_fee": 1.00,
            "maintenance_charge": 5.00
        }

        for charge_type, rate in water_charges.items():
            water_rates[charge_type] = {}
            for month in months:
                water_rates[charge_type][month] = rate

        return {
            "electricity": electricity_rates,
            "water": water_rates
        }

    def calculate_monthly_bill(self, bill_month: str, kwh: float) -> Dict[str, Any]:
        """Calculate monthly electricity bill using exact MERALCO formula

        Args:
            bill_month: Month for billing (e.g., 'may', 'june')
            kwh: Consumption in kilowatt-hours

        Returns:
            Dictionary containing bill breakdown and total
        """
        bill_month = bill_month.lower()

        # Extract rates for the month
        month_rates = self._extract_month_rates(bill_month)

        # Validate rates exist
        if not month_rates.get('generation_charge') and month_rates.get('generation_charge') != 0:
            raise ValueError(f"Rates for {bill_month} not found")

        # Calculate components
        result = {}

        # 1. Per-kWh charges
        generation = month_rates['generation_charge'] * kwh
        transmission = month_rates['transmission_charge'] * kwh
        system_loss = month_rates['system_loss_charge'] * kwh

        # 2. Distribution charge (tiered pricing)
        distribution_rate = self._get_distribution_rate(kwh, month_rates['distribution_tiers'])
        distribution_base = distribution_rate * kwh
        fixed_metering = month_rates['fixed_metering_charge']
        metering_charge = month_rates['metering_charge'] * kwh
        fixed_supply = month_rates['fixed_supply_charge']
        supply_charge = month_rates['supply_charge'] * kwh
        awat = month_rates['awat'] * kwh
        regulatory_fee = month_rates['regulatory_fee'] * kwh

        # Distribution total (complex formula from test_bill_calculation.js)
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

        # 4. Subtotal before franchise fee
        subtotal_before_franchise = (generation + transmission + system_loss + distribution +
                                   lifeline + senior_citizen + uc_me_npc_spug + uc_me_red_ci +
                                   uc_sd + current_rpt + fit_all)

        # 5. Local franchise fee (percentage of bill)
        local_franchise_fee = subtotal_before_franchise * month_rates['local_franchise_fee_rate']

        # 6. VAT calculations (applied to specific components)
        vat_transmission = transmission * month_rates['vat_transmission']
        vat_generation = generation * month_rates['vat_generation']
        vat_system_loss = system_loss * month_rates['vat_system_loss']
        vat_distribution = distribution * month_rates['vat_distribution']
        vat_current_rpt = current_rpt * month_rates['vat_current_rpt']
        vat_subsidies = (lifeline + senior_citizen) * month_rates['vat_subsidies']

        # 7. Final totals
        subtotal = (generation + transmission + system_loss + distribution +
                   lifeline + senior_citizen + uc_me_npc_spug + uc_me_red_ci +
                   uc_sd + current_rpt + fit_all + local_franchise_fee)

        total_vat = (vat_transmission + vat_generation + vat_system_loss +
                    vat_distribution + vat_current_rpt + vat_subsidies)

        total_bill = subtotal + total_vat

        # Return detailed breakdown (same format as JavaScript version)
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
            "consumption": kwh
        }

    def _extract_month_rates(self, month: str) -> Dict[str, Union[float, Dict]]:
        """Extract electricity rates for a specific month"""
        electricity_rates = self.rates_data.get('electricity', self.rates_data)
        return {
            'generation_charge': electricity_rates['generation_charge'][month],
            'transmission_charge': electricity_rates['transmission_charge'][month],
            'system_loss_charge': electricity_rates['system_loss_charge'][month],
            'distribution_tiers': electricity_rates['distribution_tiers'][month],
            'fixed_metering_charge': electricity_rates['fixed_metering_charge'][month],
            'metering_charge': electricity_rates['metering_charge'][month],
            'fixed_supply_charge': electricity_rates['fixed_supply_charge'][month],
            'supply_charge': electricity_rates['supply_charge'][month],
            'awat': electricity_rates['awat'][month],
            'regulatory_fee': electricity_rates['regulatory_fee'][month],
            'lifeline_subsidy': electricity_rates['lifeline_subsidy'][month],
            'senior_citizen_subsidy': electricity_rates['senior_citizen_subsidy'][month],
            'uc_me_npc_spug': electricity_rates['uc_me_npc_spug'][month],
            'uc_me_red_ci': electricity_rates['uc_me_red_ci'][month],
            'uc_sd': electricity_rates['uc_sd'][month],
            'current_rpt_charge': electricity_rates['current_rpt_charge'][month],
            'fit_all': electricity_rates['fit_all'][month],
            'local_franchise_fee_rate': electricity_rates['local_franchise_fee_rate'][month],
            'vat_transmission': electricity_rates['vat_transmission'][month],
            'vat_generation': electricity_rates['vat_generation'][month],
            'vat_system_loss': electricity_rates['vat_system_loss'][month],
            'vat_distribution': electricity_rates['vat_distribution'][month],
            'vat_current_rpt': electricity_rates['vat_current_rpt'][month],
            'vat_subsidies': electricity_rates['vat_subsidies'][month]
        }

    def _get_distribution_rate(self, kwh: float, tiers: Dict[str, float]) -> float:
        """Get distribution rate based on consumption tier"""
        if kwh <= 200:
            return tiers['tier1_0_200']
        elif kwh <= 300:
            return tiers['tier2_201_300']
        elif kwh <= 400:
            return tiers['tier3_301_400']
        else:
            return tiers['tier4_400_plus']  # 400+ kWh

    def calculate_simple_bill(self, bill_month: str, kwh: float) -> float:
        """Calculate total bill amount only (for forecasting)

        Args:
            bill_month: Month for billing
            kwh: Consumption in kilowatt-hours

        Returns:
            Total bill amount as float
        """
        result = self.calculate_monthly_bill(bill_month, kwh)
        return result['totalBill']

    def calculate_water_bill(self, bill_month: str, cubic_meters: float, provider: str) -> Dict[str, Any]:
        """Calculate water bill for specified provider

        Args:
            bill_month: Billing month (e.g., 'september')
            cubic_meters: Water consumption in cubic meters
            provider: Water provider ('prime', 'maynilad', 'manila_water')

        Returns:
            Dictionary with bill calculation
        """
        valid_providers = ['prime', 'maynilad', 'manila_water']
        if provider.lower() not in valid_providers:
            raise ValueError(f"Provider must be one of: {valid_providers}")

        water_rates = self.rates_data.get('water', {})

        if provider.lower() == 'prime':
            return self._calculate_prime_water_bill(bill_month, cubic_meters, water_rates)
        elif provider.lower() == 'maynilad':
            return self._calculate_maynilad_water_bill(bill_month, cubic_meters, water_rates)
        elif provider.lower() == 'manila_water':
            return self._calculate_manila_water_bill(bill_month, cubic_meters, water_rates)

    def _calculate_prime_water_bill(self, bill_month: str, cubic_meters: float, rates: Dict) -> Dict[str, Any]:
        """Calculate Prime Water bill (placeholder)"""
        base_rate = rates.get('base_rate_per_cubic_meter', {}).get(bill_month, 15.00)
        sewerage = rates.get('sewerage_charge', {}).get(bill_month, 2.50)
        environmental = rates.get('environmental_fee', {}).get(bill_month, 1.00)
        maintenance = rates.get('maintenance_charge', {}).get(bill_month, 5.00)

        # Placeholder calculation - needs actual Prime Water rate structure
        water_charge = base_rate * cubic_meters
        total_charges = sewerage + environmental + maintenance
        subtotal = water_charge + total_charges
        vat = subtotal * 0.12  # 12% VAT
        total_bill = subtotal + vat

        return {
            'provider': 'Prime Water',
            'consumption_cubic_meters': cubic_meters,
            'breakdown': {
                'water_charge': round(water_charge, 2),
                'sewerage_charge': round(sewerage, 2),
                'environmental_fee': round(environmental, 2),
                'maintenance_charge': round(maintenance, 2),
                'vat': round(vat, 2)
            },
            'subtotal': round(subtotal, 2),
            'totalBill': round(total_bill, 2),
            'month': bill_month,
            'consumption': cubic_meters,
            'note': 'Placeholder calculation - actual Prime Water rates needed'
        }

    def _calculate_maynilad_water_bill(self, bill_month: str, cubic_meters: float, rates: Dict) -> Dict[str, Any]:
        """Calculate Maynilad water bill (placeholder)"""
        base_rate = rates.get('base_rate_per_cubic_meter', {}).get(bill_month, 15.00)

        # Placeholder calculation - needs actual Maynilad rate structure
        water_charge = base_rate * cubic_meters
        service_charge = 50.00  # Fixed service charge
        wastewater_charge = water_charge * 0.3  # 30% of water charge
        subtotal = water_charge + service_charge + wastewater_charge
        vat = subtotal * 0.12
        total_bill = subtotal + vat

        return {
            'provider': 'Maynilad',
            'consumption_cubic_meters': cubic_meters,
            'breakdown': {
                'water_charge': round(water_charge, 2),
                'service_charge': round(service_charge, 2),
                'wastewater_charge': round(wastewater_charge, 2),
                'vat': round(vat, 2)
            },
            'subtotal': round(subtotal, 2),
            'totalBill': round(total_bill, 2),
            'month': bill_month,
            'consumption': cubic_meters,
            'note': 'Placeholder calculation - actual Maynilad rates needed'
        }

    def _calculate_manila_water_bill(self, bill_month: str, cubic_meters: float, rates: Dict) -> Dict[str, Any]:
        """Calculate Manila Water bill (placeholder)"""
        base_rate = rates.get('base_rate_per_cubic_meter', {}).get(bill_month, 15.00)

        # Placeholder calculation - needs actual Manila Water rate structure
        water_charge = base_rate * cubic_meters
        basic_service = 35.00  # Fixed basic service charge
        sewerage_service = water_charge * 0.5  # 50% of water charge
        subtotal = water_charge + basic_service + sewerage_service
        vat = subtotal * 0.12
        total_bill = subtotal + vat

        return {
            'provider': 'Manila Water',
            'consumption_cubic_meters': cubic_meters,
            'breakdown': {
                'water_charge': round(water_charge, 2),
                'basic_service_charge': round(basic_service, 2),
                'sewerage_service_charge': round(sewerage_service, 2),
                'vat': round(vat, 2)
            },
            'subtotal': round(subtotal, 2),
            'totalBill': round(total_bill, 2),
            'month': bill_month,
            'consumption': cubic_meters,
            'note': 'Placeholder calculation - actual Manila Water rates needed'
        }


# Global instance for use by other services
utility_calculator = PhilippineUtilityCalculator()


# Utility functions for backward compatibility
def calculate_monthly_bill(bill_month: str, kwh: float) -> Dict[str, Any]:
    """Calculate monthly electricity bill (matches test_bill_calculation.js interface)"""
    return utility_calculator.calculate_monthly_bill(bill_month, kwh)


def calculate_bill_amount(bill_month: str, kwh: float) -> float:
    """Calculate total electricity bill amount only"""
    return utility_calculator.calculate_simple_bill(bill_month, kwh)


def calculate_water_bill(bill_month: str, cubic_meters: float, provider: str) -> Dict[str, Any]:
    """Calculate water bill for specified provider"""
    return utility_calculator.calculate_water_bill(bill_month, cubic_meters, provider)