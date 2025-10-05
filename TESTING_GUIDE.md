# Testing Guide: Anomaly Detection, Cost Forecasting & Meter Readings

## Overview
This guide covers testing procedures for the three core features of the Senso utility monitoring application.

## 1. Anomaly Detection Testing

### Setup
- Ensure you have historical consumption data in the database
- User must have at least 7-14 days of readings for baseline establishment

### Test Cases

#### TC-AD-01: Normal Consumption Pattern
**Objective**: Verify system recognizes normal usage
**Steps**:
1. Submit water/electricity reading within normal range
2. Check that no anomaly alert is triggered
3. Verify UI shows "Normal" status

**Expected**: No anomaly detected, green status indicator

#### TC-AD-02: Spike Detection
**Objective**: Detect sudden increase in consumption
**Steps**:
1. Submit reading 50%+ higher than average
2. Verify anomaly detection triggers
3. Check notification/alert displayed

**Expected**: Anomaly detected with "Spike" classification

#### TC-AD-03: Leak Detection (Water)
**Objective**: Identify potential water leak
**Steps**:
1. Submit consistent elevated readings over 3+ days
2. Verify leak detection algorithm triggers
3. Check recommendations provided

**Expected**: Leak warning with actionable recommendations

#### TC-AD-04: Zero Consumption Detection
**Objective**: Detect unusual zero or near-zero readings
**Steps**:
1. Submit reading of 0 or very low value
2. Check anomaly classification
3. Verify appropriate messaging

**Expected**: Anomaly detected with potential causes listed

#### TC-AD-05: Historical Pattern Analysis
**Objective**: Test baseline calculation accuracy
**Steps**:
1. Review anomaly thresholds in database
2. Submit readings at threshold boundaries (±2 std dev)
3. Verify correct classification

**Expected**: Accurate boundary detection

### Database Queries for Validation
```sql
-- Check anomaly records
SELECT * FROM consumption_anomalies
WHERE user_id = 'test_user_id'
ORDER BY detected_at DESC;

-- Verify baseline calculations
SELECT * FROM user_consumption_baselines
WHERE user_id = 'test_user_id';
```

### API Endpoints to Test
- `GET /api/anomalies/{user_id}` - Fetch user anomalies
- `POST /api/anomalies/check` - Manual anomaly check
- `GET /api/anomalies/recommendations/{anomaly_id}` - Get recommendations

---

## 2. Cost Forecasting Testing

### Setup
- User must have configured utility rates
- Historical consumption data required (minimum 30 days recommended)

### Test Cases

#### TC-CF-01: Current Cycle Forecast
**Objective**: Verify accurate cost projection for current billing cycle
**Steps**:
1. Navigate to dashboard
2. Check "Projected Cost" section
3. Verify calculation matches: (current usage / days elapsed) × total cycle days × rate

**Expected**: Realistic projection based on current trend

#### TC-CF-02: Next Cycle Forecast
**Objective**: Predict next billing cycle cost
**Steps**:
1. View forecast dashboard
2. Check next cycle projection
3. Verify uses historical average + trend analysis

**Expected**: Projection within ±10% of historical average (unless anomalies present)

#### TC-CF-03: Tier-Based Rate Calculation
**Objective**: Test tiered pricing structure
**Steps**:
1. Submit reading that crosses tier threshold
2. Verify cost calculation applies correct rates per tier
3. Check breakdown display

**Expected**: Accurate tier-based cost calculation

#### TC-CF-04: Seasonal Adjustment
**Objective**: Verify seasonal pattern recognition
**Steps**:
1. Compare forecasts across different months
2. Check if summer/winter patterns reflected
3. Verify historical seasonal data used

**Expected**: Forecasts adjust for known seasonal patterns

#### TC-CF-05: Budget Alert Testing
**Objective**: Test budget threshold notifications
**Steps**:
1. Set budget threshold in user preferences
2. Submit readings approaching threshold
3. Verify alert triggers at configured percentage

**Expected**: Alert at 80%, 90%, 100% of budget

### Validation Queries
```sql
-- Check forecasts
SELECT * FROM cost_forecasts
WHERE user_id = 'test_user_id'
ORDER BY forecast_date DESC;

-- Verify rate configuration
SELECT * FROM utility_rates
WHERE user_id = 'test_user_id';
```

### API Endpoints to Test
- `GET /api/forecast/current-cycle/{user_id}` - Current cycle projection
- `GET /api/forecast/next-cycle/{user_id}` - Next cycle prediction
- `POST /api/forecast/recalculate` - Force recalculation

---

## 3. Meter Reading Testing

### Setup
- Camera permissions granted
- Good lighting conditions for OCR
- Clean meter display

### Test Cases

#### TC-MR-01: Water Meter OCR
**Objective**: Verify accurate water meter reading capture
**Steps**:
1. Open water meter camera
2. Align meter in frame
3. Capture image
4. Verify OCR extraction accuracy

**Expected**: Reading accuracy >95% with clear image

#### TC-MR-02: Electricity Meter OCR
**Objective**: Verify accurate electricity meter reading capture
**Steps**:
1. Open electricity meter camera
2. Capture meter display
3. Check digit recognition
4. Verify reading format validation

**Expected**: Correct reading extracted, proper unit (kWh)

