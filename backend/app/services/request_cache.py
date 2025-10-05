"""
Request caching and deduplication service
"""
import time
import hashlib
from typing import Dict, Any, Optional, Tuple
from functools import wraps
from loguru import logger


class RequestCache:
    """In-memory cache for API request deduplication"""

    def __init__(self, default_ttl: int = 60):
        self.cache: Dict[str, Tuple[Any, float]] = {}
        self.default_ttl = default_ttl
        self._last_cleanup = time.time()

    def _cleanup_expired(self):
        """Remove expired cache entries"""
        current_time = time.time()

        # Only cleanup every 5 minutes
        if current_time - self._last_cleanup < 300:
            return

        expired_keys = [
            key for key, (_, expires_at) in self.cache.items()
            if current_time > expires_at
        ]

        for key in expired_keys:
            del self.cache[key]

        self._last_cleanup = current_time

    def _generate_key(self, user_id: str, endpoint: str, **kwargs) -> str:
        """Generate cache key from request parameters"""
        # Sort kwargs for consistent key generation
        sorted_params = sorted(kwargs.items())
        key_data = f"{user_id}:{endpoint}:{sorted_params}"
        return hashlib.md5(key_data.encode()).hexdigest()

    def get(self, user_id: str, endpoint: str, **kwargs) -> Optional[Any]:
        """Get cached result if not expired"""
        self._cleanup_expired()

        key = self._generate_key(user_id, endpoint, **kwargs)
        if key in self.cache:
            result, expires_at = self.cache[key]
            if time.time() < expires_at:
                return result
            else:
                del self.cache[key]

        return None

    def set(self, user_id: str, endpoint: str, result: Any, ttl: Optional[int] = None, **kwargs):
        """Cache result with expiration"""
        if ttl is None:
            ttl = self.default_ttl

        key = self._generate_key(user_id, endpoint, **kwargs)
        expires_at = time.time() + ttl
        self.cache[key] = (result, expires_at)

    def clear_user_cache(self, user_id: str):
        """Clear all cache entries for a user"""
        keys_to_remove = [
            key for key in self.cache.keys()
            if key.startswith(f"{hashlib.md5(user_id.encode()).hexdigest()[:8]}")
        ]
        for key in keys_to_remove:
            del self.cache[key]


# Global cache instance
request_cache = RequestCache()


def cache_request(ttl: int = 60, cache_key_params: list = None):
    """
    Decorator to cache API responses and prevent duplicate requests

    Args:
        ttl: Time to live in seconds
        cache_key_params: List of parameter names to include in cache key
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user_id and endpoint info
            user_id = kwargs.get('user_id')
            if not user_id and len(args) > 0 and hasattr(args[0], 'user_id'):
                user_id = getattr(args[0], 'user_id', None)

            if not user_id:
                # No user context, skip caching
                return await func(*args, **kwargs)

            # Build cache key parameters
            cache_params = {}
            if cache_key_params:
                for param in cache_key_params:
                    if param in kwargs:
                        cache_params[param] = kwargs[param]

            endpoint = f"{func.__module__}.{func.__name__}"

            # Try to get cached result
            cached_result = request_cache.get(user_id, endpoint, **cache_params)
            if cached_result is not None:
                logger.debug(f"Cache hit for {user_id[:8]}... on {endpoint}")
                return cached_result

            # Execute function and cache result
            result = await func(*args, **kwargs)

            # Cache successful results only
            if result is not None:
                request_cache.set(user_id, endpoint, result, ttl, **cache_params)
                logger.debug(f"Cached result for {user_id[:8]}... on {endpoint}")

            return result

        return wrapper
    return decorator


def invalidate_user_cache(user_id: str):
    """Invalidate all cached requests for a user"""
    request_cache.clear_user_cache(user_id)
    logger.debug(f"Cleared cache for user {user_id[:8]}...")