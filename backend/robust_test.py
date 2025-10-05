"""
Comprehensive Robustness Testing Suite for Senso App
Tests: Meter Reading Insertion -> Anomaly Detection -> Forecast -> Reset
"""

import requests
import json
from datetime import datetime, timedelta
import time

# Configuration
BASE_URL = "http://localhost:8000"
TEST_USER_ID = "test_user_001"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_header(text):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}{text.center(60)}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.YELLOW}ℹ {text}{Colors.END}")

# ==================== TEST 1: WATER METER READING INSERTION ====================
def test_water_reading_insertion():
    print_header("TEST 1: WATER METER READING INSERTION")

    # Test Case 1: Normal reading
    print_info("Test 1.1: Insert normal water reading")
    reading_data = {
        "user_id": TEST_USER_ID,
        "reading_value": 150.5,
        "timestamp": datetime.now().isoformat(),
        "image_url": "test_water_meter.jpg",
        "confidence": 0.95
    }

    try:
        response = requests.post(f"{BASE_URL}/api/water/readings", json=reading_data)
        if response.status_code == 200:
            print_success(f"Normal reading inserted: {reading_data['reading_value']} m³")
            print(f"   Response: {response.json()}")
        else:
            print_error(f"Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

    time.sleep(1)

    # Test Case 2: High consumption reading (should trigger anomaly)
    print_info("Test 1.2: Insert high consumption reading (anomaly trigger)")
    anomaly_reading = {
        "user_id": TEST_USER_ID,
        "reading_value": 300.0,  # 150 m³ jump - should trigger anomaly
        "timestamp": (datetime.now() + timedelta(days=1)).isoformat(),
        "image_url": "test_water_meter_high.jpg",
        "confidence": 0.92
    }

    try:
        response = requests.post(f"{BASE_URL}/api/water/readings", json=anomaly_reading)
        if response.status_code == 200:
            print_success(f"Anomaly reading inserted: {anomaly_reading['reading_value']} m³")
            print(f"   Response: {response.json()}")
        else:
            print_error(f"Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

    time.sleep(1)

    # Test Case 3: Low confidence reading
    print_info("Test 1.3: Insert low confidence reading")
    low_conf_reading = {
        "user_id": TEST_USER_ID,
        "reading_value": 305.0,
        "timestamp": (datetime.now() + timedelta(days=2)).isoformat(),
        "image_url": "test_water_meter_blur.jpg",
        "confidence": 0.45
    }

    try:
        response = requests.post(f"{BASE_URL}/api/water/readings", json=low_conf_reading)
        if response.status_code == 200:
            print_success(f"Low confidence reading inserted: {low_conf_reading['reading_value']} m³ (conf: {low_conf_reading['confidence']})")
            print(f"   Response: {response.json()}")
        else:
            print_error(f"Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

# ==================== TEST 2: ELECTRICITY METER READING INSERTION ====================
def test_electricity_reading_insertion():
    print_header("TEST 2: ELECTRICITY METER READING INSERTION")

    # Test Case 1: Normal reading
    print_info("Test 2.1: Insert normal electricity reading")
    reading_data = {
        "user_id": TEST_USER_ID,
        "reading_value": 5000.0,
        "timestamp": datetime.now().isoformat(),
        "image_url": "test_elec_meter.jpg",
        "confidence": 0.97
    }

    try:
        response = requests.post(f"{BASE_URL}/api/electricity/readings", json=reading_data)
        if response.status_code == 200:
            print_success(f"Normal reading inserted: {reading_data['reading_value']} kWh")
            print(f"   Response: {response.json()}")
        else:
            print_error(f"Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

    time.sleep(1)

    # Test Case 2: High consumption reading (should trigger anomaly)
    print_info("Test 2.2: Insert high consumption reading (anomaly trigger)")
    anomaly_reading = {
        "user_id": TEST_USER_ID,
        "reading_value": 5800.0,  # 800 kWh jump in one day - should trigger anomaly
        "timestamp": (datetime.now() + timedelta(days=1)).isoformat(),
        "image_url": "test_elec_meter_high.jpg",
        "confidence": 0.94
    }

    try:
        response = requests.post(f"{BASE_URL}/api/electricity/readings", json=anomaly_reading)
        if response.status_code == 200:
            print_success(f"Anomaly reading inserted: {anomaly_reading['reading_value']} kWh")
            print(f"   Response: {response.json()}")
        else:
            print_error(f"Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

# ==================== TEST 3: ANOMALY DETECTION ====================
def test_anomaly_detection():
    print_header("TEST 3: ANOMALY DETECTION")

    # Test Case 1: Fetch water anomalies
    print_info("Test 3.1: Fetch water consumption anomalies")
    try:
        response = requests.get(f"{BASE_URL}/api/water/anomalies/{TEST_USER_ID}")
        if response.status_code == 200:
            anomalies = response.json()
            print_success(f"Found {len(anomalies)} water anomalies")
            for i, anomaly in enumerate(anomalies[:3], 1):
                print(f"   Anomaly {i}:")
                print(f"      - Type: {anomaly.get('anomaly_type')}")
                print(f"      - Severity: {anomaly.get('severity')}")
                print(f"      - Consumption: {anomaly.get('consumption_value')}")
                print(f"      - Recommendation: {anomaly.get('recommendation', 'N/A')[:80]}...")
        else:
            print_error(f"Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

    time.sleep(1)

    # Test Case 2: Fetch electricity anomalies
    print_info("Test 3.2: Fetch electricity consumption anomalies")
    try:
        response = requests.get(f"{BASE_URL}/api/electricity/anomalies/{TEST_USER_ID}")
        if response.status_code == 200:
            anomalies = response.json()
            print_success(f"Found {len(anomalies)} electricity anomalies")
            for i, anomaly in enumerate(anomalies[:3], 1):
                print(f"   Anomaly {i}:")
                print(f"      - Type: {anomaly.get('anomaly_type')}")
                print(f"      - Severity: {anomaly.get('severity')}")
                print(f"      - Consumption: {anomaly.get('consumption_value')}")
                print(f"      - Recommendation: {anomaly.get('recommendation', 'N/A')[:80]}...")
        else:
            print_error(f"Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

    time.sleep(1)

    # Test Case 3: Test anomaly recommendation engine
    print_info("Test 3.3: Test anomaly recommendation engine")
    try:
        response = requests.get(f"{BASE_URL}/api/anomalies/recommendations/{TEST_USER_ID}")
        if response.status_code == 200:
            recommendations = response.json()
            print_success(f"Generated recommendations")
            print(f"   Water recommendations: {len(recommendations.get('water', []))}")
            print(f"   Electricity recommendations: {len(recommendations.get('electricity', []))}")
        else:
            print_error(f"Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

# ==================== TEST 4: COST FORECASTING ====================
def test_cost_forecasting():
    print_header("TEST 4: COST FORECASTING")

    # Test Case 1: Water cost forecast
    print_info("Test 4.1: Generate water cost forecast")
    try:
        response = requests.get(f"{BASE_URL}/api/water/forecast/{TEST_USER_ID}")
        if response.status_code == 200:
            forecast = response.json()
            print_success("Water forecast generated")
            print(f"   Current period cost: ${forecast.get('current_period_cost', 0):.2f}")
            print(f"   Projected cost: ${forecast.get('projected_cost', 0):.2f}")
            print(f"   Days remaining: {forecast.get('days_remaining', 0)}")
            print(f"   Average daily consumption: {forecast.get('avg_daily_consumption', 0):.2f} m³")
        else:
            print_error(f"Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

    time.sleep(1)

    # Test Case 2: Electricity cost forecast
    print_info("Test 4.2: Generate electricity cost forecast")
    try:
        response = requests.get(f"{BASE_URL}/api/electricity/forecast/{TEST_USER_ID}")
        if response.status_code == 200:
            forecast = response.json()
            print_success("Electricity forecast generated")
            print(f"   Current period cost: ${forecast.get('current_period_cost', 0):.2f}")
            print(f"   Projected cost: ${forecast.get('projected_cost', 0):.2f}")
            print(f"   Days remaining: {forecast.get('days_remaining', 0)}")
            print(f"   Average daily consumption: {forecast.get('avg_daily_consumption', 0):.2f} kWh")
        else:
            print_error(f"Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

    time.sleep(1)

    # Test Case 3: Combined forecast
    print_info("Test 4.3: Generate combined utility forecast")
    try:
        response = requests.get(f"{BASE_URL}/api/forecast/combined/{TEST_USER_ID}")
        if response.status_code == 200:
            forecast = response.json()
            print_success("Combined forecast generated")
            print(f"   Total projected cost: ${forecast.get('total_projected_cost', 0):.2f}")
            print(f"   Water: ${forecast.get('water_projected', 0):.2f}")
            print(f"   Electricity: ${forecast.get('electricity_projected', 0):.2f}")
        else:
            print_error(f"Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

# ==================== TEST 5: FORECAST RESET ====================
def test_forecast_reset():
    print_header("TEST 5: FORECAST RESET")

    # Test Case 1: Reset water forecast
    print_info("Test 5.1: Reset water forecast data")
    try:
        response = requests.post(f"{BASE_URL}/api/water/forecast/reset/{TEST_USER_ID}")
        if response.status_code == 200:
            print_success("Water forecast reset successfully")
            print(f"   Response: {response.json()}")
        else:
            print_error(f"Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

    time.sleep(1)

    # Test Case 2: Reset electricity forecast
    print_info("Test 5.2: Reset electricity forecast data")
    try:
        response = requests.post(f"{BASE_URL}/api/electricity/forecast/reset/{TEST_USER_ID}")
        if response.status_code == 200:
            print_success("Electricity forecast reset successfully")
            print(f"   Response: {response.json()}")
        else:
            print_error(f"Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

    time.sleep(1)

    # Test Case 3: Verify forecast after reset
    print_info("Test 5.3: Verify forecasts after reset")
    try:
        water_response = requests.get(f"{BASE_URL}/api/water/forecast/{TEST_USER_ID}")
        elec_response = requests.get(f"{BASE_URL}/api/electricity/forecast/{TEST_USER_ID}")

        if water_response.status_code == 200 and elec_response.status_code == 200:
            print_success("Forecasts verified after reset")
            print(f"   Water forecast reset: {water_response.json()}")
            print(f"   Electricity forecast reset: {elec_response.json()}")
        else:
            print_error("Failed to verify forecasts after reset")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

# ==================== TEST 6: EDGE CASES ====================
def test_edge_cases():
    print_header("TEST 6: EDGE CASES & ERROR HANDLING")

    # Test Case 1: Invalid reading value
    print_info("Test 6.1: Insert invalid reading (negative value)")
    try:
        response = requests.post(f"{BASE_URL}/api/water/readings", json={
            "user_id": TEST_USER_ID,
            "reading_value": -10.0,
            "timestamp": datetime.now().isoformat()
        })
        if response.status_code == 400:
            print_success("Correctly rejected negative reading")
        else:
            print_error(f"Unexpected response: {response.status_code}")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

    time.sleep(1)

    # Test Case 2: Missing required fields
    print_info("Test 6.2: Insert reading with missing fields")
    try:
        response = requests.post(f"{BASE_URL}/api/water/readings", json={
            "user_id": TEST_USER_ID
        })
        if response.status_code == 400:
            print_success("Correctly rejected incomplete data")
        else:
            print_error(f"Unexpected response: {response.status_code}")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

    time.sleep(1)

    # Test Case 3: Non-existent user
    print_info("Test 6.3: Query data for non-existent user")
    try:
        response = requests.get(f"{BASE_URL}/api/water/forecast/nonexistent_user_999")
        if response.status_code in [404, 200]:
            print_success(f"Handled non-existent user correctly (status: {response.status_code})")
        else:
            print_error(f"Unexpected response: {response.status_code}")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

    time.sleep(1)

    # Test Case 4: Duplicate reading timestamp
    print_info("Test 6.4: Insert duplicate timestamp reading")
    timestamp = datetime.now().isoformat()
    try:
        # First insertion
        requests.post(f"{BASE_URL}/api/water/readings", json={
            "user_id": TEST_USER_ID,
            "reading_value": 100.0,
            "timestamp": timestamp
        })
        # Duplicate insertion
        response = requests.post(f"{BASE_URL}/api/water/readings", json={
            "user_id": TEST_USER_ID,
            "reading_value": 105.0,
            "timestamp": timestamp
        })
        if response.status_code in [200, 409]:
            print_success(f"Handled duplicate timestamp (status: {response.status_code})")
        else:
            print_error(f"Unexpected response: {response.status_code}")
    except Exception as e:
        print_error(f"Exception: {str(e)}")

# ==================== MAIN TEST RUNNER ====================
def run_all_tests():
    print_header("SENSO APP - COMPREHENSIVE ROBUSTNESS TEST SUITE")
    print_info(f"Target: {BASE_URL}")
    print_info(f"Test User: {TEST_USER_ID}")
    print_info(f"Test Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    start_time = time.time()

    try:
        # Run all test suites
        test_water_reading_insertion()
        test_electricity_reading_insertion()
        test_anomaly_detection()
        test_cost_forecasting()
        test_forecast_reset()
        test_edge_cases()

        # Summary
        end_time = time.time()
        duration = end_time - start_time

        print_header("TEST SUITE COMPLETE")
        print_success(f"Total execution time: {duration:.2f} seconds")
        print_info(f"Test End Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    except KeyboardInterrupt:
        print_error("\n\nTest suite interrupted by user")
    except Exception as e:
        print_error(f"\n\nTest suite failed with exception: {str(e)}")

if __name__ == "__main__":
    run_all_tests()
