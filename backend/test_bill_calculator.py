"""
Test script for bill calculator - September bills for water and electricity
Enter your consumption values below
"""
import asyncio
import sys
from app.services.utility_rates import utility_rates_service
from app.models.schemas import UtilityType

# Fix Windows console encoding for peso signs
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')


async def test_bill_calculator():
    """Calculate bills for September based on consumption input"""

    # ============ ENTER YOUR VALUES HERE ============
    water_consumption = 27.0  # cubic meters (m³)
    electricity_consumption = 150.0  # kilowatt-hours (kWh)
    month = "march"
    # ================================================

    test_user_id = "2577f77d-1c5c-4f11-aa6c-302fda6d1ef4"

    print("=" * 60)
    print(f"BILL CALCULATOR - {month.upper()} 2025")
    print("=" * 60)

    total_bill = 0.0

    # Calculate Water Bill
    print("\n" + "=" * 60)
    print("WATER BILL (Maynilad)")
    print("=" * 60)
    print(f"Consumption: {water_consumption} m³")

    try:
        water_bill = await utility_rates_service.calculate_bill(
            user_id=test_user_id,
            utility_type=UtilityType.WATER,
            consumption=water_consumption,
            billing_month=month
        )
        print(f"Water Bill: ₱{water_bill:.2f}")
        total_bill += water_bill
    except Exception as e:
        print(f"❌ Failed to calculate water bill: {e}")
        import traceback
        print(traceback.format_exc())

    # Calculate Electricity Bill
    print("\n" + "=" * 60)
    print("ELECTRICITY BILL (Meralco)")
    print("=" * 60)
    print(f"Consumption: {electricity_consumption} kWh")

    try:
        electricity_bill = await utility_rates_service.calculate_bill(
            user_id=test_user_id,
            utility_type=UtilityType.ELECTRICITY,
            consumption=electricity_consumption,
            billing_month=month
        )
        print(f"Electricity Bill: ₱{electricity_bill:.2f}")
        total_bill += electricity_bill
    except Exception as e:
        print(f"❌ Failed to calculate electricity bill: {e}")
        import traceback
        print(traceback.format_exc())

    # Summary
    print("\n" + "=" * 60)
    print("TOTAL BILL SUMMARY")
    print("=" * 60)
    print(f"Water Bill:       ₱{water_bill:.2f}")
    print(f"Electricity Bill: ₱{electricity_bill:.2f}")
    print(f"TOTAL:            ₱{total_bill:.2f}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_bill_calculator())
