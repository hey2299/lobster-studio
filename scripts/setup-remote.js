#!/usr/bin/env node
// One-click remote setup for Lobster Studio
// Generates Gitee repository URL and configures git remote
// 
// Usage:
//   node scripts/push-to-gitee.js <gitee-username> <repo-name>
//
// Or for GitHub (need PAT token):
//   node scripts/push-to-github.js <github-username> <repo-name> <pat-token>

const { execSync } = require('child_process');
const path = require('path');

const PROJECT = path.resolve(__dirname, '..');
const [,, username, repo, token] = process.argv;

function findGit() {
  const candidates = ['git', 'git.exe',
    'C:/Program Files/Git/bin/git.exe',
    'C:/Program Files (x86)/Git/bin/git.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Git', 'cmd', 'git.exe'),
  ];
  for (const c of candidates) {
    try {
      execSync(`"${c}" --version 2>NUL`, { shell: 'cmd.exe', timeout: 3000, encoding: 'utf8' });
      return c;
    } catch {}
  }
  return null;
}

function git(args) {
  const gitPath = findGit();
  if (!gitPath) throw new Error('Git not found');
  try {
    const r = execSync(`"${gitPath}" ${args.join(' ')}`, {
      cwd: PROJECT, shell: 'cmd.exe', timeout: 30000, encoding: 'utf8',
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    });
    return r.trim();
  } catch (e) {
    throw new Error(e.stderr?.trim() || e.message);
  }
}

console.log('');
console.log('╔════════════════════════════════════════════════╗');
console.log('║   🌐 龙虾短剧工坊 - 远程仓库设置工具           ║');
console.log('╚════════════════════════════════════════════════╝');
console.log('');

if (!username) {
  console.log('用法: node scripts/setup-remote.js <GitHub用户名> <仓库名>');
  console.log('');
  console.log('例如:');
  console.log('  node scripts/setup-remote.js xiaoxiami lobster-studio');
  console.log('');
  console.log('步骤:');
  console.log('  1️⃣  去 https://github.com/new');
  console.log('      仓库名填 ' + (repo || 'lobster-studio') + '，其他默认');
  console.log('  2️⃣  运行这个脚本');
  console.log('  3️⃣  输入 Personal Access Token');
  console.log('');
  console.log('或者用 Gitee (国内网络友好):');
  console.log('  1️⃣  去 https://gitee.com/projects/new');
  console.log('  2️⃣  运行脚本: node scripts/setup-remote.js <gitee用户名> lobster-studio');
  console.log('');
  process.exit(1);
}

const repoName = repo || 'lobster-studio';

console.log(`用户: ${username}`);
console.log(`仓库: ${repoName}`);
console.log('');

// Remove existing origin
try { git(['remote', 'remove', 'origin']); } catch {}

let remoteUrl;
let authUrl;

if (token) {
  // GitHub with PAT
  remoteUrl = `https://github.com/${username}/${repoName}.git`;
  authUrl = `https://${username}:${token}@github.com/${username}/${repoName}.git`;
  console.log('🔑 使用 GitHub + Personal Access Token');
} else {
  // Gitee or GitHub (public)
  const useGitee = username.includes('gitee') ? true : false;
  if (useGitee) {
    remoteUrl = `https://gitee.com/${username}/${repoName}.git`;
  } else {
    remoteUrl = `https://github.com/${username}/${repoName}.git`;
  }
  authUrl = remoteUrl;
  console.log('🔗 远程地址: ' + remoteUrl);
  console.log('');
  
  if (!token) {
    console.log('⚠️  没有提供 Token，先设置远程 URL');
    console.log('   首次推送需要认证:');
    console.log(`   git push -u origin master`);
    console.log('   然后输入 GitHub 用户名和密码（或 Token）');
    console.log('');
  }
}

// Set remote
git(['remote', 'add', 'origin', authUrl]);
console.log('✅ 远程仓库已配置: origin → ' + remoteUrl);
console.log('');

// Try push
console.log('正在推送...');
try {
  const result = git(['push', '-u', 'origin', 'master']);
  console.log('✅ 推送成功！');
  console.log(result);
} catch (e) {
  const errMsg = e.message || '';
  if (errMsg.includes('Repository not found')) {
    console.log('❌ 仓库不存在！请先在 GitHub/Gitee 创建同名空仓库。');
    console.log('');
    console.log('创建后再次运行:');
    console.log(`  git push -u origin master`);
    console.log('');
  } else if (errMsg.includes('Authentication failed') || errMsg.includes('403')) {
    console.log('❌ 认证失败。请用 Token 方式:');
    console.log('');
    console.log(`  git remote set-url origin https://${username}:TOKEN@github.com/${username}/${repoName}.git`);
    console.log(`  git push -u origin master`);
    console.log('');
    console.log('Token 获取: https://github.com/settings/tokens');
    console.log('');
  } else {
    console.log('⚠️ 推送失败: ' + errMsg.substring(0, 200));
    console.log('');
    console.log('可以稍后手动推送:');
    console.log(`  git push -u origin master`);
    console.log('');
  }
}
