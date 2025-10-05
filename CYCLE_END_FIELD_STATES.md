# Cycle End - Exact Field States

## What Happens to Each Field When Cycle Ends

### Scenario: Billing cycle ends November 5, 00:00 AM

---

## Backend State After Automatic Reset

### `user_preferences` table:
```python
{
    "electricity_last_bill_reading": null,     # CLEARED
    "electricity_last_bill_date": null,        # CLEARED
    "electricity_billing_date": 5              # UNCHANGED (always stays 5)
}
```

---

## API Response Immediately After Reset (Nov 5, 08:00 AM)

### `/current-cycle-consumption/electricity`

**Before user takes new reading:**
```json
{
    "has_baseline": false,
    "cycle_consumption": null,
    "baseline_reading": null,
    "baseline_date": null,
    "latest_reading": 1520,  // Last reading from Oct 31 (still in DB)

    "billing_cycle": {
        "start_date": "2024-11-05",        // NEW cycle start
        "end_date": "2024-12-04",          // NEW cycle end
        "elapsed_days": 0,                 // RESET to 0
        "remaining_days": 30,              // RESET to full cycle (30 days)
        "total_days": 30
    },

    "daily_average": 0                     // RESET to 0
}
```

### `/monthly-forecast`

```json
{
    "predicted_monthly_cost": 1720,        // NEW forecast for Nov cycle
    "predicted_monthly_consumption": 510,
    "billing_cycle_days": 30,
    "elapsed_days": 0,                     // RESET to 0
    "remaining_days": 30,                  // RESET to 30
    "confidence_score": 0.87               // Improved (model has 4 months now)
}
```

### `/forecast-comparison/electricity?limit=1`

```json
[
    {
        "billing_month": "October 2024",
        "predicted_cost": 1680,            // What we predicted
        "actual_cost": 1742,               // What actually happened
        "predicted_usage": 750,
        "actual_usage": 520,
        "accuracy_percent": 96.4,
        "variance": 62,
        "variance_type": "under"           // Predicted lower than actual
    }
]
```

---

## Frontend Display - Immediately After Reset

### Before User Takes First Reading (Nov 5, 08:00 AM):

```
┌─────────────────────────────────────────┐
│ Electricity Forecast                    │
│ Monthly prediction              ⚡       │  ← No cycle days shown
├─────────────────────────────────────────┤
│                                         │
│          ₱1,720                         │  ← NEW forecast for Nov
│                                         │
├─────────────────────────────────────────┤
│ [NO "So Far This Cycle" SECTION]       │  ← HIDDEN (has_baseline = false)
│                                         │
│ Smart Prediction Active                 │
│ High Accuracy                           │
│                                         │
├─────────────────────────────────────────┤
│ Predicted Monthly Usage: 510 kWh       │
│ Predicted Avg Daily Cost: ₱57.33       │
│ Remaining Days: 30 days                 │  ← Full cycle ahead
├─────────────────────────────────────────┤
│ Last Month Accuracy              ✓      │  ← Shows October results
│                                         │
│ 96.4%                                   │
│                                         │
│ Predicted: ₱1,680                       │
│ Actual: ₱1,742                          │
└─────────────────────────────────────────┘
```

**Key Points:**
- ❌ **Progress bar HIDDEN** (no baseline = no cycle data)
- ❌ **Daily average HIDDEN** (no consumption yet)
- ❌ **Pace HIDDEN** (no consumption to compare)
- ❌ **"From X → Y" HIDDEN** (no baseline to show)
- ✅ **Remaining days shows: 30** (full cycle)
- ✅ **Last Month Accuracy SHOWS** (October comparison)
- ✅ **New forecast shows: ₱1,720** (for November)

---

## After User Takes First Reading (Nov 5, 09:00 AM)

**User scans meter: 1520 kWh**

### API Response: `/current-cycle-consumption/electricity`
```json
{
    "has_baseline": true,                  // Baseline auto-set
    "cycle_consumption": 0,                // 1520 - 1520 = 0
    "baseline_reading": 1520,              // NEW baseline
    "baseline_date": "2024-11-05",         // NEW cycle start
    "latest_reading": 1520,                // Same as baseline (first reading)

    "billing_cycle": {
        "start_date": "2024-11-05",
        "end_date": "2024-12-04",
        "elapsed_days": 0,                 // Just started
        "remaining_days": 30,              // Full cycle
        "total_days": 30
    },

    "daily_average": 0                     // 0 / 0 = 0 (no consumption yet)
}
```

