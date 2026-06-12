// Local database with better-sqlite3
const Database = require('better-sqlite3');
const path = require('path');

let db;

function initDatabase() {
  const userDataPath = path.join(process.cwd(), '.data');
  const dbPath = path.join(userDataPath, 'lobster-studio.db');
  
  const fs = require('fs');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      script_id TEXT,
      character_ids TEXT DEFAULT '[]',
      voice_ids TEXT DEFAULT '[]',
      status TEXT DEFAULT 'draft',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
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
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS scripts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      genre TEXT DEFAULT '',
      style TEXT DEFAULT '',
      duration INTEGER DEFAULT 60,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  return dbPath;
}

function getCharacters() {
  const rows = db.prepare('SELECT * FROM characters ORDER BY created_at DESC').all();
  return rows.map(function(r) {
    return {
      id: r.id, name: r.name, role: r.role,
      personality: r.personality, appearance: r.appearance,
      voiceType: r.voice_type, avatarUrl: r.avatar_url,
      portraitPrompt: r.portrait_prompt,
      scriptsUsed: JSON.parse(r.scripts_used || '[]'),
      createdAt: r.created_at,
    };
  });
}

function saveCharacter(char) {
  const existing = db.prepare('SELECT id FROM characters WHERE id = ?').get(char.id);
  if (existing) {
    db.prepare('UPDATE characters SET name=?, role=?, personality=?, appearance=?, voice_type=?, avatar_url=?, portrait_prompt=?, scripts_used=? WHERE id=?')
      .run(char.name, char.role, char.personality, char.appearance,
        char.voiceType, char.avatarUrl, char.portraitPrompt,
        JSON.stringify(char.scriptsUsed || []), char.id);
  } else {
    db.prepare('INSERT INTO characters (id, name, role, personality, appearance, voice_type, avatar_url, portrait_prompt, scripts_used, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(char.id, char.name, char.role, char.personality, char.appearance,
        char.voiceType, char.avatarUrl, char.portraitPrompt,
        JSON.stringify(char.scriptsUsed || []), char.createdAt);
  }
}

function deleteCharacter(id) {
  db.prepare('DELETE FROM characters WHERE id = ?').run(id);
}

function getProjects() {
  const rows = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
  return rows.map(function(r) {
    return {
      id: r.id, title: r.title, scriptId: r.script_id || undefined,
      characterIds: JSON.parse(r.character_ids || '[]'),
      voiceIds: JSON.parse(r.voice_ids || '[]'),
      status: r.status, createdAt: r.created_at, updatedAt: r.updated_at,
    };
  });
}

function saveProject(proj) {
  const now = Date.now();
  const existing = db.prepare('SELECT id FROM projects WHERE id = ?').get(proj.id);
  if (existing) {
    db.prepare('UPDATE projects SET title=?, script_id=?, character_ids=?, voice_ids=?, status=?, updated_at=? WHERE id=?')
      .run(proj.title, proj.scriptId || null, JSON.stringify(proj.characterIds),
        JSON.stringify(proj.voiceIds), proj.status, now, proj.id);
  } else {
    db.prepare('INSERT INTO projects (id, title, script_id, character_ids, voice_ids, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(proj.id, proj.title, proj.scriptId || null, JSON.stringify(proj.characterIds),
        JSON.stringify(proj.voiceIds), proj.status, now, now);
  }
}

function deleteProject(id) {
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

module.exports = { initDatabase, getCharacters, saveCharacter, deleteCharacter,
  getProjects, saveProject, deleteProject, getSetting, setSetting };
