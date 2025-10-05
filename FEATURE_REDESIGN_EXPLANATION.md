# Feature Redesign: Monthly vs Daily

## The Problem Discovered

### Current Implementation (WRONG)
**Training Data:** Monthly aggregates
- September 2024: 750 kWh total, $2,500 total
- October 2024: 820 kWh total, $2,750 total

**Features Being Used:**
- `daily_consumption` ❌ (Don't have daily breakdown in monthly data!)
- `billing_cycle_day` ❌ (Don't know which day within the month!)
- `elapsed_days` ❌ (Only have monthly totals!)
- `rolling_avg_7day` ❌ (No daily data to calculate this!)
- `rolling_avg_30day` ❌ (Only have monthly totals!)

**The Mismatch:** Training on monthly totals but using daily-level features that don't exist in the training data!

---

## Two Possible Solutions

### Option 1: Keep Monthly Training (Simpler, Recommended)

**Training Data:** Monthly aggregates (consumption + bill per month)

**Appropriate Features:**
1. **Month Number** (1-12)
   - Seasonal patterns: summer AC, winter heating
   - Works with monthly data ✅

2. **Days in Billing Cycle** (28-31)
   - Different month lengths affect total consumption
   - Can be calculated from month_date ✅

3. **Average Daily Consumption**
   - `consumption / days_in_month`
   - Derived from monthly total ✅

4. **Previous Month Consumption** (lag feature)
   - Use last month's total to predict this month
   - Available from historical sequence ✅

5. **3-Month Moving Average**
   - Average of last 3 months
   - Smooths short-term fluctuations ✅

**Prediction:**
```python
# Training
features = [month_number, days_in_cycle, avg_daily, prev_month_consumption, 3mo_avg]
target = monthly_consumption

# Predicting
current_month_features = [10, 30, 25.5, 750, 760]  # October, 30 days, etc.
predicted_consumption = model.predict(current_month_features)
```

**Pros:**
- Matches training data ✅
- Simple, clean ✅
- Works with onboarding historical data ✅
- No need for daily meter readings to train ✅

**Cons:**
- Less responsive to mid-month changes
- Can't leverage daily meter reading patterns

---

### Option 2: Switch to Daily Training (Complex, More Accurate)

**Training Data:** Daily meter reading pairs
- Day 1: 1000 kWh → Day 2: 1025 kWh (25 kWh consumed)
- Day 2: 1025 kWh → Day 3: 1053 kWh (28 kWh consumed)

**Appropriate Features:**
1. **Daily Consumption** (from reading pairs)
2. **Day of Week** (weekday vs weekend patterns)
3. **Billing Cycle Day** (day 1-30 of cycle)
4. **7-Day Rolling Average**
5. **30-Day Rolling Average**
6. **Month Number** (seasonal)
7. **Elapsed/Remaining Days**

**Prediction:**
```python
# Training on DAILY pairs
features = [daily_consumption, day_of_week, billing_day, rolling_7d, rolling_30d, month]
target = daily_cost

# Predicting
for each_day_remaining:
    daily_cost = model.predict(day_features)
    total_cost += daily_cost
```

**Pros:**
- More responsive to real-time changes ✅
- Leverages actual meter reading patterns ✅
- Can detect daily usage variations ✅

**Cons:**
- Requires daily meter readings for training ❌
- Can't use onboarding monthly historical data directly ❌
- More complex prediction (need to sum daily predictions) ❌

---

## Recommended Approach: Option 1 (Monthly)

### Why Monthly Training is Better for Your Use Case:

1. **Onboarding Data:** Users provide monthly bills
   - "I used 750 kWh in September and paid $2,500"
   - This is MONTHLY data, not daily

2. **Billing Cycle Alignment:** Bills are monthly
   - You want to predict monthly cost
   - Training on monthly → predicting monthly = direct match

3. **Simplicity:** One prediction per month
   - Monthly consumption → Monthly cost
   - No need to aggregate daily predictions

4. **Data Availability:** Historical bills are always monthly
   - Electricity/water companies bill monthly
   - Users have monthly bills, not daily logs

---

## Revised Feature Set for Monthly Training

### Feature 1: **Month Number** (1-12)
**What it is:** Current month as number (1=Jan, 12=Dec)

**Why it works with monthly data:**
- Every monthly bill has a month
- Captures seasonal patterns
- Summer: High AC → High consumption
- Winter: High heating → High consumption

**Example:**
- July bills (month 7) → High AC usage
- December bills (month 12) → High heating

---

### Feature 2: **Days in Billing Cycle**
**What it is:** Number of days in the billing period (28-31)

**Why it works with monthly data:**
- Derived from the month_date in historical records
- Normalizes for month length differences
- February (28 days) vs July (31 days)

**Example:**
- February: 28 days × 25 kWh/day = 700 kWh
- July: 31 days × 25 kWh/day = 775 kWh
- Feature helps model understand the extra 75 kWh is due to 3 extra days

---

### Feature 3: **Average Daily Consumption**
**What it is:** Monthly total ÷ Days in month

**Why it works with monthly data:**
- Calculated from monthly total: `consumption / days_in_month`
- Normalizes across different month lengths
- Comparable across months

**Example:**
- September: 750 kWh / 30 days = 25 kWh/day
- October: 775 kWh / 31 days = 25 kWh/day
- Same daily rate, different monthly total due to length

---

### Feature 4: **Previous Month Consumption**
**What it is:** Last month's total consumption

**Why it works with monthly data:**
- Historical records are ordered by month
- Sequential data: Sept → Oct → Nov
- Usage tends to be correlated month-to-month

**Example:**
- If September = 750 kWh
- October likely in range of 700-800 kWh (similar)
- Unless seasonal change (Oct→Nov might increase for heating)

---

### Feature 5: **3-Month Moving Average**
**What it is:** Average of last 3 months' consumption

**Why it works with monthly data:**
- Smooths seasonal fluctuations
- Provides stable baseline
- Captures recent trend

**Example:**
- July: 820 kWh (high AC)
- Aug: 800 kWh (high AC)
- Sept: 600 kWh (cooling down)
- 3-month avg = 740 kWh (smoothed trend)

---

### Feature 6: **Year** (optional, for multi-year data)
**What it is:** Calendar year (2023, 2024)

**Why it works with monthly data:**
- Captures year-over-year changes
- New appliances, household changes
- Rate increases over time

**Example:**
- 2023: Average 700 kWh/month
- 2024: New AC installed → Average 800 kWh/month
- Model learns the baseline shifted

---

## Updated Training Process

```python
# From monthly historical data
training_data = [
    {
        "month_date": "2024-01-05",
        "consumption": 680,
        "bill": 2300,
        "month_number": 1,          # January
        "days_in_cycle": 31,
        "avg_daily": 21.9,          # 680 / 31
        "prev_month": 720,          # December consumption
        "3mo_avg": 710              # Oct+Nov+Dec avg
    },
    {
        "month_date": "2024-02-05",
        "consumption": 650,
        "bill": 2200,
        "month_number": 2,          # February
        "days_in_cycle": 29,        # Leap year
        "avg_daily": 22.4,          # 650 / 29
        "prev_month": 680,          # January
        "3mo_avg": 683              # Nov+Dec+Jan avg
    },
    # ... more months
]

# Train model
X = [month_number, days_in_cycle, avg_daily, prev_month, 3mo_avg]
y = consumption

model.fit(X, y)
```

---

## Prediction Process

```python
# User wants prediction for current month (October)
current_features = {
    "month_number": 10,              # October
    "days_in_cycle": 30,             # Oct 5 - Nov 4
    "avg_daily": 25.5,               # Estimated from recent readings
    "prev_month": 750,               # September consumption (actual)
    "3mo_avg": 760                   # July+Aug+Sept average
}

predicted_consumption = model.predict([10, 30, 25.5, 750, 760])
# Output: 765 kWh

# Then use utility rate calculator
predicted_cost = calculate_bill(765, month="october")
# Output: $2,550
```

---

## Why This Fixes the Problem

### Before (WRONG):
- Training: Monthly totals
- Features: Daily breakdowns (that don't exist!)
- Result: Model confused, poor predictions ❌

### After (CORRECT):
- Training: Monthly totals
- Features: Monthly-level data (that exists!)
- Result: Model aligned, accurate predictions ✅

---

## For the Panel Presentation

**Updated Message:**

*"Our AI model is trained on your monthly billing history - just like the bills you receive. It analyzes 5 key factors: seasonal patterns (month of year), billing cycle length, your average daily rate, last month's usage, and your recent 3-month trend. This monthly-to-monthly approach ensures the model learns from the exact same data format as your utility bills, making predictions more reliable and aligned with how you're actually billed."*

**Key Points:**
1. ✅ **Training data = Monthly bills** (what users have)
2. ✅ **Features = Monthly-level factors** (what can be derived)
3. ✅ **Prediction = Monthly consumption** (what users need)
4. ✅ **Simple, clean, aligned** with billing reality
