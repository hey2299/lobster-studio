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
});

// Listen for main process events
ipcRenderer.on('ai:progress', (_, data) => {
  window.dispatchEvent(new CustomEvent('ai-progress', { detail: data }));
});
