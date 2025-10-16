# Frequently Asked Questions (FAQ)

Common questions about Senso and utility monitoring.

## General Questions

### What is Senso?

Senso is a Progressive Web Application (PWA) that helps you monitor utility consumption using AI-powered meter reading, anomaly detection, and cost forecasting.

### Is Senso free to use?

Yes, Senso is open source and free to use. You can self-host it or use a hosted version if available.

### What utilities can I track?

Currently:
- Water meters
- Electricity meters

Future updates may include gas, solar, and other utilities.

### Do I need to install an app?

No installation required! Senso works in any modern web browser. However, you can optionally install it as a PWA for a native app experience.

### What devices are supported?

Senso works on:
- Android phones and tablets
- iOS/iPadOS devices (16.4+)
- Windows, Mac, and Linux computers
- Any device with a modern web browser

## Privacy & Security

### Is my data safe?

Yes! Senso uses:
- Encrypted HTTPS connections
- Supabase authentication with JWT tokens
- Row Level Security (RLS) policies
- No third-party data sharing

### Who can see my utility data?

Only you! Your data is private and isolated with database-level security policies.

### Can I delete my data?

Yes, you can export or permanently delete your data anytime from Settings → Account.

### Do you share data with utility companies?

No. Senso doesn't share your data with anyone. It's entirely for your personal monitoring.

## Features & Functionality

### How does the camera reading work?

Senso uses:
1. Your device camera to capture meter images
2. Computer vision to locate digits
3. OCR (Optical Character Recognition) to extract values
4. Confidence scoring to ensure accuracy

### What if OCR doesn't work for my meter?

You can always enter readings manually. The manual input option is available for all meter types.

### How accurate is anomaly detection?

Accuracy improves over time as the ML model learns your patterns. Typically:
- 10+ readings: Basic detection
- 30+ readings: Good accuracy
- 60+ readings: Excellent pattern recognition

### How does cost forecasting work?

Senso uses:
- Linear Regression and Random Forest models
- Historical consumption patterns
- Seasonal trends
- Current cycle progress
- Your configured utility rates

### Do I need to enter readings every day?

Not required, but recommended. More frequent readings provide:
- Better anomaly detection
- More accurate forecasts
- Earlier leak detection
- Detailed usage patterns

### Can I track multiple properties?

This depends on your deployment. Some installations support multiple meter profiles, while others are designed for single-property monitoring.

## Technical Questions

### What browsers are supported?

**Recommended:**
- Chrome 90+
- Edge 90+
- Safari 14+
- Firefox 88+

**Minimum:**
- Chrome 80+
- Edge 80+
- Safari 13.1+
- Firefox 75+

### Does it work offline?

Partially. With PWA installed:
- View previously loaded data
- Capture images (saved when online)
- Basic navigation

Requires internet for:
- New data sync
- ML analytics
- Forecast updates

### What is a PWA?

Progressive Web App - a web application that can be installed on your device and works like a native app, with offline support and push notifications.

### How much data does it use?

Minimal:
- Text data: negligible
- Images: ~100-500KB per capture
- Total: ~1-5MB per month typical usage

### Can I use it without camera?

Yes! Manual input is always available for entering meter readings.

## Data & Analytics

### How many readings do I need?

**For basic features:**
- 1 reading to start
- 2+ for consumption calculations
- 5+ for trends

**For analytics:**
- 10+ for anomaly detection
- 30+ days for forecasting
- More readings = better accuracy

### Why am I not getting forecasts?

Forecasts require:
- 30+ days of reading history
- At least 10 readings
- Configured billing cycle
- Entered utility rates

### Can I import historical data?

Some deployments support CSV imports. Check your Settings → Data for import options.

### How far back is history kept?

Indefinitely! All your readings are stored and available in your account.

### Can I export my data?

Yes! Export options available in Settings → Data & Privacy. Export formats:
- JSON (complete data)
- CSV (for spreadsheets)

## Billing & Rates

### Why configure utility rates?

Rates enable:
- Accurate cost calculations
- Precise forecasts
- Budget tracking
- Savings measurements

### Where do I find my utility rates?

Check:
- Recent utility bill (rate schedule section)
- Utility company website (tariffs/rates)
- Customer service call

### What if rates change?

Update rates in Settings → Billing when they change. Forecasts will adjust accordingly.

### Do you support tiered rates?

Yes! Configure multiple tiers with different rates per usage level.

## Troubleshooting

### Why can't I access my camera?

Check:
- Browser permissions granted
- No other app using camera
- HTTPS enabled (required for camera access)
- Try different browser

### Readings not saving?

Verify:
- Internet connection active
- Logged in to account
- No browser console errors
- Try again after a moment

### App is slow?

Try:
- Clear browser cache
- Close unnecessary tabs
- Update browser
- Restart device
- Check internet speed

### See full [Troubleshooting Guide](common-issues.md) for more.

## Notifications

### Why am I not getting alerts?

Check:
- Notifications enabled in Senso settings
- Browser/device permissions granted
- Not in quiet hours
- PWA installed for best notifications

### Can I customize alerts?

Yes! Configure in Settings → Notifications:
- Which types to receive
- Severity thresholds
- Delivery methods
- Quiet hours

### How do I stop getting too many notifications?

Adjust:
- Increase severity threshold (anomalies)
- Reduce frequency
- Enable digest mode
- Set quiet hours

## Getting Started

### How do I create an account?

1. Open Senso in your browser
2. Click "Sign Up"
3. Enter email and password
4. Verify email address
5. Log in and start!

### What's the first thing I should do?

1. Log in/create account
2. Capture your first meter reading
3. Configure billing settings (optional)
4. Set up reading reminders
5. Continue adding regular readings

### How long until I see analytics?

- **Consumption**: After 2nd reading
- **Trends**: After 5+ readings
- **Anomalies**: After 10+ readings
- **Forecasts**: After 30+ days

### Do I need special equipment?

No! Just:
- A device with camera (phone, tablet, laptop)
- Access to your meters
- Internet connection

## Advanced Features

### Can I set up API access?

Check your deployment documentation. Some installations offer API keys for programmatic access.

### Is there a mobile app?

Senso is a PWA - install it from your browser for a native app experience. No separate app store download needed.

### Can I integrate with smart home?

Some deployments support:
- IFTTT
- Zapier
- Custom webhooks

Check Settings → Integrations.

### Can I add custom alerts?

Threshold alerts may be available in Settings. Custom rules depend on your deployment.

## Contributing & Development

### Is Senso open source?

Yes! Check the GitHub repository for source code and contribution guidelines.

### Can I self-host Senso?

Yes! See the [Deployment Guide](../deployment/overview.md) for self-hosting instructions.

### How can I contribute?

- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation
- Share your experience

### Can I customize Senso for my needs?

Yes! Being open source, you can fork and modify it for your specific requirements.

## Still Have Questions?

- Check [User Guide](../user-guide/overview.md)
- Review [Troubleshooting](common-issues.md)
- Read [Technical Documentation](../technical-docs/architecture.md)
- Ask in community forums
- Report issues on GitHub
