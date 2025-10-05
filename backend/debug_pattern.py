#!/usr/bin/env python3
"""
Debug pattern detection - minimal test
"""

import asyncio
import httpx

API_BASE_URL = "http://localhost:8000/api/v1"
TEST_EMAIL = "test@gmail.com"
TEST_PASSWORD = "Test@123"

async def debug_pattern():
    """Simple debug test"""
    async with httpx.AsyncClient() as client:

        # Login
        login_response = await client.post(
            f"{API_BASE_URL}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        print("Creating test readings...")

        # Reading 1: 1000L
        r1 = await client.post(f"{API_BASE_URL}/readings/",
            json={"utility_type": "water", "reading_value": 1000.0, "is_manual": True},
            headers=headers)
        print(f"R1: {r1.status_code}, anomaly: {r1.json().get('anomaly') is not None if r1.status_code == 201 else 'failed'}")

        await asyncio.sleep(1)

        # Reading 2: 1050L (50L consumption)
        r2 = await client.post(f"{API_BASE_URL}/readings/",
            json={"utility_type": "water", "reading_value": 1050.0, "is_manual": True},
            headers=headers)
        print(f"R2: {r2.status_code}, anomaly: {r2.json().get('anomaly') is not None if r2.status_code == 201 else 'failed'}")

        await asyncio.sleep(1)

        # Reading 3: 1300L (250L consumption = 5x the 50L pattern)
        r3 = await client.post(f"{API_BASE_URL}/readings/",
            json={"utility_type": "water", "reading_value": 1300.0, "is_manual": True},
            headers=headers)

        if r3.status_code == 201:
            r3_data = r3.json()
            print(f"R3: 1300L (250L consumption = 5x pattern)")
            print(f"Anomaly detected: {r3_data.get('anomaly') is not None}")
            if r3_data.get('anomaly'):
                anomaly = r3_data['anomaly']
                print(f"  Severity: {anomaly.get('severity')}")
                print(f"  Method: {anomaly.get('contributing_factors', {}).get('detection_method')}")
                print(f"  Reason: {anomaly.get('contributing_factors', {}).get('reason')}")
        else:
            print(f"R3 failed: {r3.status_code}")

if __name__ == "__main__":
    asyncio.run(debug_pattern())