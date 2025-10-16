#!/usr/bin/env python3
"""
USER TEST 1: Meter Reading Simulation
Account: test2@gmail.com / Test@123

This script simulates realistic meter readings for both water and electricity.
It creates baseline readings and progressive readings to establish normal patterns.
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta
from typing import Optional

sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

import httpx
from loguru import logger

# Configuration
API_BASE_URL = "https://allencrz-senso-api.hf.space/api/v1"
TEST_EMAIL = "test@gmail.com"
TEST_PASSWORD = "Test@123"

class MeterReadingSimulator:
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

    async def create_reading(self, utility_type: str, reading_value: float, notes: str = "", capture_timestamp: Optional[datetime] = None) -> dict:
        """Create a meter reading with optional custom capture timestamp"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}

        reading_data = {
            "utility_type": utility_type,
            "reading_value": reading_value,
            "is_manual": True,
            "notes": notes
        }

        # Add custom capture timestamp if provided (for backfilling historical data)
        if capture_timestamp:
            reading_data["capture_timestamp"] = capture_timestamp.isoformat()
            logger.debug(f"Sending capture_timestamp: {reading_data['capture_timestamp']}")

        logger.debug(f"Sending reading data: {reading_data}")

        try:
            response = await self.client.post(
                f"{self.base_url}/readings/",
                json=reading_data,
                headers=headers
            )

            if response.status_code == 201:
                result = response.json()
                timestamp_info = f" at {capture_timestamp.strftime('%Y-%m-%d')}" if capture_timestamp else ""
                logger.success(f"✓ Created {utility_type} reading: {reading_value}{timestamp_info}")

                # Debug: Print the actual capture_timestamp returned by API
                if 'reading' in result:
                    api_capture = result['reading'].get('capture_timestamp')
                    logger.info(f"  API returned capture_timestamp: {api_capture}")

                return result
            else:
                logger.error(f"✗ Error creating reading: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            logger.error(f"✗ Request failed: {e}")
            return None

    async def get_readings(self, utility_type: str, limit: int = 10) -> list:
        """Get recent readings"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}

        try:
            response = await self.client.get(
                f"{self.base_url}/readings/",
                params={"utility_type": utility_type, "limit": limit},
                headers=headers
            )

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"✗ Error getting readings: {response.status_code}")
                return []
        except Exception as e:
            logger.error(f"✗ Request failed: {e}")
            return []

    async def simulate_water_readings(self):
        """Simulate realistic water meter readings over time with custom dates"""
        logger.info("\n" + "="*60)
        logger.info("SIMULATING WATER METER READINGS")
        logger.info("="*60)

        # Simulate 10 days of water readings from September 1-10, 2025
        base_reading = 1000.0
        daily_consumption = [12.5, 11.8, 13.2, 12.0, 14.1, 11.5, 13.8, 12.3, 11.9, 13.5]

        for day, consumption in enumerate(daily_consumption, 1):
            current_reading = round(base_reading + consumption, 3)

            # Create reading for September 1-10, 2025
            reading_date = datetime(2025, 9, day, 8, 0, 0)  # 8:00 AM each day

            result = await self.create_reading(
                utility_type="water",
                reading_value=current_reading,
                notes=f"September {day}, 2025 - Normal consumption pattern",
                capture_timestamp=reading_date
            )

            if result:
                logger.info(f"  Sep {day}, 2025: {current_reading:.2f} m³ (Δ {consumption:.2f} m³)")

            base_reading = current_reading
            await asyncio.sleep(1)  # Space out requests

        logger.success(f"✓ Water readings simulation complete: 10 readings created (Sep 1-10, 2025)")
        logger.info(f"  Total consumption: {sum(daily_consumption):.2f} m³")
        logger.info(f"  Average daily: {sum(daily_consumption)/len(daily_consumption):.2f} m³")

        return base_reading

    async def simulate_electricity_readings(self):
        """Simulate realistic electricity meter readings over time with custom dates"""
        logger.info("\n" + "="*60)
        logger.info("SIMULATING ELECTRICITY METER READINGS")
        logger.info("="*60)

        # Simulate 10 days of electricity readings with normal consumption (~20-30 kWh per day)
        # Start from 10 days ago
        base_reading = 1000.0
        daily_consumption = [25.3, 28.7, 24.5, 26.8, 29.2, 23.9, 27.4, 25.8, 28.1, 26.5]

        for day, consumption in enumerate(daily_consumption, 1):
            current_reading = round(base_reading + consumption, 3)

            # Create reading with custom timestamp (10 days ago + day)
            reading_date = datetime.now() - timedelta(days=10-day)

            result = await self.create_reading(
                utility_type="electricity",
                reading_value=current_reading,
                notes=f"Day {day} - Normal consumption pattern",
                capture_timestamp=reading_date
            )

            if result:
                logger.info(f"  Day {day}: {current_reading:.2f} kWh (Δ {consumption:.2f} kWh)")

            base_reading = current_reading
            await asyncio.sleep(1)  # Space out requests

        logger.success(f"✓ Electricity readings simulation complete: 10 readings created")
        logger.info(f"  Total consumption: {sum(daily_consumption):.2f} kWh")
        logger.info(f"  Average daily: {sum(daily_consumption)/len(daily_consumption):.2f} kWh")

        return base_reading

    async def display_summary(self):
        """Display summary of all readings"""
        logger.info("\n" + "="*60)
        logger.info("READING SUMMARY")
        logger.info("="*60)

        # Get water readings
        water_readings = await self.get_readings("water", limit=20)
        logger.info(f"\nWater Readings: {len(water_readings)} total")
        if water_readings:
            for i, reading in enumerate(water_readings[-5:], 1):
                value = float(reading['reading_value'])
                logger.info(f"  {i}. {value:.2f} m³ - {reading['notes']}")

        # Get electricity readings
        electricity_readings = await self.get_readings("electricity", limit=20)
        logger.info(f"\nElectricity Readings: {len(electricity_readings)} total")
        if electricity_readings:
            for i, reading in enumerate(electricity_readings[-5:], 1):
                value = float(reading['reading_value'])
                logger.info(f"  {i}. {value:.2f} kWh - {reading['notes']}")

    async def close(self):
        """Clean up"""
        await self.client.aclose()


async def main():
    """Main test execution"""
    logger.info("="*60)
    logger.info("USER TEST 1: METER READING SIMULATION")
    logger.info("="*60)
    logger.info(f"Account: {TEST_EMAIL}")
    logger.info(f"Purpose: Establish baseline meter readings for both utilities")
    logger.info("")

    simulator = MeterReadingSimulator(API_BASE_URL)

    try:
        # Login
        logger.info("Step 1: Authenticating...")
        if not await simulator.login(TEST_EMAIL, TEST_PASSWORD):
            logger.error("✗ Authentication failed. Exiting.")
            return

        # Simulate water readings
        logger.info("\nStep 2: Creating water meter readings for Sep 1-10, 2025...")
        final_water = await simulator.simulate_water_readings()

        # # Simulate electricity readings (commented out for now)
        # logger.info("\nStep 3: Creating electricity meter readings...")
        # final_electricity = await simulator.simulate_electricity_readings()

        # Display summary
        await simulator.display_summary()

        logger.info("\n" + "="*60)
        logger.success("✓ TEST 1 COMPLETED SUCCESSFULLY")
        logger.info("="*60)
        logger.info("Water readings for September 1-10, 2025 have been created")
        logger.info(f"  Final Water Reading: {final_water:.2f} m³")
        # logger.info(f"  Final Electricity Reading: {final_electricity:.2f} kWh")

    except Exception as e:
        logger.error(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await simulator.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.warning("\n⚠ Test interrupted by user")
    except Exception as e:
        logger.error(f"\n✗ Test failed: {e}")
