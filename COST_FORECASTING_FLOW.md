# Cost Forecasting Flow - Complete System Explanation

## Overview
The cost forecasting system uses Linear Regression trained on monthly billing data to predict future utility costs. The system automatically manages billing cycles, trains models, and provides real-time predictions.

---

## Phase 1: Initial Setup (New User Onboarding)

### Step 1: User Provides Historical Data
**Where:** Registration or Historical Data Entry page
**What Happens:**
- User enters past billing history (e.g., "September 2024: 750 kWh, ₱2,500")
- Data stored in `user_historical_data` table with:
  - `month_date` (e.g., "2024-09-05")
  - `consumption` (e.g., 750 kWh)
  - `actual_bill` (e.g., ₱2,500)
  - `month_name` (lowercase, e.g., "september")

**Minimum:** Need at least 3 months of historical data to train a model

### Step 2: User Sets Billing Date
**Where:** User Preferences page
**What Happens:**
- User sets their billing day (e.g., "5th of each month")
- Stored in `user_preferences` table:
  - `water_billing_date: 5`
  - `electricity_billing_date: 5`

### Step 3: First Meter Reading (Baseline)
**Where:** Water/Electricity Monitoring page (Camera scan or manual entry)
**What Happens:**
- User scans first meter reading (e.g., 1000 kWh on October 5)
- System detects this is the first reading in current cycle
- Stores as **baseline reading** in `user_preferences`:
  - `water_baseline_reading: 1000`
  - `water_baseline_date: "2024-10-05"`
- This baseline is the starting point for tracking consumption

---

## Phase 2: Initial Model Training

### Step 4: Train Initial Model
**Trigger:** Automatically after user provides 3+ months of historical data
**Backend Function:** `train_initial_model()` in `cost_forecasting.py`

**What Happens:**

1. **Fetch Historical Records**
   ```python
   historical_records = await historical_data_service.get_user_records(
       user_id, utility_type
   )
   # Returns: [
   #   {month_date: "2024-07", consumption: 820, actual_bill: 2750},
   #   {month_date: "2024-08", consumption: 780, actual_bill: 2600},
   #   {month_date: "2024-09", consumption: 750, actual_bill: 2500}
   # ]
   ```

2. **Create Training Data** (`_create_training_data()`)
   - Sorts records chronologically
   - For each month, calculates **5 monthly features**:

     **Feature 1: avg_daily_consumption**
     - `consumption / days_in_billing_cycle`
     - Example: 750 kWh / 30 days = 25 kWh/day

     **Feature 2: days_in_billing_cycle**
     - Actual billing cycle length (28-31 days)
     - Example: 30 days

     **Feature 3: month_number**
     - Month as number (1=Jan, 12=Dec)
     - Example: September = 9

     **Feature 4: prev_month_consumption**
     - Last month's total consumption
     - Example: August = 780 kWh

     **Feature 5: 3mo_moving_average**
     - Average of last 3 months
     - Example: (820 + 780 + 750) / 3 = 783 kWh

   - **Target:** `actual_bill` (the cost we want to predict)

3. **Train Linear Regression Model** (`_train_model()`)
   ```python
   # Feature matrix (each row = 1 month)
   X = [
       [25.0, 30, 9, 780, 783],  # Sept features
       [26.0, 31, 8, 820, 800],  # Aug features
       [27.3, 30, 7, 0, 820]     # July features
   ]

   # Target costs
   y = [2500, 2600, 2750]

   # Train model
   model.fit(X_scaled, y)
   ```

4. **Calculate Performance Metrics**
   - R² Score (how well model fits data)
   - MAE (Mean Absolute Error in pesos)
   - Feature Importance (which features matter most)

5. **Save Model to Database**
   - Table: `user_forecasting_models`
   - Stores: model parameters, scaler, feature names, performance metrics
   - Also saves to memory cache for fast predictions

**Result:** User now has a trained model ready to make predictions

---

## Phase 3: Real-Time Predictions (During Billing Cycle)

### Step 5: User Takes Meter Reading
**Where:** Water/Electricity Monitoring page
**When:** Anytime during the billing cycle
**What Happens:**

