const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { initDatabase, getCharacters, saveCharacter, deleteCharacter,
  getProjects, saveProject, deleteProject, getSetting, setSetting } = require('./database');
const { generateScript, generateCharacterPrompt, expandStoryboard, configureAI, generateImage, generateAllSceneImages, generateTTS } = require('./ai-engine');
const memory = require('./vector-memory');
const { composeVideo, exportFrame, getAvailableOutputs } = require('./video-composer');

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
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
