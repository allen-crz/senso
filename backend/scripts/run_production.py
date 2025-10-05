#!/usr/bin/env python3
"""
Production server runner with optimized logging
"""
import os
import sys
import uvicorn
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

def main():
    """Run the production server with optimized settings"""

    # Set production environment
    os.environ["LOG_LEVEL"] = "WARNING"

    # Disable uvicorn access logging
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        workers=int(os.environ.get("WORKERS", 1)),
        log_level="warning",
        access_log=False,
        server_header=False,
        date_header=False,
        # Performance optimizations
        loop="uvloop",
        http="httptools",
        # Disable reload in production
        reload=False
    )

if __name__ == "__main__":
    main()