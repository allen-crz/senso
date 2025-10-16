# Common Issues & Troubleshooting

This guide covers common issues you might encounter while using Senso and how to resolve them.

## Camera & Image Capture Issues

### Camera Not Working

**Symptoms:**
- Camera doesn't open
- Black screen when trying to capture
- "Permission denied" error

**Solutions:**

1. **Check browser permissions:**
   - Chrome: Settings → Privacy → Camera
   - Firefox: about:permissions
   - Safari: Settings → Websites → Camera
   - Grant permission for your domain

2. **Try different browser:**
   - Some browsers have better camera support
   - Chrome/Edge recommended for best compatibility

3. **Check device camera:**
   - Test camera in other apps
   - Ensure no other app is using camera
   - Restart device if needed

4. **Use manual input:**
   - Fallback option always available
   - Enter reading manually if camera fails

### OCR Not Reading Correctly

**Symptoms:**
- Wrong numbers extracted
- Low confidence scores
- Skipped digits

**Solutions:**

1. **Improve lighting:**
   - Use natural daylight if possible
   - Add extra light source
   - Avoid shadows on meter face

2. **Better positioning:**
   - Hold device parallel to meter
   - Fill 60-80% of frame with meter
   - Keep steady (use both hands)
   - Get closer but don't cut off digits

3. **Clean meter:**
   - Wipe glass/plastic cover
   - Remove dirt or condensation
   - Report damaged meters to utility

4. **Manual correction:**
   - Edit OCR result
   - Use manual input for problem meters

### Image Upload Fails

**Symptoms:**
- Upload stuck at loading
- Error after capture
- Image not saved

**Solutions:**

1. **Check connection:**
   - Verify internet connectivity
   - Try again with better signal
   - Switch between WiFi/cellular

2. **Reduce image size:**
   - Some backends have size limits
   - Camera quality settings
   - Retry capture

3. **Clear cache:**
   - Browser cache and cookies
   - App data (if PWA)
   - Reload and try again

## Authentication Issues

### Can't Log In

**Symptoms:**
- Invalid credentials error
- Login button doesn't work
- Stuck on login screen

**Solutions:**

1. **Verify credentials:**
   - Check email spelling
   - Ensure Caps Lock is off
   - Try copy-paste password

2. **Reset password:**
   - Use "Forgot Password" link
   - Check email for reset link
   - Create new password

3. **Check email verification:**
   - Verify email first
   - Resend verification email
   - Check spam folder

4. **Clear session:**
   - Log out completely
   - Clear browser cookies
   - Try incognito mode

### Session Expired

**Symptoms:**
- Logged out unexpectedly
- "Session expired" message
- Need to log in again

**Solutions:**

1. **Log in again:**
   - Your data is safe
   - Just re-authenticate

2. **Check "Remember Me":**
   - Option may be available
   - Keeps you logged in longer

3. **Extend session:**
   - Settings may have session duration
   - Some platforms support longer sessions

## Dashboard & Data Issues

### No Data Showing

**Symptoms:**
- Empty dashboard
- Missing readings
- Blank charts

**Solutions:**

1. **Add readings:**
   - Capture at least one reading
   - Wait for data to sync
   - Refresh dashboard

2. **Check date filter:**
   - May be filtering out data
   - Reset to "All Time"
   - Adjust date range

3. **Verify data saved:**
   - Check reading history
   - Ensure no errors during save
   - Re-add reading if needed

### Incorrect Consumption Calculation

**Symptoms:**
- Wrong usage amounts
- Negative consumption
- Unrealistic values

**Solutions:**

1. **Check readings:**
   - Verify meter values correct
   - Look for typos
   - Edit incorrect readings

2. **Meter rollover:**
   - Some meters reset to zero
   - May need manual adjustment
   - Contact support for help

3. **Verify order:**
   - Readings must be chronological
   - Check timestamps
   - Correct date/time if wrong

### Charts Not Loading

**Symptoms:**
- Blank chart area
- Loading spinner stuck
- Error message

**Solutions:**

1. **Accumulate data:**
   - Need multiple readings
   - Wait for data collection
   - At least 2-3 points for chart

2. **Browser compatibility:**
   - Update browser
   - Try different browser
   - Enable JavaScript

3. **Clear cache:**
   - Browser cache/cookies
   - Hard refresh (Ctrl+Shift+R)
   - Reload page

## Analytics Issues

### No Anomalies Detected

**Not necessarily a problem!** This might mean:
- Your usage is consistent (good!)
- Not enough data yet (need 10+ readings)
- Detection threshold too high

**To get anomalies working:**
1. Add more readings (need 10+ minimum)
2. Wait for pattern learning
3. Check anomaly settings
4. Lower severity threshold if needed

### Forecasts Not Available

**Symptoms:**
- "Not enough data" message
- No forecast displayed
- Forecast section missing

**Requirements:**
- 30+ days of history
- At least 10 readings
- Configured billing info
- Valid utility rates

