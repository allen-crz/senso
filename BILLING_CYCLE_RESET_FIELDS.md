# Billing Cycle Reset - Field Behavior

## What Happens When Billing Cycle Resets

When the demo button is clicked or automatic scheduler triggers billing cycle end:

### Backend Changes (Step 5 of `reset_forecast_at_billing_date()`)

**Database Updates:**
```python
# user_preferences table
{
    "{utility_type}_last_bill_reading": None,  # Cleared ✓
    "{utility_type}_last_bill_date": None      # Cleared ✓
}
```

**What Gets Reset:**
1. ✅ Baseline reading cleared
2. ✅ Baseline date cleared
3. ✅ Historical data added (actual consumption + cost)
4. ✅ Forecast updated with actuals
5. ✅ Model retrained with new data point

**What Stays:**
- ❌ Billing day (e.g., 5th) - Never changes
- ❌ Meter readings in database - Preserved for history
- ❌ Previous forecasts - Stored permanently for comparison

---

## API Response After Reset

### `/current-cycle-consumption/{utility_type}` Endpoint

**When baseline is cleared (immediately after reset):**

```json
{
    "utility_type": "water",
    "has_baseline": false,
    "message": "No baseline reading available. Please scan your first meter reading.",
    "cycle_consumption": null,
    "baseline_reading": null,
    "latest_reading": null,
    "baseline_date": null,
    "billing_cycle": {
        "start_date": "2024-11-05",    // Correct next cycle start
        "end_date": "2024-12-04",      // Correct next cycle end
        "elapsed_days": 0,              // Reset to 0
        "remaining_days": 30,           // Full cycle ahead
        "total_days": 30
    },
    "daily_average": 0                  // Reset to 0
}
```

**After user takes first reading in new cycle:**

The first reading automatically becomes the new baseline:
```json
{
    "utility_type": "water",
    "has_baseline": true,
    "cycle_consumption": 0,             // Starts from 0
    "baseline_reading": 1520.5,         // New baseline
    "latest_reading": 1520.5,           // Same as baseline (first reading)
    "baseline_date": "2024-11-05",      // New cycle start
    "billing_cycle": {
        "start_date": "2024-11-05",
        "end_date": "2024-12-04",
        "elapsed_days": 0,              // Just started
        "remaining_days": 30,
        "total_days": 30
    },
    "daily_average": 0                  // No consumption yet
}
```

---

## Frontend Display After Reset

### Simplified Water/Electricity Forecast Components

**Before Reset (mid-cycle):**
```
Water Forecast
15 of 30 days                          ← Shows progress

₱1,680                                 ← Predicted cost

So Far This Cycle
250 kWh                                ← Cycle consumption
[████████████░░░░░░░░] 50%            ← Progress bar
From 1000 (Oct 5) → 1250              ← Baseline to latest

Daily Average (This Cycle): 16.67 kWh/day
Your Pace: +5% above                   ← Comparing to forecast

Last Month Accuracy                    ← Previous cycle comparison
✓ 96.4%
Predicted: ₱1,680
Actual: ₱1,742
```

**Immediately After Reset (no baseline):**
```
Water Forecast
Monthly prediction                     ← Generic message (no cycle data)

₱1,680                                 ← New forecast for next cycle

[No "So Far This Cycle" section]      ← Hidden (hasCycleData = false)

[No Daily Average shown]               ← Hidden (hasCycleData = false)
[No Pace shown]                        ← Hidden (paceVsForecast = null)

Last Month Accuracy                    ← NOW SHOWS previous cycle!
✓ 96.4%
Predicted: ₱1,680
Actual: ₱1,742
```

**After First Reading in New Cycle:**
```
Water Forecast
0 of 30 days                           ← Fresh cycle starts

₱1,720                                 ← Updated forecast (model improved)

So Far This Cycle
0 kWh                                  ← Starting from zero
[░░░░░░░░░░░░░░░░░░░░] 0%             ← Progress bar at 0%
From 1520.5 (Nov 5) → 1520.5          ← New baseline

Daily Average (This Cycle): 0 kWh/day  ← Will update with next reading
[No Pace yet]                          ← Needs consumption first

Last Month Accuracy
✓ 96.4%
Predicted: ₱1,680
Actual: ₱1,742
```

---

## Field-by-Field Reset Behavior

| Field | Before Reset | After Reset (No Baseline) | After First New Reading |
|-------|-------------|---------------------------|-------------------------|
| **has_baseline** | `true` | `false` ✓ | `true` |
| **cycle_consumption** | `250 kWh` | `null` ✓ | `0 kWh` |
| **baseline_reading** | `1000` | `null` ✓ | `1520.5` (new) |
| **baseline_date** | `Oct 5` | `null` ✓ | `Nov 5` (new) |
| **latest_reading** | `1250` | `1250` (preserved) | `1520.5` (new) |
| **billing_cycle.start_date** | `Oct 5` | `Nov 5` ✓ | `Nov 5` |
| **billing_cycle.end_date** | `Nov 4` | `Dec 4` ✓ | `Dec 4` |
| **billing_cycle.elapsed_days** | `15` | `0` ✓ | `0` |
| **billing_cycle.remaining_days** | `15` | `30` ✓ | `30` |
| **billing_cycle.total_days** | `30` | `30` | `30` |
| **daily_average** | `16.67` | `0` ✓ | `0` |
| **Progress Bar %** | `50%` | `0%` ✓ | `0%` |
| **Pace vs Forecast** | `+5%` | `null` (hidden) ✓ | `null` (needs data) |

---

## Why It Works

### 1. Baseline Clearing
- Both `_last_bill_reading` AND `_last_bill_date` set to `null`
- `get_billing_cycle_baseline()` returns `None`
- Next reading auto-sets as new baseline

### 2. Frontend Logic
```typescript
const hasCycleData = cycleData?.has_baseline && cycleData?.cycle_consumption !== null;

// When hasCycleData = false:
// - Progress bar shows 0%
// - "So Far This Cycle" section hidden
// - Daily average hidden
// - Pace hidden
```

### 3. Billing Cycle Calculation
- `_calculate_billing_position()` works independently of baseline
- Uses only billing_day from preferences
- Calculates correct cycle dates even with no baseline
- Returns proper `elapsed_days` and `remaining_days`

### 4. API Consistency
- All response paths include `billing_cycle` object ✓
- All response paths include `daily_average` field ✓
- Frontend never gets undefined values ✓

---

## Reset Doesn't Affect (By Design)

❌ **Billing Day** - User's billing date (e.g., 5th) never changes
❌ **Historical Forecasts** - Previous cycle data preserved in `cost_forecasts`
❌ **Meter Readings** - All readings kept in `meter_readings` table
❌ **Model** - Retrained with new data (improved, not reset)
❌ **Historical Data** - New training point added to `user_historical_data`

---

## Summary

**Reset Flow:**
1. Demo button clicked OR automatic scheduler detects billing date
2. Backend clears baseline reading + baseline date
3. Backend updates forecast with actuals, retrains model
4. API returns `has_baseline: false` with reset cycle data
5. Frontend hides cycle progress UI
6. User takes next reading → Auto-sets as new baseline
7. Cycle tracking starts fresh

**All Fields Reset Properly:** ✅
- Progress bar: 0%
- Cycle consumption: null → 0
- Daily average: 0
- Pace: hidden
- Billing position: Correct new cycle dates
- Elapsed days: 0
- Remaining days: Full cycle
