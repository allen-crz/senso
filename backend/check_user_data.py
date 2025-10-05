"""
Check existing user data for test2@gmail.com
Retrieves user info, billing cycle, and last readings
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import json

# Database configuration
DB_CONFIG = {
    "dbname": "senso_db",
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": "5432"
}

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'

def print_header(text):
    print(f"\n{Colors.BLUE}{'='*70}{Colors.END}")
    print(f"{Colors.BLUE}{text.center(70)}{Colors.END}")
    print(f"{Colors.BLUE}{'='*70}{Colors.END}\n")

def print_section(text):
    print(f"\n{Colors.CYAN}{'─'*70}{Colors.END}")
    print(f"{Colors.CYAN}{text}{Colors.END}")
    print(f"{Colors.CYAN}{'─'*70}{Colors.END}")

def check_user_data():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        print_header("USER DATA CHECK: test2@gmail.com")

        # 1. Get User Info
        print_section("1. USER INFORMATION")
        cursor.execute("""
            SELECT id, email, full_name, phone_number, address, created_at
            FROM users
            WHERE email = 'test2@gmail.com'
        """)
        user = cursor.fetchone()

        if not user:
            print(f"{Colors.RED}✗ User not found!{Colors.END}")
            return

        print(f"{Colors.GREEN}✓ User found{Colors.END}")
        print(f"  ID: {user['id']}")
        print(f"  Email: {user['email']}")
        print(f"  Name: {user['full_name']}")
        print(f"  Phone: {user['phone_number']}")
        print(f"  Address: {user['address']}")
        print(f"  Created: {user['created_at']}")

        user_id = user['id']

        # 2. Get User Preferences & Billing Cycle
        print_section("2. USER PREFERENCES & BILLING CYCLE")
        cursor.execute("""
            SELECT water_provider, electricity_provider,
                   water_billing_cycle_start, water_billing_cycle_end,
                   electricity_billing_cycle_start, electricity_billing_cycle_end,
                   notification_preferences
            FROM user_preferences
            WHERE user_id = %s
        """, (user_id,))
        preferences = cursor.fetchone()

        if preferences:
            print(f"{Colors.GREEN}✓ Preferences found{Colors.END}")
            print(f"\n  {Colors.YELLOW}Water:{Colors.END}")
            print(f"    Provider: {preferences['water_provider']}")
            print(f"    Billing Cycle: {preferences['water_billing_cycle_start']} to {preferences['water_billing_cycle_end']}")

            print(f"\n  {Colors.YELLOW}Electricity:{Colors.END}")
            print(f"    Provider: {preferences['electricity_provider']}")
            print(f"    Billing Cycle: {preferences['electricity_billing_cycle_start']} to {preferences['electricity_billing_cycle_end']}")

            print(f"\n  Notifications: {preferences['notification_preferences']}")
        else:
            print(f"{Colors.RED}✗ No preferences found{Colors.END}")

        # 3. Get Water Readings (last 5)
        print_section("3. WATER METER READINGS (Last 5)")
        cursor.execute("""
            SELECT reading_value, reading_date, confidence_score, image_url, created_at
            FROM water_readings
            WHERE user_id = %s
            ORDER BY reading_date DESC
            LIMIT 5
        """, (user_id,))
        water_readings = cursor.fetchall()

        if water_readings:
            print(f"{Colors.GREEN}✓ Found {len(water_readings)} water readings{Colors.END}\n")
            for i, reading in enumerate(water_readings, 1):
                print(f"  {i}. {reading['reading_value']} m³")
                print(f"     Date: {reading['reading_date']}")
                print(f"     Confidence: {reading['confidence_score']:.2%}" if reading['confidence_score'] else "     Confidence: N/A")
                print(f"     Image: {reading['image_url']}")
                print()
        else:
            print(f"{Colors.RED}✗ No water readings found{Colors.END}")

        # 4. Get Electricity Readings (last 5)
        print_section("4. ELECTRICITY METER READINGS (Last 5)")
        cursor.execute("""
            SELECT reading_value, reading_date, confidence_score, image_url, created_at
            FROM electricity_readings
            WHERE user_id = %s
            ORDER BY reading_date DESC
            LIMIT 5
        """, (user_id,))
        elec_readings = cursor.fetchall()

        if elec_readings:
            print(f"{Colors.GREEN}✓ Found {len(elec_readings)} electricity readings{Colors.END}\n")
            for i, reading in enumerate(elec_readings, 1):
                print(f"  {i}. {reading['reading_value']} kWh")
                print(f"     Date: {reading['reading_date']}")
                print(f"     Confidence: {reading['confidence_score']:.2%}" if reading['confidence_score'] else "     Confidence: N/A")
                print(f"     Image: {reading['image_url']}")
                print()
        else:
            print(f"{Colors.RED}✗ No electricity readings found{Colors.END}")

        # 5. Get Water Consumption Stats
        print_section("5. WATER CONSUMPTION STATISTICS")
        cursor.execute("""
            SELECT
                COUNT(*) as total_readings,
                MIN(reading_value) as min_reading,
                MAX(reading_value) as max_reading,
                AVG(reading_value) as avg_reading,
                MIN(reading_date) as first_reading_date,
                MAX(reading_date) as last_reading_date
            FROM water_readings
            WHERE user_id = %s
        """, (user_id,))
        water_stats = cursor.fetchone()

        if water_stats and water_stats['total_readings'] > 0:
            print(f"{Colors.GREEN}✓ Water statistics{Colors.END}")
            print(f"  Total readings: {water_stats['total_readings']}")
            print(f"  Range: {water_stats['min_reading']} - {water_stats['max_reading']} m³")
            print(f"  Average: {water_stats['avg_reading']:.2f} m³")
            print(f"  First reading: {water_stats['first_reading_date']}")
            print(f"  Last reading: {water_stats['last_reading_date']}")
        else:
            print(f"{Colors.RED}✗ No water statistics available{Colors.END}")

        # 6. Get Electricity Consumption Stats
        print_section("6. ELECTRICITY CONSUMPTION STATISTICS")
        cursor.execute("""
            SELECT
                COUNT(*) as total_readings,
                MIN(reading_value) as min_reading,
                MAX(reading_value) as max_reading,
                AVG(reading_value) as avg_reading,
                MIN(reading_date) as first_reading_date,
                MAX(reading_date) as last_reading_date
            FROM electricity_readings
            WHERE user_id = %s
        """, (user_id,))
        elec_stats = cursor.fetchone()

        if elec_stats and elec_stats['total_readings'] > 0:
            print(f"{Colors.GREEN}✓ Electricity statistics{Colors.END}")
            print(f"  Total readings: {elec_stats['total_readings']}")
            print(f"  Range: {elec_stats['min_reading']} - {elec_stats['max_reading']} kWh")
            print(f"  Average: {elec_stats['avg_reading']:.2f} kWh")
            print(f"  First reading: {elec_stats['first_reading_date']}")
            print(f"  Last reading: {elec_stats['last_reading_date']}")
        else:
            print(f"{Colors.RED}✗ No electricity statistics available{Colors.END}")

        # 7. Get Recent Anomalies
        print_section("7. RECENT ANOMALIES (Last 3)")
        cursor.execute("""
            SELECT utility_type, anomaly_type, severity, consumption_value,
                   detected_at, recommendation
            FROM consumption_anomalies
            WHERE user_id = %s
            ORDER BY detected_at DESC
            LIMIT 3
        """, (user_id,))
        anomalies = cursor.fetchall()

        if anomalies:
            print(f"{Colors.GREEN}✓ Found {len(anomalies)} recent anomalies{Colors.END}\n")
            for i, anomaly in enumerate(anomalies, 1):
                print(f"  {i}. {anomaly['utility_type'].upper()} - {anomaly['anomaly_type']}")
                print(f"     Severity: {anomaly['severity']}")
                print(f"     Consumption: {anomaly['consumption_value']}")
                print(f"     Detected: {anomaly['detected_at']}")
                print(f"     Recommendation: {anomaly['recommendation'][:80]}..." if anomaly['recommendation'] else "     Recommendation: None")
                print()
        else:
            print(f"{Colors.YELLOW}ℹ No anomalies detected{Colors.END}")

        # 8. Get Current Billing Period Info
        print_section("8. CURRENT BILLING PERIOD")
        if preferences:
            today = datetime.now().date()
            print(f"  Today: {today}")
            print(f"\n  {Colors.YELLOW}Water:{Colors.END}")
            print(f"    Current cycle: {preferences['water_billing_cycle_start']} to {preferences['water_billing_cycle_end']}")

            # Calculate days in cycle
            if preferences['water_billing_cycle_start'] and preferences['water_billing_cycle_end']:
                days_in_cycle = (preferences['water_billing_cycle_end'] - preferences['water_billing_cycle_start']).days
                days_remaining = (preferences['water_billing_cycle_end'] - today).days
                print(f"    Days in cycle: {days_in_cycle}")
                print(f"    Days remaining: {days_remaining}")

            print(f"\n  {Colors.YELLOW}Electricity:{Colors.END}")
            print(f"    Current cycle: {preferences['electricity_billing_cycle_start']} to {preferences['electricity_billing_cycle_end']}")

            if preferences['electricity_billing_cycle_start'] and preferences['electricity_billing_cycle_end']:
                days_in_cycle = (preferences['electricity_billing_cycle_end'] - preferences['electricity_billing_cycle_start']).days
                days_remaining = (preferences['electricity_billing_cycle_end'] - today).days
                print(f"    Days in cycle: {days_in_cycle}")
                print(f"    Days remaining: {days_remaining}")

        print_header("DATA CHECK COMPLETE")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"{Colors.RED}✗ Error: {str(e)}{Colors.END}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_user_data()
