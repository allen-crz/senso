# Normal Billing Cycle Behavior (Production - No Demo)

## Overview
In production, the billing cycle automatically transitions at midnight on the user's billing date. No manual intervention needed.

---

## Complete Automatic Flow

### Phase 1: User Onboarding (One-Time Setup)

**Step 1: User Registers**
- Creates account with email/password

**Step 2: User Enters Historical Data**
- Provides 3+ months of past bills:
  - September 2024: 750 kWh, ₱2,500
  - August 2024: 780 kWh, ₱2,600
  - July 2024: 820 kWh, ₱2,750
- Stored in `user_historical_data` table

**Step 3: User Sets Billing Date**
- Example: "My electricity billing date is the 5th of each month"
- Stored in `user_preferences.electricity_billing_date = 5`

**Step 4: System Trains Initial Model**
- Automatically trains on 3 historical months
- Creates Linear Regression model
- Stores in `user_forecasting_models` table

---

### Phase 2: First Billing Cycle (October 5 - November 4)

**October 5 (Cycle Start Day):**

**User Action:** Takes first meter reading
- Scans meter: 1000 kWh
- Stored in `meter_readings` table

**System Action:** Auto-sets baseline
- No baseline exists yet
- `get_billing_cycle_baseline()` sees first reading
- Auto-sets as baseline:
  ```python
  user_preferences.update({
      "electricity_last_bill_reading": 1000,
      "electricity_last_bill_date": "2024-10-05"
  })
  ```

**Frontend Shows:**
```
Electricity Forecast
0 of 30 days

₱1,680 (predicted for full October cycle)

So Far This Cycle
0 kWh consumed
[░░░░░░░░░░░░░░░░░░░░] 0%
From 1000 (Oct 5) → 1000

Daily Average (This Cycle): 0 kWh/day
```

---

**October 10 (Mid-Cycle - Day 5):**

**User Action:** Takes another meter reading
- Scans meter: 1125 kWh
- Stored in `meter_readings` table

**System Action:** Updates consumption tracking
- Calculates: 1125 - 1000 = 125 kWh consumed
- Calculates: 125 / 5 days = 25 kWh/day average
- Projects: 25 × 30 = 750 kWh monthly estimate

**System Action:** Generates/Updates forecast
- Calls `get_monthly_forecast()`
- Prepares monthly features:
  - avg_daily_consumption: 25 kWh/day
  - days_in_billing_cycle: 30
  - month_number: 10 (October)
  - prev_month_consumption: 750 kWh (Sept)
  - 3mo_moving_average: 783 kWh
- Model predicts: ₱1,680 monthly cost
- **First time only:** Stores forecast in `cost_forecasts` table:
  ```python
  {
      "user_id": user_id,
      "utility_type": "electricity",
      "forecast_month": "2024-10-05",
      "predicted_cost": 1680,
      "predicted_usage": 750,
      "actual_cost": null,      # Not known yet
      "actual_usage": null,     # Not known yet
      "accuracy_error": null
  }
  ```

**Frontend Shows:**
```
Electricity Forecast
5 of 30 days

₱1,680

So Far This Cycle
125 kWh consumed
[███████░░░░░░░░░░░░░] 17%
From 1000 (Oct 5) → 1125

Daily Average (This Cycle): 25 kWh/day
Your Pace: On track
```

---

**October 15, 20, 25... (Throughout Cycle):**

**User Action:** Takes periodic readings
- Each new reading updates:
  - Latest reading value
  - Cycle consumption (latest - baseline)
  - Daily average (consumption / days elapsed)
  - Pace vs forecast