**Solutions:**
1. Continue adding readings
2. Configure billing settings
3. Enter rate information
4. Wait for data accumulation

### Inaccurate Forecast

**Symptoms:**
- Prediction far from actual
- Wide confidence range
- Doesn't match usage

**Solutions:**

1. **Update rates:**
   - Verify correct utility rates
   - Check tier breakpoints
   - Include all fees

2. **Add more data:**
   - Accuracy improves over time
   - Regular readings help
   - At least 30-60 days needed

3. **Note unusual usage:**
   - Add context for anomalies
   - Explain special events
   - Helps model learn

## Notification Issues

### Not Receiving Notifications

**Symptoms:**
- No alerts appearing
- Missing reminders
- Silent notifications

**Solutions:**

1. **Check Senso settings:**
   - Notifications enabled?
   - Correct notification types?
   - Not in quiet hours?

2. **Browser permissions:**
   - Allow notifications
   - Check OS settings
   - Grant permission when prompted

3. **PWA installation:**
   - Install as PWA for best notifications
   - Native app experience
   - Better notification support

4. **Email notifications:**
   - Verify email address
   - Check spam folder
   - Add to contacts

### Too Many Notifications

**Symptoms:**
- Notification overload
- Constant alerts
- Distraction

**Solutions:**

1. **Adjust thresholds:**
   - Increase anomaly severity
   - Reduce frequency
   - Enable digest mode

2. **Set quiet hours:**
   - Configure Do Not Disturb
   - Schedule based on habits
   - Weekend differences

3. **Selective disable:**
   - Turn off less important types
   - Keep critical alerts only
   - Review periodically

## Performance Issues

### App Running Slow

**Symptoms:**
- Laggy interface
- Slow page loads
- Delayed responses

**Solutions:**

1. **Clear cache:**
   - Browser cache/cookies
   - App data
   - Service worker cache

2. **Close tabs:**
   - Too many open tabs
   - Resource intensive
   - Close unused tabs

3. **Update browser:**
   - Old browser version
   - Missing optimizations
   - Update to latest

4. **Check device:**
   - Low storage space
   - Too many apps running
   - Restart device

### Long Load Times

**Symptoms:**
- Pages take long to load
- Stuck loading screens
- Timeout errors

**Solutions:**

1. **Check connection:**
   - Slow internet
   - Switch networks
   - Try WiFi vs cellular

2. **Optimize data:**
   - Reduce date range
   - Filter data displayed
   - Paginate long lists

3. **Server issues:**
   - Backend may be slow
   - High traffic
   - Wait and retry

## PWA Installation Issues

### Install Button Not Showing (Desktop)

**Solutions:**
1. Clear browser cache
2. Check HTTPS enabled
3. Verify manifest.json
4. Service worker registered
5. Try different browser

### iOS Not Installing

**Solutions:**
1. Must use Safari
2. iOS 16.4+ required
3. Use Share → "Add to Home Screen"
4. Manual process (no auto-prompt)

### Installed App Not Working

**Solutions:**
1. Reinstall PWA
2. Clear app data
3. Check for updates
4. Use browser version temporarily

## Database & Sync Issues

### Data Not Syncing

**Symptoms:**
- Changes not saving
- Old data showing
- Missing readings

**Solutions:**

1. **Check connection:**
   - Internet connectivity
   - Sync requires network
   - Try manual refresh

2. **Log out/in:**
   - Refresh session
   - Force resync
   - Clear local cache

3. **Conflict resolution:**
   - Multiple devices?
   - Check all devices
   - Latest change wins

### Duplicate Readings

**Symptoms:**
- Same reading appears twice
- Doubled consumption
- Incorrect analytics

**Solutions:**

1. **Delete duplicates:**
   - Review reading history
   - Delete extra entries
   - Keep most accurate

2. **Prevent duplicates:**
   - Don't retry immediately
   - Wait for confirmation
   - Check before re-submitting

## Getting More Help

### Still Having Issues?

1. **Check documentation:**
   - [FAQ](faq.md)
   - [User Guide](../user-guide/overview.md)
   - [Technical Docs](../technical-docs/architecture.md)

2. **Report bugs:**
   - GitHub Issues
   - Include error messages
   - Describe steps to reproduce
   - Attach screenshots

3. **Contact support:**
   - Email support
   - Community forums
   - Discord/Slack channel

### Information to Include

When reporting issues:
- Browser and version
- Device and OS
- Steps to reproduce
- Error messages
- Screenshots
- Expected vs actual behavior

## Prevention Tips

### Best Practices

1. **Regular readings:**
   - Consistent schedule
   - Better analytics
   - Fewer gaps

2. **Update regularly:**
   - Keep browser updated
   - Update PWA when prompted
   - Check for new features

3. **Good habits:**
   - Verify data before saving
   - Review settings periodically
   - Back up important data

4. **Stay informed:**
   - Read update notes
   - Check announcements
   - Follow best practices

## See Also

- [FAQ](faq.md)
- [Installation Guide](../getting-started/installation.md)
- [User Guide](../user-guide/overview.md)
