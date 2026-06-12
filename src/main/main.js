const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { initDatabase, getCharacters, saveCharacter, deleteCharacter,
  getProjects, saveProject, deleteProject, getSetting, setSetting } = require('./database');
const { generateScript, generateCharacterPrompt, expandStoryboard, configureAI, generateImage, generateAllSceneImages, generateTTS } = require('./ai-engine');
const memory = require('./vector-memory');
const { composeVideo, exportFrame, getAvailableOutputs } = require('./video-composer');
const { getStatus: gitStatus, setRemote: gitSetRemote, removeRemote: gitRemoveRemote, push: gitPush, commitAndPush: gitCommitAndPush, getRecentCommits: gitRecentCommits } = require('./git-sync');
const { getPlatforms, publishVideo, getPublishHistory, clearPublishHistory } = require('./publish-engine');
const { getLicense, activateLicense, deactivateLicense, getEditionInfo, checkFeature } = require('./license');
const { TranslationEngine, LANGUAGES } = require('./translation.js');
let transEngine = null;
const { generateBGMForScript } = require('./bgm-engine');
const { getAllPlatformRules, getPlatformRules, analyzeScriptForPlatforms, generateOptimizedParams, adaptScriptForPlatform, generateHashtags } = require('./auto-detect');
const { generateSRT, generateASS } = require('./subtitle-engine');
const { exportCapCutDraft, exportFCPXML, exportASSProject } = require('./draft-export');

let mainWindow;
let dbInitialized = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: '🦞 龙虾短剧工坊',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    frame: process.platform === 'darwin' ? true : false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0a0a0f',
  });

  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  // Initialize database
  try {
    await initDatabase();
    console.log('Database initialized');
    dbInitialized = true;
  } catch (e) {
    console.error('Database init failed:', e.message);
  }

  // Init memory engine
  try {
    await memory.initMemoryDB();
    console.log('Memory engine initialized');
    // Inject memory into AI engine for character consistency across scripts
    const aiEngine = require('./ai-engine');
    aiEngine.injectMemory(memory);
    console.log('Memory injected into AI engine');
  } catch (e) {
    console.error('Memory init failed:', e.message);
  }

  // Register all IPC handlers
  registerIpcHandlers();
  createWindow();
});

