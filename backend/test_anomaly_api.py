#!/usr/bin/env python3
"""
Test the anomaly detection API endpoints to see if frontend can access anomalies
"""
import asyncio
import sys
import os
import json

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

import httpx

API_BASE_URL = "http://localhost:8000/api/v1"
TEST_EMAIL = "test@gmail.com"
TEST_PASSWORD = "Test@123"

async def main():
    """Test anomaly API"""
    print("=== TESTING ANOMALY API ENDPOINTS ===")

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

        # Test the user anomalies endpoint
        print("\n--- Testing user anomalies endpoint ---")
        response = await client.get(
            f"{API_BASE_URL}/anomaly-detection/user-anomalies/water?limit=10",
            headers=headers
        )

        print(f"API Status: {response.status_code}")
        if response.status_code == 200:
            anomalies = response.json()
            print(f"Anomalies returned: {len(anomalies)}")

            if anomalies:
                print("Latest anomaly:")
                latest = anomalies[0]
                print(f"  ID: {latest.get('id')}")
                print(f"  Severity: {latest.get('severity')}")
                print(f"  Score: {latest.get('anomaly_score')}")
                print(f"  Detection method: {latest.get('contributing_factors', {}).get('detection_method')}")
                print(f"  Detected at: {latest.get('detected_at')}")
                print("Frontend should be able to display these anomalies!")
            else:
                print("No anomalies found - this is why frontend is empty")
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