1. **Capture Reading**
   - User scans meter (e.g., 1250 kWh on October 20)
   - Stored in `user_meter_readings` table

2. **Calculate Consumption**
   ```python
   cycle_consumption = current_reading - baseline_reading
   # 1250 - 1000 = 250 kWh consumed so far

   elapsed_days = current_date - baseline_date
   # October 20 - October 5 = 15 days elapsed

   daily_consumption = cycle_consumption / elapsed_days
   # 250 / 15 = 16.67 kWh/day
   ```

### Step 6: Generate Monthly Forecast
**Trigger:** User views dashboard or forecast page
**Backend Function:** `get_monthly_forecast()` in `cost_forecasting.py`

**What Happens:**

1. **Calculate Billing Position**
   ```python
   billing_position = await _calculate_billing_position(user_id, utility_type)
   # Returns:
   # {
   #   cycle_start_date: "2024-10-05",
   #   elapsed_days: 15,
   #   remaining_days: 15,
   #   total_cycle_days: 30
   # }
   ```

2. **Estimate Monthly Consumption**
   ```python
   # Current pace
   current_daily_rate = 250 kWh / 15 days = 16.67 kWh/day

   # Project to full month
   estimated_monthly = current_daily_rate × total_cycle_days
   # 16.67 × 30 = 500 kWh (estimated for full month)
   ```

3. **Prepare Monthly Features for Prediction** (`predict_billing_aware_cost()`)
   - Fetch historical records to get prev_month and 3mo_avg
   - Create same 5 features as training:
     ```python
     features = [
         16.67,  # avg_daily_consumption (current rate)
         30,     # days_in_billing_cycle
         10,     # month_number (October)
         750,    # prev_month_consumption (Sept)
         783     # 3mo_moving_average (July-Aug-Sept)
     ]
     ```

4. **Model Predicts Monthly Cost** (`_predict_cost()`)
   ```python
   # Scale features
   features_scaled = scaler.transform([features])

   # Predict
   predicted_monthly_cost = model.predict(features_scaled)
   # Output: ₱1,680 (predicted for full October cycle)
   ```

