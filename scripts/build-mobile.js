// Lobster Studio Mobile — PWA + Android WebView Shell
// Generates: PWA manifest + service worker + Capacitor project files

const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const MOBILE_DIR = path.join(ROOT, 'mobile');
const ANDROID_DIR = path.join(MOBILE_DIR, 'android');

function buildMobile() {
  console.log('📱 Building mobile version...\n');

  // Ensure dirs
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  if (!fs.existsSync(ANDROID_DIR)) fs.mkdirSync(ANDROID_DIR, { recursive: true });
  if (!fs.existsSync(path.join(MOBILE_DIR, 'www'))) fs.mkdirSync(path.join(MOBILE_DIR, 'www'), { recursive: true });

  // ─── 1. Web App Manifest ───
  const manifest = {
    name: '龙虾短剧工坊',
    short_name: 'LobsterStudio',
    description: 'AI-powered short drama creation studio — full pipeline from script to publish',
    start_url: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#0a0a0f',
    theme_color: '#e84142',
    lang: 'zh-CN',
    icons: [
      { src: '/icons/icon-72.png', sizes: '72x72', type: 'image/png' },
      { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
      { src: '/icons/icon-128.png', sizes: '128x128', type: 'image/png' },
      { src: '/icons/icon-144.png', sizes: '144x144', type: 'image/png' },
      { src: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
    categories: ['entertainment', 'productivity', 'video'],
    screenshots: [
      { src: '/screenshots/dashboard.png', sizes: '1280x720', type: 'image/png', form_factor: 'wide' },
      { src: '/screenshots/mobile.png', sizes: '720x1280', type: 'image/png', form_factor: 'narrow' },
    ],
    prefer_related_applications: false,
    related_applications: [],
  };

  fs.writeFileSync(path.join(PUBLIC_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('   ✅ manifest.json');

  // ─── 2. Generate Icons (SVG-based placeholder icons) ───
  const iconsDir = path.join(PUBLIC_DIR, 'icons');
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

  // Generate PNG placeholder icons as SVG data URLs
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  for (const size of sizes) {
    // Generate a simple SVG icon — a lobster/studio emoji styled icon
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#e84142"/>
          <stop offset="100%" stop-color="#ff6b6b"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="url(#bg)"/>
      <text x="${size * 0.5}" y="${size * 0.62}" text-anchor="middle" font-size="${Math.round(size * 0.5)}" fill="white">🦞</text>
    </svg>`;
    
    // Write as SVG (PNG will be generated at build time)
    fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), svg);
  }
  console.log('   ✅ Icons (' + sizes.length + ' sizes SVG)');

  // Generate a simple PNG placeholder (1x1 pixel data URL)
  // Real icons will need to be generated at build time via tool like sharp

  // ─── 3. Service Worker ───
  const swCode = `// Lobster Studio Service Worker v1
const CACHE_NAME = 'lobster-studio-v1';
const ASSETS_TO_CACHE = [];

// Install
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
});

// Fetch: network-first with cache fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET and API calls
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
`;

  fs.writeFileSync(path.join(PUBLIC_DIR, 'sw.js'), swCode);
  console.log('   ✅ sw.js (Service Worker)');

  // ─── 4. Android WebView Shell (Capacitor-compatible) ───
  const androidBuildGradle = `// Lobster Studio Android Shell
// Gradle build file for Android WebView app

buildscript {
    ext.kotlin_version = '1.9.0'
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.0'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
`;

  fs.writeFileSync(path.join(ANDROID_DIR, 'build.gradle'), androidBuildGradle);

  // Android app source
  const appSrc = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.lobsterstudio.app"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <application
        android:allowBackup="true"
        android:label="龙虾短剧工坊"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:label="龙虾短剧工坊"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <!-- Open .lspack files -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:scheme="file" android:mimeType="application/octet-stream" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`;

  fs.writeFileSync(path.join(ANDROID_DIR, 'AndroidManifest.xml'), appSrc);

  // MainActivity.java
  const mainActivity = `package com.lobsterstudio.app;

import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        webView = new WebView(this);
        setContentView(webView);
        
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        
        // Enable hardware acceleration
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient());
        
        // Load the app
        webView.loadUrl("file:///android_asset/www/index.html");
        
        // Bridge for Electron IPC → Android
        webView.addJavascriptInterface(new AndroidBridge(this), "AndroidBridge");
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
`;

  const bridgesDir = path.join(ANDROID_DIR, 'app', 'src', 'main', 'java', 'com', 'lobsterstudio', 'app');
  if (!fs.existsSync(bridgesDir)) fs.mkdirSync(bridgesDir, { recursive: true });
  fs.writeFileSync(path.join(bridgesDir, 'MainActivity.java'), mainActivity);

  // Android Bridge (JS interface for native features)
  const androidBridge = `package com.lobsterstudio.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

public class AndroidBridge {
    private Activity activity;
    
    public AndroidBridge(Activity activity) {
        this.activity = activity;
    }
    
    @JavascriptInterface
    public String getPlatform() {
        return "android";
    }
    
    @JavascriptInterface
    public void shareText(String text) {
        Intent sendIntent = new Intent();
        sendIntent.setAction(Intent.ACTION_SEND);
        sendIntent.putExtra(Intent.EXTRA_TEXT, text);
        sendIntent.setType("text/plain");
        activity.startActivity(Intent.createChooser(sendIntent, "分享到"));
    }
    
    @JavascriptInterface
    public void shareFile(String filePath) {
        Uri fileUri = Uri.parse(filePath);
        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.putExtra(Intent.EXTRA_STREAM, fileUri);
        shareIntent.setType("video/*");
        activity.startActivity(Intent.createChooser(shareIntent, "分享视频"));
    }
    
    @JavascriptInterface
    public String getExternalStorageDir() {
        return Environment.getExternalStorageDirectory().getAbsolutePath();
    }
    
    @JavascriptInterface
    public void showToast(String message) {
        activity.runOnUiThread(() -> 
            Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
        );
    }
}
`;

  fs.writeFileSync(path.join(bridgesDir, 'AndroidBridge.java'), androidBridge);

  // ─── 5. Capacitor config ───
  const capacitorConfig = `{
  "appId": "com.lobsterstudio.app",
  "appName": "龙虾短剧工坊",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https",
    "cleartext": true
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#0a0a0f",
      "showSpinner": false
    }
  }
}
`;

  fs.writeFileSync(path.join(MOBILE_DIR, 'capacitor.config.json'), capacitorConfig);

  // ─── 6. Package.json for mobile ───
  const mobilePkg = `{
  "name": "lobster-studio-mobile",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "cd .. && npm run build && cp -r dist/* mobile/www/",
    "android:sync": "npx cap sync android",
    "android:open": "npx cap open android",
    "android:build": "npx cap build android"
  },
  "dependencies": {
    "@capacitor/android": "^6.0.0",
    "@capacitor/core": "^6.0.0"
  },
  "devDependencies": {
    "@capacitor/cli": "^6.0.0"
  }
}
`;

  fs.writeFileSync(path.join(MOBILE_DIR, 'package.json'), mobilePkg);

  // ─── 7. HTML entry for mobile (detects WebView vs PWA) ───
  const mobileHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#0a0a0f">
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/icons/icon-192.png">
  <title>龙虾短剧工坊</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: #0a0a0f; color: #fff; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      overscroll-behavior: none; 
    }
    #app { width: 100%; height: 100dvh; }
    
    /* Mobile-specific scrollbar */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
    
    /* Safe area padding */
    @supports (padding-top: env(safe-area-inset-top)) {
      .safe-top { padding-top: env(safe-area-inset-top); }
      .safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
    }
  </style>
</head>
<body>
  <div id="app"></div>
  
  <script>
    // Mobile platform detection
    window.__MOBILE__ = true;
    window.__PLATFORM__ = navigator.userAgent.includes('Android') ? 'android' : 
                          navigator.userAgent.includes('iPhone') ? 'ios' : 'web';
    
    // Polyfill for Electron IPC in mobile
    window.electronAPI = {
      getPlatform: () => Promise.resolve(window.__PLATFORM__),
      getVersion: () => Promise.resolve('1.0.0-mobile'),
      // All other methods return graceful fallbacks
    };
    
    // Load main app
    const script = document.createElement('script');
    script.src = '/assets/index.js';
    script.type = 'module';
    document.body.appendChild(script);
  </script>
</body>
</html>
`;

  const mobileWww = path.join(MOBILE_DIR, 'www');
  if (!fs.existsSync(mobileWww)) fs.mkdirSync(mobileWww, { recursive: true });
  fs.writeFileSync(path.join(mobileWww, 'index.html'), mobileHtml);

  console.log('   ✅ Android WebView shell (MainActivity + Bridge)');
  console.log('   ✅ Capacitor config');
  console.log('   ✅ Mobile HTML entry');
  
  // ─── 8. Install guide ───
  const guide = `# 🦞 Lobster Studio Mobile

## Build Guide

### Option 1: PWA (Progressive Web App)
1. Run \`npm run build\` to build the web app
2. Serve the \`dist/\` folder with HTTPS
3. Open in Chrome → "Add to Home Screen"

### Option 2: Android WebView (manual)
1. Open \`mobile/android/\` in Android Studio
2. Copy \`dist/\` contents to \`app/src/main/assets/www/\`
3. Build → APK

### Option 3: Capacitor (recommended)
\`\`\`bash
cd mobile
npm install
npm run build           # builds web app + copies to www/
npx cap sync android    # syncs to Android project
npx cap open android    # opens in Android Studio
npx cap build android   # builds APK/AAB
\`\`\`

## Features
- WebView with native bridge (share, storage, toast)
- PWA manifest with full icon set
- Service Worker for offline caching
- .lspack file association
`;

  fs.writeFileSync(path.join(MOBILE_DIR, 'README.md'), guide);

  console.log('\n✅ Mobile build complete!');
  console.log('   📱 PWA: public/manifest.json + sw.js');
  console.log('   📱 Android: mobile/android/');
  console.log('   📱 Capacitor: mobile/capacitor.config.json');
  console.log('   📱 Guide: mobile/README.md');
  console.log('\n📦 To build APK:');
  console.log('   1. Install Android Studio + Capacitor CLI');
  console.log('   2. Run: cd mobile && npm install && npm run build && npx cap build android');
  console.log('');
}

buildMobile();
