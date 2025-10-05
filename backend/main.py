"""
FastAPI main application for Senso - Utility Monitoring PWA
"""
import os

# Disable multiprocessing completely to prevent Windows spawn issues
os.environ['JOBLIB_MULTIPROCESSING'] = '0'
os.environ['JOBLIB_START_METHOD'] = 'threading'
os.environ['SCIKIT_LEARN_ENABLE_MULTIPROCESSING'] = '0'
os.environ['SKLEARN_N_JOBS'] = '1'

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api import api_router
from app.core.database import init_db
from app.core.logging_config import structured_logger  # Initialize logging
from app.core.middleware import add_logging_middleware
from app.core.scheduler import app_scheduler
from app.services.billing_scheduler import billing_scheduler_service
from loguru import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("🚀 Starting Senso API...")
    await init_db()

    # Start the scheduler
    logger.info("⏰ Initializing billing cycle scheduler...")
    app_scheduler.start()

    # Schedule daily billing cycle check at midnight (00:00)
    app_scheduler.add_daily_task(
        func=billing_scheduler_service.process_daily_billing_cycles,
        hour=0,
        minute=0,
        task_id="daily_billing_cycle_check"
    )

    logger.success("✅ Senso API started successfully with automatic billing cycle checks")

    yield

    # Shutdown - cleanup
    logger.info("🛑 Shutting down Senso API...")
    app_scheduler.shutdown()
    logger.info("✅ Senso API shut down successfully")


# Create FastAPI app
app = FastAPI(
    title="Senso API",
    description="Backend API for Senso - Utility Monitoring Progressive Web App",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add optimized logging middleware
add_logging_middleware(app)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Senso API is running"}


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Senso API",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    import logging

    # Disable uvicorn access logging in production
    log_level = "info"
    access_log = True
    if settings.LOG_LEVEL.upper() in ["WARNING", "ERROR"]:
        log_level = "warning"
        access_log = False

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=log_level,
        access_log=access_log
    )