// Lobster Studio Installer Builder v2
// Pure-JS installer generation (no NSIS/makensis required)
// Creates: install.ps1 + uninstall.ps1 + app copy + batch launcher

const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const RELEASE_DIR = path.join(ROOT, 'release');
const PORTABLE_DIR = path.join(RELEASE_DIR, 'LobsterStudio-win32-x64');
const INSTALLER_DIR = path.join(RELEASE_DIR, 'installer');

function buildInstaller() {
  console.log('📦 Building installer package...\n');

  if (!fs.existsSync(PORTABLE_DIR)) {
    console.log('❌ Portable build not found. Run: node scripts/pack.js win');
    process.exit(1);
  }

  const appCopyDir = path.join(INSTALLER_DIR, 'app');

  // Clean and create dirs
  if (fs.existsSync(INSTALLER_DIR)) {
    // Don't delete app/ — copy on top
    if (!fs.existsSync(appCopyDir)) fs.mkdirSync(appCopyDir, { recursive: true });
  } else {
    fs.mkdirSync(INSTALLER_DIR, { recursive: true });
    fs.mkdirSync(appCopyDir, { recursive: true });
  }

  // Copy portable build to installer/app/
  copyDirSync(PORTABLE_DIR, appCopyDir, ['uninstall.cmd']);
  
  // Copy install.ps1 + uninstall.ps1
  copyFileIfExists(path.join(INSTALLER_DIR, '..', 'installer', 'install.ps1'), path.join(INSTALLER_DIR, 'install.ps1'));
  copyFileIfExists(path.join(INSTALLER_DIR, '..', 'installer', 'uninstall.ps1'), path.join(INSTALLER_DIR, 'uninstall.ps1'));

  // Create setup.bat launcher (double-click friendly)
  const setupBat = `@echo off
chcp 65001 >nul
title 龙虾短剧工坊 安装程序

echo.
echo  ╔══════════════════════════════════════╗
echo  ║   🦞 龙虾短剧工坊 安装程序 v1.0       ║
echo  ║     AI短剧创作工具                     ║
echo  ╚══════════════════════════════════════╝
echo.
echo  📁 将安装到: %%LOCALAPPDATA%%\\LobsterStudio
echo.

REM Check existing installation
if exist "%%LOCALAPPDATA%%\\LobsterStudio\\LobsterStudio.exe" (
  echo ⚠️  检测到已安装版本
  set /p OVERWRITE="是否覆盖安装？(Y/N): "
  if /i not "!OVERWRITE!"=="Y" (
    echo 安装已取消
    pause
    exit /b
  )
)

echo.
echo 安装需要管理员权限创建快捷方式和注册表。
echo 请在弹出的 UAC 窗口中点击"是"。
echo.
pause

REM Self-elevate
net session >nul 2>&1
if %%errorlevel%% neq 0 (
  echo 正在请求管理员权限...
  powershell -Command "Start-Process '%%~dp0install.ps1' -Verb RunAs"
  echo.
  echo 安装程序已在后台启动。安装完成后将自动退出。
  pause
  exit /b
)

powershell -ExecutionPolicy Bypass -File "%%~dp0install.ps1"
pause
`;

  fs.writeFileSync(path.join(RELEASE_DIR, 'Setup.bat'), setupBat, 'utf-8');
  
  // Copy uninstall.ps1 to app directory (used by uninstall shortcut)
  fs.copyFileSync(
    path.join(INSTALLER_DIR, 'uninstall.ps1'),
    path.join(appCopyDir, 'uninstall.ps1')
  );

  // Also copy installer to release root for distribution
  const ROOT_INSTALLER = path.join(RELEASE_DIR, 'installer');
  if (ROOT_INSTALLER !== INSTALLER_DIR) {
    // Already there
  }

  const totalSize = getDirSize(INSTALLER_DIR);
  const appSize = getDirSize(appCopyDir);

  console.log('✅ Installer package ready!');
  console.log(`   📄 ${path.join(RELEASE_DIR, 'Setup.bat')} — 双击安装`);
  console.log(`   📄 ${path.join(INSTALLER_DIR, 'install.ps1')} — PowerShell 安装脚本`);
  console.log(`   📄 ${path.join(INSTALLER_DIR, 'uninstall.ps1')} — 卸载脚本`);
  console.log(`   📁 ${appCopyDir} — 应用文件 (${formatSize(appSize)})`);
  console.log(`   📄 ${path.join(RELEASE_DIR, 'setup.iss')} — Inno Setup 配置 (可选)`);
  console.log(`   📄 ${path.join(RELEASE_DIR, 'installer.nsi')} — NSIS 配置 (可选)`);
  console.log('');
  console.log(`📦 安装包总大小: ${formatSize(totalSize)}`);
  console.log('');
  console.log('📱 双击 release/Setup.bat 即可安装');
  console.log('📱 或使用 Inno Setup 编译 setup.iss 生成官方安装程序');
  console.log('');
  console.log('✅ Installer build complete!');
}

function getDirSize(dirPath) {
  let total = 0;
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const item of items) {
      const fp = path.join(dirPath, item.name);
      if (item.isFile()) total += fs.statSync(fp).size;
      else if (item.isDirectory()) total += getDirSize(fp);
    }
  } catch {}
  return total;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function copyDirSync(src, dest, exclude = []) {
  const items = fs.readdirSync(src, { withFileTypes: true });
  for (const item of items) {
    if (exclude.includes(item.name)) continue;
    const srcPath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);
    if (item.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    } else if (item.isDirectory()) {
      if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
      copyDirSync(srcPath, destPath, exclude);
    }
  }
}

function copyFileIfExists(src, dest) {
  try {
    if (fs.existsSync(src)) fs.copyFileSync(src, dest);
  } catch {}
}

buildInstaller();