5. **First-Time Forecast Storage**
   - Check if forecast already exists for this cycle
   - If NOT (first prediction of this cycle):
     ```python
     # Store in cost_forecasts table
     {
         "user_id": user_id,
         "utility_type": "electricity",
         "forecast_month": "2024-10-05",
         "predicted_cost": 1680,
         "predicted_usage": 500,
         "confidence_score": 0.85,
         "actual_cost": null,      # Not known yet
         "actual_usage": null,     # Not known yet
         "accuracy_error": null    # Can't calculate yet
     }
     ```
   - If forecast already exists: Just return it (don't store duplicate)

6. **Return Forecast to Frontend**
   ```json
   {
     "predicted_monthly_cost": 1680,
     "predicted_monthly_consumption": 500,
     "billing_cycle_days": 30,
     "elapsed_days": 15,
     "remaining_days": 15,
     "confidence_score": 0.85
   }
   ```

**Frontend Displays:**
- "Predicted Monthly Cost: ₱1,680"
- "Predicted Monthly Usage: 500 kWh"
- "Your Pace: 16.67 kWh/day"
- Progress bar showing 15/30 days complete

---

## Phase 4: Billing Cycle Ends (Automatic or Manual)

### Step 7A: Automatic Billing Cycle End (Natural Flow)
**When:** Midnight on user's billing date
**Trigger:** APScheduler cron job runs at 00:00 daily
**Backend Function:** `process_daily_billing_cycles()` in `billing_scheduler.py`

**What Happens:**

1. **Scheduler Checks All Users**
   ```python
   current_date = date.today()  # e.g., November 5, 2024
   users = get_all_active_users()

   for user in users:
       if current_date.day == user.water_billing_date:
           # This user's water billing cycle ends today!
           await check_user_billing_cycle(user, UtilityType.WATER)
   ```

2. **Trigger Billing Cycle End**
   - Calls `reset_forecast_at_billing_date()` in `cost_forecasting.py`
   - Proceeds to Step 8 below

### Step 7B: Manual Billing Cycle End (Demo/Testing)
**When:** User clicks "Demo Forecast Reset" in Settings
**Trigger:** Demo endpoint with `demo_mode=True`
**What Happens:**
- Bypasses date check
- Immediately triggers billing cycle end
- Same flow as automatic (Step 8)

### Step 8: Process Billing Cycle Transition
**Backend Function:** `reset_forecast_at_billing_date()` in `cost_forecasting.py`

**What Happens:**

1. **Calculate Actual Consumption and Cost**
   ```python
   # Get all meter readings from this billing cycle
   cycle_start = "2024-10-05"
   cycle_end = "2024-11-05"

   readings_in_cycle = get_readings_between(cycle_start, cycle_end)

   # Calculate actual consumption
   first_reading = 1000 kWh (baseline)
   last_reading = 1520 kWh
   actual_consumption = 1520 - 1000 = 520 kWh

   # Calculate actual cost using utility rates
   actual_cost = await utility_rates_service.calculate_bill(
       user_id, utility_type,
       consumption=520,
       billing_month="october"
   )
   # Result: ₱1,742
   ```

2. **Update Forecast with Actual Results**
   ```python
   # Find the forecast we stored in Step 6
   forecast = get_forecast_for_cycle("2024-10-05")

   # Calculate accuracy
   predicted_cost = 1680
   actual_cost = 1742
   accuracy_percentage = 100 - (|1680 - 1742| / 1742 × 100)
   # = 100 - (62/1742 × 100) = 96.4% accuracy

   # Update forecast record
   forecast.update({
       "actual_cost": 1742,
       "actual_usage": 520,
       "accuracy_error": 96.4,  # Stored as accuracy percentage
       "forecast_status": "completed"
   })
   ```

3. **Add to Historical Data**
   ```python
   # This actual consumption becomes a training data point
   historical_data_service.add_record({
       "user_id": user_id,
       "utility_type": "electricity",
       "month_date": "2024-10-05",
       "month_name": "october",
       "consumption": 520,
       "actual_bill": 1742
   })
   ```

4. **Retrain Model with New Data**
   ```python
   # Now we have 4 months of data instead of 3
   historical_records = [
       {month: "july", consumption: 820, bill: 2750},
       {month: "august", consumption: 780, bill: 2600},
       {month: "september", consumption: 750, bill: 2500},
       {month: "october", consumption: 520, bill: 1742}  # NEW!
   ]

   # Retrain model (same process as Step 4)
   await update_with_meter_readings(user_id, utility_type)
   ```

5. **Update Model Performance**
   ```python
   # Calculate new MAE across all forecasts
   all_forecasts = get_all_completed_forecasts(user_id, utility_type)
   errors = [abs(f.predicted_cost - f.actual_cost) for f in all_forecasts]
   mae = mean(errors)  # e.g., ₱58.50 average error

   # Update model record
   model.update({
       "mae": 58.50,
       "last_trained_at": now(),
       "training_data_count": 4
   })
   ```

6. **Reset Billing Cycle**
   ```python
   # Clear baseline for new cycle
   user_preferences.update({
       "water_baseline_reading": null,
       "water_baseline_date": null
   })
   ```

7. **Generate New Forecast for Next Cycle**
   - Next meter reading will set new baseline
   - New forecast will be generated for November 5 - December 5 cycle
   - Model now has October data to improve predictions

**Result:**
- Previous forecast (October) is now **completed** with actual vs predicted
- Model is **retrained** with October data
- System is **ready** for next billing cycle (November)

---

## Phase 5: Frontend Display Updates

### Step 9: Dashboard Shows Updated Data
**What User Sees After Billing Cycle Ends:**

1. **Last Month Accuracy Card** (NEW)
   ```
   Last Month Accuracy
   ✓ 96.4%

   Predicted: ₱1,680
   Actual: ₱1,742
   ```

2. **Current Cycle Card** (RESET)
   ```
   Current Cycle: November 5 - December 5

   No readings yet
   [Take first reading to start tracking]
   ```

3. **Model Info** (UPDATED)
   ```
   Smart Prediction Active
   Training Data: 4 months
   Accuracy: 96.4%
   ```

4. **Forecast Comparison Page**
   - Shows historical predicted vs actual for all past months
   - October now appears with 96.4% accuracy
   - Chart shows trend improving over time

---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    NEW USER ONBOARDING                       │
│  1. Enter historical data (3+ months)                        │
│  2. Set billing date (e.g., 5th)                            │
│  3. Initial model training                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   BILLING CYCLE STARTS                       │
│  Day 1 (Oct 5): User scans meter → Baseline set (1000 kWh) │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 MID-CYCLE PREDICTIONS                        │
│  Day 15 (Oct 20): Scan meter (1250 kWh)                     │
│  → Calculate: 250 kWh consumed / 15 days = 16.67 kWh/day    │
│  → Project: 16.67 × 30 = 500 kWh monthly                    │
│  → Model predicts: ₱1,680 monthly cost                       │
│  → FIRST TIME: Store forecast in DB                          │
│  → NEXT TIMES: Return existing forecast                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              BILLING CYCLE ENDS (Nov 5)                      │
│  AUTOMATIC: Scheduler detects billing date                   │
│  OR MANUAL: User clicks demo button                          │
│                                                              │
│  1. Calculate actual: 1520 - 1000 = 520 kWh                 │
│  2. Calculate actual cost: ₱1,742                            │
│  3. Update forecast: actual_cost, actual_usage, accuracy     │
│  4. Add to historical_data: Oct → 520 kWh, ₱1,742           │
│  5. Retrain model with Oct data (now 4 months)              │
│  6. Update MAE across all forecasts                          │
│  7. Clear baseline (ready for next cycle)                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 NEW CYCLE BEGINS (Nov 5)                     │
│  - Last month (Oct) shows: Predicted ₱1,680 vs Actual ₱1,742│
│  - Current cycle reset, waiting for first reading            │
│  - Model improved with October data                          │
│  - Cycle repeats...                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features of the System

### 1. **Monthly Feature Alignment**
- Training data: Monthly aggregates (consumption + bill)
- Prediction features: Monthly-level calculations
- NO daily-level features that don't exist in training data

### 2. **Automatic Cycle Management**
- Scheduler runs daily at midnight
- Checks all users' billing dates
- Triggers cycle end automatically
- No manual intervention needed in production

### 3. **Progressive Learning**
- Each completed cycle = 1 new training sample
- Model retrains automatically
- Accuracy improves over time as more data collected

### 4. **Forecast Storage Logic**
- First prediction of cycle: Store in DB
- Subsequent predictions: Return existing forecast
- Update with actuals only when cycle ends

### 5. **Demo Mode**
- Bypasses date checks for testing
- Same logic as production
- Useful for panel demonstrations

---

## Database Tables Used

1. **user_historical_data**
   - Monthly consumption and bills entered by user
   - Used for initial training and retraining

2. **user_meter_readings**
   - Individual meter readings with timestamps
   - Used to calculate cycle consumption

3. **user_preferences**
   - Billing dates (water_billing_date, electricity_billing_date)
   - Baseline readings (water_baseline_reading, water_baseline_date)

4. **cost_forecasts**
   - Predicted cost/usage (stored when first generated)
   - Actual cost/usage (filled when cycle ends)
   - Accuracy metrics

5. **user_forecasting_models**
   - Model parameters and coefficients
   - Feature names and importance
   - Performance metrics (MAE, R²)

---

## For Panel Presentation

**Elevator Pitch:**
"Our AI learns from your actual monthly bills - just like the statements you receive. Each billing cycle, it predicts your next month's cost using 5 monthly factors: your daily rate, cycle length, seasonal patterns, last month's usage, and your 3-month trend. When the cycle ends, we compare predicted vs actual, add the real data to our training set, and the model gets smarter. It's a self-improving system that becomes more accurate with every billing cycle."

**Key Differentiators:**
1. ✅ Trains on actual billing data (monthly aggregates)
2. ✅ Features match training data format (no mismatch)
3. ✅ Automatic cycle management (no manual intervention)
4. ✅ Progressive learning (improves over time)
5. ✅ Transparent predictions (show accuracy on past forecasts)
