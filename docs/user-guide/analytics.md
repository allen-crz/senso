# Understanding Analytics

Senso's analytics features use machine learning to help you understand your utility consumption patterns, detect anomalies, and forecast future costs.

## Overview

The Analytics section provides:
- **Usage Patterns**: Historical trends and patterns
- **Anomaly Detection**: Unusual consumption alerts
- **Cost Forecasting**: Predicted future costs
- **Comparisons**: Period-over-period analysis
- **Insights**: AI-generated recommendations

## Usage Analytics

### Consumption Trends

**View your usage over time:**
- Daily, weekly, monthly, or yearly views
- Interactive charts and graphs
- Compare multiple time periods
- Export data for external analysis

**Metrics displayed:**
- Total consumption
- Average daily rate
- Peak usage periods
- Lowest usage periods
- Trend direction (increasing/decreasing)

### Pattern Recognition

**Seasonal Patterns:**
- Summer vs. winter usage
- Weekday vs. weekend patterns
- Time-of-day variations
- Monthly cycles

**Usage Categories:**
- Baseline consumption (always-on)
- Peak periods
- Variable usage
- Unusual spikes

### Comparative Analysis

**Compare across:**
- Different time periods
- Water vs. electricity
- Before and after changes
- Against forecasts

## Anomaly Detection

### What is an Anomaly?

An anomaly is consumption that significantly deviates from your normal patterns. It might indicate:
- Leaks or malfunctions
- Unusual usage events
- Billing errors
- Meter issues

### How Anomaly Detection Works

**Machine Learning Model:**
- Uses Isolation Forest algorithm
- Trained on your historical data (requires 10+ readings)
- Learns your unique patterns
- Detects outliers automatically

**Detection Factors:**
- Daily consumption amount
- Time patterns
- Rate of change
- Historical context
- Day of week patterns

### Anomaly Severity Levels

**🟢 Low Severity (Score 0.0-0.3)**
- Slightly unusual but likely normal
- Minor deviation from pattern
- Worth monitoring
- No immediate action needed

**🟡 Medium Severity (Score 0.3-0.6)**
- Moderate deviation
- Could indicate an issue
- Check for obvious causes
- Monitor for recurrence

**🔴 High Severity (Score 0.6-1.0)**
- Significant deviation
- Likely indicates a problem
- Investigate immediately
- May be leak or malfunction

### Responding to Anomalies

**When you receive an anomaly alert:**

1. **Check for known causes**
   - Did you have guests?
   - Was there a special event?
   - Did you run unusual appliances?
   - Any maintenance or repairs?

2. **Physical inspection**
   - Check for visible leaks
   - Listen for running water
   - Check all faucets and fixtures
   - Inspect appliances

3. **Provide feedback**
   - Mark anomaly as "Real" or "False Positive"
   - Add notes explaining the cause
   - Help improve detection accuracy

4. **Take action if needed**
   - Fix identified issues
   - Contact utility company
   - Call plumber/electrician
   - Document for insurance

### Anomaly History

**View past anomalies:**
- Complete anomaly log
- Severity and dates
- Your feedback and notes
- Resolution status

## Cost Forecasting

### What is Cost Forecasting?

Senso predicts your utility costs for the current billing cycle based on:
- Historical consumption patterns
- Current cycle progress
- Seasonal trends
- Your configured utility rates

### Requirements

**Minimum data needed:**
- 30+ days of reading history
- At least 10 readings
- Configured billing cycle
- Utility rate information

### How Forecasting Works

**Machine Learning Models:**
- **Linear Regression**: Captures overall trends
- **Random Forest**: Handles complex patterns
- **Ensemble Method**: Combines both for accuracy

**Input Features:**
- Historical consumption
- Day of year (seasonality)
- Days since cycle start
- Day of week patterns
- Recent trend direction

### Understanding Forecasts

