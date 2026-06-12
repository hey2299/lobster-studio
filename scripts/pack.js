// Manual packager - copies everything to release dir and creates a launcher
// Bypasses electron-builder's powershell dependency

const fs = require('fs');
const path = require('path');

const src = process.cwd();
const dest = path.join(src, 'release', 'LobsterStudio-win32-x64');

const electronDist = path.join(src, 'node_modules', 'electron', 'dist');

// 1. Clear and create destination
if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true });

// 2. Copy Electron binaries
function copyRecursive(from, to) {
  fs.mkdirSync(to, { recursive: true });
  const entries = fs.readdirSync(from, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) copyRecursive(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

console.log('Copying Electron...');
copyRecursive(electronDist, dest);

// 3. Copy app files
const appDest = path.join(dest, 'resources', 'app');
fs.mkdirSync(path.join(appDest, 'src', 'main'), { recursive: true });
fs.mkdirSync(path.join(appDest, 'dist'), { recursive: true });

// Package.json (prod only deps)
const pkg = JSON.parse(fs.readFileSync(path.join(src, 'package.json'), 'utf8'));
const prodPkg = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  main: 'src/main/main.js',
  dependencies: pkg.dependencies,
};
fs.writeFileSync(path.join(appDest, 'package.json'), JSON.stringify(prodPkg, null, 2));

// Copy main process files
const mainDir = path.join(src, 'src', 'main');
for (const f of fs.readdirSync(mainDir)) {
  fs.copyFileSync(path.join(mainDir, f), path.join(appDest, 'src', 'main', f));
}

// Copy dist (vite output)
const distDir = path.join(src, 'dist');
for (const f of fs.readdirSync(distDir, { recursive: true })) {
  const srcF = path.join(distDir, f);
  const dstF = path.join(appDest, 'dist', f);
  if (fs.statSync(srcF).isDirectory()) {
    fs.mkdirSync(dstF, { recursive: true });
  } else {
    fs.mkdirSync(path.dirname(dstF), { recursive: true });
    fs.copyFileSync(srcF, dstF);
  }
}

// 4. Install prod node_modules
console.log('Installing production dependencies...');
require('child_process').execSync('npm install --production --no-audit --no-fund', {
  cwd: appDest, stdio: 'inherit',
});

// 5. Rename electron.exe
const exeName = 'LobsterStudio.exe';
fs.renameSync(path.join(dest, 'electron.exe'), path.join(dest, exeName));
const localeDir = path.join(dest, 'locales');
if (fs.existsSync(localeDir)) {
  // Keep only zh-CN locale
  for (const f of fs.readdirSync(localeDir)) {
    if (f !== 'zh-CN.pak') fs.rmSync(path.join(localeDir, f));
  }
}

console.log('✅ Package ready at:', dest);
console.log('Launch:', path.join(dest, exeName));
