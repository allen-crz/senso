# Authentication & Session Management

## Overview
The Senso app uses **JWT token-based authentication** with **automatic token refresh** to keep users logged in for extended periods without requiring daily login.

---

## How Long Users Stay Logged In

### ✅ **Answer: Users stay logged in indefinitely (until they manually log out)**

| Scenario | User Experience |
|----------|-----------------|
| **Daily Usage** | ✅ **NO LOGIN REQUIRED** - Token auto-refreshes |
| **App Close & Reopen** | ✅ Still logged in (localStorage persists) |
| **1 Hour Later** | ✅ Still logged in (token auto-refreshed) |
| **1 Day Later** | ✅ Still logged in (token auto-refreshed) |
| **1 Week Later** | ✅ Still logged in (as long as used within refresh window) |
| **Token Expires + 24h Inactive** | ❌ Auto-logout (security measure) |
| **Manual Logout** | ❌ Logged out (user action) |

---

## Authentication Architecture

### 1. **Token System**

```
Access Token (JWT):
├─ Expires: 1 hour (Supabase default)
├─ Used for: API authentication
└─ Auto-refreshed: When < 5 minutes remaining

Refresh Token:
├─ Expires: 30+ days (Supabase default)
├─ Used for: Getting new access tokens
└─ Stored in: localStorage (persistent)
```

### 2. **Automatic Token Refresh**

The app automatically refreshes tokens **before they expire**:

```typescript
// When user opens app or makes API call
1. Check if access token expires within 5 minutes
2. If yes → Automatically refresh using refresh token
3. Update access token in localStorage
4. Continue with original request

// User never sees this happening! 🎉
```

**Trigger Points for Auto-Refresh:**
- On app startup (`getCurrentUser()`)
- Before any API call if token expiring soon
- After 401 error (expired token detected)

### 3. **Session Persistence**

**Storage Method:** `localStorage`
- ✅ Survives app close/reopen
- ✅ Survives browser restart
- ✅ Works on mobile PWA
- ❌ Cleared on manual logout only

**Stored Data:**
```javascript
localStorage:
├─ access_token       // JWT for API calls
├─ refresh_token      // For getting new access token
├─ token_expires_at   // Timestamp for expiration
├─ token_type         // Usually "Bearer"
└─ expires_in         // Duration in seconds
```

---

## Security Features

### 1. **Inactivity Timeout**
- **Duration:** 24 hours of no activity
- **Behavior:** Only logs out if BOTH conditions met:
  - User inactive for 24 hours AND
  - Token has expired
- **Activity Detection:**
  - Mouse/touch interactions
  - Scrolling, clicking
  - Any user engagement

### 2. **Token Expiration Handling**
```
Token lifecycle:
├─ 0-55 min:  ✅ Valid, no action needed
├─ 55-60 min: ⚠️  Auto-refresh triggered
├─ 60+ min:   🔄 Use refresh token to get new access token
└─ No refresh token: ❌ Logout required
```

### 3. **Multi-Tab Synchronization**
- Login in one tab → All tabs logged in
- Logout in one tab → All tabs logged out
- Uses `localStorage` events for sync

---

## Mobile PWA Behavior

### **iOS/Android Users:**

1. **First Login:** User logs in once
2. **App Added to Home Screen:** Token stored in device storage
3. **Daily Usage:**
   - Day 1: ✅ Opens app → Already logged in
   - Day 7: ✅ Opens app → Already logged in
   - Day 30: ✅ Opens app → Already logged in
4. **Long Absence:** Only logged out if refresh token expires (30+ days)

### **Background Behavior:**
- App in background: Token preserved
- Device restart: Token preserved
- iOS/Android memory clear: Token preserved (localStorage persists)

---

## Implementation Details

### **Auth Flow (Login)**
```typescript
1. User enters credentials
2. Backend validates & returns:
   - access_token (1 hour expiry)
   - refresh_token (30 day expiry)
3. Frontend stores both in localStorage
4. User is logged in ✅
```

### **Auth Flow (Daily Return)**
```typescript
1. User opens app
2. Frontend checks localStorage for access_token
3. If token expires < 5 min:
   - Automatically call /api/v1/auth/refresh
   - Get new access_token
   - Update localStorage
4. User sees dashboard (no login screen) ✅
```

### **Auth Flow (Logout)**
```typescript
1. User clicks "Logout"
2. Frontend calls /api/v1/auth/logout
3. Clear all localStorage data
4. Redirect to /login
5. Session tracking cleanup
```

---

## Configuration

### **Adjust Inactivity Timeout**
File: `src/utils/sessionManager.ts`
```typescript
const INACTIVITY_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
```

### **Adjust Token Refresh Window**
File: `src/services/auth.ts`
```typescript
const fiveMinutes = 5 * 60 * 1000; // Refresh if < 5 min remaining
```

### **Adjust API Cache Times**
File: `src/App.tsx`
```typescript
staleTime: 5 * 60 * 1000,  // 5 minutes
gcTime: 30 * 60 * 1000,    // 30 minutes
```

---

## Troubleshooting

### **Users Getting Logged Out Daily?**
- ❌ **Old Behavior:** No token refresh → Users logout after 1 hour
- ✅ **New Behavior:** Auto token refresh → Users stay logged in

### **Users Seeing "Session Expired"?**
- Check if refresh token is being stored
- Check if `/api/v1/auth/refresh` endpoint works
- Check backend refresh token expiration settings

### **Users Logged Out After App Close?**
- Verify `localStorage` is being used (not `sessionStorage`)
- Check if PWA is properly installed
- Check browser/device settings (Privacy mode blocks storage)

---

## Testing Checklist

- [ ] Login → Close app → Reopen (should stay logged in)
- [ ] Login → Wait 1 hour → Make API call (should auto-refresh)
- [ ] Login → Don't use for 24 hours → Check if logged out
- [ ] Login on Tab 1 → Check Tab 2 (should auto-login)
- [ ] Logout on Tab 1 → Check Tab 2 (should auto-logout)
- [ ] Install PWA → Close → Reopen next day (should stay logged in)

---

## Summary

**The app now works like modern mobile apps (Instagram, Twitter, etc.):**
- ✅ Login once
- ✅ Stay logged in indefinitely
- ✅ Automatic session management
- ✅ Secure with token rotation
- ✅ Works offline (PWA)
- ✅ No daily login required! 🎉

**For daily users:** They will **NEVER** need to login again unless they:
1. Manually log out
2. Don't use the app for 30+ days (refresh token expires)
3. Clear browser data/app cache