**Forecast Display:**
```
Predicted Cost: $45.00
Confidence Range: $42.00 - $48.00
Days Remaining: 12
```

**Components:**
- **Predicted Cost**: Most likely amount
- **Confidence Range**: 90% confidence interval
- **Days Remaining**: Time left in cycle
- **Confidence Score**: How certain the model is

### Forecast Accuracy

**Accuracy improves with:**
- More historical data
- Consistent reading schedule
- Stable consumption patterns
- Progress through current cycle

**Early in cycle:**
- Lower confidence
- Wider range
- Based more on history

**Late in cycle:**
- Higher confidence
- Narrow range
- Based more on current data

### Using Forecasts

**Budget planning:**
- Anticipate upcoming bills
- Plan for higher usage periods
- Track against spending goals

**Usage adjustment:**
- See real-time impact of changes
- Forecast updates with new readings
- Compare "what if" scenarios

**Savings tracking:**
- Compare to previous cycles
- Measure improvement efforts
- Set reduction targets

## Analytics Dashboard

### Main Analytics View

**Access analytics:**
1. Click "Analytics" in main menu
2. Select utility type (or view all)
3. Choose time range
4. Explore different views

### Available Views

**1. Overview Tab**
- High-level summary
- Key metrics
- Recent alerts
- Quick insights

**2. Trends Tab**
- Detailed consumption charts
- Multiple time ranges
- Comparison tools
- Pattern analysis

**3. Anomalies Tab**
- All detected anomalies
- Filter by severity
- Review and provide feedback
- View investigation notes

**4. Forecasts Tab**
- Current cycle prediction
- Historical accuracy
- What-if scenarios
- Savings opportunities

**5. Insights Tab**
- AI-generated recommendations
- Usage tips
- Efficiency suggestions
- Savings potential

## Data Requirements

### For Basic Analytics
- Minimum 2 readings
- Any time span
- Basic trend charts

### For Anomaly Detection
- Minimum 10 readings
- At least 7 days of data
- Regular reading schedule

### For Cost Forecasting
- Minimum 30 days history
- At least 10 readings
- Configured billing info
- Utility rate data

## Tips for Better Analytics

### Reading Consistency

**Best practices:**
- Read at same time daily
- Maintain regular schedule
- Avoid large gaps
- Record even on vacation

### Data Quality

**Ensure accuracy:**
- Verify OCR readings
- Fix errors promptly
- Note unusual events
- Keep rates updated

### Feedback Loop

**Improve models:**
- Mark anomaly accuracy
- Note causes of spikes
- Report forecast accuracy
- Suggest improvements

## Technical Details

For technical users interested in the underlying models:
- [Cost Forecasting Flow](../technical-docs/cost-forecasting-flow.md)
- [Model Features](../technical-docs/model-features.md)

## Troubleshooting

### No Analytics Available

**Reasons:**
- Insufficient data (need 10+ readings)
- Recent account (need 30+ days for forecasts)
- Irregular readings

**Solution:**
- Continue adding readings consistently
- Wait for minimum data threshold
- Set up reading reminders

### Inaccurate Forecasts

**Possible causes:**
- Rates not configured
- Unusual usage patterns
- Insufficient history
- Recent rate changes

**Improvements:**
- Update utility rates
- Add more historical data
- Note unusual events
- Wait for model retraining

### False Anomaly Alerts

**Why it happens:**
- Model learning your patterns
- Legitimate unusual usage
- Seasonal changes
- Recent changes in habits

**What to do:**
- Provide feedback (mark as false positive)
- Add notes explaining the usage
- Model will learn over time

## Next Steps

- [Configure Settings](settings.md) for billing and rates
- [Set up Notifications](notifications.md) for anomaly alerts
- [Review Dashboard](dashboard.md) for quick analytics access

## See Also

- [Cost Forecasting Flow](../technical-docs/cost-forecasting-flow.md)
- [Technical Documentation](../technical-docs/architecture.md)
