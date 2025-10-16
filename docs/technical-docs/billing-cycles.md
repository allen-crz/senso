# Billing Cycle System

This document provides an overview of how Senso manages billing cycles for utility monitoring.

## Related Documentation

The billing cycle system is documented across several detailed guides:

- [Billing Cycle Reset Fields](billing-cycle-reset-fields.md) - Explains how cycle resets work
- [Normal Billing Cycle Behavior](billing-cycle-behavior.md) - Standard cycle operations
- [Cycle End Field States](cycle-end-field-states.md) - Detailed field state documentation

## Overview

Senso's billing cycle system tracks utility billing periods to:
- Calculate usage within billing periods
- Forecast costs accurately
- Send billing reminders
- Track consumption patterns by billing cycle

## Key Concepts

### Billing Period
The time span between billing dates, typically monthly but can be customized per utility provider.

### Billing Day
The day of the month when your utility bill is generated (e.g., day 1, 15, 30).

### Cycle Reset
When a billing period ends and a new one begins, certain fields are reset:
- Cycle consumption totals
- Previous cycle data is archived
- New cycle baseline is established

## Configuration

Users can configure billing cycles in Settings:
1. Set billing day for each utility type
2. Configure rate information
3. Enable billing reminders

## How It Works

### Reading Assignment
When a meter reading is captured, Senso:
1. Determines which billing cycle it belongs to
2. Calculates consumption since cycle start
3. Updates cycle totals
4. Checks against forecast predictions

### Cycle Transitions
At the end of each billing cycle:
1. Final totals are calculated
2. Actual costs are compared to forecasts
3. Data is archived for historical analysis
4. New cycle begins with reset counters

### Forecasting Integration
The billing cycle system integrates with cost forecasting:
- Historical cycle data trains prediction models
- Current cycle progress updates forecast confidence
- Partial cycle data provides mid-cycle estimates

## Database Schema

Key tables involved:
- `user_preferences` - Stores billing day configuration
- `meter_readings` - Contains individual readings
- `cost_forecasts` - Stores billing cycle predictions
- `billing_cycles` - Archives completed cycles

## See Also

- [Cost Forecasting Flow](cost-forecasting-flow.md)
- [Feature Design Explanations](feature-design.md)
