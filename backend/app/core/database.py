"""
Database connection and utilities for Supabase
"""
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings
from loguru import logger


class DatabaseManager:
    """Database connection manager for Supabase"""

    def __init__(self):
        self.supabase: Optional[Client] = None
        self.service_supabase: Optional[Client] = None

    async def init_supabase(self) -> Client:
        """Initialize Supabase client"""
        if not self.supabase:
            self.supabase = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_ANON_KEY  # Use anon key for JWT validation
            )
            logger.info("Supabase client initialized")
        return self.supabase

    async def init_service_supabase(self) -> Client:
        """Initialize Supabase client with service role key (bypasses RLS)"""
        if not self.service_supabase:
            self.service_supabase = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY  # Use service role key
            )
            logger.info("Supabase service client initialized")
        return self.service_supabase

    async def close(self):
        """Close database connections"""
        logger.info("Supabase connections closed")


# Global database manager instance
db_manager = DatabaseManager()


async def init_db():
    """Initialize database connections"""
    await db_manager.init_supabase()


async def get_supabase() -> Client:
    """Dependency to get Supabase client"""
    if not db_manager.supabase:
        await db_manager.init_supabase()
    return db_manager.supabase


async def get_service_supabase() -> Client:
    """Dependency to get Supabase client with service role (bypasses RLS)"""
    if not db_manager.service_supabase:
        await db_manager.init_service_supabase()
    return db_manager.service_supabase