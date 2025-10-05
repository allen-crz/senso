#!/usr/bin/env python3
"""
Test script for anomaly detection - Insert readings to test anomaly system
Uses account: test@gmail.com / Test@123
"""

import asyncio
import json
import sys
import os
from datetime import datetime, timedelta
from decimal import Decimal

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

import httpx
from app.models.schemas import MeterReadingCreate, UtilityType

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
TEST_EMAIL = "test@gmail.com"
TEST_PASSWORD = "Test@123"

class AnomalyTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.auth_token = None
        self.client = httpx.AsyncClient()

    async def login(self, email: str, password: str) -> bool:
        """Login and get auth token"""
        try:
            response = await self.client.post(
                f"{self.base_url}/auth/login",
                json={"email": email, "password": password}
            )

            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                print(f"Login successful for {email}")
                return True
            else:
                print(f"Login failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"Login error: {e}")
            return False

    async def create_reading(self, reading_data: dict) -> dict:
        """Create a meter reading via API"""
        headers = {}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"

        try:
            response = await self.client.post(
                f"{self.base_url}/readings/",
                json=reading_data,
                headers=headers
            )

            if response.status_code == 201:
                return response.json()
            else:
                print(f"Error creating reading: {response.status_code} - {response.text}")
                return None

        except Exception as e:
            print(f"Request failed: {e}")
            return None

    async def detect_anomaly(self, reading_id: str) -> dict:
        """Trigger anomaly detection for a specific reading"""
        headers = {}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
            print(f"Using auth token: {self.auth_token[:20]}..." if self.auth_token else "No token")
        else:
            print("No auth token available!")

        try:
            print(f"Making request to: {self.base_url}/anomaly-detection/detect")
            response = await self.client.post(
                f"{self.base_url}/anomaly-detection/detect",
                json={"reading_id": reading_id},
                headers=headers
            )

            print(f"Response status: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print(f"Response data: {result}")
                return result
            else:
                print(f"Error detecting anomaly: {response.status_code} - {response.text}")
                try:
                    error_detail = response.json()
                    print(f"Error details: {error_detail}")
                except:
                    pass
                return None

        except Exception as e:
            print(f"Anomaly detection request failed: {e}")
            return None

    async def test_water_readings(self):
        """Test water meter readings with baseline and anomaly"""
        print("\n=== TESTING WATER METER ANOMALY DETECTION ===")
        print("-" * 50)

        # Baseline reading (normal consumption)
        baseline_reading = {
            "utility_type": "water",
            "reading_value": 1245.678,  # Normal reading
            "is_manual": True,
            "notes": "Baseline reading for anomaly testing"
        }

        # Anomaly reading (HUGE spike in usage - much farther reading)
        anomaly_reading = {
            "utility_type": "water",
            "reading_value": 2500.123,  # MASSIVE increase (+1254.445 units!)
            "is_manual": True,
            "notes": "Anomaly reading - MASSIVE spike in water usage"
        }

        print("1. Creating baseline water reading...")
        baseline_result = await self.create_reading(baseline_reading)

        if baseline_result:
            reading_id = baseline_result['reading']['id']
            print(f"   Reading ID: {reading_id}")
            print(f"   Value: {baseline_result['reading']['reading_value']}")

            # Use early detection API
            print("   Running early anomaly detection...")
            anomaly_result = await self.detect_anomaly(reading_id)
            if anomaly_result:
                print(f"   Anomaly detected: {anomaly_result.get('is_anomaly', False)}")
                if anomaly_result.get('is_anomaly'):
                    print(f"   Severity: {anomaly_result.get('severity', 'N/A')}")
                    print(f"   Score: {anomaly_result.get('anomaly_score', 'N/A')}")
            else:
                print("   No anomaly detected (expected for baseline)")
        else:
            print("   Failed to create baseline reading")
            return

        # Wait a bit to simulate time passage
        print("\n   Waiting 3 seconds...")
        await asyncio.sleep(3)

        print("2. Creating anomaly water reading...")
        anomaly_reading_result = await self.create_reading(anomaly_reading)

        if anomaly_reading_result:
            reading_id = anomaly_reading_result['reading']['id']
            print(f"   Reading ID: {reading_id}")
            print(f"   Value: {anomaly_reading_result['reading']['reading_value']}")

            # Use early detection API
            print("   Running early anomaly detection...")
            anomaly_result = await self.detect_anomaly(reading_id)
            if anomaly_result:
                print(f"   Anomaly detected: {anomaly_result.get('is_anomaly', False)}")
                if anomaly_result.get('is_anomaly'):
                    print(f"   ANOMALY DETECTED!")
                    print(f"   Severity: {anomaly_result.get('severity', 'N/A')}")
                    print(f"   Score: {anomaly_result.get('anomaly_score', 'N/A')}")
                    print(f"   Method: {anomaly_result.get('contributing_factors', {}).get('detection_method', 'N/A')}")
                    print(f"   Factors: {json.dumps(anomaly_result.get('contributing_factors', {}), indent=2)}")
                else:
                    print("   No anomaly detected by early detection")
            else:
                print("   Early detection API call failed")
        else:
            print("   Failed to create anomaly reading")

    async def test_electricity_readings(self):
        """Test electricity meter readings with baseline and anomaly"""
        print("\n=== TESTING ELECTRICITY METER ANOMALY DETECTION ===")
        print("-" * 50)

        # Baseline reading (normal consumption)
        baseline_reading = {
            "utility_type": "electricity",
            "reading_value": 15432,  # Normal reading
            "is_manual": True,
            "notes": "Baseline reading for anomaly testing"
        }

        # Anomaly reading (unusual consumption pattern)
        anomaly_reading = {
            "utility_type": "electricity",
            "reading_value": 15632,  # Large increase (+200 kWh in short time)
            "is_manual": True,
            "notes": "Anomaly reading - significant spike in electricity usage"
        }

        print("1. Creating baseline electricity reading...")
        baseline_result = await self.create_reading(baseline_reading)

        if baseline_result:
            print(f"   Reading ID: {baseline_result['reading']['id']}")
            print(f"   Value: {baseline_result['reading']['reading_value']}")
            print(f"   Anomaly detected: {baseline_result.get('anomaly') is not None}")
            if baseline_result.get('anomaly'):
                anomaly = baseline_result['anomaly']
                print(f"   Anomaly score: {anomaly.get('anomaly_score', 'N/A')}")
                print(f"   Severity: {anomaly.get('severity', 'N/A')}")
        else:
            print("   Failed to create baseline reading")

        # Wait a bit to simulate time passage
        print("\n   Waiting 2 seconds...")
        await asyncio.sleep(2)

        print("2. Creating anomaly electricity reading...")
        anomaly_result = await self.create_reading(anomaly_reading)

        if anomaly_result:
            print(f"   Reading ID: {anomaly_result['reading']['id']}")
            print(f"   Value: {anomaly_result['reading']['reading_value']}")
            print(f"   Anomaly detected: {anomaly_result.get('anomaly') is not None}")
            if anomaly_result.get('anomaly'):
                anomaly = anomaly_result['anomaly']
                print(f"   Anomaly score: {anomaly.get('anomaly_score', 'N/A')}")
                print(f"   Severity: {anomaly.get('severity', 'N/A')}")
                print(f"   Factors: {json.dumps(anomaly.get('contributing_factors', {}), indent=2)}")
            else:
                print("   No anomaly detected (may need more baseline data)")
        else:
            print("   Failed to create anomaly reading")

    async def check_server_status(self):
        """Check if the backend server is running"""
        try:
            response = await self.client.get(f"{self.base_url}/health")
            if response.status_code == 200:
                print("Backend server is running")
                return True
            else:
                print(f"Backend server responded with status: {response.status_code}")
                return False
        except Exception as e:
            print(f"Cannot connect to backend server: {e}")
            print("Make sure the backend is running on http://localhost:8000")
            return False

    async def close(self):
        """Clean up HTTP client"""
        await self.client.aclose()


async def main():
    """Main test function"""
    print("Anomaly Detection Testing")
    print("=" * 50)
    print("Account: test@gmail.com")
    print("Testing anomaly detection with:")
    print("1. Baseline reading (normal consumption)")
    print("2. Anomaly reading (MASSIVE spike)")
    print()

    # Initialize tester
    tester = AnomalyTester(API_BASE_URL)

    try:
        # Login with test account (this will test if server is running)
        print("Logging in...")
        login_ok = await tester.login(TEST_EMAIL, TEST_PASSWORD)
        if not login_ok:
            print("Login failed. Make sure:")
            print("1. The backend server is running")
            print("2. The account test@gmail.com exists")
            return

        # Run water test only (focused test)
        await tester.test_water_readings()

        print("\n=== TEST SUMMARY ===")
        print("Water anomaly detection test completed.")
        print("Check the output above for anomaly detection results.")
        print("The massive spike (+1254.445 units) should trigger anomaly detection.")

    except Exception as e:
        print(f"\nTest failed with error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await tester.close()


if __name__ == "__main__":
    print("Starting anomaly detection tests...")
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"\nTest failed: {e}")