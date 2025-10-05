"""
Database connection and utilities for Supabase
"""
from typing import Optional, AsyncGenerator
import asyncpg
from supabase import create_client, Client
from app.core.config import settings
from loguru import logger


class DatabaseManager:
    """Database connection manager for Supabase"""
    
    def __init__(self):
        self.supabase: Optional[Client] = None
        self.service_supabase: Optional[Client] = None
        self.pool: Optional[asyncpg.Pool] = None
    
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
    
    async def init_pool(self) -> asyncpg.Pool:
        """Initialize asyncpg connection pool for direct PostgreSQL access"""
        if not self.pool:
            if settings.DATABASE_URL:
                self.pool = await asyncpg.create_pool(
                    settings.DATABASE_URL,
                    min_size=10,  # Increased from 5 for better concurrency
                    max_size=50,  # Increased from 20 for high load scenarios
                    command_timeout=30,  # Reduced from 60 for faster failure detection
                    server_settings={
                        'application_name': 'senso_backend',
                        'tcp_keepalives_idle': '300',
                        'tcp_keepalives_interval': '30',
                        'tcp_keepalives_count': '3'
                    }
                )
                logger.info("Database connection pool initialized with optimized settings")
            else:
                logger.warning("DATABASE_URL not set, direct PostgreSQL access unavailable")
        return self.pool
    
    async def close(self):
        """Close database connections"""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")


# Global database manager instance
db_manager = DatabaseManager()


async def init_db():
    """Initialize database connections"""
    await db_manager.init_supabase()
    await db_manager.init_pool()


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


async def get_db_pool() -> Optional[asyncpg.Pool]:
    """Dependency to get database connection pool"""
    if not db_manager.pool:
        await db_manager.init_pool()
    return db_manager.pool


async def get_db_connection() -> AsyncGenerator[asyncpg.Connection, None]:
    """Dependency to get database connection"""
    pool = await get_db_pool()
    if pool:
        async with pool.acquire() as connection:
            yield connection
    else:
        raise RuntimeError("Database connection pool not available")