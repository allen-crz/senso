"""
Billing Cycle Scheduler Service

Automatically checks and processes billing cycle transitions for all users daily.
This ensures billing cycles are processed even if users don't submit readings on their billing date.
"""
from datetime import date
from typing import List
from loguru import logger

from app.core.database import get_supabase
from app.models.schemas import UtilityType
from app.services.cost_forecasting import cost_forecasting_service


class BillingSchedulerService:
    """
    Service to handle automatic daily billing cycle checks for all users
    """

    def __init__(self):
        self.supabase = None

    async def init_supabase(self):
        """Initialize Supabase client"""
        if not self.supabase:
            self.supabase = await get_supabase()

    async def get_all_active_users(self) -> List[dict]:
        """
        Get all users who have user preferences set up
        (indicates they have billing dates configured)
        """
        await self.init_supabase()

        try:
            logger.info("Querying user_preferences table for billing dates...")
            response = self.supabase.table("user_preferences")\
                .select("user_id, water_billing_date, electricity_billing_date")\
                .execute()

            logger.info(f"Query response: {response}")

            if response.data:
                logger.info(f"Found {len(response.data)} users with billing preferences")
                for user in response.data:
                    logger.info(f"User {user.get('user_id')}: water={user.get('water_billing_date')}, electricity={user.get('electricity_billing_date')}")
                return response.data
            else:
                logger.warning("Query returned no data")
            return []

        except Exception as e:
            logger.error(f"Failed to get active users: {e}")
            logger.exception("Full traceback:")
            return []

    async def check_user_billing_cycle(
        self,
        user_id: str,
        utility_type: UtilityType,
        billing_day: int,
        current_date: date
    ) -> bool:
        """
        Check if a specific user needs billing cycle processing today

        Args:
            user_id: User ID
            utility_type: water or electricity
            billing_day: Day of month for billing (1-31)
            current_date: Today's date

        Returns:
            True if billing cycle was processed, False otherwise
        """
        try:
            # Check if today is the billing date
            if current_date.day == billing_day:
                logger.info(f"📅 Billing date matched for user {user_id}, {utility_type.value} - Processing cycle transition...")

                # Trigger the billing cycle reset
                result = await cost_forecasting_service.reset_forecast_at_billing_date(
                    user_id=user_id,
                    utility_type=utility_type,
                    current_date=current_date,
                    demo_mode=False  # This is real automatic processing
                )

                if result.get("success"):
                    logger.success(f"✅ Automatic billing cycle processed for user {user_id}, {utility_type.value}")
                    return True
                else:
                    logger.warning(f"Billing cycle check returned: {result.get('message', 'No message')}")
                    return False

            return False

        except Exception as e:
            logger.error(f"Error checking billing cycle for user {user_id}, {utility_type.value}: {e}")
            return False

    async def process_daily_billing_cycles(self):
        """
        Main scheduled task: Check all users for billing cycle transitions
        Runs daily at midnight (or configured time)
        """
        current_date = date.today()
        logger.info(f"🔄 Starting daily billing cycle check for {current_date.isoformat()}")

        try:
            # Get all users with preferences
            users = await self.get_all_active_users()

            if not users:
                logger.info("No users with billing preferences found")
                return

            processed_count = 0
            total_checks = 0

            # Check each user for both water and electricity
            for user_pref in users:
                user_id = user_pref.get("user_id")

                # Check water billing
                water_billing_date = user_pref.get("water_billing_date")
                if water_billing_date:
                    total_checks += 1
                    if await self.check_user_billing_cycle(
                        user_id=user_id,
                        utility_type=UtilityType.WATER,
                        billing_day=water_billing_date,
                        current_date=current_date
                    ):
                        processed_count += 1

                # Check electricity billing
                electricity_billing_date = user_pref.get("electricity_billing_date")
                if electricity_billing_date:
                    total_checks += 1
                    if await self.check_user_billing_cycle(
                        user_id=user_id,
                        utility_type=UtilityType.ELECTRICITY,
                        billing_day=electricity_billing_date,
                        current_date=current_date
                    ):
                        processed_count += 1

            logger.success(f"🎉 Daily billing cycle check complete: {processed_count} cycles processed out of {total_checks} checks")

        except Exception as e:
            logger.error(f"Failed to process daily billing cycles: {e}")
            logger.exception("Full error:")


# Singleton instance
billing_scheduler_service = BillingSchedulerService()
