#!/usr/bin/env python3
"""
Debug anomaly detection to see what's happening
"""
import asyncio
import sys
import os
from datetime import datetime

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.anomaly_detection import anomaly_detection_service

async def debug_detection():
    """Debug detection with real reading IDs"""
    print("=== DEBUGGING ANOMALY DETECTION ===")

    # Use the reading IDs from the last test
    baseline_reading_id = "797acab0-d45e-470c-a1d0-805055246da2"
    anomaly_reading_id = "538021a7-a126-45a1-bfe4-996619d03e6e"

    # Get user ID (assuming it's the test user)
    test_user_id = "0dffe6c0-b8e0-4e82-9e05-ca1e8b5f5f82"  # This might need to be looked up

    try:
        print(f"Testing with baseline reading: {baseline_reading_id}")
        result1 = await anomaly_detection_service.detect_anomaly(test_user_id, baseline_reading_id)
        print(f"Baseline result: {result1}")

        print(f"\nTesting with anomaly reading: {anomaly_reading_id}")
        result2 = await anomaly_detection_service.detect_anomaly(test_user_id, anomaly_reading_id)
        print(f"Anomaly result: {result2}")

        if result2:
            print("✅ ANOMALY DETECTED!")
        else:
            print("❌ No anomaly detected - need to investigate")

    except Exception as e:
        print(f"Error during detection: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_detection())