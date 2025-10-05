#!/usr/bin/env python3
"""
Test 3 readings to verify clean pattern detection
Uses account: test@gmail.com / Test@123
"""

import asyncio
import httpx

API_BASE_URL = "http://localhost:8000/api/v1"
TEST_EMAIL = "test@gmail.com"
TEST_PASSWORD = "Test@123"

async def test_3_readings():
    """Test with 3 readings to trigger pattern detection"""
    async with httpx.AsyncClient() as client:

        # Step 1: Login
        print("1. Logging in...")
        login_response = await client.post(
            f"{API_BASE_URL}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )

        if login_response.status_code != 200:
            print(f"Login failed: {login_response.status_code}")
            return

        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("   Login successful")

        # Step 2: Create first reading (baseline)
        print("\n2. Creating baseline reading...")
        reading1_response = await client.post(
            f"{API_BASE_URL}/readings/",
            json={
                "utility_type": "water",
                "reading_value": 1000.0,
                "is_manual": True,
                "notes": "Baseline reading"
            },
            headers=headers
        )

        if reading1_response.status_code == 201:
            print(f"   Reading 1: 1000.0L created")
        else:
            print(f"   Failed: {reading1_response.status_code}")
            return

        # Wait longer to ensure database consistency
        await asyncio.sleep(5)

        # Step 3: Create second reading (normal pattern)
        print("\n3. Creating normal pattern reading...")
        reading2_response = await client.post(
            f"{API_BASE_URL}/readings/",
            json={
                "utility_type": "water",
                "reading_value": 1100.0,  # 100L consumption
                "is_manual": True,
                "notes": "Normal pattern reading"
            },
            headers=headers
        )

        if reading2_response.status_code == 201:
            print(f"   Reading 2: 1100.0L created (100L consumption)")
        else:
            print(f"   Failed: {reading2_response.status_code}")
            return

        # Wait longer to ensure database consistency
        await asyncio.sleep(5)

        # Step 4: Create third reading (ANOMALY - should trigger pattern detection)
        print("\n4. Creating ANOMALY reading...")
        reading3_response = await client.post(
            f"{API_BASE_URL}/readings/",
            json={
                "utility_type": "water",
                "reading_value": 1600.0,  # 500L consumption (5x the 100L pattern!)
                "is_manual": True,
                "notes": "ANOMALY - massive spike 5x normal pattern"
            },
            headers=headers
        )

        if reading3_response.status_code == 201:
            reading3_data = reading3_response.json()
            print(f"   Reading 3: 1600.0L created (500L consumption = 5x pattern!)")
            print(f"   Auto anomaly detected: {reading3_data.get('anomaly') is not None}")

            if reading3_data.get('anomaly'):
                anomaly = reading3_data['anomaly']
                print(f"   ✅ ANOMALY DETECTED!")
                print(f"   Severity: {anomaly.get('severity')}")
                print(f"   Score: {anomaly.get('anomaly_score')}")
                print(f"   Reason: {anomaly.get('contributing_factors', {}).get('reason')}")
                print(f"   Detection Method: {anomaly.get('contributing_factors', {}).get('detection_method')}")
            else:
                print("   ❌ No anomaly detected - pattern detection may not be working")
        else:
            print(f"   Failed: {reading3_response.status_code}")
            print(f"   Error: {reading3_response.text}")

if __name__ == "__main__":
    print("Testing 3 readings for pattern detection...")
    asyncio.run(test_3_readings())