#### TC-MR-03: Manual Reading Entry
**Objective**: Test manual input fallback
**Steps**:
1. Skip camera capture
2. Enter reading manually
3. Verify validation rules
4. Submit reading

**Expected**: Reading accepted with proper validation

#### TC-MR-04: Reading Confirmation
**Objective**: Verify user can review before submission
**Steps**:
1. Capture meter image
2. Review extracted reading
3. Edit if necessary
4. Confirm submission

**Expected**: Editable confirmation screen, successful save

#### TC-MR-05: Duplicate Reading Prevention
**Objective**: Prevent duplicate submissions
**Steps**:
1. Submit a reading
2. Attempt to submit same/similar reading immediately
3. Verify duplicate detection

**Expected**: Warning or prevention of duplicate submission

#### TC-MR-06: Image Quality Validation
**Objective**: Reject poor quality images
**Steps**:
1. Capture blurry/dark image
2. Check quality validation
3. Verify re-capture prompt

**Expected**: Image rejected with guidance for better capture

#### TC-MR-07: Historical Reading Validation
**Objective**: Prevent readings lower than previous
**Steps**:
1. Submit reading lower than last reading
2. Verify validation error
3. Check error message clarity

**Expected**: Error: "Reading cannot be lower than previous reading"

### Backend Processing Tests
```sql
-- Verify reading storage
SELECT * FROM meter_readings
WHERE user_id = 'test_user_id'
ORDER BY reading_date DESC;

-- Check OCR confidence scores
SELECT reading_value, ocr_confidence, image_url
FROM meter_readings
WHERE ocr_confidence < 0.9;
```

### API Endpoints to Test
- `POST /api/meter/water/process` - Process water meter image
- `POST /api/meter/electricity/process` - Process electricity meter image
- `POST /api/meter/reading/manual` - Submit manual reading
- `GET /api/meter/readings/{user_id}` - Fetch reading history

---

## Integration Testing

### INT-01: End-to-End Flow
1. Capture meter reading (water or electricity)
2. Verify reading saved to database
3. Check anomaly detection triggered
4. Verify cost forecast updated
5. Confirm dashboard reflects new data

### INT-02: Multi-Utility Testing
1. Submit both water and electricity readings
2. Verify independent anomaly detection
3. Check separate cost forecasts
4. Validate combined dashboard view

---

## Performance Testing

### PERF-01: OCR Processing Time
- Meter image processing should complete in <3 seconds
- Test with various image sizes and qualities

### PERF-02: Anomaly Detection Speed
- Anomaly check should complete in <1 second
- Test with varying amounts of historical data

### PERF-03: Forecast Calculation
- Forecast generation should complete in <2 seconds
- Test with 1 month, 6 months, 1 year of data

---

## Edge Cases & Error Scenarios

### Edge-01: No Historical Data
- New user submits first reading
- Verify graceful handling (no anomaly detection, basic forecast)

### Edge-02: Extreme Values
- Submit reading 10x higher than normal
- Verify system doesn't crash, appropriate alerts

### Edge-03: Network Failure
- Simulate offline mode during reading submission
- Verify retry mechanism or offline storage

### Edge-04: Rate Changes
- Update utility rates mid-cycle
- Verify forecasts recalculate correctly

### Edge-05: Timezone Handling
- Test with users in different timezones
- Verify cycle dates and forecasts correct

---

## Automated Test Scripts

### Jest Test Example (Anomaly Detection)
```javascript
describe('Anomaly Detection', () => {
  test('should detect spike anomaly', async () => {
    const reading = { value: 150, previous_avg: 100, std_dev: 10 };
    const result = await detectAnomaly(reading);
    expect(result.is_anomaly).toBe(true);
    expect(result.type).toBe('spike');
  });
});
```

### Python Test Example (OCR)
```python
def test_meter_ocr_accuracy():
    image_path = 'test_meter_images/clear_reading.jpg'
    result = process_meter_image(image_path)
    assert result['confidence'] > 0.95
    assert result['reading'] == 12345.67
```

---

## Monitoring & Logging

### Metrics to Track
- OCR accuracy rate
- Anomaly detection false positive rate
- Forecast accuracy (actual vs predicted)
- Average processing times
- Error rates by feature

### Log Review
Check `logs.md`, `detetctionlogs.md`, and `errors.md` for:
- OCR failures and confidence scores
- Anomaly detection triggers
- Cost calculation errors
- API response times

---

## Test Data Requirements

### Minimum Test Dataset
- 3 test users with different consumption patterns
- 90 days of historical readings per user
- Various meter image qualities (good, poor, edge cases)
- Multiple utility rate structures

### Test User Profiles
1. **Low Consumption User**: Consistent, minimal usage
2. **High Consumption User**: High but steady usage
3. **Variable User**: Fluctuating patterns, seasonal changes

---

## Sign-off Checklist

- [ ] All anomaly detection test cases pass
- [ ] Cost forecasting within acceptable accuracy range
- [ ] Meter reading OCR >90% accuracy rate
- [ ] Manual reading input validated
- [ ] Integration tests pass
- [ ] Performance benchmarks met
- [ ] Edge cases handled gracefully
- [ ] Error messages clear and actionable
- [ ] Mobile device testing completed
- [ ] Backend logs reviewed for errors
