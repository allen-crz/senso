#!/usr/bin/env python3
"""
USER TEST 2: Anomaly Detection Testing
Account: test2@gmail.com / Test@123

This script tests the anomaly detection system by introducing anomalous readings.
Run this AFTER user_test_1_meter_readings.py to have baseline data.
"""

import asyncio
import sys
import os
import json
from typing import Optional

sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

import httpx
from loguru import logger

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
TEST_EMAIL = "test2@gmail.com"
TEST_PASSWORD = "Test@123"

class AnomalyDetectionTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.auth_token: Optional[str] = None
        self.client = httpx.AsyncClient(timeout=30.0)

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
                logger.info(f"✓ Login successful for {email}")
                return True
            else:
                logger.error(f"✗ Login failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            logger.error(f"✗ Login error: {e}")
            return False

    async def get_latest_reading(self, utility_type: str) -> dict:
        """Get the latest reading for a utility type"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}

        try:
            response = await self.client.get(
                f"{self.base_url}/readings/latest/{utility_type}",
                headers=headers
            )

            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"⚠ No latest reading found for {utility_type}")
                return None
        except Exception as e:
            logger.error(f"✗ Error getting latest reading: {e}")
            return None

    async def create_reading(self, utility_type: str, reading_value: float, notes: str = "") -> dict:
        """Create a meter reading"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}

        reading_data = {
            "utility_type": utility_type,
            "reading_value": reading_value,
            "is_manual": True,
            "notes": notes
        }

        try:
            response = await self.client.post(
                f"{self.base_url}/readings/",
                json=reading_data,
                headers=headers
            )

            if response.status_code == 201:
                result = response.json()
                return result
            else:
                logger.error(f"✗ Error creating reading: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            logger.error(f"✗ Request failed: {e}")
            return None

    async def detect_anomaly(self, reading_id: str) -> dict:
        """Manually trigger anomaly detection"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}

        try:
            response = await self.client.post(
                f"{self.base_url}/anomaly-detection/detect",
                json={"reading_id": reading_id},
                headers=headers
            )

            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"⚠ Anomaly detection returned: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"✗ Anomaly detection failed: {e}")
            return None

    async def get_user_anomalies(self, utility_type: str) -> list:
        """Get all detected anomalies for user"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}

        try:
            response = await self.client.get(
                f"{self.base_url}/anomaly-detection/user-anomalies/{utility_type}",
                params={"limit": 50},
                headers=headers
            )

            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"⚠ Error getting anomalies: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"✗ Error getting anomalies: {e}")
            return []

    def print_anomaly_details(self, anomaly: dict, reading_value: float, previous_value: float):
        """Print detailed anomaly information"""
        if not anomaly:
            logger.info("  ℹ No anomaly detected")
            return

        logger.warning("  ⚠ ANOMALY DETECTED!")
        logger.info(f"  Severity: {anomaly.get('severity', 'N/A')}")
        anomaly_score = anomaly.get('anomaly_score', 'N/A')
        if isinstance(anomaly_score, (int, float)):
            logger.info(f"  Score: {anomaly_score:.4f}")
        else:
            logger.info(f"  Score: {anomaly_score}")
        logger.info(f"  Reading: {reading_value:.2f}")
        logger.info(f"  Previous: {previous_value:.2f}")
        logger.info(f"  Difference: {reading_value - previous_value:.2f}")

        if anomaly.get('contributing_factors'):
            factors = anomaly['contributing_factors']
            logger.info("  Contributing Factors:")
            for key, value in factors.items():
                logger.info(f"    - {key}: {value}")

        if anomaly.get('recommendations'):
            logger.info("  Recommendations:")
            for rec in anomaly['recommendations']:
                logger.info(f"    • {rec}")

    async def test_water_spike_anomaly(self):
        """Test water meter with sudden spike"""
        logger.info("\n" + "="*60)
        logger.info("TEST: WATER METER - SUDDEN SPIKE")
        logger.info("="*60)

        # Get latest reading
        latest = await self.get_latest_reading("water")
        if not latest:
            logger.error("✗ No baseline water readings found. Run user_test_1 first!")
            return

        baseline_value = float(latest['reading_value'])
        logger.info(f"Baseline: {baseline_value:.2f} m³")

        # Create anomaly: Massive spike (simulate water leak)
        spike_value = round(baseline_value + 250.0, 3)  # Huge increase!
        logger.info(f"\nCreating SPIKE reading: {spike_value:.2f} m³ (Δ +250.0 m³)")

        result = await self.create_reading(
            utility_type="water",
            reading_value=spike_value,
            notes="TEST: Simulated water leak - massive spike"
        )

        if result:
            reading_id = result['reading']['id']
            logger.success(f"✓ Reading created: ID {reading_id}")

            # Check for automatic anomaly detection
            if result.get('anomaly'):
                logger.info("\n🔍 Automatic Anomaly Detection:")
                self.print_anomaly_details(result['anomaly'], spike_value, baseline_value)
            else:
                # Manually trigger detection
                logger.info("\n🔍 Triggering Manual Anomaly Detection...")
                anomaly = await self.detect_anomaly(reading_id)
                self.print_anomaly_details(anomaly, spike_value, baseline_value)

    async def test_water_rollback_anomaly(self):
        """Test water meter with rollback (reading goes backward)"""
        logger.info("\n" + "="*60)
        logger.info("TEST: WATER METER - ROLLBACK")
        logger.info("="*60)

        # Get latest reading
        latest = await self.get_latest_reading("water")
        if not latest:
            logger.error("✗ No baseline water readings found.")
            return

        baseline_value = float(latest['reading_value'])
        logger.info(f"Baseline: {baseline_value:.2f} m³")

        # Create anomaly: Rollback (reading goes backward)
        rollback_value = round(baseline_value - 50.0, 3)
        logger.info(f"\nCreating ROLLBACK reading: {rollback_value:.2f} m³ (Δ -50.0 m³)")

        result = await self.create_reading(
            utility_type="water",
            reading_value=rollback_value,
            notes="TEST: Simulated meter rollback/reset"
        )

        if result:
            reading_id = result['reading']['id']
            logger.success(f"✓ Reading created: ID {reading_id}")

            if result.get('anomaly'):
                logger.info("\n🔍 Automatic Anomaly Detection:")
                self.print_anomaly_details(result['anomaly'], rollback_value, baseline_value)
            else:
                logger.info("\n🔍 Triggering Manual Anomaly Detection...")
                anomaly = await self.detect_anomaly(reading_id)
                self.print_anomaly_details(anomaly, rollback_value, baseline_value)

    async def test_electricity_spike_anomaly(self):
        """Test electricity meter with sudden spike"""
        logger.info("\n" + "="*60)
        logger.info("TEST: ELECTRICITY METER - SUDDEN SPIKE")
        logger.info("="*60)

        # Get latest reading
        latest = await self.get_latest_reading("electricity")
        if not latest:
            logger.error("✗ No baseline electricity readings found. Run user_test_1 first!")
            return

        baseline_value = float(latest['reading_value'])
        logger.info(f"Baseline: {baseline_value:.2f} kWh")

        # Create anomaly: Large spike (simulate high usage)
        spike_value = round(baseline_value + 150.0, 3)
        logger.info(f"\nCreating SPIKE reading: {spike_value:.2f} kWh (Δ +150.0 kWh)")

        result = await self.create_reading(
            utility_type="electricity",
            reading_value=spike_value,
            notes="TEST: Simulated high electricity usage"
        )

        if result:
            reading_id = result['reading']['id']
            logger.success(f"✓ Reading created: ID {reading_id}")

            if result.get('anomaly'):
                logger.info("\n🔍 Automatic Anomaly Detection:")
                self.print_anomaly_details(result['anomaly'], spike_value, baseline_value)
            else:
                logger.info("\n🔍 Triggering Manual Anomaly Detection...")
                anomaly = await self.detect_anomaly(reading_id)
                self.print_anomaly_details(anomaly, spike_value, baseline_value)

    async def test_normal_reading_after_anomaly(self, utility_type: str):
        """Test that normal readings after anomaly are not flagged"""
        logger.info("\n" + "="*60)
        logger.info(f"TEST: {utility_type.upper()} - NORMAL READING AFTER ANOMALY")
        logger.info("="*60)

        # Get latest reading
        latest = await self.get_latest_reading(utility_type)
        if not latest:
            return

        baseline_value = float(latest['reading_value'])

        # Normal consumption based on utility type
        normal_increase = 12.5 if utility_type == "water" else 25.0
        normal_value = round(baseline_value + normal_increase, 3)

        logger.info(f"Baseline: {baseline_value:.2f}")
        logger.info(f"Creating NORMAL reading: {normal_value:.2f} (Δ +{normal_increase:.2f})")

        result = await self.create_reading(
            utility_type=utility_type,
            reading_value=normal_value,
            notes=f"TEST: Normal {utility_type} consumption after anomaly"
        )

        if result:
            reading_id = result['reading']['id']
            logger.success(f"✓ Reading created: ID {reading_id}")

            if result.get('anomaly'):
                logger.warning("⚠ Anomaly detected on normal reading (possible false positive)")
                self.print_anomaly_details(result['anomaly'], normal_value, baseline_value)
            else:
                logger.success("✓ No anomaly detected (expected for normal reading)")

    async def display_anomaly_summary(self):
        """Display summary of all detected anomalies"""
        logger.info("\n" + "="*60)
        logger.info("ANOMALY DETECTION SUMMARY")
        logger.info("="*60)

        for utility_type in ["water", "electricity"]:
            anomalies = await self.get_user_anomalies(utility_type)
            logger.info(f"\n{utility_type.upper()} Anomalies: {len(anomalies)} detected")

            if anomalies:
                for i, anomaly in enumerate(anomalies[:5], 1):
                    logger.info(f"\n  {i}. ID: {anomaly.get('id', 'N/A')[:8]}...")
                    logger.info(f"     Severity: {anomaly.get('severity', 'N/A')}")
                    anomaly_score = anomaly.get('anomaly_score', 0)
                    if isinstance(anomaly_score, (int, float)):
                        logger.info(f"     Score: {anomaly_score:.4f}")
                    else:
                        logger.info(f"     Score: {anomaly_score}")
                    logger.info(f"     Reading: {anomaly.get('reading_value', 'N/A')}")

    async def close(self):
        """Clean up"""
        await self.client.aclose()


async def main():
    """Main test execution"""
    logger.info("="*60)
    logger.info("USER TEST 2: ANOMALY DETECTION")
    logger.info("="*60)
    logger.info(f"Account: {TEST_EMAIL}")
    logger.info(f"Purpose: Test anomaly detection with various scenarios")
    logger.info("")

    tester = AnomalyDetectionTester(API_BASE_URL)

    try:
        # Login
        logger.info("Step 1: Authenticating...")
        if not await tester.login(TEST_EMAIL, TEST_PASSWORD):
            logger.error("✗ Authentication failed. Exiting.")
            return

        # Test scenarios
        logger.info("\nStep 2: Testing Water Anomalies...")
        await tester.test_water_spike_anomaly()
        await asyncio.sleep(2)
        await tester.test_water_rollback_anomaly()
        await asyncio.sleep(2)

        logger.info("\nStep 3: Testing Electricity Anomalies...")
        await tester.test_electricity_spike_anomaly()
        await asyncio.sleep(2)

        logger.info("\nStep 4: Testing Normal Readings...")
        await tester.test_normal_reading_after_anomaly("water")
        await asyncio.sleep(2)
        await tester.test_normal_reading_after_anomaly("electricity")

        # Summary
        await tester.display_anomaly_summary()

        logger.info("\n" + "="*60)
        logger.success("✓ TEST 2 COMPLETED SUCCESSFULLY")
        logger.info("="*60)
        logger.info("Review the anomaly detection results above.")
        logger.info("Expected: Spikes and rollbacks should be detected.")
        logger.info("          Normal readings should NOT be flagged.")

    except Exception as e:
        logger.error(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await tester.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.warning("\n⚠ Test interrupted by user")
    except Exception as e:
        logger.error(f"\n✗ Test failed: {e}")