function registerIpcHandlers() {
  // === Dialog ===
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: '剧本文件', extensions: ['txt', 'md', 'docx', 'pdf'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    });
    return result;
  });

  ipcMain.handle('dialog:saveFile', async (_, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [{ name: 'MP4 视频', extensions: ['mp4'] }, { name: '所有文件', extensions: ['*'] }],
    });
    return result;
  });

  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.handle('app:getPlatform', () => process.platform);

  // === Database ===
  ipcMain.handle('db:getCharacters', () => dbInitialized ? getCharacters() : []);
  ipcMain.handle('db:saveCharacter', (_, char) => dbInitialized ? saveCharacter(char) : null);
  ipcMain.handle('db:deleteCharacter', (_, id) => dbInitialized ? deleteCharacter(id) : null);
  ipcMain.handle('db:getProjects', () => dbInitialized ? getProjects() : []);
  ipcMain.handle('db:saveProject', (_, proj) => dbInitialized ? saveProject(proj) : null);
  ipcMain.handle('db:deleteProject', (_, id) => dbInitialized ? deleteProject(id) : null);
  ipcMain.handle('db:getSetting', (_, key) => dbInitialized ? getSetting(key) : null);
  ipcMain.handle('db:setSetting', (_, key, value) => dbInitialized ? setSetting(key, value) : null);

  // === AI Engine ===
  ipcMain.handle('ai:configure', (_, provider, apiKey, model) => {
    configureAI(provider, apiKey, model);
    return true;
  });

  ipcMain.handle('ai:generateScript', async (_, params) => {
    try {
      mainWindow?.webContents.send('ai:progress', { step: 'scripts', message: 'AI 正在创作剧本...' });
      const result = await generateScript(params);
      mainWindow?.webContents.send('ai:progress', { step: 'scripts', message: '剧本完成！', done: true });
      return { success: true, data: result };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('ai:generateCharacterPrompt', async (_, char) => {
    try {
      mainWindow?.webContents.send('ai:progress', { step: 'portrait', message: 'AI 正在设计角色形象...' });
      const result = await generateCharacterPrompt(char);
      return { success: true, data: result };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('ai:expandStoryboard', async (_, scenes) => {
    try {
      mainWindow?.webContents.send('ai:progress', { step: 'storyboard', message: 'AI 正在生成分镜...' });
      const result = await expandStoryboard(scenes);
      return { success: true, data: result };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // Image generation (Phase 2)
  ipcMain.handle('ai:generateImage', async (_, scene) => {
    try {
      mainWindow?.webContents.send('ai:progress', { step: 'image', message: 'AI 正在生成画面...' });
      const imageUrl = await generateImage(scene);
      return { success: true, data: { sceneIndex: scene.index, imageUrl } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('ai:generateAllImages', async (_, scenes) => {
    try {
      mainWindow?.webContents.send('ai:progress', { step: 'image', message: 'AI 正在批量生成画面...' });
      const results = await generateAllSceneImages(scenes);
      return { success: true, data: results };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // Vector Memory (Phase 2)
  ipcMain.handle('memory:store', (_, char) => {
    memory.storeCharacterMemory(char);
    return true;
  });

  ipcMain.handle('memory:search', (_, query, threshold) => {
    return memory.searchSimilarCharacters(query, threshold);
  });

  ipcMain.handle('memory:findByName', (_, name) => {
    return memory.findCharacterByName(name);
  });

  ipcMain.handle('memory:addAlias', (_, id, alias, script) => {
    memory.addAlias(id, alias, script);
    return true;
  });

  ipcMain.handle('memory:getStats', () => {
    return memory.getMemoryStats();
  });

  // Video Composition (Phase 3)
  ipcMain.handle('video:compose', async (_, params) => {
    try {
      mainWindow?.webContents.send('ai:progress', { step: 'video', message: '🎬 正在合成视频...' });
      const result = await composeVideo(params);
      mainWindow?.webContents.send('ai:progress', { step: 'video', message: '✅ 视频合成完成！', done: true });
      return { success: true, data: { outputPath: result } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('video:listOutputs', () => {
    return getAvailableOutputs();
  });

  // Git Sync
  ipcMain.handle('git:status', async () => {
    return gitStatus();
  });

  ipcMain.handle('git:setRemote', async (_, name, url) => {
    const r = gitSetRemote(name, url);
    return { success: r.success, error: r.error };
  });

  ipcMain.handle('git:removeRemote', async (_, name) => {
    gitRemoveRemote(name);
    return { success: true };
  });

  ipcMain.handle('git:push', async (_, remoteName, branch) => {
    const r = gitPush(remoteName, branch);
    return { success: r.success, error: r.error, needsCommit: r.needsCommit };
  });

  ipcMain.handle('git:commitAndPush', async (_, message, remoteName) => {
    const r = gitCommitAndPush(message, remoteName);
    return { success: r.success, error: r.error };
  });

  // License
  ipcMain.handle('license:get', async () => getLicense());
  ipcMain.handle('license:activate', async (_, key, edition) => activateLicense(key, edition));
  ipcMain.handle('license:deactivate', async () => deactivateLicense());
  ipcMain.handle('license:editions', async () => getEditionInfo());
  ipcMain.handle('license:checkFeature', async (_, feature) => checkFeature(feature));

  const ad = require('./auto-detect');

  // === Auto-Detect Engine (Dual Mode) ===
  ipcMain.handle('autodetect:allPlatforms', async (_, mode) => {
    return ad.getAllPlatformRules(mode || '');
  });

  ipcMain.handle('autodetect:platformRules', async (_, platformId) => {
    return ad.getPlatformRules(platformId);
  });

  ipcMain.handle('autodetect:analyze', async (_, script, options) => {
    return ad.analyzeScriptForPlatforms(script, options || {});
  });

  ipcMain.handle('autodetect:optimize', async (_, platformId, options) => {
    return ad.generateOptimizedParams(platformId, options || {});
  });

  ipcMain.handle('autodetect:adaptScript', async (_, script, platformId, options) => {
    try {
      const adapted = ad.adaptScriptForPlatform(script, platformId, options || {});
      return { success: true, data: adapted };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('autodetect:hashtags', async (_, platformId, genre, style) => {
    return ad.generateHashtags(platformId, genre, style);
  });

  ipcMain.handle('autodetect:regionSummary', async (_, mode) => {
    return ad.getRegionSummary(mode || 'domestic');
  });

  ipcMain.handle('autodetect:region', async (_, platformId) => {
    return ad.getPlatformRegion(platformId);
  });

  // Publish (Phase 3)
  ipcMain.handle('publish:getPlatforms', async () => {
    return getPlatforms();
  });

  ipcMain.handle('publish:video', async (_, platformId, videoPath, metadata) => {
    try {
      const result = await publishVideo(platformId, videoPath, metadata);
      return { success: true, data: result };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('publish:history', async () => {
    return getPublishHistory();
  });

  ipcMain.handle('publish:clearHistory', async () => {
    clearPublishHistory();
    return { success: true };
  });

  // === BGM Engine (Phase 3+) ===
  ipcMain.handle('bgm:generate', async (_, scenes, moodOverrides) => {
    try {
      mainWindow?.webContents.send('ai:progress', { step: 'bgm', message: '🎵 正在生成背景配乐...' });
      const bgmDataUrl = generateBGMForScript(scenes, moodOverrides || {});
      mainWindow?.webContents.send('ai:progress', { step: 'bgm', message: '✅ 配乐完成！', done: true });
      return { success: true, data: { bgmDataUrl } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // === Subtitle Engine ===
  ipcMain.handle('subtitle:generateSRT', async (_, scenes) => {
    return generateSRT(scenes);
  });

  ipcMain.handle('subtitle:generateASS', async (_, scenes, options) => {
    return generateASS(scenes, options || {});
  });

  // === Draft Export (CapCut, FCPXML, ASS) ===
  ipcMain.handle('draft:exportCapCut', async (_, project, scenes, options) => {
    try {
      const draftDir = exportCapCutDraft(project, scenes, options || {});
      return { success: true, data: { draftDir } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('draft:exportFCPXML', async (_, project, scenes, options) => {
    try {
      const xml = exportFCPXML(project, scenes, options || {});
      return { success: true, data: { xml } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('draft:exportSubtitles', async (_, scenes, options) => {
    return exportASSProject(scenes, options || {});
  });

  // TTS (Phase 2)
  ipcMain.handle('ai:generateTTS', async (_, text, voiceType) => {
    try {
      mainWindow?.webContents.send('ai:progress', { step: 'tts', message: 'AI 正在生成配音...' });
      const audioUrl = await generateTTS(text, voiceType);
      return { success: true, data: { audioUrl } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // === Translation Engine (Phase 5) ===
  // Wrap AI engine's client for translation calls
  const aiEngine = require('./ai-engine');
  const aiCallerWrapper = {
    chat: async (params) => {
      // Reuse the AI engine's configured client
      const client = aiEngine.getClient();
      if (client) {
        try {
          return await client.chat.completions.create(params);
        } catch (e) {
          console.warn('Translation AI call failed, falling back:', e.message);
          return null;
        }
      }
      return null;
    },
  };
  transEngine = new TranslationEngine(aiCallerWrapper);

  ipcMain.handle('translation:languages', async () => {
    return transEngine.getAvailableLanguages();
  });

  ipcMain.handle('translation:languageInfo', async (_, code) => {
    return transEngine.getLanguageInfo(code);
  });

  ipcMain.handle('translation:translateText', async (_, text, targetLang) => {
    try {
      const result = await transEngine.translateText(text, targetLang);
      return { success: true, data: result };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('translation:translateScript', async (_, scenes, targetLang, options) => {
    try {
      const result = await transEngine.translateScript(scenes, targetLang, options || {});
      return { success: true, data: result };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('translation:translateSubtitles', async (_, subtitles, targetLang, options) => {
    try {
      const result = await transEngine.translateSubtitles(subtitles, targetLang, options || {});
      return { success: true, data: result };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('translation:generateBilingualASS', async (_, zhSubtitles, translated, lang) => {
    try {
      const ass = transEngine.generateBilingualASS(zhSubtitles, translated, lang || 'en');
      return { success: true, data: ass };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('translation:generateSRT', async (_, subtitles) => {
    return transEngine.generateSRT(subtitles);
  });

  ipcMain.handle('translation:stats', async () => {
    return transEngine.getStats();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
