#!/usr/bin/env python3
"""
USER TEST 3: Complete End-to-End Simulation
Account: test2@gmail.com / Test@123

This script runs a complete simulation combining:
1. Baseline meter readings establishment
2. Normal usage patterns
3. Anomaly injection and detection
4. Data validation and reporting

This is a comprehensive test that can be run standalone.
"""

import asyncio
import sys
import os
import json
from typing import Optional, Dict, List
from datetime import datetime

sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

import httpx
from loguru import logger

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
TEST_EMAIL = "test2@gmail.com"
TEST_PASSWORD = "Test@123"

class CompleteSimulator:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.auth_token: Optional[str] = None
        self.client = httpx.AsyncClient(timeout=30.0)
        self.test_results: Dict = {
            "readings_created": 0,
            "anomalies_detected": 0,
            "false_positives": 0,
            "true_negatives": 0,
            "errors": []
        }

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
                logger.error(f"✗ Login failed: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"✗ Login error: {e}")
            return False

    async def create_reading(self, utility_type: str, reading_value: float,
                           notes: str = "", expected_anomaly: bool = False) -> Dict:
        """Create a meter reading and track results"""
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
                self.test_results["readings_created"] += 1

                # Check anomaly detection
                has_anomaly = result.get('anomaly') is not None

                if has_anomaly and expected_anomaly:
                    self.test_results["anomalies_detected"] += 1
                    logger.success(f"✓ Expected anomaly detected")
                elif has_anomaly and not expected_anomaly:
                    self.test_results["false_positives"] += 1
                    logger.warning(f"⚠ False positive: Anomaly on normal reading")
                elif not has_anomaly and not expected_anomaly:
                    self.test_results["true_negatives"] += 1
                    logger.info(f"✓ Normal reading - no anomaly (expected)")

                return result
            else:
                error_msg = f"Error creating reading: {response.status_code}"
                self.test_results["errors"].append(error_msg)
                logger.error(f"✗ {error_msg}")
                return None
        except Exception as e:
            error_msg = f"Request failed: {str(e)}"
            self.test_results["errors"].append(error_msg)
            logger.error(f"✗ {error_msg}")
            return None

    async def get_latest_reading(self, utility_type: str) -> Optional[Dict]:
        """Get latest reading for a utility type"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}

        try:
            response = await self.client.get(
                f"{self.base_url}/readings/latest/{utility_type}",
                headers=headers
            )

            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            logger.error(f"✗ Error getting latest reading: {e}")
            return None

    async def get_user_anomalies(self, utility_type: str) -> List[Dict]:
        """Get all anomalies for utility type"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}

        try:
            response = await self.client.get(
                f"{self.base_url}/anomaly-detection/user-anomalies/{utility_type}",
                params={"limit": 100},
                headers=headers
            )

            if response.status_code == 200:
                return response.json()
            return []
        except Exception as e:
            logger.error(f"✗ Error getting anomalies: {e}")
            return []

    async def get_consumption_stats(self, utility_type: str) -> Optional[Dict]:
        """Get consumption statistics"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}

        try:
            response = await self.client.get(
                f"{self.base_url}/anomaly-detection/consumption-stats/{utility_type}",
                params={"days": 30},
                headers=headers
            )

            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            logger.warning(f"⚠ Stats unavailable: {e}")
            return None

    async def phase_1_baseline(self):
        """Phase 1: Establish baseline readings"""
        logger.info("\n" + "="*70)
        logger.info("PHASE 1: ESTABLISHING BASELINE READINGS")
        logger.info("="*70)

        # Water baseline (5 readings)
        logger.info("\n📊 Creating water baseline...")
        water_base = 1000.0
        water_consumption = [12.5, 13.2, 11.8, 14.0, 12.3]

        for i, consumption in enumerate(water_consumption, 1):
            water_base = round(water_base + consumption, 3)
            await self.create_reading(
                utility_type="water",
                reading_value=water_base,
                notes=f"Baseline day {i}",
                expected_anomaly=False
            )
            await asyncio.sleep(0.5)

        logger.success(f"✓ Water baseline complete: {len(water_consumption)} readings")

        # Electricity baseline (5 readings)
        logger.info("\n📊 Creating electricity baseline...")
        elec_base = 5000.0
        elec_consumption = [25.3, 28.7, 24.5, 26.8, 27.4]

        for i, consumption in enumerate(elec_consumption, 1):
            elec_base = round(elec_base + consumption, 3)
            await self.create_reading(
                utility_type="electricity",
                reading_value=elec_base,
                notes=f"Baseline day {i}",
                expected_anomaly=False
            )
            await asyncio.sleep(0.5)

        logger.success(f"✓ Electricity baseline complete: {len(elec_consumption)} readings")

    async def phase_2_normal_usage(self):
        """Phase 2: Normal usage patterns"""
        logger.info("\n" + "="*70)
        logger.info("PHASE 2: NORMAL USAGE PATTERNS")
        logger.info("="*70)

        # Get latest readings
        water_latest = await self.get_latest_reading("water")
        elec_latest = await self.get_latest_reading("electricity")

        if not water_latest or not elec_latest:
            logger.error("✗ Cannot proceed without baseline readings")
            return

        # Normal water readings
        logger.info("\n💧 Creating normal water readings...")
        water_base = float(water_latest['reading_value'])
        for i in range(3):
            water_base = round(water_base + 12.0, 3)  # Normal daily consumption
            await self.create_reading(
                utility_type="water",
                reading_value=water_base,
                notes=f"Normal usage day {i+1}",
                expected_anomaly=False
            )
            await asyncio.sleep(0.5)

        # Normal electricity readings
        logger.info("\n⚡ Creating normal electricity readings...")
        elec_base = float(elec_latest['reading_value'])
        for i in range(3):
            elec_base = round(elec_base + 26.0, 3)  # Normal daily consumption
            await self.create_reading(
                utility_type="electricity",
                reading_value=elec_base,
                notes=f"Normal usage day {i+1}",
                expected_anomaly=False
            )
            await asyncio.sleep(0.5)

        logger.success("✓ Normal usage patterns established")

    async def phase_3_anomaly_injection(self):
        """Phase 3: Inject anomalies"""
        logger.info("\n" + "="*70)
        logger.info("PHASE 3: ANOMALY INJECTION AND DETECTION")
        logger.info("="*70)

        # Get latest readings
        water_latest = await self.get_latest_reading("water")
        elec_latest = await self.get_latest_reading("electricity")

        # Test 1: Water spike (leak)
        logger.info("\n🔴 TEST 1: Water Spike (Simulated Leak)")
        water_spike = round(float(water_latest['reading_value']) + 200.0, 3)
        result = await self.create_reading(
            utility_type="water",
            reading_value=water_spike,
            notes="ANOMALY: Massive water spike - possible leak",
            expected_anomaly=True
        )
        await asyncio.sleep(1)

        # Test 2: Water rollback
        logger.info("\n🔴 TEST 2: Water Rollback (Meter Reset)")
        water_rollback = round(water_spike - 100.0, 3)
        await self.create_reading(
            utility_type="water",
            reading_value=water_rollback,
            notes="ANOMALY: Water meter rollback",
            expected_anomaly=True
        )
        await asyncio.sleep(1)

        # Test 3: Electricity spike
        logger.info("\n🔴 TEST 3: Electricity Spike (High Usage)")
        elec_spike = round(float(elec_latest['reading_value']) + 150.0, 3)
        await self.create_reading(
            utility_type="electricity",
            reading_value=elec_spike,
            notes="ANOMALY: High electricity usage spike",
            expected_anomaly=True
        )
        await asyncio.sleep(1)

        # Test 4: Return to normal (water)
        logger.info("\n🟢 TEST 4: Return to Normal (Water)")
        water_normal = round(water_rollback + 13.0, 3)
        await self.create_reading(
            utility_type="water",
            reading_value=water_normal,
            notes="Normal reading after anomalies",
            expected_anomaly=False
        )
        await asyncio.sleep(1)

        # Test 5: Return to normal (electricity)
        logger.info("\n🟢 TEST 5: Return to Normal (Electricity)")
        elec_normal = round(elec_spike + 25.0, 3)
        await self.create_reading(
            utility_type="electricity",
            reading_value=elec_normal,
            notes="Normal reading after anomalies",
            expected_anomaly=False
        )

        logger.success("✓ Anomaly injection complete")

    async def phase_4_validation(self):
        """Phase 4: Validate results"""
        logger.info("\n" + "="*70)
        logger.info("PHASE 4: VALIDATION AND REPORTING")
        logger.info("="*70)

        # Get anomalies
        water_anomalies = await self.get_user_anomalies("water")
        elec_anomalies = await self.get_user_anomalies("electricity")

        logger.info(f"\n📊 Anomalies Detected:")
        logger.info(f"  Water: {len(water_anomalies)} anomalies")
        logger.info(f"  Electricity: {len(elec_anomalies)} anomalies")

        # Display recent anomalies
        if water_anomalies:
            logger.info(f"\n💧 Recent Water Anomalies:")
            for i, anomaly in enumerate(water_anomalies[:3], 1):
                logger.info(f"  {i}. Severity: {anomaly.get('severity', 'N/A')}")
                logger.info(f"     Score: {anomaly.get('anomaly_score', 0):.4f}")
                logger.info(f"     Value: {anomaly.get('reading_value', 'N/A')}")

        if elec_anomalies:
            logger.info(f"\n⚡ Recent Electricity Anomalies:")
            for i, anomaly in enumerate(elec_anomalies[:3], 1):
                logger.info(f"  {i}. Severity: {anomaly.get('severity', 'N/A')}")
                logger.info(f"     Score: {anomaly.get('anomaly_score', 0):.4f}")
                logger.info(f"     Value: {anomaly.get('reading_value', 'N/A')}")

        # Get consumption stats
        logger.info(f"\n📈 Consumption Statistics:")

        water_stats = await self.get_consumption_stats("water")
        if water_stats:
            logger.info(f"\n  Water:")
            logger.info(f"    Daily Average: {water_stats.get('daily_avg', 0):.2f} m³")
            logger.info(f"    Daily Max: {water_stats.get('daily_max', 0):.2f} m³")
            logger.info(f"    Daily Min: {water_stats.get('daily_min', 0):.2f} m³")
            logger.info(f"    Trend: {water_stats.get('trend', 'N/A')}")

        elec_stats = await self.get_consumption_stats("electricity")
        if elec_stats:
            logger.info(f"\n  Electricity:")
            logger.info(f"    Daily Average: {elec_stats.get('daily_avg', 0):.2f} kWh")
            logger.info(f"    Daily Max: {elec_stats.get('daily_max', 0):.2f} kWh")
            logger.info(f"    Daily Min: {elec_stats.get('daily_min', 0):.2f} kWh")
            logger.info(f"    Trend: {elec_stats.get('trend', 'N/A')}")

    def print_final_report(self):
        """Print comprehensive test report"""
        logger.info("\n" + "="*70)
        logger.info("FINAL TEST REPORT")
        logger.info("="*70)

        logger.info(f"\n📊 Test Statistics:")
        logger.info(f"  Total Readings Created: {self.test_results['readings_created']}")
        logger.info(f"  Anomalies Detected: {self.test_results['anomalies_detected']}")
        logger.info(f"  True Negatives: {self.test_results['true_negatives']}")
        logger.info(f"  False Positives: {self.test_results['false_positives']}")
        logger.info(f"  Errors: {len(self.test_results['errors'])}")

        # Calculate accuracy
        total_tests = (self.test_results['anomalies_detected'] +
                      self.test_results['true_negatives'] +
                      self.test_results['false_positives'])

        if total_tests > 0:
            accuracy = ((self.test_results['anomalies_detected'] +
                        self.test_results['true_negatives']) / total_tests) * 100
            logger.info(f"\n✨ Detection Accuracy: {accuracy:.1f}%")

        if self.test_results['errors']:
            logger.warning(f"\n⚠ Errors Encountered:")
            for error in self.test_results['errors'][:5]:
                logger.warning(f"  • {error}")

        # Overall status
        if self.test_results['anomalies_detected'] > 0 and self.test_results['false_positives'] == 0:
            logger.success("\n✓ ALL TESTS PASSED - System is working correctly!")
        elif self.test_results['false_positives'] > 2:
            logger.warning("\n⚠ WARNING - High false positive rate detected")
        else:
            logger.info("\n✓ Tests completed - Review results above")

    async def close(self):
        """Clean up"""
        await self.client.aclose()


async def main():
    """Main test execution"""
    logger.info("="*70)
    logger.info("USER TEST 3: COMPLETE END-TO-END SIMULATION")
    logger.info("="*70)
    logger.info(f"Account: {TEST_EMAIL}")
    logger.info(f"Test Start: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("")

    simulator = CompleteSimulator(API_BASE_URL)

    try:
        # Login
        logger.info("🔐 Authenticating...")
        if not await simulator.login(TEST_EMAIL, TEST_PASSWORD):
            logger.error("✗ Authentication failed. Exiting.")
            return

        # Run all phases
        await simulator.phase_1_baseline()
        await asyncio.sleep(2)

        await simulator.phase_2_normal_usage()
        await asyncio.sleep(2)

        await simulator.phase_3_anomaly_injection()
        await asyncio.sleep(2)

        await simulator.phase_4_validation()

        # Final report
        simulator.print_final_report()

        logger.info("\n" + "="*70)
        logger.success("✓ COMPLETE SIMULATION FINISHED")
        logger.info("="*70)
        logger.info(f"Test End: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    except Exception as e:
        logger.error(f"\n✗ Simulation failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await simulator.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.warning("\n⚠ Simulation interrupted by user")
    except Exception as e:
        logger.error(f"\n✗ Simulation failed: {e}")
