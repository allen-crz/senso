"""
APScheduler configuration for automatic background tasks

Handles scheduled tasks like daily billing cycle checks
"""
try:
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from apscheduler.triggers.cron import CronTrigger
except ImportError:
    # Try with different case
    from APScheduler.schedulers.asyncio import AsyncIOScheduler
    from APScheduler.triggers.cron import CronTrigger

from loguru import logger


class AppScheduler:
    """
    Application scheduler for background tasks
    """

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self._started = False

    def start(self):
        """Start the scheduler"""
        if not self._started:
            self.scheduler.start()
            self._started = True
            logger.info("✅ APScheduler started successfully")

    def shutdown(self):
        """Shutdown the scheduler gracefully"""
        if self._started:
            self.scheduler.shutdown()
            self._started = False
            logger.info("✅ APScheduler shut down successfully")

    def add_daily_task(self, func, hour: int = 0, minute: int = 0, task_id: str = None):
        """
        Add a task that runs daily at a specific time

        Args:
            func: Async function to execute
            hour: Hour to run (0-23), default 0 (midnight)
            minute: Minute to run (0-59), default 0
            task_id: Unique identifier for the task
        """
        trigger = CronTrigger(hour=hour, minute=minute)

        self.scheduler.add_job(
            func,
            trigger=trigger,
            id=task_id,
            replace_existing=True,
            misfire_grace_time=3600  # Allow 1 hour grace period if server was down
        )

        logger.info(f"✅ Scheduled daily task '{task_id}' at {hour:02d}:{minute:02d}")

    def add_interval_task(self, func, minutes: int, task_id: str = None):
        """
        Add a task that runs at regular intervals

        Args:
            func: Async function to execute
            minutes: Interval in minutes
            task_id: Unique identifier for the task
        """
        self.scheduler.add_job(
            func,
            trigger='interval',
            minutes=minutes,
            id=task_id,
            replace_existing=True
        )

        logger.info(f"✅ Scheduled interval task '{task_id}' every {minutes} minutes")


# Singleton instance
app_scheduler = AppScheduler()