### Frontend Display:

```
┌─────────────────────────────────────────┐
│ Electricity Forecast                    │
│ 0 of 30 days                    ⚡       │  ← NOW shows cycle position
├─────────────────────────────────────────┤
│                                         │
│          ₱1,720                         │
│                                         │
├─────────────────────────────────────────┤
│ So Far This Cycle                       │  ← NOW VISIBLE
│ 0 kWh                                   │
│ [░░░░░░░░░░░░░░░░░░░░] 0%              │  ← Progress bar at 0%
│ From 1520 (Nov 5) → 1520                │  ← Shows baseline → latest
├─────────────────────────────────────────┤
│ Smart Prediction Active                 │
│ High Accuracy                           │
│                                         │
├─────────────────────────────────────────┤
│ Daily Average (This Cycle): 0 kWh/day  │  ← Shows 0 (no consumption)
│ Predicted Monthly Usage: 510 kWh       │
│ Predicted Avg Daily Cost: ₱57.33       │
│ Remaining Days: 30 days                 │
├─────────────────────────────────────────┤
│ Last Month Accuracy              ✓      │
│                                         │
│ 96.4%                                   │
│                                         │
│ Predicted: ₱1,680                       │
│ Actual: ₱1,742                          │
└─────────────────────────────────────────┘
```

**Key Points:**
- ✅ **Progress bar SHOWS** at 0%
- ✅ **Cycle position: "0 of 30 days"**
- ✅ **Daily average: 0 kWh/day**
- ✅ **From/To bar: "From 1520 (Nov 5) → 1520"** (baseline to latest)
- ✅ **Remaining days: 30**
- ❌ **Pace STILL HIDDEN** (no consumption yet to compare)
- ✅ **Last Month Accuracy SHOWS**

---

## After Second Reading (Nov 10 - Day 5)

**User scans meter: 1645 kWh**

### API Response:
```json
{
    "has_baseline": true,
    "cycle_consumption": 125,              // 1645 - 1520 = 125 kWh
    "baseline_reading": 1520,
    "baseline_date": "2024-11-05",
    "latest_reading": 1645,

    "billing_cycle": {
        "start_date": "2024-11-05",
        "end_date": "2024-12-04",
        "elapsed_days": 5,                 // 5 days passed
        "remaining_days": 25,              // 25 days left
        "total_days": 30
    },

    "daily_average": 25                    // 125 / 5 = 25 kWh/day
}
```

### Frontend Display:

```
┌─────────────────────────────────────────┐
│ Electricity Forecast                    │
│ 5 of 30 days                    ⚡       │  ← Shows progress
├─────────────────────────────────────────┤
│                                         │
│          ₱1,720                         │
│                                         │
├─────────────────────────────────────────┤
│ So Far This Cycle                       │
│ 125 kWh                                 │
│ [███████░░░░░░░░░░░░░] 17%             │  ← Progress bar at 17%
│ From 1520 (Nov 5) → 1645                │  ← Updated latest
├─────────────────────────────────────────┤
│ Smart Prediction Active                 │
│ High Accuracy                           │
│                                         │
├─────────────────────────────────────────┤
│ Daily Average (This Cycle): 25 kWh/day │  ← NOW calculated
│ Your Pace: On track                     │  ← NOW shows pace
│ Predicted Monthly Usage: 510 kWh       │
│ Predicted Avg Daily Cost: ₱57.33       │
│ Remaining Days: 25 days                 │  ← Counting down
├─────────────────────────────────────────┤
│ Last Month Accuracy              ✓      │
│                                         │
│ 96.4%                                   │
│                                         │
│ Predicted: ₱1,680                       │
│ Actual: ₱1,742                          │
└─────────────────────────────────────────┘
```

---

## Summary of Field Reset Behavior

| Field | End of Cycle (No Baseline) | First Reading (Baseline Set) | Second Reading (Day 5) |
|-------|---------------------------|------------------------------|------------------------|
| **Progress Bar** | Hidden | 0% (shows but empty) | 17% (shows progress) |
| **Cycle Days Header** | "Monthly prediction" | "0 of 30 days" | "5 of 30 days" |
| **Cycle Consumption** | null (hidden) | 0 kWh | 125 kWh |
| **From → To Bar** | Hidden | "From 1520 → 1520" | "From 1520 → 1645" |
| **Daily Average** | Hidden | 0 kWh/day | 25 kWh/day |
| **Pace** | Hidden | Hidden | "On track" |
| **Elapsed Days** | 0 | 0 | 5 |
| **Remaining Days** | 30 | 30 | 25 |
| **Last Month Accuracy** | Shows Oct results | Shows Oct results | Shows Oct results |
| **New Forecast** | ₱1,720 (Nov) | ₱1,720 (Nov) | ₱1,720 (Nov) |

