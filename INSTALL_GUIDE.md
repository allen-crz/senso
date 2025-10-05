# Senso PWA - Installation Guide

## ✅ Service Worker is Cross-Platform
The service worker uses **standard Web APIs** that work on:
- ✅ Android (Chrome, Edge, Samsung Internet)
- ✅ iOS/iPadOS 16.4+ (Safari)
- ✅ Windows (Chrome, Edge)
- ✅ macOS (Chrome, Safari, Edge)
- ✅ Linux (Chrome, Firefox, Edge)

**No iOS-specific checks needed** - it's already universal!

---

## 📱 How to Install on Different Platforms

### **Android (Chrome/Edge/Samsung Internet)**

#### Method 1: Install Banner (Automatic)
1. Visit the app in Chrome/Edge
2. Wait for the install prompt banner at the bottom
3. Tap **"Install"** or **"Add to Home Screen"**

#### Method 2: Manual Install
1. Open the app in Chrome
2. Tap the **⋮** (three dots) menu
3. Select **"Install app"** or **"Add to Home Screen"**
4. Tap **"Install"**
5. App icon appears on your home screen

---

### **iOS/iPadOS (Safari 16.4+)**

#### Requirements:
- iOS/iPadOS **16.4 or later**
- Must use **Safari** browser (not Chrome/Firefox on iOS)

#### Installation Steps:
1. Open the app in **Safari**
2. Tap the **Share** button (box with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Edit the name if desired
5. Tap **"Add"**
6. App icon appears on your home screen

**Note**: iOS PWAs don't show install prompts - users must manually add via Share menu.

---

### **Desktop (Chrome/Edge on Windows/Mac/Linux)**

#### Method 1: Address Bar Icon
1. Visit the app in Chrome/Edge
2. Look for the **install icon** (⊕ or computer) in the address bar
3. Click it and select **"Install"**

#### Method 2: Menu Install
1. Click the **⋮** (three dots) menu
2. Select **"Install Senso"** or **"Apps" → "Install this site as an app"**
3. Click **"Install"**
4. App opens in its own window

#### Method 3: Desktop Shortcut
- After installing, the app appears in:
  - **Windows**: Start Menu & Desktop
  - **macOS**: Applications folder & Launchpad
  - **Linux**: Applications menu

---

## 🔧 For Development/Testing

### Local Testing
```bash
# Serve with HTTPS (required for PWA features)
npm install -g http-server
http-server -S -C cert.pem -K key.pem -p 8080

# Or use Vite (already has dev HTTPS)
npm run dev
```

### Testing PWA Install
1. Open Chrome DevTools (F12)
2. Go to **Application** → **Manifest**
3. Check for errors
4. Click **"Install"** to test

### Testing Service Worker
1. DevTools → **Application** → **Service Workers**
2. Check registration status
3. Test offline mode: Check **"Offline"** in Network tab

---

## 📋 PWA Checklist (Already Configured ✅)

- ✅ manifest.json with correct icons
- ✅ Service worker registered
- ✅ Icons: 16x16, 32x32, 48x48, 144x144, 192x192, 512x512
- ✅ `display: "standalone"` (runs fullscreen)
- ✅ `theme_color` and `background_color` set
- ✅ HTTPS (required in production)
- ✅ Screenshots for app stores
- ✅ Offline support via service worker
- ✅ Background sync for failed uploads
- ✅ Push notifications support

---

## 🌐 Production Deployment

### Requirements for Installation:
1. **HTTPS is mandatory** (except localhost)
2. Valid SSL certificate
3. Service worker must register successfully
4. manifest.json must be accessible

### Recommended Hosting:
- Vercel ✅ (automatic HTTPS)
- Netlify ✅ (automatic HTTPS)
- Firebase Hosting ✅
- AWS Amplify ✅
- GitHub Pages ✅ (with custom domain)

---

## 🐛 Troubleshooting

### Install button not showing (Desktop)
- Clear browser cache and reload
- Check DevTools → Application → Manifest for errors
- Ensure HTTPS is enabled
- Check service worker is registered

### iOS not installing
- Must use Safari (not Chrome on iOS)
- Requires iOS 16.4+ for full PWA support
- Use Share → "Add to Home Screen"

### Service worker not registering
- Check browser console for errors
- Verify service-worker.js is accessible
- Ensure HTTPS in production
- Clear site data and reload

### Icons not showing
- Verify all icon files exist in `/public/icons/`
- Check manifest.json paths
- Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

---

## 📱 Features After Installation

### Installed App Benefits:
- ✅ **Standalone window** (no browser UI)
- ✅ **Appears in app drawer/launcher**
- ✅ **Offline functionality**
- ✅ **Push notifications**
- ✅ **Background sync** (meter readings queued offline)
- ✅ **Faster load times** (cached assets)
- ✅ **Native-like experience**

### iOS Specific:
- Runs in standalone mode (no Safari UI)
- Splash screen from 512x512 icon
- Status bar themed to app color
- Swipe gestures work natively

### Android Specific:
- Appears in app drawer
- Can be uninstalled like native apps
- WebAPK support (better integration)
- Automatic updates via browser

---

## 📊 Verify Installation

### Check if PWA is installed:
```javascript
// In browser console
window.matchMedia('(display-mode: standalone)').matches
// Returns true if installed, false if in browser
```

### Check service worker status:
```javascript
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Service worker:', reg ? 'Active' : 'Not registered');
});
```

---

## 🎯 Quick Install Links (Production)

Once deployed, users can install by:
1. Visiting: `https://your-domain.com`
2. Following platform-specific steps above

**Android**: Automatic prompt appears
**iOS**: Manual "Add to Home Screen" required
**Desktop**: Click install icon in address bar
