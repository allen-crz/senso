# Managing Notifications

Stay informed about your utility consumption with Senso's intelligent notification system. Learn how to configure alerts, review notifications, and customize your preferences.

## Overview

Senso's notification system keeps you informed about:
- Anomaly detections
- Reading reminders
- Billing cycle alerts
- Forecast updates
- System messages

## Notification Types

### Anomaly Alerts

**When sent:**
- Unusual consumption detected
- Based on ML anomaly detection
- Severity-based triggering

**Contains:**
- Anomaly severity level
- Consumption amount
- Comparison to normal
- Recommended actions

**Example:**
> 🔴 High usage detected!
> Your water consumption today (150 gallons) is 3x your normal usage. Check for leaks.

### Reading Reminders

**When sent:**
- Based on your reading schedule
- Configurable frequency
- Smart timing based on habits

**Contains:**
- Reminder to capture reading
- Last reading date
- Quick capture link

**Example:**
> 📸 Time for your daily water meter reading!
> Last reading: 2 days ago. Tap to capture now.

### Billing Cycle Notifications

**When sent:**
- Cycle start/end dates
- Mid-cycle updates
- Payment reminders

**Contains:**
- Cycle progress
- Current forecast
- Days remaining
- Estimated cost

**Example:**
> 📊 Billing cycle ending in 5 days
> Predicted cost: $45 (↓ 10% from last month)

### Forecast Updates

**When sent:**
- Significant forecast changes
- Cost threshold alerts
- Savings opportunities

**Contains:**
- Updated prediction
- Change explanation
- Impact of recent usage

**Example:**
> 💰 Cost forecast updated: $52 → $48
> Your reduced usage this week lowered your predicted bill!

## Accessing Notifications

### Notification Center

**Desktop:**
1. Click bell icon in top bar
2. View notification list
3. Click notification for details
4. Mark as read or dismiss

**Mobile:**
1. Tap notification bell
2. Swipe to dismiss
3. Tap for full details
4. Pull to refresh

### Notification Badge

**Indicators:**
- Red dot: Unread notifications
- Number: Count of unread
- Clearing: Mark all as read

### Push Notifications (PWA)

**If installed as PWA:**
- Native OS notifications
- Even when app closed
- Banner style alerts
- Sound and vibration

## Configuring Notifications

### Access Settings

1. Go to **Settings** → **Notifications**
2. Or click **"Manage"** in notification center
3. Configure each notification type

### Notification Preferences

**For each type, configure:**
- ✅ **Enable/Disable**: Turn on or off
- 🔔 **Method**: In-app, push, email
- ⚙️ **Frequency**: How often
- 🎚️ **Threshold**: When to trigger

### Anomaly Alert Settings

**Configure:**
```
☑ Enable anomaly alerts
  Minimum severity: ○ Low ○ Medium ● High
  Notification method: ☑ In-app ☑ Push ☐ Email
  Alert frequency: Immediate
```

**Options:**
- Minimum severity threshold
- Alert for all or only critical
- Quiet hours (optional)

### Reading Reminder Settings

**Configure:**
```
☑ Enable reading reminders
  Frequency: ● Daily ○ Weekly ○ Custom
  Reminder time: 8:00 AM
  Days: ☑ M ☑ T ☑ W ☑ T ☑ F ☑ S ☑ S
```

**Options:**
- Daily, weekly, or custom schedule
- Specific time of day
- Select days of week
- Snooze duration

### Billing Notifications

**Configure:**
```
☑ Enable billing notifications
  ☑ Cycle start/end alerts
  ☑ Mid-cycle forecast updates
  ☑ Cost threshold warnings
  Threshold: $50
```

**Options:**
- Cycle milestones
- Forecast updates
- Budget thresholds
- Payment reminders

### Forecast Update Settings

**Configure:**
```
☑ Enable forecast updates
  ☐ Daily updates
  ☑ Significant changes only (>$5)
  ☑ Savings opportunities
```

**Options:**
- Update frequency
- Change threshold
- Positive updates only
- Improvement tracking

## Notification Methods

### In-App Notifications

**Characteristics:**
- Always available
- Cannot be disabled
- Shown in notification center
- Badge on icon