---

## Visual Progression

### 1. Right After Midnight Reset (No Baseline)
```
┌────────────────────────┐
│ Monthly prediction     │
│ ₱1,720                 │
│ [NO CYCLE DATA]        │
│ Remaining: 30 days     │
│                        │
│ Last Month: 96.4% ✓    │
│ Predicted: ₱1,680      │
│ Actual: ₱1,742         │
└────────────────────────┘
```

### 2. After First Reading (Baseline Set)
```
┌────────────────────────┐
│ 0 of 30 days           │
│ ₱1,720                 │
│                        │
│ 0 kWh                  │
│ [░░░░░░░░░░] 0%       │
│ 1520 → 1520            │
│                        │
│ Daily Avg: 0 kWh/day   │
│ Remaining: 30 days     │
│                        │
│ Last Month: 96.4% ✓    │
└────────────────────────┘
```

### 3. After Second Reading (Day 5)
```
┌────────────────────────┐
│ 5 of 30 days           │
│ ₱1,720                 │
│                        │
│ 125 kWh                │
│ [███░░░░░░░] 17%      │
│ 1520 → 1645            │
│                        │
│ Daily Avg: 25 kWh/day  │
│ Pace: On track         │
│ Remaining: 25 days     │
│                        │
│ Last Month: 96.4% ✓    │
└────────────────────────┘
```

---

## Your Questions Answered

**Q: "billing position remaining days pace daily average progress bar is reset to 0 or 30 days?"**

A:
- **Remaining days:** 30 days (full cycle)
- **Elapsed days:** 0 days
- **Progress bar:** 0% (or hidden if no baseline)
- **Daily average:** 0 kWh/day (or hidden if no baseline)
- **Pace:** Hidden (need consumption to calculate)

**Q: "the from of the bar should be from(billing start) last reading →"**

A:
- **Immediately after reset:** Hidden (no baseline)
- **After first reading:** "From 1520 (Nov 5) → 1520" (baseline = latest)
- **After next reading:** "From 1520 (Nov 5) → 1645" (baseline → latest)

**Q: "then the new forecasts and below the last predicted vs actual right?"**

A: YES, exactly:
```
NEW FORECAST (top):
┌────────────────────────┐
│ ₱1,720                 │  ← New forecast for Nov
└────────────────────────┘

LAST MONTH COMPARISON (bottom):
┌────────────────────────┐
│ Last Month Accuracy    │
│ 96.4% ✓                │
│                        │
│ Predicted: ₱1,680      │  ← Oct prediction
│ Actual: ₱1,742         │  ← Oct actual
└────────────────────────┘
```

---

## Correct Layout Flow

```
┌─────────────────────────────────────────┐
│ [UTILITY] Forecast          [ICON]      │
│ [CYCLE POSITION]                        │  ← "0 of 30" or "Monthly"
├─────────────────────────────────────────┤
│                                         │
│    [NEW FORECAST AMOUNT]                │  ← ₱1,720 for Nov
│                                         │
├─────────────────────────────────────────┤
│ So Far This Cycle                       │  ← Hidden if no baseline
│ [CONSUMPTION]                           │
│ [PROGRESS BAR] [%]                      │
│ From [BASELINE] → [LATEST]              │
├─────────────────────────────────────────┤
│ Smart Prediction / Model Info           │
├─────────────────────────────────────────┤
│ Daily Average (This Cycle): [VALUE]     │  ← 0 then increases
│ Your Pace: [STATUS]                     │  ← Hidden at start
│ Predicted Monthly Usage: [VALUE]        │
│ Remaining Days: [DAYS]                  │  ← 30 → 29 → 28...
├─────────────────────────────────────────┤
│ Last Month Accuracy                     │  ← Oct comparison
│ [ACCURACY %] [ICON]                     │
│                                         │
│ Predicted: [OLD FORECAST]               │  ← ₱1,680 (Oct)
│ Actual: [ACTUAL COST]                   │  ← ₱1,742 (Oct)
└─────────────────────────────────────────┘
```
