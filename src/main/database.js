// Local database with sql.js (pure JS SQLite - no native deps, no Python needed)
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let db;
let userDataPath;

async function initDatabase() {
  const SQL = await initSqlJs();
  
  userDataPath = path.join(process.cwd(), '.data');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  const dbPath = path.join(userDataPath, 'lobster-studio.db');

  // Load existing DB or create new
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Enable WAL-like persistence (save on write)
  db.run('PRAGMA journal_mode = MEMORY');

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      script_id TEXT,
      character_ids TEXT DEFAULT '[]',
      voice_ids TEXT DEFAULT '[]',
      status TEXT DEFAULT 'draft',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      personality TEXT DEFAULT '',
      appearance TEXT DEFAULT '',
      voice_type TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      portrait_prompt TEXT DEFAULT '',
      scripts_used TEXT DEFAULT '[]',
      created_at INTEGER NOT NULL
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS scripts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      genre TEXT DEFAULT '',
      style TEXT DEFAULT '',
      duration INTEGER DEFAULT 60,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Save initial DB file
  persistDB();
  console.log('Database initialized at:', dbPath);
  return dbPath;
}

function persistDB() {
  if (!db || !userDataPath) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(path.join(userDataPath, 'lobster-studio.db'), buffer);
}

function rowToObj(row, columns) {
  if (!row) return null;
  const obj = {};
  columns.forEach((col, i) => { obj[col] = row[i]; });
  return obj;
}

function getCharacters() {
  const stmt = db.prepare('SELECT * FROM characters ORDER BY created_at DESC');
  const results = [];
  while (stmt.step()) {
    const r = stmt.getAsObject();
    results.push({
      id: r.id, name: r.name, role: r.role,
      personality: r.personality || '', appearance: r.appearance || '',
      voiceType: r.voice_type || '', avatarUrl: r.avatar_url || '',
      portraitPrompt: r.portrait_prompt || '',
      scriptsUsed: safeJSON(r.scripts_used || '[]', []),
      createdAt: r.created_at,
    });
  }
  stmt.free();
  return results;
}

function saveCharacter(char) {
  const existing = db.exec(`SELECT id FROM characters WHERE id = '${char.id}'`);
  const now = Date.now();

  if (existing.length > 0 && existing[0].values.length > 0) {
    db.run(`UPDATE characters SET name=?, role=?, personality=?, appearance=?, voice_type=?, avatar_url=?, portrait_prompt=?, scripts_used=? WHERE id=?`,
      [char.name, char.role, char.personality || '', char.appearance || '',
        char.voiceType || '', char.avatarUrl || '', char.portraitPrompt || '',
        JSON.stringify(char.scriptsUsed || []), char.id]);
  } else {
    db.run(`INSERT INTO characters (id, name, role, personality, appearance, voice_type, avatar_url, portrait_prompt, scripts_used, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [char.id, char.name, char.role, char.personality || '', char.appearance || '',
        char.voiceType || '', char.avatarUrl || '', char.portraitPrompt || '',
        JSON.stringify(char.scriptsUsed || []), char.createdAt || now]);
  }
  persistDB();
}

function deleteCharacter(id) {
  db.run('DELETE FROM characters WHERE id = ?', [id]);
  persistDB();
}

function getProjects() {
  const stmt = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC');
  const results = [];
  while (stmt.step()) {
    const r = stmt.getAsObject();
    results.push({
      id: r.id, title: r.title, scriptId: r.script_id || undefined,
      characterIds: safeJSON(r.character_ids || '[]', []),
      voiceIds: safeJSON(r.voice_ids || '[]', []),
      status: r.status, createdAt: r.created_at, updatedAt: r.updated_at,
    });
  }
  stmt.free();
  return results;
}

function saveProject(proj) {
  const now = Date.now();
  const existing = db.exec(`SELECT id FROM projects WHERE id = '${proj.id}'`);
  
  if (existing.length > 0 && existing[0].values.length > 0) {
    db.run(`UPDATE projects SET title=?, script_id=?, character_ids=?, voice_ids=?, status=?, updated_at=? WHERE id=?`,
      [proj.title, proj.scriptId || null, JSON.stringify(proj.characterIds || []),
        JSON.stringify(proj.voiceIds || []), proj.status || 'draft', now, proj.id]);
  } else {
    db.run(`INSERT INTO projects (id, title, script_id, character_ids, voice_ids, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [proj.id, proj.title, proj.scriptId || null, JSON.stringify(proj.characterIds || []),
        JSON.stringify(proj.voiceIds || []), proj.status || 'draft', now, now]);
  }
  persistDB();
}

function deleteProject(id) {
  db.run('DELETE FROM projects WHERE id = ?', [id]);
  persistDB();
}

function getSetting(key) {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  stmt.bind([key]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row.value;
  }
  stmt.free();
  return null;
}

function setSetting(key, value) {
  const existing = db.exec(`SELECT key FROM settings WHERE key = '${key}'`);
  if (existing.length > 0 && existing[0].values.length > 0) {
    db.run('UPDATE settings SET value=? WHERE key=?', [value, key]);
  } else {
    db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
  }
  persistDB();
}

function safeJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

// Clean up on exit
process.on('exit', () => { if (db) { persistDB(); db.close(); } });

module.exports = { initDatabase, getCharacters, saveCharacter, deleteCharacter,
  getProjects, saveProject, deleteProject, getSetting, setSetting };
