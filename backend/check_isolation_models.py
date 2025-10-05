#!/usr/bin/env python3
"""
Check if user isolation models were created during the test
"""
import asyncio
import sys
import os
from datetime import datetime

sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import get_supabase
from loguru import logger

async def check_models():
    """Check for model training logs and user isolation models"""

    supabase = await get_supabase()

    print("=" * 60)
    print("CHECKING USER ISOLATION MODELS")
    print("=" * 60)

    # Check model_training_logs table
    print("\n1. Checking model_training_logs table...")
    try:
        logs_result = supabase.table("model_training_logs")\
            .select("*")\
            .order("training_started_at", desc=True)\
            .limit(10)\
            .execute()

        if logs_result.data:
            print(f"   Found {len(logs_result.data)} training logs:")
            for log in logs_result.data:
                print(f"   - {log['model_type']} | {log['utility_type']} | {log['training_status']} | {log['training_data_size']} readings")
                print(f"     Started: {log['training_started_at']}")
                if log['training_completed_at']:
                    print(f"     Completed: {log['training_completed_at']}")
                if log['error_message']:
                    print(f"     Error: {log['error_message']}")
                print()
        else:
            print("   ⚠️ No training logs found!")
    except Exception as e:
        print(f"   Error checking training logs: {e}")

    # Check user_isolation_models table (if it exists)
    print("\n2. Checking user_isolation_models table...")
    try:
        models_result = supabase.table("user_isolation_models")\
            .select("*")\
            .order("created_at", desc=True)\
            .limit(10)\
            .execute()

        if models_result.data:
            print(f"   Found {len(models_result.data)} saved models:")
            for model in models_result.data:
                print(f"   - User: {model['user_id']}")
                print(f"     Utility: {model['utility_type']}")
                print(f"     Created: {model['created_at']}")
                print(f"     Last used: {model.get('last_used_at', 'Never')}")
                print()
        else:
            print("   ⚠️ No saved isolation models found!")
    except Exception as e:
        print(f"   Error checking isolation models: {e}")
        print(f"     (Table might not exist)")

    # Check readings for test user
    print("\n3. Checking meter readings for test2@gmail.com...")
    try:
        # Get user ID first
        auth_result = supabase.table("auth.users")\
            .select("id")\
            .eq("email", "test2@gmail.com")\
            .single()\
            .execute()

        if auth_result.data:
            user_id = auth_result.data['id']
            print(f"   User ID: {user_id}")

            # Get readings count
            readings_result = supabase.table("meter_readings")\
                .select("*", count="exact")\
                .eq("user_id", user_id)\
                .execute()

            print(f"   Total readings: {readings_result.count}")

            # Get readings by utility type
            water_count = supabase.table("meter_readings")\
                .select("*", count="exact")\
                .eq("user_id", user_id)\
                .eq("utility_type", "water")\
                .execute()
            print(f"   Water readings: {water_count.count}")

            electricity_count = supabase.table("meter_readings")\
                .select("*", count="exact")\
                .eq("user_id", user_id)\
                .eq("utility_type", "electricity")\
                .execute()
            print(f"   Electricity readings: {electricity_count.count}")

    except Exception as e:
        print(f"   Error checking readings: {e}")

    # Check anomaly detections
    print("\n4. Checking anomaly detections...")
    try:
        anomalies_result = supabase.table("anomaly_detections")\
            .select("*", count="exact")\
            .execute()

        print(f"   Total anomaly detections: {anomalies_result.count}")

        if anomalies_result.data:
            print(f"   Recent anomalies:")
            for anomaly in anomalies_result.data[:5]:
                print(f"   - {anomaly['utility_type']} | Score: {anomaly['anomaly_score']} | Severity: {anomaly['severity']}")
                print(f"     Model version: {anomaly['model_version']}")
                print()
    except Exception as e:
        print(f"   Error checking anomalies: {e}")

    print("=" * 60)
    print("DIAGNOSIS:")
    print("=" * 60)
    print()
    print("If no training logs are found, it means:")
    print("  1. Anomaly detection was not triggered during reading creation")
    print("  2. The system used smart pattern detection instead of ML")
    print("  3. OR training failed silently")
    print()
    print("Expected behavior with 10 readings per utility:")
    print("  - Should have created 20 readings total (10 water + 10 electricity)")
    print("  - Should have triggered model training for both utilities")
    print("  - Should have 2 training logs (one for water, one for electricity)")
    print("  - Should have 2 saved models in user_isolation_models table")
    print()

if __name__ == "__main__":
    asyncio.run(check_models())