**Best for:**
- Users who check app regularly
- Non-urgent notifications
- Detailed information

### Push Notifications

**Requirements:**
- PWA installed
- Permission granted
- Device supports push

**Characteristics:**
- Real-time delivery
- Works when app closed
- Native OS integration
- Banner style

**Best for:**
- Urgent alerts
- Anomaly notifications
- Time-sensitive reminders

### Email Notifications

**Configuration:**
- Verify email address
- Select notification types
- Configure frequency

**Characteristics:**
- Works everywhere
- Detailed information
- Archivable record
- Digest options available

**Best for:**
- Summary reports
- Non-urgent updates
- Users who prefer email

## Managing Notifications

### Mark as Read

**Individual:**
- Click/tap notification
- Or mark read without opening

**Bulk:**
- "Mark all as read" button
- Select multiple to mark

### Dismiss Notifications

**Temporary:**
- Swipe to dismiss (mobile)
- Click X to close (desktop)

**Permanent:**
- Delete from history
- Clear old notifications

### Notification History

**View past notifications:**
1. Notification center
2. "Show all" or "History"
3. Filter by type
4. Search by keyword

**History includes:**
- All notifications
- Read and unread
- Dismissed items
- Actions taken

## Quiet Hours

### Configure Do Not Disturb

**Set quiet hours:**
```
☑ Enable quiet hours
  Start: 10:00 PM
  End: 7:00 AM
  Days: ☑ M ☑ T ☑ W ☑ T ☑ F ☐ S ☐ S
```

**During quiet hours:**
- Push notifications silenced
- In-app notifications queued
- Emergency alerts still sent

**Exception settings:**
- Critical anomalies override
- Custom whitelist
- Break glass options

## Notification Actions

### Quick Actions

Some notifications include actions:
- **"View Details"**: Open full information
- **"Capture Reading"**: Launch camera
- **"Dismiss"**: Clear notification
- **"Snooze"**: Remind later

### Inline Responses

**For reminders:**
- Mark as done
- Snooze for later
- Disable future reminders
- Capture now

## Troubleshooting

### Not Receiving Notifications

**Check:**
1. Notifications enabled in settings
2. Browser/device permissions granted
3. Push notifications allowed
4. Not in quiet hours
5. Email verified (for email notifications)

**Fixes:**
1. Re-enable in Senso settings
2. Check browser/OS permissions
3. Reinstall PWA if needed
4. Verify email address
5. Check spam folder

### Too Many Notifications

**Solutions:**
1. Adjust thresholds (anomaly severity)
2. Change frequency (reading reminders)
3. Enable digest mode
4. Set quiet hours
5. Disable less important types

### Notifications Delayed

**Reasons:**
- Network connectivity issues
- Background app restrictions
- Device battery saver
- Service worker not running

**Fixes:**
- Check internet connection
- Allow background activity
- Disable battery optimization
- Refresh app

### Wrong Notification Time

**Fixes:**
1. Check timezone setting
2. Update reminder time
3. Verify device clock
4. Save settings again

## Best Practices

### For Effective Monitoring

**Recommended setup:**
- ✅ Enable anomaly alerts (medium+)
- ✅ Daily reading reminders
- ✅ Billing cycle notifications
- ✅ Significant forecast changes

### Avoid Notification Fatigue

**Tips:**
- Set appropriate thresholds
- Use quiet hours
- Group similar notifications
- Review and adjust regularly

### Stay Informed Without Overwhelm

**Strategy:**
1. Start with all enabled
2. Adjust based on needs
3. Fine-tune thresholds
4. Use digest mode for summaries

## Notification Privacy

### Data in Notifications

**What's included:**
- Consumption summaries
- Alert types
- Timing information
- No sensitive details in previews

### Privacy Settings

**Control what's shown:**
- Hide values in previews
- Generic titles only
- Full details in app only
- Encrypted delivery

## Next Steps

- [Configure Settings](settings.md) for full notification control
- [Understand Analytics](analytics.md) to make sense of anomaly alerts
- [View Dashboard](dashboard.md) for notification summaries

## See Also

- [Quick Start Guide](../getting-started/quick-start.md)
- [Troubleshooting](../troubleshooting/common-issues.md)
