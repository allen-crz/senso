# Authentication & Login

This guide covers everything you need to know about creating an account, logging in, and managing your authentication in Senso.

## Creating Your Account

### Step 1: Access the Sign Up Page

1. Open Senso in your web browser
2. On the landing page, click **"Sign Up"** or **"Get Started"**
3. You'll be directed to the registration page

### Step 2: Enter Your Information

1. **Email Address**: Enter a valid email address
   - This will be your username for logging in
   - You'll receive a verification email at this address

2. **Password**: Create a secure password
   - Must be at least 8 characters long
   - Include a mix of uppercase, lowercase, numbers, and symbols
   - Avoid common passwords

3. **Confirm Password**: Re-enter your password to confirm

### Step 3: Complete Registration

1. Review the terms of service (if displayed)
2. Click **"Create Account"** or **"Sign Up"**
3. Wait for the confirmation message

### Step 4: Verify Your Email

1. Check your email inbox for a verification message from Senso
2. Open the email and click the verification link
3. You'll be redirected back to Senso
4. Your email is now verified and you can log in

**Note**: Check your spam folder if you don't receive the email within a few minutes.

## Logging In

### Standard Login

1. Navigate to the Senso app
2. Enter your email address
3. Enter your password
4. Click **"Log In"** or **"Sign In"**
5. You'll be redirected to your dashboard

### Stay Logged In

- Most browsers will remember your login session
- You won't need to log in every time you open the app
- Session duration depends on your settings

### Login Issues

**Forgot Password?**
1. Click **"Forgot Password"** on the login page
2. Enter your email address
3. Check your email for a password reset link
4. Click the link and create a new password
5. Return to the login page with your new password

**Invalid Credentials?**
- Double-check your email address (no typos)
- Ensure Caps Lock is not on
- Try resetting your password if you're unsure

**Email Not Verified?**
- Check your inbox for the verification email
- Click the verification link before logging in
- Request a new verification email if needed

## Security Features

### Password Security

Senso uses industry-standard security practices:
- Passwords are hashed and encrypted
- Never stored in plain text
- Transmitted over HTTPS only

### Session Management

- Sessions automatically expire after extended inactivity
- You can log out manually at any time
- Multiple devices can be logged in simultaneously

### Two-Factor Authentication (If Enabled)

Some deployments may offer 2FA:
1. Enable in Settings → Security
2. Link your authenticator app
3. Enter verification code at each login

## Managing Your Account

### Changing Your Password

1. Log in to your account
2. Go to **Settings** → **Account**
3. Click **"Change Password"**
4. Enter your current password
5. Enter and confirm your new password
6. Click **"Update Password"**

### Updating Your Email

1. Go to **Settings** → **Account**
2. Click **"Change Email"**
3. Enter your new email address
4. Verify your new email address
5. Your login email will be updated

### Logging Out

To log out of Senso:
1. Click on your profile icon or menu
2. Select **"Log Out"** or **"Sign Out"**
3. You'll be returned to the login page

**Tip**: Always log out when using shared or public devices.

## Privacy & Data Security

### What Senso Collects

- Email address for account identification
- Password (encrypted) for authentication
- Utility readings and usage data you input
- Profile settings and preferences

### Data Protection

- All data transmitted over encrypted HTTPS connections
- Row Level Security (RLS) ensures data isolation
- Your data is never shared with third parties
- You can export or delete your data at any time

### Account Deletion

To permanently delete your account:
1. Go to **Settings** → **Account**
2. Scroll to **"Danger Zone"**
3. Click **"Delete Account"**
4. Confirm the deletion
5. All your data will be permanently removed

**Warning**: Account deletion is irreversible. Export your data first if needed.

## Troubleshooting

### Can't Receive Verification Email

1. Check spam/junk folders
2. Verify email address was entered correctly
3. Request a new verification email
4. Try a different email address if the problem persists
5. Contact support if issue continues

### Session Expired

If your session expires:
1. Simply log in again
2. Your data is still safe
3. Consider using "Remember Me" option if available

### Browser Issues

- Clear browser cache and cookies
- Try a different browser
- Ensure JavaScript is enabled
- Check for browser extensions that might interfere

### Can't Access Account

If locked out of your account:
1. Try password reset first
2. Verify your email address is correct
3. Check for any account suspension notifications
4. Contact support if you still can't access

## Best Practices

### Password Tips

- Use a unique password (don't reuse from other sites)
- Consider using a password manager
- Change password if you suspect compromise
- Never share your password with anyone

### Account Security

- Log out on shared devices
- Don't save passwords on public computers
- Keep your email account secure
- Enable 2FA if available
- Review account activity regularly

## Technical Details

For developers and technical users, see:
- [Authentication Flow](../technical-docs/authentication-flow.md) - Detailed technical documentation
- [API Authentication](../api-reference/authentication.md) - API endpoint details

## Next Steps

Now that you're logged in:
- [Capture your first meter reading](capturing-readings.md)
- [Explore your dashboard](dashboard.md)
- [Configure your settings](settings.md)
