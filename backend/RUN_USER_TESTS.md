# User Testing Guide

## Test Account
- **Email**: test2@gmail.com
- **Password**: Test@123

## Prerequisites
1. Backend server must be running on `http://localhost:8000`
2. Test account must exist in the database
3. Python dependencies installed (httpx, loguru)

## Test Scripts

### Test 1: Meter Reading Simulation
**File**: `user_test_1_meter_readings.py`

**Purpose**: Establish baseline meter readings for both water and electricity utilities.

**What it does**:
- Creates 10 water readings with normal consumption patterns (10-15 m³/day)
- Creates 10 electricity readings with normal consumption patterns (20-30 kWh/day)
- Establishes baseline data for anomaly detection

**Run**:
```bash
cd backend
python user_test_1_meter_readings.py
```

**Expected Output**:
- 20 total readings created (10 water, 10 electricity)
- No anomalies should be detected
- Summary of readings displayed

---

### Test 2: Anomaly Detection Testing
**File**: `user_test_2_anomaly_detection.py`

**Purpose**: Test the anomaly detection system with various scenarios.

**Prerequisites**: Run Test 1 first to establish baseline data.

**What it does**:
- Tests water spike detection (massive increase - simulated leak)
- Tests water rollback detection (reading goes backward)
- Tests electricity spike detection (high usage)
- Verifies normal readings after anomalies are not flagged

**Run**:
```bash
cd backend
python user_test_2_anomaly_detection.py
```

**Expected Output**:
- Spikes should be detected as anomalies (high severity)
- Rollbacks should be detected as anomalies (critical severity)
- Normal readings after anomalies should NOT be flagged
- Anomaly details displayed (severity, score, factors, recommendations)

---

### Test 3: Complete End-to-End Simulation
**File**: `user_test_3_complete_simulation.py`

**Purpose**: Comprehensive test combining all scenarios in a single run.

**What it does**:
1. **Phase 1**: Establishes baseline readings (5 readings per utility)
2. **Phase 2**: Creates normal usage patterns (3 readings per utility)
3. **Phase 3**: Injects anomalies (spikes, rollbacks) and tests detection
4. **Phase 4**: Validates results and displays statistics
5. **Final Report**: Shows accuracy, false positives, and overall performance

**Run**:
```bash
cd backend
python user_test_3_complete_simulation.py
```

**Expected Output**:
- All phases complete successfully
- Anomalies correctly identified
- Low/zero false positive rate
- Comprehensive report with accuracy percentage
- Statistics and consumption trends

---

## Test Execution Order

### Recommended Order:
1. **First Time**: Run Test 3 (complete simulation) for comprehensive validation
2. **Detailed Testing**: Run Test 1, then Test 2 for step-by-step verification
3. **Quick Testing**: Run Test 3 for rapid end-to-end validation

### Alternative Order:
1. Run Test 1 (establish baseline)
2. Wait a few minutes
3. Run Test 2 (test anomaly detection)
4. Review results

---

## What to Look For

### ✅ Success Indicators:
- All readings created successfully (status 201)
- Anomalies detected on spike/rollback readings
- Normal readings NOT flagged as anomalies
- Severity levels appropriate (HIGH for spikes, CRITICAL for rollbacks)
- Recommendations provided for detected anomalies
- Accuracy > 90% in Test 3

### ⚠️ Warning Signs:
- False positives (normal readings flagged as anomalies)
- Missed anomalies (spikes/rollbacks not detected)
- Authentication failures
- Database connection errors
- HTTP 500 errors

---

## Troubleshooting

### "Login failed" Error:
1. Verify backend server is running: `curl http://localhost:8000/api/v1/health`
2. Check if account exists in database
3. Verify credentials: test2@gmail.com / Test@123

### "No baseline readings found" Error:
- Run Test 1 first to establish baseline data
- Or run Test 3 which includes baseline establishment

### Anomalies Not Detected:
- Ensure sufficient baseline readings exist (minimum 3-5)
- Check anomaly detection service is running
- Review backend logs for errors

### Connection Errors:
```bash
# Check if backend is running
curl http://localhost:8000/api/v1/health

# Start backend if not running
cd backend
python -m uvicorn main:app --reload
```

---

## Test Data Cleanup

To reset test data and start fresh:

```sql
-- Connect to your database and run:
DELETE FROM anomaly_detections WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test2@gmail.com');
DELETE FROM meter_readings WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test2@gmail.com');
```

Or use Supabase dashboard to delete the user's readings and anomalies.

---

## Expected Results Summary

| Test | Readings Created | Anomalies Expected | False Positives |
|------|-----------------|-------------------|-----------------|
| Test 1 | 20 | 0 | 0 |
| Test 2 | 8 | 3-4 | 0-1 |
| Test 3 | 16-20 | 3 | 0 |

---

## Notes

- Tests use realistic consumption patterns based on typical household usage
- Water: ~12 m³/day normal, 200+ m³ spike for leak simulation
- Electricity: ~25 kWh/day normal, 150+ kWh spike for high usage
- All tests use manual readings (is_manual: true) for consistency
- Tests include proper delays to avoid rate limiting

---

## Support

If issues persist:
1. Check backend logs for detailed error messages
2. Review anomaly detection service logs
3. Verify database schema is up to date
4. Check Supabase connection settings in .env file
