"""
Optimized logging configuration for Senso API
"""
import sys
import time
from typing import Dict, Any, Optional
from functools import wraps
from loguru import logger
from app.core.config import settings


class LogSampler:
    """Rate limiting for repeated log messages"""

    def __init__(self, window_seconds: int = 60, max_per_window: int = 5):
        self.window_seconds = window_seconds
        self.max_per_window = max_per_window
        self._log_counts: Dict[str, Dict[str, Any]] = {}

    def should_log(self, message_key: str) -> bool:
        """Check if message should be logged based on rate limiting"""
        now = time.time()

        if message_key not in self._log_counts:
            self._log_counts[message_key] = {
                'count': 0,
                'window_start': now
            }

        entry = self._log_counts[message_key]

        # Reset window if expired
        if now - entry['window_start'] > self.window_seconds:
            entry['count'] = 0
            entry['window_start'] = now

        # Check if under limit
        if entry['count'] < self.max_per_window:
            entry['count'] += 1
            return True

        return False


class StructuredLogger:
    """Centralized logging with sampling and structured output"""

    def __init__(self):
        self.samplers = {
            'rate_warning': LogSampler(window_seconds=300, max_per_window=1),  # 1 per 5min
            'model_cache': LogSampler(window_seconds=60, max_per_window=3),    # 3 per min
            'db_operation': LogSampler(window_seconds=30, max_per_window=10),  # 10 per 30s
            'training': LogSampler(window_seconds=60, max_per_window=2),       # 2 per min
        }
        self._setup_logger()

    def _setup_logger(self):
        """Configure loguru with optimized settings"""
        # Remove default handler
        logger.remove()

        # Production format (structured JSON for log aggregation)
        if settings.LOG_LEVEL.upper() in ['ERROR', 'WARNING']:
            log_format = (
                "{"
                '"time": "{time:YYYY-MM-DD HH:mm:ss.SSS}", '
                '"level": "{level}", '
                '"module": "{module}", '
                '"function": "{function}", '
                '"line": {line}, '
                '"message": "{message}"'
                "}\n"
            )
        else:
            # Development format (human readable)
            log_format = (
                "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
                "<level>{level: <8}</level> | "
                "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
                "<level>{message}</level>"
            )

        # Add console handler with filtering
        logger.add(
            sys.stdout,
            format=log_format,
            level=settings.LOG_LEVEL.upper(),
            enqueue=True,  # Async logging
            backtrace=True,
            diagnose=True,
            filter=self._log_filter
        )

        # Add file handler for errors only
        if settings.LOG_LEVEL.upper() != 'DEBUG':
            logger.add(
                "logs/error.log",
                format=log_format,
                level="ERROR",
                rotation="10 MB",
                retention="7 days",
                compression="gz",
                enqueue=True
            )

    def _log_filter(self, record):
        """Filter out noisy log messages"""
        message = record["message"]

        # Filter out uvicorn access logs that leak through
        if "127.0.0.1" in message and "HTTP/1.1" in message:
            return False

        # Filter verbose training details in production
        if settings.LOG_LEVEL.upper() in ['ERROR', 'WARNING']:
            if any(keyword in message for keyword in [
                "Feature importance:",
                "Predictor strength:",
                "JSON serialization test passed",
                "Generated 151 daily training samples",
                "Model trained - R²:",
                "Forecasting model saved for user",
            ]):
                return False

        return True

    def rate_limited_log(self, level: str, message: str, sampler_key: str, **kwargs):
        """Log with rate limiting"""
        if self.samplers[sampler_key].should_log(message):
            getattr(logger, level)(message, **kwargs)

    def db_operation(self, operation: str, table: str, user_id: Optional[str] = None, **kwargs):
        """Log database operations with sampling"""
        message = f"DB {operation}: {table}"
        if user_id:
            message += f" (user: {user_id[:8]}...)"
        self.rate_limited_log('debug', message, 'db_operation', **kwargs)

    def model_cache_info(self, user_id: str, action: str, details: str = ""):
        """Log model cache operations with sampling"""
        message = f"Model cache {action} for {user_id[:8]}... {details}"
        self.rate_limited_log('debug', message, 'model_cache')

    def rate_warning(self, provider_id: str, utility_type: str):
        """Log rate calculation warnings with heavy sampling"""
        message = f"No rates found for provider {provider_id[:8]}... ({utility_type})"
        self.rate_limited_log('warning', message, 'rate_warning')

    def training_info(self, user_id: str, utility_type: str, action: str, metrics: Optional[Dict] = None):
        """Log training operations with sampling"""
        message = f"Training {action} for {user_id[:8]}... ({utility_type})"
        if metrics:
            message += f" - R²: {metrics.get('r2', 'N/A')}, MAE: {metrics.get('mae', 'N/A')}"
        self.rate_limited_log('info', message, 'training')


def log_performance(func_name: str = None):
    """Decorator to log function performance"""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start_time
                if duration > 1.0:  # Only log slow operations
                    logger.debug(f"{func_name or func.__name__} took {duration:.2f}s")
                return result
            except Exception as e:
                duration = time.time() - start_time
                logger.error(f"{func_name or func.__name__} failed after {duration:.2f}s: {e}")
                raise

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                if duration > 1.0:  # Only log slow operations
                    logger.debug(f"{func_name or func.__name__} took {duration:.2f}s")
                return result
            except Exception as e:
                duration = time.time() - start_time
                logger.error(f"{func_name or func.__name__} failed after {duration:.2f}s: {e}")
                raise

        return async_wrapper if hasattr(func, '__await__') or str(func).find('async') != -1 else sync_wrapper

    return decorator


# Global instance
structured_logger = StructuredLogger()

# Convenience functions
def log_db_operation(operation: str, table: str, user_id: Optional[str] = None, **kwargs):
    structured_logger.db_operation(operation, table, user_id, **kwargs)

def log_model_cache(user_id: str, action: str, details: str = ""):
    structured_logger.model_cache_info(user_id, action, details)

def log_rate_warning(provider_id: str, utility_type: str):
    structured_logger.rate_warning(provider_id, utility_type)

def log_training_info(user_id: str, utility_type: str, action: str, metrics: Optional[Dict] = None):
    structured_logger.training_info(user_id, utility_type, action, metrics)