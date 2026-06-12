#!/usr/bin/env node
// deploy-gh-pages.js - 部署 Lobster Studio 到 GitHub Pages
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const BRANCH = process.argv[2] || 'gh-pages';
const REPO = 'https://github.com/hey2299/lobster-studio.git';
const GIT_BIN = 'C:\\Program Files\\Git\\bin';
const GIT = '"' + GIT_BIN + '\\git.exe"';

function sh(cmd, opts) {
  const env = { ...process.env, PATH: GIT_BIN + ';' + (process.env.PATH || '') };
  return execSync(cmd, { ...opts, env, stdio: 'pipe', encoding: 'utf-8', shell: true });
}

console.log('📤 Deploying to GitHub Pages (branch: ' + BRANCH + ')...');

if (!fs.existsSync(DIST) || !fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('❌ dist/ missing. Run: npx vite build');
  process.exit(1);
}

const TMP = path.join(__dirname, '..', '.gh-pages-tmp');
if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true, force: true });
fs.cpSync(DIST, TMP, { recursive: true });
fs.writeFileSync(path.join(TMP, '.nojekyll'), '');

try {
  const opts = { cwd: TMP };
  sh(GIT + ' init', opts);
  sh(GIT + ' checkout -b ' + BRANCH, opts);
  sh(GIT + ' add -A', opts);
  sh(GIT + ' commit -m "Deploy ' + new Date().toISOString().slice(0, 10) + '"', opts);
  sh(GIT + ' remote add origin ' + REPO, opts);
  console.log('   Pushing to ' + REPO + ' #' + BRANCH);
  sh(GIT + ' push -f origin ' + BRANCH, opts);
  console.log('\n✅ Done! https://hey2299.github.io/lobster-studio/');
} catch (e) {
  console.error('\n❌ Failed:', e.message);
} finally {
  if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true, force: true });
}
