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

  // Video Composition
  videoCompose: (params) => ipcRenderer.invoke('video:compose', params),
  videoListOutputs: () => ipcRenderer.invoke('video:listOutputs'),

  // License
  licenseGet: () => ipcRenderer.invoke('license:get'),
  licenseActivate: (key, edition) => ipcRenderer.invoke('license:activate', key, edition),
  licenseDeactivate: () => ipcRenderer.invoke('license:deactivate'),
  licenseEditions: () => ipcRenderer.invoke('license:editions'),
  licenseCheckFeature: (feature) => ipcRenderer.invoke('license:checkFeature', feature),

  // Git
  gitStatus: () => ipcRenderer.invoke('git:status'),
  gitSetRemote: (name, url) => ipcRenderer.invoke('git:setRemote', name, url),
  gitRemoveRemote: (name) => ipcRenderer.invoke('git:removeRemote', name),
  gitPush: (name, branch) => ipcRenderer.invoke('git:push', name, branch),
  gitCommitAndPush: (msg, name) => ipcRenderer.invoke('git:commitAndPush', msg, name),

  // Publish
  publishGetPlatforms: () => ipcRenderer.invoke('publish:getPlatforms'),
  publishVideo: (platformId, videoPath, metadata) => ipcRenderer.invoke('publish:video', platformId, videoPath, metadata),
  publishHistory: () => ipcRenderer.invoke('publish:history'),
  publishClearHistory: () => ipcRenderer.invoke('publish:clearHistory'),

  // TTS
  aiGenerateTTS: (text, voiceType) => ipcRenderer.invoke('ai:generateTTS', text, voiceType),

  // BGM
  bgmGenerate: (scenes, moodOverrides) => ipcRenderer.invoke('bgm:generate', scenes, moodOverrides),

  // Subtitles
  subtitleGenerateSRT: (scenes) => ipcRenderer.invoke('subtitle:generateSRT', scenes),
  subtitleGenerateASS: (scenes, options) => ipcRenderer.invoke('subtitle:generateASS', scenes, options),

  // Draft Export
  draftExportCapCut: (project, scenes, options) => ipcRenderer.invoke('draft:exportCapCut', project, scenes, options),
  draftExportFCPXML: (project, scenes, options) => ipcRenderer.invoke('draft:exportFCPXML', project, scenes, options),
  draftExportSubtitles: (scenes, options) => ipcRenderer.invoke('draft:exportSubtitles', scenes, options),

  // AutoDetect
  autodetectAllPlatforms: () => ipcRenderer.invoke('autodetect:allPlatforms'),
  autodetectPlatformRules: (id) => ipcRenderer.invoke('autodetect:platformRules', id),
  autodetectAnalyze: (script, options) => ipcRenderer.invoke('autodetect:analyze', script, options),
  autodetectOptimize: (id, options) => ipcRenderer.invoke('autodetect:optimize', id, options),
  autodetectAdaptScript: (script, id, options) => ipcRenderer.invoke('autodetect:adaptScript', script, id, options),
  autodetectHashtags: (id, genre, style) => ipcRenderer.invoke('autodetect:hashtags', id, genre, style),
});

// Listen for main process events
ipcRenderer.on('ai:progress', (_, data) => {
  window.dispatchEvent(new CustomEvent('ai-progress', { detail: data }));
});
