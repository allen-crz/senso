"""
Middleware for logging and performance monitoring
"""
import time
from typing import Callable
from fastapi import Request, Response
from loguru import logger


class LoggingMiddleware:
    """Middleware for request/response logging with performance metrics"""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)
        start_time = time.time()

        # Track slow requests only
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                duration = time.time() - start_time

                # Only log very slow requests (>5s) or server errors (>=500)
                status = message.get("status", 200)
                if duration > 5.0 or status >= 500:
                    logger.info(
                        f"{request.method} {request.url.path} - "
                        f"Status: {message.get('status', 200)} - "
                        f"Duration: {duration:.3f}s"
                    )
            await send(message)

        await self.app(scope, receive, send_wrapper)


def add_logging_middleware(app):
    """Add optimized logging middleware"""
    app.add_middleware(LoggingMiddleware)