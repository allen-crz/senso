#!/usr/bin/env python3
"""
Simple curl-style test for anomaly detection
"""

import asyncio
import httpx

API_BASE_URL = "http://localhost:8000/api/v1"
TEST_EMAIL = "test@gmail.com"
TEST_PASSWORD = "Test@123"

async def test_with_curl_style():
    """Test anomaly detection with simple API calls"""
    async with httpx.AsyncClient() as client:

        # Step 1: Login
        print("1. Logging in...")
        login_response = await client.post(
            f"{API_BASE_URL}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )

        if login_response.status_code != 200:
            print(f"Login failed: {login_response.status_code}")
            print(login_response.text)
            return

        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("   Login successful")

        # Step 2: Create baseline reading
        print("\n2. Creating baseline reading...")
        baseline_response = await client.post(
            f"{API_BASE_URL}/readings/",
            json={
                "utility_type": "water",
                "reading_value": 1245.678,
                "is_manual": True,
                "notes": "Baseline reading"
            },
            headers=headers
        )

        if baseline_response.status_code == 201:
            baseline_data = baseline_response.json()
            print(f"   Created: {baseline_data['reading']['reading_value']}")
            print(f"   Auto anomaly detected: {baseline_data.get('anomaly') is not None}")
        else:
            print(f"   Failed: {baseline_response.status_code}")
            print(f"   Error: {baseline_response.text}")

        # Step 3: Wait
        print("\n3. Waiting 3 seconds...")
        await asyncio.sleep(3)

        # Step 4: Create massive anomaly reading
        print("\n4. Creating MASSIVE anomaly reading...")
        anomaly_response = await client.post(
            f"{API_BASE_URL}/readings/",
            json={
                "utility_type": "water",
                "reading_value": 3000.999,  # HUGE spike
                "is_manual": True,
                "notes": "MASSIVE anomaly test"
            },
            headers=headers
        )

        if anomaly_response.status_code == 201:
            anomaly_data = anomaly_response.json()
            print(f"   Created: {anomaly_data['reading']['reading_value']}")
            print(f"   Auto anomaly detected: {anomaly_data.get('anomaly') is not None}")

            if anomaly_data.get('anomaly'):
                anomaly = anomaly_data['anomaly']
                print(f"   ANOMALY DETECTED!")
                print(f"   Severity: {anomaly.get('severity')}")
                print(f"   Score: {anomaly.get('anomaly_score')}")
                print(f"   Method: {anomaly.get('contributing_factors', {}).get('detection_method')}")
            else:
                print("   No anomaly detected automatically")
        else:
            print(f"   Failed: {anomaly_response.status_code}")
            print(f"   Error: {anomaly_response.text}")

if __name__ == "__main__":
    asyncio.run(test_with_curl_style())