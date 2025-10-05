#!/usr/bin/env python3
"""
Focused test to understand why anomaly detection isn't working
"""
import asyncio
import sys
import os
import json
from datetime import datetime

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

import httpx
from app.services.anomaly_detection import anomaly_detection_service

API_BASE_URL = "http://localhost:8000/api/v1"
TEST_EMAIL = "test@gmail.com"
TEST_PASSWORD = "Test@123"

async def main():
    """Focused test"""
    print("=== FOCUSED ANOMALY DETECTION TEST ===")

    client = httpx.AsyncClient()

    try:
        # Login
        response = await client.post(
            f"{API_BASE_URL}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )

        if response.status_code != 200:
            print(f"Login failed: {response.status_code}")
            return

        auth_data = response.json()
        token = auth_data.get("access_token")
        headers = {"Authorization": f"Bearer {token}"}

        print("Login successful")

        # Create baseline reading
        baseline_data = {
            "utility_type": "water",
            "reading_value": 1000.0,
            "is_manual": True,
            "notes": "Baseline for test"
        }

        response = await client.post(
            f"{API_BASE_URL}/readings/",
            json=baseline_data,
            headers=headers
        )

        if response.status_code != 201:
            print(f"Failed to create baseline: {response.status_code} - {response.text}")
            return

        baseline_result = response.json()
        baseline_id = baseline_result['reading']['id']
        print(f"Created baseline reading: {baseline_id} = {baseline_data['reading_value']}")

        # Wait a moment
        await asyncio.sleep(1)

        # Create anomaly reading
        anomaly_data = {
            "utility_type": "water",
            "reading_value": 2500.0,  # +1500L increase!
            "is_manual": True,
            "notes": "HUGE anomaly for test"
        }

        response = await client.post(
            f"{API_BASE_URL}/readings/",
            json=anomaly_data,
            headers=headers
        )

        if response.status_code != 201:
            print(f"Failed to create anomaly: {response.status_code} - {response.text}")
            return

        anomaly_result = response.json()
        anomaly_id = anomaly_result['reading']['id']
        print(f"Created anomaly reading: {anomaly_id} = {anomaly_data['reading_value']}")
        print(f"   Consumption increase: {anomaly_data['reading_value'] - baseline_data['reading_value']}L")

        # Test anomaly detection on the huge spike
        print("\n--- Testing anomaly detection ---")
        response = await client.post(
            f"{API_BASE_URL}/anomaly-detection/detect",
            json={"reading_id": anomaly_id},
            headers=headers
        )

        print(f"Detection API status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Detection result: {result}")

            if result and result.get('is_anomaly'):
                print("SUCCESS! Anomaly detected!")
                print(f"   Severity: {result.get('severity')}")
                print(f"   Score: {result.get('anomaly_score')}")
                print(f"   Method: {result.get('contributing_factors', {}).get('detection_method')}")
            else:
                print("FAILED! No anomaly detected for 1500L spike")
        else:
            print(f"API Error: {response.text}")

    except Exception as e:
        print(f"Test failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await client.aclose()

if __name__ == "__main__":
    asyncio.run(main())