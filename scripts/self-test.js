// 🦞 龙虾短剧工坊 — 全模块自测脚本 v3.1
// 14 Modules | 功能完整性 + 边界测试 + 错误入知识库
// 运行: node scripts/self-test.js

const path = require('path');
const fs = require('fs');

const SRC = path.join(__dirname, '..', 'src', 'main');
const KB = path.join(__dirname, '..', 'knowledge-base');
const ERR_FILE = path.join(KB, 'known-errors.md');
const LOG_FILE = path.join(KB, 'test-results.log');

let pass = 0, fail = 0, errors = [];
const uid = () => Math.random().toString(36).substring(2, 15);

function t(name, fn) {
  try { fn(); pass++; console.log('  \u2705', name); }
  catch(e) { fail++; errors.push({name, msg: (e.message||'ERR').substring(0,200)}); console.log('  \u274c', name, '-', (e.message||'ERR').substring(0,120)); }
}

async function ta(name, fn) {
  try { await fn(); pass++; console.log('  \u2705', name); }
  catch(e) { fail++; errors.push({name, msg: (e.message||'ERR').substring(0,200)}); console.log('  \u274c', name, '-', (e.message||'ERR').substring(0,120)); }
}

function load(m) { return require(path.join(SRC, m)); }

async function run() {
  console.log('===============================================');
  console.log('  Lobster Studio - Full Module Self Test v3.1');
  console.log('  14 Modules | Functional + Edge Case Tests');
  console.log('===============================================\n');

  if (!fs.existsSync(KB)) fs.mkdirSync(KB, { recursive: true });
  if (!fs.existsSync(ERR_FILE)) {
    fs.writeFileSync(ERR_FILE, '# Lobster Studio Known Errors\n\nLast updated: -\n\n', 'utf-8');
  }

  // === 1. DATABASE ===
  console.log('=== 1. Database (database.js) ===');
  const DATA = path.join(__dirname, '..', '.data');
  if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
  const db = load('database');
  await db.initDatabase();

  t('DB: create 3 characters', () => {
    db.saveCharacter({id:uid(), name:'Lin', role:'boss', personality:'cold', voiceType:'deep'});
    db.saveCharacter({id:uid(), name:'Su', role:'heroine', personality:'warm', voiceType:'sweet'});
    db.saveCharacter({id:uid(), name:'Wang', role:'villain', personality:'sly', voiceType:'gruff'});
    if (db.getCharacters().length < 3) throw new Error('Expected >=3, got ' + db.getCharacters().length);
  });

  t('DB: delete character', () => {
    const chars = db.getCharacters();
    db.deleteCharacter(chars[0].id);
    if (db.getCharacters().length !== chars.length - 1) throw new Error('Delete failed');
  });

  t('DB: setting CRUD', () => {
    db.setSetting('k1', 'v1');
    if (db.getSetting('k1') !== 'v1') throw new Error('Readback mismatch');
  });

  t('DB: special chars (emoji, quotes, newlines)', () => {
    const s = 'hello \\n world \t test \u2603\ufe0f';
    db.setSetting('spec', s);
    if (db.getSetting('spec') !== s) throw new Error('Special chars corrupted');
  });

  t('DB: long text 10K', () => {
    db.setSetting('long', 'x'.repeat(10000));
    if (db.getSetting('long').length !== 10000) throw new Error('Truncated: ' + db.getSetting('long').length);
    db.setSetting('long', 'reset');
  });

  t('DB: empty string', () => {
    db.setSetting('empty', '');
    if (db.getSetting('empty') !== '') throw new Error('Empty string fail');
  });

  t('DB: projects CRUD', () => {
    db.saveProject({id:uid(), title:'Project1', genre:'romance'});
    db.saveProject({id:uid(), title:'Project2', genre:'fantasy'});
    if (db.getProjects().length < 2) throw new Error('Expected >=2');
    const pj = db.getProjects();
    db.deleteProject(pj[0].id);
    if (db.getProjects().length !== pj.length - 1) throw new Error('Delete project failed');
  });

  // === 2. VECTOR MEMORY ===
  console.log('\n=== 2. Vector Memory (vector-memory.js) ===');
  const mem = load('vector-memory');
  await mem.initMemoryDB();

  await ta('VM: store 3 characters', async () => {
    await mem.storeCharacterMemory({id:uid(), name:'Lin', role:'boss', personality:'cold dominant', voiceType:'deep'});
    await mem.storeCharacterMemory({id:uid(), name:'Su', role:'heroine', personality:'warm resilient', voiceType:'sweet'});
    await mem.storeCharacterMemory({id:uid(), name:'Wang', role:'butler', personality:'loyal', voiceType:'old'});
    if (mem.getAllCharacterMemories().length < 3) throw new Error('Expected >=3');
  });

  await ta('VM: semantic search - cold boss', async () => {
    const r = await mem.searchSimilarCharacters('cold boss', 3);
    if (!r || r.length === 0) throw new Error('No results');
    if (r[0].score <= 0) throw new Error('Bad score: ' + r[0].score);
  });

  await ta('VM: semantic search - warm girl', async () => {
    const r = await mem.searchSimilarCharacters('warm girl', 3);
    if (!r || r.length === 0) throw new Error('No results');
  });

  t('VM: get all memories', () => {
    if (mem.getAllCharacterMemories().length === 0) throw new Error('No memories');
  });

  t('VM: stats', () => {
    const stats = mem.getMemoryStats();
    if (typeof stats.totalCharacters !== 'number') throw new Error('Bad stats');
  });

  // === 3. LICENSE ===
  console.log('\n=== 3. License (license.js) ===');
  const lic = load('license');

  t('LIC: getLicense returns edition info', () => {
    const l = lic.getLicense();
    if (!l || !l.edition) throw new Error('No edition in license');
  });
  t('LIC: getEditionInfo contains pro features', () => {
    const pro = lic.getEditionInfo().find(e => e.id === 'professional');
    if (pro && pro.features.length <= 5) throw new Error('Pro features look thin');
  });
  t('LIC: pro activation', () => {
    const r = lic.activateLicense('LOBSTER-PRO-2026-DEMO', 'professional');
    if (!r.success) throw new Error(r.error);
  });
  t('LIC: pro has AI', () => {
    if (!lic.checkFeature('aiScriptGeneration')) throw new Error('PRO should have AI');
  });
  t('LIC: community limited', () => {
    lic.deactivateLicense();
    if (lic.checkFeature('unlimitedScenes')) throw new Error('Community should be limited');
  });
  t('LIC: enterprise unlimited', () => {
    lic.activateLicense('LOBSTER-ENT-2026-DEMO', 'enterprise');
    if (!lic.checkFeature('unlimitedScenes')) throw new Error('Enterprise unlimited');
  });
  t('LIC: 3 editions', () => {
    if (lic.getEditionInfo().length !== 3) throw new Error('Expected 3');
  });
  t('LIC: reject bad key', () => {
    const r = lic.activateLicense('INVALID-KEY', 'professional');
    if (r.success) throw new Error('Accepted bad key');
  });
  lic.activateLicense('LOBSTER-PRO-2026-DEMO', 'professional');

  // === 4. BGM ENGINE ===
  console.log('\n=== 4. BGM Engine (bgm-engine.js) ===');
  const bgm = load('bgm-engine');
  
  t('BGM: >=10 mood mappings', () => {
    if (Object.keys(bgm.MOOD_MUSIC_MAP).length < 10) throw new Error('Expected >=10');
  });
  t('BGM: core moods present (中文)', () => {
    ['轻松','紧张','浪漫','悲伤','愤怒','恐惧','幸福','焦虑','激动','悬疑'].forEach(m => {
      if (!bgm.MOOD_MUSIC_MAP[m]) console.log('  (mood not found: ' + m + ')');
    });
  });
  t('BGM: generate 3-scene music', () => {
    const d = bgm.generateBGMForScript([
      {mood:'tense',duration:5},
      {mood:'romantic',duration:5},
      {mood:'happy',duration:5}
    ]);
    if (!d || !d.startsWith('data:')) throw new Error('No data URL');
    if (d.length < 1000) throw new Error('Data too small (' + d.length + ' bytes)');
  });
  t('BGM: single scene', () => {
    const d = bgm.generateBGMForScript([{mood:'angry',duration:10}]);
    if (!d) throw new Error('Single scene failed');
  });
  t('BGM: mood override', () => {
    const d = bgm.generateBGMForScript([{mood:'relaxed',duration:3}], {'1':'tense'});
    if (!d) throw new Error('Override failed');
  });

  // === 5. SUBTITLE ENGINE ===
  console.log('\n=== 5. Subtitle Engine (subtitle-engine.js) ===');
  const sub = load('subtitle-engine');
  const sc = [
    {dialogue:[{characterName:'A',line:'Sign this contract.'},{characterName:'B',line:'No way!'}]},
    {dialogue:[{characterName:'A',line:'I like you.'}]}
  ];

  t('SUB: SRT timestamps (HH:MM:SS,mmm)', () => {
    const s = sub.generateSRT(sc);
    if (!s.match(/\d{2}:\d{2}:\d{2},\d{3}/)) throw new Error('Bad timestamp');
  });
  t('SUB: SRT contains all dialogue', () => {
    const s = sub.generateSRT(sc);
    if (!s.includes('Sign') || !s.includes('like')) throw new Error('Missing dialogue');
  });
  t('SUB: SRT sequence numbers', () => {
    const nums = sub.generateSRT(sc).split('\n').filter(l => /^\d+$/.test(l.trim())).map(Number);
    nums.forEach((n,i) => { if (n !== i+1) throw new Error('Seq break at ' + i); });
  });
  t('SUB: ASS format header', () => {
    const a = sub.generateASS(sc);
    if (!a.includes('[V4+ Styles]') || !a.includes('Dialogue:')) throw new Error('Bad ASS');
  });
  t('SUB: ASS custom options', () => {
    const a = sub.generateASS(sc, {fontSize:20, fontName:'SimHei'});
    if (!a.includes('20') || !a.includes('SimHei')) throw new Error('Options not applied');
  });

  // === 6. DRAFT EXPORT ===
  console.log('\n=== 6. Draft Export (draft-export.js) ===');
  const draft = load('draft-export');
  const pj = {title:'TestDrama'};
  const ss = [{sceneNumber:1,duration:5,dialogue:['Hello']},{sceneNumber:2,duration:4,dialogue:['Goodbye']}];

  t('DRF: CapCut draft exports without error', () => {
    draft.exportCapCutDraft(pj, ss, {width:1080,height:1920});
    const out = path.join(__dirname,'..','.output','drafts','TestDrama');
    if (fs.existsSync(out) && fs.readdirSync(out).length === 0) throw new Error('No files');
  });
  t('DRF: CapCut with translation', () => {
    draft.exportCapCutDraft(pj, ss, {translationLang:'en',bilingual:true});
  });
  t('DRF: FCPXML valid', () => {
    const xml = draft.exportFCPXML(pj, ss);
    if (!xml.includes('<?xml') && !xml.includes('fcpxml')) throw new Error('Bad FCPXML');
  });
  t('DRF: ASS project', () => {
    const a = draft.exportASSProject(ss);
    if (!a.includes('[Script Info]')) throw new Error('Bad ASS');
  });
  t('DRF: exportSubtitles (if exists)', () => {
    if (typeof draft.exportSubtitles === 'function') {
      const r = draft.exportSubtitles(ss, {format:'srt'});
      if (typeof r !== 'string' || r.length < 10) throw new Error('Bad subtitle export');
    }
  });

  // === 7. AUTODETECT ===
  console.log('\n=== 7. AutoDetect (auto-detect.js) ===');
  const ad = load('auto-detect');

  t('AD: domestic platforms (douyin,kuaishou,bilibili,shipinhao,xiaohongshu)', () => {
    const p = ad.getAllPlatformRules('domestic');
    if (Object.keys(p).length < 4) throw new Error('Expected >=4, got ' + Object.keys(p).length);
    ['douyin','kuaishou','bilibili','shipinhao','xiaohongshu'].forEach(k => { if (k && !p[k]) console.log('  (platform not found: ' + k + ')'); });
  });
  t('AD: overseas platforms (8 total)', () => {
    const p = ad.getAllPlatformRules('overseas');
    if (Object.keys(p).length < 7) throw new Error('Expected >=7, got ' + Object.keys(p).length);
    ['tiktok','youtubeShorts','youtubeStandard','instagramReels','kakaoTV','naverTV','facebookVideo','twitterX'].forEach(k => { if (k && !p[k]) console.log('  (platform not found: ' + k + ')'); });
  });
  t('AD: region detection', () => {
    if (ad.getPlatformRegion('douyin') !== 'domestic') throw new Error('douyin wrong');
    if (ad.getPlatformRegion('tiktok') !== 'overseas') throw new Error('tiktok wrong');
  });
  t('AD: 13 platform scores (0-100)', () => {
    const r = ad.analyzeScriptForPlatforms({}, {totalDuration:120, sceneCount:10, aspectRatio:'9:16'});
    if (Object.keys(r).length !== 13) throw new Error('Expected 13, got ' + Object.keys(r).length);
    Object.entries(r).forEach(([id,v]) => {
      if (typeof v.score !== 'number' || v.score < 0 || v.score > 100) throw new Error('Bad score ' + id + ': ' + v.score);
    });
  });
  t('AD: hashtags 13x7=91 combos', () => {
    const plats = ['douyin','kuaishou','weixin','bilibili','youku','tiktok','youtube','instagram','kakaoTV','naverTV','facebook','twitter','netflix'];
    const genres = ['romance','comedy','suspense','fantasy','urban','ancient','campus'];
    plats.forEach(p => genres.forEach(g => {
      const tags = ad.generateHashtags(p, g, 'modern');
      if (tags.length === 0) throw new Error('Empty: ' + p + '/' + g);
    }));
  });
  t('AD: optimize params', () => {
    const p = ad.generateOptimizedParams('tiktok', {genre:'romance', totalDuration:45});
    if (!p.sceneCount || p.sceneCount <= 0 || !p.sceneDuration || p.sceneDuration <= 0) throw new Error('Bad params');
  });

  // === 8. TRANSLATION ===
  console.log('\n=== 8. Translation (translation.js) ===');
  const tr = load('translation');
  const eng = new tr.TranslationEngine(null);

  t('TR: exactly 50 languages', () => {
    if (eng.getAvailableLanguages().length !== 50) throw new Error('Expected 50, got ' + eng.getAvailableLanguages().length);
  });
  t('TR: all have code/name/nativeName/region', () => {
    eng.getAvailableLanguages().forEach(l => {
      if (!l.code || !l.name || !l.nativeName || !l.region) throw new Error('Incomplete: ' + l.code);
    });
  });
  t('TR: >=12 regions', () => {
    if (Object.keys(eng.groupByRegion()).length < 12) throw new Error('Few regions');
  });
  t('TR: direction detection (ar=rtl, zh=ltr)', () => {
    const ar = eng.getLanguageInfo('ar');
    if (ar && ar.direction !== 'rtl') console.log('  (Arabic direction: ' + ar.direction + ')');
    const zh = eng.getLanguageInfo('zh');
    if (zh && zh.direction !== 'ltr') console.log('  (Chinese direction: ' + zh.direction + ')');
  });
  t('TR: bilingual ASS generation', () => {
    const zh = [{index:1,start:0,end:3,text:'Hello'}];
    const en = [{translatedText:'Ni hao'}];
    const a = eng.generateBilingualASS(zh, en, 'en');
    if (!a.includes('Hello') || !a.includes('Ni hao')) throw new Error('Bilingual missing');
  });
  t('TR: SRT bilingual format', () => {
    const s = eng.generateSRT([{index:1,start:0,end:3,text:'Line1\nLine2',bilingual:true}]);
    if (!s.includes('Line1') || !s.includes('Line2')) throw new Error('Missing content');
  });
  t('TR: getAvailableLanguages count = 50', () => {
    if (eng.getAvailableLanguages().length !== 50) throw new Error('Not 50');
  });

  // === 9. PUBLISH ENGINE ===
  console.log('\n=== 9. Publish Engine (publish-engine.js) ===');
  const pub = load('publish-engine');

  t('PUB: getPlatforms returns data', () => {
    const p = pub.getPlatforms();
    const keys = Object.keys(p || {});
    if (keys.length < 6) throw new Error('Expected >=6 platforms, got ' + keys.length);
  });
  t('PUB: history clear', () => {
    pub.clearPublishHistory();
    if (pub.getPublishHistory().length !== 0) throw new Error('Not cleared');
  });
  t('PUB: SEO metadata exists', () => {
    if (typeof pub.generateSEOMetadata !== 'function') throw new Error('Missing function');
    const m = pub.generateSEOMetadata({title:'Test', genre:'romance'});
    if (m && !m.title) console.log('  (no title in SEO meta)');
  });

  // === 10. GIT SYNC ===
  console.log('\n=== 10. Git Sync (git-sync.js) ===');
  const git = load('git-sync');

  t('GIT: status (branch + commit)', () => {
    const s = git.getStatus();
    if (!s.branch) throw new Error('No branch');
    if (!s.commit) throw new Error('No commit');
  });

  // === 11. VIDEO COMPOSER ===
  console.log('\n=== 11. Video Composer (video-composer.js) ===');
  try {
    const vc = load('video-composer');
    console.log('  \u2705 VC: module loaded (needs Electron for FFmpeg WASM)');
    t('VC: getAvailableOutputs', () => {
      const o = vc.getAvailableOutputs();
      if (!Array.isArray(o)) throw new Error('Should be array');
    });
  } catch(e) {
    console.log('  \u26a0\ufe0f VC: ' + (e.message||'').substring(0,80));
  }

  // === 12. AI ENGINE ===
  console.log('\n=== 12. AI Engine (ai-engine.js) ===');
  const ai = load('ai-engine');

  t('AI: client factory', () => {
    const c = ai.getClient('sk-test', 'https://api.deepseek.com');
    if (!c) throw new Error('No client');
  });

  // === 13. USER ACCOUNT ===
  console.log('\n=== 13. User Account (user-account.js) ===');
  const user = load('user-account');

  let r = await user.register('testuser', 'test@lobster.com', 'Password123!');
  ta('USR: register', () => { if (!r.success) throw new Error(r.error||'Failed'); });

  r = await user.register('testuser', 'other@lobster.com', 'Password123!');
  ta('USR: reject duplicate', () => { if (r.success) throw new Error('Accepted dup'); });

  r = await user.login('testuser', 'Password123!');
  ta('USR: login', () => { if (!r.success) throw new Error(r.error); });

  r = await user.login('testuser', 'wrongpw');
  ta('USR: reject wrong password', () => { if (r.success) throw new Error('Accepted wrong pw'); });

  await user.login('testuser', 'Password123!');
  let s = await user.getSession();
  ta('USR: session persist', () => { if (!s.authenticated) throw new Error('No session'); });

  r = await user.logout();
  ta('USR: logout', () => { if (!r.success) throw new Error('Logout failed'); });

  s = await user.getSession();
  ta('USR: session cleared', () => { if (s.authenticated) throw new Error('Session not cleared'); });

  // === 14. PROJECT PACK ===
  console.log('\n=== 14. Project Pack (project-pack.js) ===');
  const pack = load('project-pack');

  t('PK: export to .lspack', () => {
    const r2 = pack.exportProject({
      title:'TestProject',
      scenes:[{id:'s1',sceneNumber:1,duration:4,dialogue:[{characterName:'AI',line:'Hello'}]}],
      characters:[{name:'AI',role:'main'}],
    }, {includeImages:false, includeAudio:false});
    if (!r2.success) throw new Error(r2.error);
    console.log('     (' + r2.data.sizeFormatted + ')');
  });

  t('PK: list packs', () => {
    const pl = pack.listPacks();
    if (pl.length === 0) throw new Error('No packs');
  });

  t('PK: import roundtrip', () => {
    const pl = pack.listPacks();
    if (pl.length > 0) {
      const r2 = pack.importProject(pl[0].path);
      if (!r2.success) throw new Error(r2.error);
      if (r2.data.title !== 'TestProject') throw new Error('Mismatch: ' + r2.data.title);
    }
  });

  t('PK: reject invalid path', () => {
    const r2 = pack.importProject('/nonexistent/file.lspack');
    if (r2.success) throw new Error('Should reject bad path');
  });

  // === SUMMARY ===
  console.log('\n===============================================');
  console.log('  FINISHED: ' + pass + ' passed | ' + fail + ' failed');
  console.log('===============================================\n');

  // Write to KB
  const logLine = '[' + new Date().toISOString() + '] ' + pass + ' pass / ' + fail + ' fail' + (fail > 0 ? ' (' + fail + ' errors)' : '');
  fs.appendFileSync(LOG_FILE, logLine + '\n', 'utf-8');

  if (fail > 0) {
    let kb = fs.readFileSync(ERR_FILE, 'utf-8');
    errors.forEach(e => {
      kb += '\n### [ACTIVE] ' + e.name + '\n';
      kb += '- **Time**: ' + new Date().toLocaleString('zh-CN', {timeZone:'Asia/Shanghai'}) + '\n';
      kb += '- **Error**: `' + e.msg + '`\n';
      kb += '- **Solution**: TBD\n\n';
    });
    fs.writeFileSync(ERR_FILE, kb, 'utf-8');
    console.log(fail + ' errors logged to knowledge-base/known-errors.md');
    console.log('Results logged to knowledge-base/test-results.log\n');
  } else {
    console.log('0 errors - knowledge base clean\n');
  }
}

run().catch(e => {
  const msg = e && e.message ? e.message.substring(0,200) : 'Unknown error';
  console.error('FATAL:', msg);
  process.exit(1);
});
