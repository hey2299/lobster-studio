#!/usr/bin/env node
// Setup Git remote for lobster-studio
// Usage: node scripts/setup-remote.js <github-username> <repo-name>
// Example: node scripts/setup-remote.js xiaoxiami lobster-studio

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT = path.resolve(__dirname, '..');

function run(args) {
  try {
    const r = execSync(`"${findGit()}" ${args.join(' ')}`, {
      cwd: PROJECT, encoding: 'utf8', timeout: 30000, shell: 'cmd.exe',
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    });
    return r.trim();
  } catch (e) {
    console.error(e.stderr?.trim() || e.message);
    return null;
  }
}

function findGit() {
  const candidates = ['git.exe', 'git',
    'C:/Program Files/Git/bin/git.exe', 'C:/Program Files (x86)/Git/bin/git.exe'];
  for (const c of candidates) {
    try {
      execSync(`"${c}" --version`, { shell: 'cmd.exe', timeout: 5000 });
      return c;
    } catch {}
  }
  throw new Error('Git not found');
}

const [,, username, repo] = process.argv;

if (!username || !repo) {
  console.log('');
  console.log('🔧 龙虾短剧工坊 - Git 远端设置工具');
  console.log('');
  console.log('用法:');
  console.log('  node scripts/setup-remote.js <GitHub用户名> <仓库名>');
  console.log('');
  console.log('例如:');
  console.log('  node scripts/setup-remote.js xiaoxiami lobster-studio');
  console.log('');
  console.log('步骤:');
  console.log('  1. 先去 https://github.com/new 创建同名空仓库');
  console.log('     → 不要勾选 README/.gitignore/LICENSE');
  console.log('  2. 然后运行本脚本');
  console.log('');
  process.exit(1);
}

console.log(`\n📤 设置远程仓库: ${username}/${repo}`);
console.log(`   远程地址: https://github.com/${username}/${repo}.git\n`);

// Check if remote already exists
const remotes = run(['remote', '-v']);
if (remotes?.includes('origin')) {
  console.log('ℹ️ remote origin 已存在，更新中...');
  run(['remote', 'set-url', 'origin', `https://github.com/${username}/${repo}.git`]);
} else {
  run(['remote', 'add', 'origin', `https://github.com/${username}/${repo}.git`]);
}

console.log('✅ 远程仓库已配置');
console.log('');
console.log('下一步: 运行以下命令推送');
console.log('');
console.log(`  git push -u origin master`);
console.log('');
console.log('如果遇到认证问题，可以用 Token:');
console.log('  1. 去 https://github.com/settings/tokens 创建 token');
console.log('  2. 运行: git remote set-url origin https://TOKEN@github.com/username/repo.git');
console.log('');
