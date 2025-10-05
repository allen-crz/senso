# Cost Forecasting Model Features Explanation

## Overview
Our Linear Regression model uses 5 monthly-level features to predict your monthly utility costs. These features are designed to match the monthly billing data format, ensuring accurate predictions based on actual billing patterns.

---

## The 5 Monthly Features Explained

### 1. **Average Daily Consumption** (avg_daily_consumption)
**What it is:** Your total monthly consumption divided by the number of days in your billing cycle.

**Why it matters:** This normalizes consumption across different month lengths, making it comparable. A 28-day February vs 31-day July can be fairly compared using this rate.

**Example:**
- September: 750 kWh / 30 days = 25 kWh/day
- October: 775 kWh / 31 days = 25 kWh/day
- Same daily rate, but different monthly totals due to length

**Typical Importance:** 30-40% of prediction weight

---

### 2. **Days in Billing Cycle** (days_in_billing_cycle)
**What it is:** The actual number of days in your billing period (typically 28-31 days).

**Why it matters:** Different month lengths directly affect total consumption. The model uses this to properly scale predictions for each billing cycle.

**Example:**
- February: 28 days × 25 kWh/day = 700 kWh
- July: 31 days × 25 kWh/day = 775 kWh
- Feature helps model understand the extra 75 kWh is due to 3 extra days

**Typical Importance:** 10-15% of prediction weight

---

### 3. **Month Number** (month_number)
**What it is:** The current month as a number (1=January, 2=February, ..., 12=December)

**Why it matters:** Seasonal variations affect utility usage:
- **Electricity:** Higher in summer (air conditioning) or winter (heating)
- **Water:** Higher in summer (gardening, pools) or during dry seasons

**Example:**
- July (month 7): High AC usage → Higher electricity consumption
- December (month 12): Cold weather → Higher water heating costs

**Typical Importance:** 15-20% of prediction weight

---

### 4. **Previous Month Consumption** (prev_month_consumption)
**What it is:** Your total consumption from the previous billing cycle.

**Why it matters:** Consumption tends to be correlated month-to-month. Last month's usage provides a strong baseline for predicting this month, unless seasonal changes occur.

**Example:**
- September: 750 kWh
- October prediction starts with: "Likely 700-800 kWh (similar to last month)"
- Unless October→November brings heating season (then increase expected)

**Typical Importance:** 20-25% of prediction weight

---

### 5. **3-Month Moving Average** (3mo_moving_average)
**What it is:** The average of your last 3 months' total consumption.

**Why it matters:** This smooths out short-term fluctuations and captures recent trends. It's less sensitive to one-off spikes but responds to gradual changes in usage patterns.

**Example:**
- July: 820 kWh (high AC)
- August: 800 kWh (high AC)
- September: 600 kWh (cooling down)
- 3-month average = 740 kWh (smoothed trend showing decline)

**Typical Importance:** 15-20% of prediction weight

---

## How the Model Uses These Features

### Simple Example Prediction:
```
Your Historical Data:
- Previous month (September): 750 kWh consumption
- 3-month average: 760 kWh (July: 820, August: 780, Sept: 750)
- Current month: October (month 10)
- Billing cycle: 30 days
- Current daily rate: 25 kWh/day (from recent meter readings)

Model Calculation:
1. Normalizes your current rate: 25 kWh/day
2. Considers October is month 10 (moderate seasonal demand)
3. Notes last month was 750 kWh (stable baseline)
4. Factors in 3-month trend showing slight decline (760 kWh avg)
5. Predicts for 30-day cycle
6. Final prediction: ~765 kWh (₱2,550)
```

---

## Feature Importance Visualization

When you view your model details, you'll see percentages showing how much each feature influences predictions:

```
Feature Importance (Example):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Avg Daily Consumption   ████████████ 35%
Previous Month          ███████      22%
3-Month Avg             ██████       20%
Month Number            ██████       15%
Days in Cycle           ███          8%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Why This Matters for Accurate Predictions

### Monthly Alignment ✅
Training on monthly data and using monthly features ensures:
- Model learns from actual billing patterns
- Predictions match how you're billed
- No mismatch between training and prediction data

### Seasonal Patterns ✅
The **month number** captures:
- Summer AC usage spikes
- Winter heating increases
- Dry season water consumption

### Consumption Trends ✅
The **previous month** and **3-month average** track:
- Month-to-month consistency
- Gradual usage changes
- Household baseline shifts

### Billing Cycle Normalization ✅
The **days in cycle** and **avg daily consumption** ensure:
- Fair comparison across different month lengths
- Proper scaling for 28-day vs 31-day cycles
- Accurate daily rate calculations

---

## How the Model Learns and Improves

Every billing cycle:
1. **Model predicts** your cost based on these 7 features
2. **Billing cycle ends** - we calculate your actual consumption and cost
3. **Model compares** predicted vs actual (accuracy check)
4. **Model retrains** with the new data point (1 month = 1 training sample)
5. **Feature weights adjust** to improve future predictions

After 3-6 months of data, the model becomes highly accurate for your specific patterns!

---

## Technical Note

**Model Type:** Linear Regression
**Training Data:** Monthly aggregates (consumption + actual bill from historical records)
**Data Points:** Each completed billing cycle adds 1 training sample
**Update Frequency:** Model retrains automatically when billing cycle ends
**Prediction Method:** Weighted sum of 5 monthly features × their learned coefficients
**Feature Alignment:** Training and prediction use the same monthly-level features

---

## For the Panel Presentation

**Key Message:**
*"Our AI model is trained on your monthly billing history - just like the bills you receive. It analyzes 5 key monthly factors: your normalized daily rate, billing cycle length, seasonal patterns (month of year), last month's consumption, and your recent 3-month trend. This monthly-to-monthly approach ensures the model learns from the exact same data format as your utility bills, making predictions more reliable and aligned with how you're actually billed."*
