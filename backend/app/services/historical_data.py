"""
Clean Historical Data Repository - CRUD operations only
No ML logic, no complex conversions, just clean data management
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timezone
from decimal import Decimal
import calendar

from app.core.database import get_supabase, get_service_supabase
from app.models.schemas import UtilityType, HistoricalDataResponse
from app.models.forecasting import OnboardingData
from app.services.utility_rates import utility_rates_service
from loguru import logger


class HistoricalDataRepository:
    """Clean CRUD operations for historical consumption data"""

    def __init__(self):
        self.supabase = None

    async def init_supabase(self):
        """Initialize Supabase client"""
        if not self.supabase:
            self.supabase = await get_service_supabase()

    async def store_onboarding_data(self, onboarding_data: OnboardingData) -> List[str]:
        """
        Store consumption data from frontend onboarding
        REQUIREMENT 1: Initial model training data
        """
        await self.init_supabase()
        stored_ids = []

        try:
            for monthly_data in onboarding_data.monthly_consumption:
                # Parse month and year
                month_year = monthly_data["month"]  # "January 2025"
                month_name = month_year.split()[0].lower()
                year = int(month_year.split()[1])

                # Validate month
                month_names = [
                    'january', 'february', 'march', 'april', 'may', 'june',
                    'july', 'august', 'september', 'october', 'november', 'december'
                ]

                if month_name not in month_names:
                    raise ValueError(f"Invalid month: {month_name}")

                month_number = month_names.index(month_name) + 1
                month_date = date(year, month_number, 1)

                # Calculate bill using provider rates - REQUIREMENT 2: Data-driven
                consumption = float(monthly_data["consumption"])
                calculated_bill = await utility_rates_service.calculate_bill(
                    user_id=onboarding_data.user_id,
                    utility_type=UtilityType(onboarding_data.utility_type),
                    consumption=consumption,
                    billing_month=month_name
                )

                # Store record (removed data_source for database compatibility)
                record_data = {
                    "user_id": onboarding_data.user_id,
                    "utility_type": onboarding_data.utility_type,
                    "month_date": month_date.isoformat(),
                    "month_name": month_name,
                    "year": year,
                    "consumption": round(consumption, 3),
                    "actual_bill": round(float(calculated_bill), 2),
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }

                # Check for existing record
                existing = self.supabase.table("user_historical_data").select("id").eq(
                    "user_id", onboarding_data.user_id
                ).eq("utility_type", onboarding_data.utility_type).eq(
                    "month_date", month_date.isoformat()
                ).execute()

                if existing.data:
                    # Update existing
                    result = self.supabase.table("user_historical_data").update(
                        record_data
                    ).eq("id", existing.data[0]["id"]).execute()
                else:
                    # Insert new
                    result = self.supabase.table("user_historical_data").insert(
                        record_data
                    ).execute()

                if result.data:
                    stored_ids.append(result.data[0]["id"])
                    logger.info(f"Stored onboarding data: {month_name} {year} - {consumption} units")

            return stored_ids

        except Exception as e:
            logger.error(f"Failed to store onboarding data: {e}")
            raise

    async def get_user_records(
        self,
        user_id: str,
        utility_type: UtilityType,
        from_date: Optional[date] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get user's historical records"""
        await self.init_supabase()

        try:
            query = self.supabase.table("user_historical_data").select("*").eq(
                "user_id", user_id
            ).eq("utility_type", utility_type.value)

            if from_date:
                query = query.gte("month_date", from_date.isoformat())

            result = query.order("month_date", desc=True).limit(limit).execute()

            # Convert to clean format
            records = []
            for data in result.data:
                records.append({
                    'id': data['id'],
                    'user_id': data['user_id'],
                    'utility_type': data['utility_type'],
                    'month_date': datetime.fromisoformat(data['month_date']).date(),
                    'month_name': data['month_name'],
                    'year': data['year'],
                    'consumption': float(data['consumption']),
                    'actual_bill': float(data['actual_bill']) if data['actual_bill'] else None,
                    'created_at': datetime.fromisoformat(data['created_at']),
                })

            return records

        except Exception as e:
            logger.error(f"Failed to get user records: {e}")
            return []

    async def update_record(
        self,
        record_id: str,
        user_id: str,
        consumption: Decimal,
        actual_bill: Optional[Decimal] = None
    ) -> bool:
        """Update existing historical record"""
        await self.init_supabase()

        try:
            update_data = {
                "consumption": round(float(consumption), 3),
                "actual_bill": round(float(actual_bill), 2) if actual_bill else None,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }

            result = self.supabase.table("user_historical_data").update(
                update_data
            ).eq("id", record_id).eq("user_id", user_id).execute()

            return len(result.data) > 0

        except Exception as e:
            logger.error(f"Failed to update record: {e}")
            return False

    async def delete_record(self, record_id: str, user_id: str) -> bool:
        """Delete historical record"""
        await self.init_supabase()

        try:
            result = self.supabase.table("user_historical_data").delete().eq(
                "id", record_id
            ).eq("user_id", user_id).execute()

            return len(result.data) > 0

        except Exception as e:
            logger.error(f"Failed to delete record: {e}")
            return False

    async def count_records(self, user_id: str, utility_type: UtilityType) -> int:
        """Count user's historical records"""
        await self.init_supabase()

        try:
            result = self.supabase.table("user_historical_data").select("id").eq(
                "user_id", user_id
            ).eq("utility_type", utility_type.value).execute()

            return len(result.data)

        except Exception as e:
            logger.error(f"Failed to count records: {e}")
            return 0

    async def add_historical_record(
        self,
        user_id: str,
        utility_type: UtilityType,
        month_date: date,
        consumption: float,
        actual_bill: float,
        source: str = "billing_cycle_calculation"
    ) -> bool:
        """
        Add a single historical record

        Used when billing cycle ends to store actual consumption and cost.
        This record will be used for future model training.

        Args:
            user_id: User ID
            utility_type: Utility type (water/electricity)
            month_date: Month date for the record
            consumption: Actual consumption for the month
            actual_bill: Actual cost for the month
            source: Data source (default: billing_cycle_calculation)

        Returns:
            bool: True if record was added successfully
        """
        await self.init_supabase()

        try:
            # Check if record already exists for this month
            existing = self.supabase.table("user_historical_data").select("id").eq(
                "user_id", user_id
            ).eq("utility_type", utility_type.value).eq(
                "month_date", month_date.isoformat()
            ).execute()

            if existing.data and len(existing.data) > 0:
                logger.info(f"Historical record already exists for {month_date.isoformat()}, updating instead")
                # Update existing record
                result = self.supabase.table("user_historical_data").update({
                    "consumption": consumption,
                    "actual_bill": actual_bill,
                    "notes": f"Updated from {source}",  # Store source in notes
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }).eq("id", existing.data[0]["id"]).execute()
                return True

            # Create new record
            record = {
                "user_id": user_id,
                "utility_type": utility_type.value,
                "month_date": month_date.isoformat(),
                "month_name": month_date.strftime('%B').lower(),  # e.g., "january"
                "year": month_date.year,
                "consumption": consumption,
                "actual_bill": actual_bill,
                "notes": f"Auto-generated from {source}",
                "created_at": datetime.now(timezone.utc).isoformat()
            }

            result = self.supabase.table("user_historical_data").insert(record).execute()

            logger.info(f"Historical record added: {month_date.isoformat()}, consumption={consumption}, cost={actual_bill}")
            return True

        except Exception as e:
            logger.error(f"Failed to add historical record: {e}")
            return False

    def _get_days_in_month(self, year: int, month: int) -> int:
        """Get number of days in a specific month"""
        return calendar.monthrange(year, month)[1]


# Global service instance
historical_data_service = HistoricalDataRepository()