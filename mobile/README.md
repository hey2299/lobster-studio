# 🦞 Lobster Studio Mobile

## Build Guide

### Option 1: PWA (Progressive Web App)
1. Run `npm run build` to build the web app
2. Serve the `dist/` folder with HTTPS
3. Open in Chrome → "Add to Home Screen"

### Option 2: Android WebView (manual)
1. Open `mobile/android/` in Android Studio
2. Copy `dist/` contents to `app/src/main/assets/www/`
3. Build → APK

### Option 3: Capacitor (recommended)
```bash
cd mobile
npm install
npm run build           # builds web app + copies to www/
npx cap sync android    # syncs to Android project
npx cap open android    # opens in Android Studio
npx cap build android   # builds APK/AAB
```

## Features
- WebView with native bridge (share, storage, toast)
- PWA manifest with full icon set
- Service Worker for offline caching
- .lspack file association
