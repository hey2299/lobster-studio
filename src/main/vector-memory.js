// Vector Memory Engine - cross-drama character consistency
// Uses sql.js for storage (pure JS, no native deps)
const cosineSimilarity = require('compute-cosine-similarity');
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let db;
let userDataPath = '';

// Deterministic embedding for character profiles (128-dim vector)
// Supports both profile objects and raw text queries
function generateEmbedding(char) {
  const dims = 128;
  let seed;
  
  if (typeof char === 'string') {
    // Raw text query — use directly
    seed = char;
  } else if (char && typeof char === 'object') {
    // Profile object
    seed = [
      char.name || '',
      char.role || '',
      char.personality || '',
      char.appearance || '',
      char.voiceType || '',
      ...(char.attributes || []),
      ...(char.styleTraits || []),
    ].join(' ');
  } else {
    seed = String(char || '');
  }

  const vector = new Array(dims).fill(0);
  for (let i = 0; i < seed.length; i++) {
    const code = seed.charCodeAt(i);
    vector[i % dims] += (code * (i + 1)) / 1000;
    // Better distribution: use position-dependent weight
    const posWeight = 1 + Math.sin(i * 0.1) * 0.5;
    vector[(i + 7) % dims] += (code * posWeight) / 500;
  }
  // Normalize
  let magnitude = 0;
  for (let i = 0; i < dims; i++) magnitude += vector[i] * vector[i];
  magnitude = Math.sqrt(magnitude);
  if (magnitude > 0) for (let i = 0; i < dims; i++) vector[i] /= magnitude;
  return vector;
}

async function initMemoryDB() {
  const SQL = await initSqlJs();
  
  userDataPath = path.join(process.cwd(), '.data');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  const dbPath = path.join(userDataPath, 'character-memory.db');
  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath));
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode = MEMORY');

  db.run(`
    CREATE TABLE IF NOT EXISTS character_vectors (
      character_id TEXT PRIMARY KEY,
      vector_json TEXT NOT NULL,
      profile_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS character_aliases (
      alias TEXT PRIMARY KEY,
      character_id TEXT NOT NULL,
      source_script TEXT DEFAULT ''
    )
  `);

  persistMemoryDB();
  return db;
}

function persistMemoryDB() {
  if (!db || !userDataPath) return;
  const data = db.export();
  fs.writeFileSync(path.join(userDataPath, 'character-memory.db'), Buffer.from(data));
}

function storeCharacterMemory(char) {
  const now = Date.now();
  const vector = generateEmbedding(char);
  const existing = db.exec(`SELECT character_id FROM character_vectors WHERE character_id = '${char.id}'`);

  if (existing.length > 0 && existing[0].values.length > 0) {
    db.run('UPDATE character_vectors SET vector_json=?, profile_json=?, updated_at=? WHERE character_id=?',
      [JSON.stringify(vector), JSON.stringify(char), now, char.id]);
  } else {
    db.run('INSERT INTO character_vectors (character_id, vector_json, profile_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [char.id, JSON.stringify(vector), JSON.stringify(char), now, now]);
  }
  persistMemoryDB();
}

function searchSimilarCharacters(queryChar, threshold = 0.35, limit = 5) {
  const queryObj = typeof queryChar === 'string'
    ? { id: '__query__', name: '', role: '', personality: queryChar }
    : queryChar;
  const queryVector = generateEmbedding(queryObj);
  const stmt = db.prepare('SELECT character_id, vector_json, profile_json FROM character_vectors');
  const scored = [];

  while (stmt.step()) {
    const r = stmt.getAsObject();
    try {
      const storedVector = JSON.parse(r.vector_json);
      const profile = JSON.parse(r.profile_json);
      if (profile.id === queryChar.id) continue;
      const score = cosineSimilarity(queryVector, storedVector);
      if (score >= threshold) {
        scored.push({ character: profile, score });
      }
    } catch (e) { /* skip malformed rows */ }
  }
  stmt.free();

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

function findCharacterByName(name) {
  // Try direct name match first
  const stmt = db.prepare('SELECT profile_json FROM character_vectors');
  while (stmt.step()) {
    const r = stmt.getAsObject();
    const profile = JSON.parse(r.profile_json);
    if (profile.name === name || profile.id === name) {
      stmt.free();
      return profile;
    }
  }
  stmt.free();

  // Try alias match
  const stmt2 = db.prepare(
    'SELECT cv.profile_json FROM character_vectors cv JOIN character_aliases ca ON cv.character_id = ca.character_id WHERE ca.alias = ?'
  );
  stmt2.bind([name]);
  if (stmt2.step()) {
    const r = stmt2.getAsObject();
    stmt2.free();
    return JSON.parse(r.profile_json);
  }
  stmt2.free();
  return null;
}

function addAlias(characterId, alias, sourceScript = '') {
  db.run('INSERT OR IGNORE INTO character_aliases (alias, character_id, source_script) VALUES (?, ?, ?)',
    [alias, characterId, sourceScript]);
  persistMemoryDB();
}

function getCharacterMemory(characterId) {
  const stmt = db.prepare('SELECT profile_json FROM character_vectors WHERE character_id = ?');
  stmt.bind([characterId]);
  if (stmt.step()) {
    const r = stmt.getAsObject();
    stmt.free();
    return JSON.parse(r.profile_json);
  }
  stmt.free();
  return null;
}

function getMemoryStats() {
  const count = db.exec('SELECT COUNT(*) as c FROM character_vectors');
  const aliasCount = db.exec('SELECT COUNT(*) as c FROM character_aliases');
  const total = count[0]?.values?.[0]?.[0] || 0;
  return {
    totalCharacters: total,
    characters: total,
    totalAliases: aliasCount[0]?.values?.[0]?.[0] || 0,
    aliases: aliasCount[0]?.values?.[0]?.[0] || 0,
  };
}

function getAllCharacterMemories() {
  const stmt = db.prepare('SELECT profile_json FROM character_vectors');
  const results = [];
  while (stmt.step()) {
    try {
      const r = stmt.getAsObject();
      results.push(JSON.parse(r.profile_json));
    } catch { /* skip */ }
  }
  stmt.free();
  return results;
}

process.on('exit', () => { if (db) { persistMemoryDB(); db.close(); } });

module.exports = {
  initMemoryDB, storeCharacterMemory, searchSimilarCharacters,
  findCharacterByName, addAlias, getCharacterMemory, getMemoryStats, getAllCharacterMemories, generateEmbedding,
};
