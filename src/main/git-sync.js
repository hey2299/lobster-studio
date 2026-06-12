// Git sync module - manage remote repository backup
// Handles GitHub / Gitee push. Settings stored in local JSON file (not DB).

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SETTINGS_PATH = path.join(__dirname, '.git-sync-settings.json');

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    }
  } catch {}
  return { remoteName: '', remoteUrl: '' };
}

function saveSettings(s) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(s, null, 2));
}

function execGit(args) {
  try {
    const gitPath = findGit();
    const result = execSync(`"${gitPath}" ${args.join(' ')}`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      timeout: 30000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
      maxBuffer: 1024 * 1024,
      shell: 'cmd.exe',
    });
    return { success: true, output: result.trim() };
  } catch (e) {
    const errMsg = e.stderr?.trim() || e.message || '';
    return { success: false, error: errMsg };
  }
}

function findGit() {
  const candidates = [
    'git.exe', 'git',
    path.join(process.env.ProgramFiles || 'C:/Program Files', 'Git', 'bin', 'git.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:/Program Files (x86)', 'Git', 'bin', 'git.exe'),
  ];
  for (const c of candidates) {
    try {
      const r = execSync(`"${c}" --version`, { shell: 'cmd.exe', encoding: 'utf8', timeout: 5000 });
      if (r.includes('git version')) return c;
    } catch {}
  }
  throw new Error('Git not found. Please install Git from https://git-scm.com');
}

function getRemoteInfo() {
  const remotes = execGit(['remote', '-v']);
  if (!remotes.success) return [];

  const lines = remotes.output.split('\n').filter(Boolean);
  const seen = new Set();
  const result = [];

  for (const line of lines) {
    const match = line.match(/^(\S+)\s+(\S+)\s+\((push|fetch)\)$/);
    if (match) {
      const key = match[1];
      if (!seen.has(key)) {
        seen.add(key);
        result.push({
          name: key,
          url: match[2].replace(/\.git$/, ''),
          type: match[2].includes('github.com') ? 'github' : match[2].includes('gitee.com') ? 'gitee' : 'other',
        });
      }
    }
  }
  return result;
}

function getStatus() {
  const branch = execGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  const commit = execGit(['rev-parse', '--short', 'HEAD']);
  const commitMsg = execGit(['log', '--oneline', '-1']);
  const status = execGit(['status', '--short']);
  const log = execGit(['log', '--oneline', '-10']);

  const remoteInfo = getRemoteInfo();
  const settings = loadSettings();

  return {
    branch: branch.success ? branch.output : 'unknown',
    commit: commit.success ? commit.output : 'unknown',
    commitMsg: commitMsg.success ? commitMsg.output : '',
    hasChanges: status.success && status.output.length > 0,
    fileCount: status.success && status.output ? status.output.split('\n').filter(Boolean).length : 0,
    recentLog: log.success ? log.output.split('\n').filter(Boolean) : [],
    remotes: remoteInfo,
    storedRemoteName: settings.remoteName || '',
    storedRemoteUrl: settings.remoteUrl || '',
    gitFound: true,
  };
}

function setRemote(name, url) {
  execGit(['remote', 'remove', name]);
  const result = execGit(['remote', 'add', name, url]);
  if (result.success) {
    saveSettings({ remoteName: name, remoteUrl: url });
  }
  return result;
}

function removeRemote(name) {
  const result = execGit(['remote', 'remove', name]);
  if (result.success) {
    saveSettings({ remoteName: '', remoteUrl: '' });
  }
  return result;
}

function push(remoteName = 'origin', branch = '') {
  const status = execGit(['status', '--porcelain']);
  if (status.success && status.output.trim()) {
    return { success: false, error: '有未提交的更改，请先运行"提交 + 推送"', needsCommit: true };
  }

  if (!branch) {
    const current = execGit(['rev-parse', '--abbrev-ref', 'HEAD']);
    branch = current.success ? current.output : 'main';
  }

  return execGit(['push', '-u', remoteName, branch]);
}

function commitAndPush(message, remoteName = 'origin') {
  execGit(['add', '-A']);
  const commitResult = execGit(['commit', '-m', message || `自动备份 ${new Date().toLocaleString('zh-CN')}`]);
  if (!commitResult.success && !commitResult.error?.includes('nothing to commit')) {
    return commitResult;
  }

  const current = execGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  const branch = current.success ? current.output : 'main';
  return execGit(['push', '-u', remoteName, branch]);
}

function getRecentCommits(count = 10) {
  const log = execGit(['log', `--format=%h|%s|%ai`, `-${count}`]);
  if (!log.success) return [];

  return log.output.split('\n').filter(Boolean).map(line => {
    const [hash, ...rest] = line.split('|');
    return { hash, message: rest.join('|') };
  });
}

module.exports = { getStatus, setRemote, removeRemote, push, commitAndPush, getRecentCommits, getRemoteInfo, findGit };
