#!/usr/bin/env python3
"""
Development server runner with detailed logging
"""
import os
import sys
import uvicorn
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

def main():
    """Run the development server with detailed logging"""

    # Set development environment
    os.environ["LOG_LEVEL"] = "INFO"

    # Enable uvicorn access logging for development
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        log_level="info",
        access_log=True,
        # Development features
        reload=True,
        reload_dirs=[str(backend_dir)],
        reload_includes=["*.py", "*.yaml", "*.yml", "*.json"]
    )

if __name__ == "__main__":
    main()