**System Action:** Returns existing forecast
- `get_monthly_forecast()` checks if forecast exists for this cycle
- Finds forecast from Oct 10 → Returns it (doesn't create duplicate)
- Forecast remains ₱1,680 (stable prediction)

**Frontend Shows:** Updated progress
```
Electricity Forecast
20 of 30 days

₱1,680 (same forecast)

So Far This Cycle
350 kWh consumed
[█████████████░░░░░░░] 67%
From 1000 (Oct 5) → 1350

Daily Average (This Cycle): 17.5 kWh/day
Your Pace: +5% above forecast
```

---

### Phase 3: Billing Cycle Ends (Automatic - No User Action)

**November 5, 00:00:00 (Midnight):**

**System Action:** APScheduler cron job runs
```python
# billing_scheduler.py runs automatically at midnight
current_date = date.today()  # November 5, 2024

# Check all users
for user in all_active_users:
    if current_date.day == user.electricity_billing_date:
        # This user's billing date is today!
        await check_user_billing_cycle(
            user_id=user.id,
            utility_type=UtilityType.ELECTRICITY,
            billing_day=5,
            current_date=current_date
        )
```

**Step 1: Get previous forecast**
```python
# Retrieves forecast stored on October 10
previous_forecast = {
    "forecast_month": "2024-10-05",
    "predicted_cost": 1680,
    "predicted_usage": 750,
    "actual_cost": null,      # To be filled
    "actual_usage": null      # To be filled
}
```

**Step 2: Calculate actual consumption**
```python
# Get all readings from Oct 5 - Nov 4
readings_in_cycle = [
    {timestamp: "2024-10-05", value: 1000},
    {timestamp: "2024-10-10", value: 1125},
    {timestamp: "2024-10-15", value: 1250},
    {timestamp: "2024-10-20", value: 1350},
    {timestamp: "2024-10-25", value: 1430},
    {timestamp: "2024-11-04", value: 1520}  # Last reading before cycle end
]

# Calculate actual consumption
first_reading = 1000 kWh
last_reading = 1520 kWh
actual_consumption = 1520 - 1000 = 520 kWh
```

**Step 3: Calculate actual cost**
```python
# Use utility rates for October
actual_cost = await calculate_bill(
    user_id=user_id,
    utility_type="electricity",
    consumption=520,
    billing_month="october"
)
# Result: ₱1,742
```

**Step 4: Update forecast with actuals**
```python
# Calculate accuracy
predicted_cost = 1680
actual_cost = 1742
accuracy = 100 - (|1680 - 1742| / 1742 × 100)
# = 100 - 3.6% = 96.4%

# Update the forecast record
cost_forecasts.update({
    "actual_usage": 520,
    "actual_cost": 1742,
    "accuracy_error": 96.4,  # Stored as accuracy percentage
    "forecast_status": "completed"
}).where(forecast_month="2024-10-05")
```

**Step 5: Add to historical data**
```python
# October consumption becomes training data
user_historical_data.insert({
    "user_id": user_id,
    "utility_type": "electricity",
    "month_date": "2024-10-05",
    "month_name": "october",
    "consumption": 520,
    "actual_bill": 1742
})
```

**Step 6: Retrain model**
```python
# Now have 4 months instead of 3
historical_records = [
    {month: "july", consumption: 820, bill: 2750},
    {month: "august", consumption: 780, bill: 2600},
    {month: "september", consumption: 750, bill: 2500},
    {month: "october", consumption: 520, bill: 1742}  # NEW!
]

# Retrain model with updated monthly features
await update_with_meter_readings(user_id, UtilityType.ELECTRICITY)

# Model now:
# - Trained on 4 months
# - Updated MAE: ₱58.50 (average error across all forecasts)
# - Better predictions going forward
```

**Step 7: Clear baseline for new cycle**
```python
# Reset for November 5 - December 4 cycle
user_preferences.update({
    "electricity_last_bill_reading": null,
    "electricity_last_bill_date": null
})
```

**Step 8: Generate forecast for new cycle**
```python
# System generates forecast for Nov 5 - Dec 4
# But doesn't store it yet (will store on first user visit)
new_forecast = {
    "predicted_cost": 1720,  # Updated prediction (model improved)
    "predicted_usage": 510,
    "billing_cycle_days": 30
}
```

**Backend Logs:**
```
[00:00:00] ✓ Found previous forecast: Predicted=$1680, Consumption=750
[00:00:01] ✓ Actual consumption calculated: 520 kWh
[00:00:02] ✓ Actual cost calculated: $1742
[00:00:03] ✓ Comparison complete: Predicted=$1680 vs Actual=$1742, Error=3.6%
[00:00:04] ✓ Historical record created - Actual becomes training data
[00:00:05] ✓ Model retrained with updated data
[00:00:06] ✓ New forecast generated: $1720
[00:00:07] ✓ Baseline cleared for new billing cycle
[00:00:08] 🎉 Billing cycle transition complete!
```

---

### Phase 4: New Billing Cycle (November 5 - December 4)

**November 5, 08:00 AM (User Opens App):**

**Frontend Fetches:** `/current-cycle-consumption/electricity`

**API Returns:**
```json
{
    "utility_type": "electricity",
    "has_baseline": false,
    "message": "No baseline reading available. Please scan your first meter reading.",
    "cycle_consumption": null,
    "baseline_reading": null,
    "latest_reading": 1520,  // Still exists from yesterday
    "baseline_date": null,
    "billing_cycle": {
        "start_date": "2024-11-05",
        "end_date": "2024-12-04",
        "elapsed_days": 0,
        "remaining_days": 30,
        "total_days": 30
    },
    "daily_average": 0
}
```

**Frontend Shows:**
```
Electricity Forecast
Monthly prediction

₱1,720 (new forecast for November)

[No "So Far This Cycle" section - no baseline]

Last Month Accuracy
✓ 96.4%
Predicted: ₱1,680
Actual: ₱1,742
```

---

**November 5, 09:00 AM (User Takes First Reading):**

**User Action:** Scans meter
- Reads: 1520 kWh (exactly where October ended)

**System Action:** Auto-sets new baseline
```python
# get_billing_cycle_baseline() finds no baseline
# Auto-sets this reading as baseline:
user_preferences.update({
    "electricity_last_bill_reading": 1520,
    "electricity_last_bill_date": "2024-11-05"
})
```

**Frontend Shows:**
```
Electricity Forecast
0 of 30 days

₱1,720

So Far This Cycle
0 kWh consumed
[░░░░░░░░░░░░░░░░░░░░] 0%
From 1520 (Nov 5) → 1520

Daily Average (This Cycle): 0 kWh/day

Last Month Accuracy
✓ 96.4%
Predicted: ₱1,680
Actual: ₱1,742
```

---

**November 10 (Day 5 of New Cycle):**

**User Action:** Takes reading
- Scans meter: 1645 kWh

**System Action:** Updates consumption
- 1645 - 1520 = 125 kWh consumed
- 125 / 5 days = 25 kWh/day
- Projects: 25 × 30 = 750 kWh monthly

**System Action:** Generates forecast
- Model uses 4 months of training data (improved from 3)
- Predicts: ₱1,720 monthly cost
- **First time for this cycle:** Stores in `cost_forecasts`

**Frontend Shows:**
```
Electricity Forecast
5 of 30 days

₱1,720

So Far This Cycle
125 kWh consumed
[███████░░░░░░░░░░░░░] 17%
From 1520 (Nov 5) → 1645

Daily Average (This Cycle): 25 kWh/day
Your Pace: On track

Last Month Accuracy
✓ 96.4%
Predicted: ₱1,680
Actual: ₱1,742
```

---

### Phase 5: Cycle Continues (Every Month)

**December 5, 00:00 AM (Next Automatic Reset):**
- Scheduler runs again
- Calculates November actuals
- Updates November forecast with actuals
- Adds November data to historical records
- Retrains model (now 5 months of data)
- Clears baseline
- Generates December forecast
- Cycle repeats...

---

## Timeline Summary (Normal Operation)

```
Oct 5, 00:00    │ [Previous cycle ended - automatic]
Oct 5, 09:00    │ User scans → Baseline set (1000 kWh)
Oct 10          │ User scans → Forecast generated & stored (₱1,680)
Oct 15          │ User scans → Progress updates (uses same forecast)
Oct 20          │ User scans → Progress updates
Oct 25          │ User scans → Progress updates
Nov 4, 23:59    │ User scans last reading (1520 kWh)
                │
Nov 5, 00:00    │ ⚙️  AUTOMATIC SCHEDULER RUNS
                │ ├─ Calculate actual: 520 kWh, ₱1,742
                │ ├─ Update forecast with actuals
                │ ├─ Add to historical data
                │ ├─ Retrain model (4 months now)
                │ ├─ Clear baseline
                │ └─ Generate new forecast: ₱1,720
                │
Nov 5, 08:00    │ User opens app → Sees "Take first reading"
Nov 5, 09:00    │ User scans → New baseline set (1520 kWh)
Nov 10          │ User scans → New forecast generated & stored
                │ ... cycle continues ...
                │
Dec 5, 00:00    │ ⚙️  AUTOMATIC SCHEDULER RUNS AGAIN
                │ ... repeat process ...
```

---

## Key Differences: Demo vs Normal

| Aspect | Demo Mode (Button) | Normal Mode (Automatic) |
|--------|-------------------|-------------------------|
| **Trigger** | User clicks button in Settings | APScheduler at midnight |
| **Date Check** | `demo_mode=True` (bypassed) | Checks if `today.day == billing_day` |
| **When Runs** | Anytime user clicks | Only at midnight on billing date |
| **Manual Action** | Required (user must click) | None (fully automatic) |
| **Purpose** | Testing/presentations | Production operation |
| **Same Logic** | ✅ Yes - calls same function | ✅ Yes - calls same function |

**Both modes:**
- Calculate actuals from meter readings
- Update forecast with actual_cost, actual_usage, accuracy
- Add to historical data
- Retrain model
- Clear baseline
- Generate new forecast

---

## What User Experiences (Normal Mode)

**User Never Needs To:**
- ❌ Click any reset button
- ❌ Manually end billing cycles
- ❌ Trigger model retraining
- ❌ Update forecasts

**User Only Needs To:**
- ✅ Take meter readings periodically (recommended 2-3 times per week)
- ✅ Check dashboard to see predictions and progress
- ✅ Review accuracy after each cycle (optional)

**System Handles:**
- ✅ Automatic cycle detection (midnight on billing date)
- ✅ Actual consumption calculation
- ✅ Forecast comparison
- ✅ Model retraining
- ✅ Baseline management
- ✅ Historical data tracking

---

## For Panel Presentation

**Key Message:**

*"The system runs completely automatically. Users simply scan their meter a few times a month, and our AI handles everything else. At midnight on their billing date, the system automatically detects the cycle end, calculates their actual usage, compares it to our prediction, adds that data to improve the model, and starts fresh for the next month. No manual intervention needed - it just works."*

**Demonstration Flow:**

1. **Show Dashboard Mid-Cycle** (e.g., Day 15)
   - "Here's a user halfway through their billing cycle"
   - Progress bar at 50%, showing 15 of 30 days
   - Predicted cost: ₱1,680

2. **Show Forecast Details**
   - "The AI predicted ₱1,680 based on their consumption pattern"
   - Daily average this cycle: 16.67 kWh/day
   - Pace: Slightly above forecast

3. **Explain Automatic Process**
   - "At midnight on November 5th, the system automatically:"
   - ✅ Calculated actual consumption: 520 kWh
   - ✅ Calculated actual cost: ₱1,742
   - ✅ Accuracy: 96.4%
   - ✅ Retrained model with October data
   - ✅ Ready for November predictions

4. **Show After Reset** (Click demo button to demonstrate)
   - "After the cycle ends (I'll use our demo button to show this)..."
   - Last Month Accuracy appears: 96.4%
   - Current cycle resets to 0
   - New forecast: ₱1,720 (improved with more data)

5. **Emphasize Zero Maintenance**
   - "Users never touch this process"
   - "System learns and improves automatically"
   - "Every month makes predictions more accurate"
