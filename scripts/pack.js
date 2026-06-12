// Multi-platform packager for Lobster Studio
// Builds portable packages for Windows, macOS, and Linux
// Usage: node scripts/pack.js [win|mac|linux]
//   (default: all available on current platform)

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const src = process.cwd();
const releaseDir = path.join(src, 'release');
const electronDist = path.join(src, 'node_modules', 'electron', 'dist');
const pkg = JSON.parse(fs.readFileSync(path.join(src, 'package.json'), 'utf8'));

function copyRecursive(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  const entries = fs.readdirSync(from, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      // Skip unnecessary Electron files
      if (['swiftshader', 'v8_context_snapshot.bin'].includes(entry.name)) continue;
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function buildPackage(platform, exeName, appDirName) {
  console.log(`\n📦 Building for ${platform}...`);
  const dest = path.join(releaseDir, appDirName);
  
  // 1. Clean
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true });

  // 2. Copy Electron
  console.log(`  Copying Electron (${platform})...`);
  copyRecursive(electronDist, dest);

  // 3. Copy app
  const appDest = path.join(dest, 'resources', 'app');
  fs.mkdirSync(path.join(appDest, 'src', 'main'), { recursive: true });
  fs.mkdirSync(path.join(appDest, 'dist'), { recursive: true });

  const prodPkg = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    main: 'src/main/main.js',
    dependencies: pkg.dependencies,
  };
  fs.writeFileSync(path.join(appDest, 'package.json'), JSON.stringify(prodPkg, null, 2));

  // Main process files
  const mainDir = path.join(src, 'src', 'main');
  for (const f of fs.readdirSync(mainDir)) {
    if (f.endsWith('.json')) continue; // skip settings files
    fs.copyFileSync(path.join(mainDir, f), path.join(appDest, 'src', 'main', f));
  }

  // Dist (vite output)
  const distDir = path.join(src, 'dist');
  if (fs.existsSync(distDir)) {
    function recurseD(dir, base) {
      for (const f of fs.readdirSync(dir)) {
        const sf = path.join(dir, f);
        const df = path.join(base, f);
        if (fs.statSync(sf).isDirectory()) {
          fs.mkdirSync(df, { recursive: true });
          recurseD(sf, df);
        } else {
          fs.copyFileSync(sf, df);
        }
      }
    }
    recurseD(distDir, path.join(appDest, 'dist'));
  }

  // 4. Install deps
  console.log('  Installing production dependencies...');
  try {
    execSync('npm install --production --no-audit --no-fund 2>&1', {
      cwd: appDest, stdio: 'pipe',
      timeout: 60000, shell: 'cmd.exe',
    });
  } catch (e) {
    // npm warnings are non-fatal
  }

  // 5. Rename Electron binary
  const oldExe = path.join(dest, 'electron' + (platform === 'win' ? '.exe' : ''));
  const newExe = path.join(dest, exeName);
  if (fs.existsSync(oldExe)) {
    fs.renameSync(oldExe, newExe);
  }

  // 6. Cleanup locales (keep zh-CN only)
  const localeDir = path.join(dest, 'locales');
  if (fs.existsSync(localeDir)) {
    for (const f of fs.readdirSync(localeDir)) {
      if (f !== 'zh-CN.pak') fs.rmSync(path.join(localeDir, f));
    }
  }

  // 7. Package info
  const size = fs.statSync(newExe).length;
  console.log(`  ✅ ${exeName} (${(size / 1024 / 1024).toFixed(0)} MB)`);
  return dest;
}

// Determine platform
const target = process.argv[2] || 'auto';

const platform = process.platform;
if (target === 'win' || (target === 'auto' && platform === 'win32')) {
  buildPackage('win', 'LobsterStudio.exe', 'LobsterStudio-win32-x64');
}
if (target === 'mac' || (target === 'auto' && platform === 'darwin')) {
  buildPackage('mac', 'LobsterStudio.app', 'LobsterStudio-darwin-x64');
  // For macOS, also create .app bundle structure
  const appDir = path.join(releaseDir, 'LobsterStudio-darwin-x64');
  const macApp = path.join(releaseDir, 'LobsterStudio.app');
  if (!fs.existsSync(macApp)) {
    fs.mkdirSync(path.join(macApp, 'Contents', 'MacOS'), { recursive: true });
    fs.mkdirSync(path.join(macApp, 'Contents', 'Resources'), { recursive: true });
    fs.writeFileSync(path.join(macApp, 'Contents', 'Info.plist'), `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>龙虾短剧工坊</string>
  <key>CFBundleDisplayName</key><string>龙虾短剧工坊</string>
  <key>CFBundleExecutable</key><string>LobsterStudio</string>
  <key>CFBundleIdentifier</key><string>com.lobster.studio</string>
  <key>CFBundleVersion</key><string>1.0.0</string>
</dict></plist>`);
    // Copy app into bundle
    copyRecursive(appDir, path.join(macApp, 'Contents'));
  }
}
if (target === 'linux' || (target === 'auto' && platform === 'linux')) {
  buildPackage('linux', 'LobsterStudio', 'LobsterStudio-linux-x64');
}

console.log('\n✅ All builds complete!');
console.log(`  📁 ${releaseDir}`);
