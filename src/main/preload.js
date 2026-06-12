const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File dialogs
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (defaultName) => ipcRenderer.invoke('dialog:saveFile', defaultName),
  
  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),

  // Database
  dbGetCharacters: () => ipcRenderer.invoke('db:getCharacters'),
  dbSaveCharacter: (char) => ipcRenderer.invoke('db:saveCharacter', char),
  dbDeleteCharacter: (id) => ipcRenderer.invoke('db:deleteCharacter', id),
  dbGetProjects: () => ipcRenderer.invoke('db:getProjects'),
  dbSaveProject: (proj) => ipcRenderer.invoke('db:saveProject', proj),
  dbDeleteProject: (id) => ipcRenderer.invoke('db:deleteProject', id),
  dbGetSetting: (key) => ipcRenderer.invoke('db:getSetting', key),
  dbSetSetting: (key, value) => ipcRenderer.invoke('db:setSetting', key, value),

  // AI Engine
  aiGenerateScript: (params) => ipcRenderer.invoke('ai:generateScript', params),
  aiGenerateCharacterPrompt: (char) => ipcRenderer.invoke('ai:generateCharacterPrompt', char),
  aiExpandStoryboard: (scenes) => ipcRenderer.invoke('ai:expandStoryboard', scenes),
  aiConfigure: (provider, apiKey, model) => ipcRenderer.invoke('ai:configure', provider, apiKey, model),

  // Vector Memory
  memoryStore: (char) => ipcRenderer.invoke('memory:store', char),
  memorySearch: (query, threshold) => ipcRenderer.invoke('memory:search', query, threshold),
  memoryFindByName: (name) => ipcRenderer.invoke('memory:findByName', name),
  memoryAddAlias: (id, alias, script) => ipcRenderer.invoke('memory:addAlias', id, alias, script),
  memoryGetStats: () => ipcRenderer.invoke('memory:getStats'),

  // Image generation
  aiGenerateImage: (scene) => ipcRenderer.invoke('ai:generateImage', scene),
  aiGenerateAllImages: (scenes) => ipcRenderer.invoke('ai:generateAllImages', scenes),

  // TTS
  aiGenerateTTS: (text, voiceType) => ipcRenderer.invoke('ai:generateTTS', text, voiceType),
});

// Listen for main process events
ipcRenderer.on('ai:progress', (_, data) => {
  window.dispatchEvent(new CustomEvent('ai-progress', { detail: data }));
});
