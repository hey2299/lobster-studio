// Bridge between React UI and Electron IPC
// Provides typed async wrappers

declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<any>;
      saveFile: (name: string) => Promise<any>;
      getVersion: () => Promise<string>;
      getPlatform: () => Promise<string>;
      dbGetCharacters: () => Promise<any[]>;
      dbSaveCharacter: (char: any) => Promise<void>;
      dbDeleteCharacter: (id: string) => Promise<void>;
      dbGetProjects: () => Promise<any[]>;
      dbSaveProject: (proj: any) => Promise<void>;
      dbDeleteProject: (id: string) => Promise<void>;
      dbGetSetting: (key: string) => Promise<string | null>;
      dbSetSetting: (key: string, value: string) => Promise<void>;
      aiGenerateScript: (params: any) => Promise<{ success: boolean; data?: any; error?: string }>;
      aiGenerateCharacterPrompt: (char: any) => Promise<{ success: boolean; data?: string; error?: string }>;
      aiExpandStoryboard: (scenes: any[]) => Promise<{ success: boolean; data?: any; error?: string }>;
      aiConfigure: (provider: string, apiKey: string, model: string) => Promise<boolean>;
      memoryStore: (char: any) => Promise<boolean>;
      memorySearch: (query: any, threshold?: number) => Promise<any[]>;
      memoryFindByName: (name: string) => Promise<any>;
      memoryAddAlias: (id: string, alias: string, script?: string) => Promise<boolean>;
      memoryGetStats: () => Promise<{ characters: number; aliases: number }>;
      aiGenerateImage: (scene: any) => Promise<{ success: boolean; data?: { sceneIndex: number; imageUrl: string }; error?: string }>;
      aiGenerateAllImages: (scenes: any[]) => Promise<{ success: boolean; data?: { sceneIndex: number; imageUrl: string }[]; error?: string }>;
      aiGenerateTTS: (text: string, voiceType: string) => Promise<{ success: boolean; data?: { audioUrl: string }; error?: string }>;
      videoCompose: (params: any) => Promise<{ success: boolean; data?: { outputPath: string }; error?: string }>;
      videoListOutputs: () => Promise<{ name: string; path: string; size: number; createdAt: string }[]>;
      publishGetPlatforms: () => Promise<{ id: string; name: string; icon: string; color: string; authed: boolean; account: string }[]>;
      publishVideo: (platformId: string, videoPath: string, metadata: any) => Promise<{ success: boolean; data?: any; error?: string }>;
      publishHistory: () => Promise<any[]>;
      publishClearHistory: () => Promise<{ success: boolean }>;
      gitStatus: () => Promise<any>;
      gitSetRemote: (name: string, url: string) => Promise<any>;
      gitRemoveRemote: (name: string) => Promise<any>;
      gitPush: (name: string, branch: string) => Promise<any>;
      gitCommitAndPush: (msg: string, name: string) => Promise<any>;
      licenseGet: () => Promise<any>;
      licenseActivate: (key: string, edition: string) => Promise<any>;
      licenseDeactivate: () => Promise<any>;
      licenseEditions: () => Promise<any>;
      licenseCheckFeature: (feature: string) => Promise<any>;
      // BGM
      bgmGenerate: (scenes: any[], moodOverrides?: Record<number, string>) => Promise<{ success: boolean; data?: { bgmDataUrl: string }; error?: string }>;
      // Subtitles
      subtitleGenerateSRT: (scenes: any[]) => Promise<string>;
      subtitleGenerateASS: (scenes: any[], options?: any) => Promise<string>;
      // Draft Export
      draftExportCapCut: (project: any, scenes: any[], options?: any) => Promise<{ success: boolean; data?: { draftDir: string }; error?: string }>;
      draftExportFCPXML: (project: any, scenes: any[], options?: any) => Promise<{ success: boolean; data?: { xml: string }; error?: string }>;
      draftExportSubtitles: (scenes: any[], options?: any) => Promise<string>;
      // AutoDetect (Dual Mode)
      autodetectAllPlatforms: (mode?: string) => Promise<Record<string,any>>;
      autodetectPlatformRules: (id: string) => Promise<any>;
      autodetectAnalyze: (script: any, options?: any) => Promise<Record<string,any>>;
      autodetectOptimize: (id: string, options?: any) => Promise<any>;
      autodetectAdaptScript: (script: any, id: string, options?: any) => Promise<{ success: boolean; data?: any; error?: string }>;
      autodetectHashtags: (id: string, genre?: string, style?: string) => Promise<string[]>;
      autodetectRegionSummary: (mode: string) => Promise<any[]>;
      autodetectRegion: (id: string) => Promise<string | null>;

      // Translation
      translateLanguages: () => Promise<any[]>;
      translateLanguageInfo: (code: string) => Promise<any>;
      translateText: (text: string, lang: string) => Promise<{ success: boolean; data?: string; error?: string }>;
      translateScript: (scenes: any[], lang: string, opts?: any) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      translateSubtitles: (subs: any[], lang: string, opts?: any) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      translateBilingualASS: (zh: any[], t: any[], lang: string) => Promise<{ success: boolean; data?: string; error?: string }>;
      translateGenerateSRT: (subs: any[]) => Promise<string>;
      translateStats: () => Promise<any>;
    };
  }
}

const api = typeof window !== 'undefined' ? window.electronAPI : null;

export const db = {
  getCharacters: () => api?.dbGetCharacters() ?? Promise.resolve([]),
  saveCharacter: (char: any) => api?.dbSaveCharacter(char) ?? Promise.resolve(),
  deleteCharacter: (id: string) => api?.dbDeleteCharacter(id) ?? Promise.resolve(),
  getProjects: () => api?.dbGetProjects() ?? Promise.resolve([]),
  saveProject: (proj: any) => api?.dbSaveProject(proj) ?? Promise.resolve(),
  deleteProject: (id: string) => api?.dbDeleteProject(id) ?? Promise.resolve(),
  getSetting: (key: string) => api?.dbGetSetting(key) ?? Promise.resolve(null),
  setSetting: (key: string, value: string) => api?.dbSetSetting(key, value) ?? Promise.resolve(),
};

export const memory = {
  store: (char: any) => api?.memoryStore(char) ?? Promise.resolve(false),
  search: (query: any, threshold = 0.4) => api?.memorySearch(query, threshold) ?? Promise.resolve([]),
  findByName: (name: string) => api?.memoryFindByName(name) ?? Promise.resolve(null),
  addAlias: (id: string, alias: string, script?: string) => api?.memoryAddAlias(id, alias, script) ?? Promise.resolve(false),
  getStats: () => api?.memoryGetStats() ?? Promise.resolve({ characters: 0, aliases: 0 }),
};

export const bgm = {
  generate: (scenes: any[], moodOverrides?: Record<number, string>) =>
    api?.bgmGenerate(scenes, moodOverrides) ?? Promise.resolve({ success: false }),
};

export const subtitle = {
  generateSRT: (scenes: any[]) => api?.subtitleGenerateSRT(scenes) ?? Promise.resolve(''),
  generateASS: (scenes: any[], options?: any) => api?.subtitleGenerateASS(scenes, options) ?? Promise.resolve(''),
};

export const autodetect = {
  allPlatforms: () => api?.autodetectAllPlatforms() ?? Promise.resolve({}),
  platformRules: (id: string) => api?.autodetectPlatformRules(id) ?? Promise.resolve(null),
  analyze: (script: any, options?: any) => api?.autodetectAnalyze(script, options) ?? Promise.resolve({}),
  optimize: (id: string, options?: any) => api?.autodetectOptimize(id, options) ?? Promise.resolve(null),
  adaptScript: (script: any, id: string, options?: any) =>
    api?.autodetectAdaptScript(script, id, options) ?? Promise.resolve({ success: false }),
  hashtags: (id: string, genre?: string, style?: string) =>
    api?.autodetectHashtags(id, genre, style) ?? Promise.resolve([]),
  regionSummary: (mode: string) => api?.autodetectRegionSummary(mode) ?? Promise.resolve([]),
  region: (id: string) => api?.autodetectRegion(id) ?? Promise.resolve(null),
};

// Translation exports
export const translate = {
  languages: () => api?.translateLanguages() ?? Promise.resolve([]),
  languageInfo: (code: string) => api?.translateLanguageInfo(code) ?? Promise.resolve(null),
  text: (text: string, lang: string) => api?.translateText(text, lang) ?? Promise.resolve({ success: false }),
  script: (scenes: any[], lang: string, opts?: any) => api?.translateScript(scenes, lang, opts) ?? Promise.resolve({ success: false }),
  subtitles: (subs: any[], lang: string, opts?: any) => api?.translateSubtitles(subs, lang, opts) ?? Promise.resolve({ success: false }),
  bilingualASS: (zh: any[], t: any[], lang: string) => api?.translateBilingualASS(zh, t, lang) ?? Promise.resolve({ success: false }),
  generateSRT: (subs: any[]) => api?.translateGenerateSRT(subs) ?? Promise.resolve(''),
  stats: () => api?.translateStats() ?? Promise.resolve({}),
};

export const draft = {
  exportCapCut: (project: any, scenes: any[], options?: any) =>
    api?.draftExportCapCut(project, scenes, options) ?? Promise.resolve({ success: false }),
  exportFCPXML: (project: any, scenes: any[], options?: any) =>
    api?.draftExportFCPXML(project, scenes, options) ?? Promise.resolve({ success: false }),
  exportSubtitles: (scenes: any[], options?: any) =>
    api?.draftExportSubtitles(scenes, options) ?? Promise.resolve(''),
};

export const ai = {
  generateScript: (params: any) => api?.aiGenerateScript(params) ?? Promise.resolve({ success: false, error: 'Not in Electron' }),
  generateCharacterPrompt: (char: any) => api?.aiGenerateCharacterPrompt(char) ?? Promise.resolve({ success: false, error: 'Not in Electron' }),
  expandStoryboard: (scenes: any[]) => api?.aiExpandStoryboard(scenes) ?? Promise.resolve({ success: false, error: 'Not in Electron' }),
  configure: (provider: string, apiKey: string, model: string) => api?.aiConfigure(provider, apiKey, model) ?? Promise.resolve(false),
  generateImage: (scene: any) => api?.aiGenerateImage(scene) ?? Promise.resolve({ success: false, error: 'Not in Electron' }),
  generateAllImages: (scenes: any[]) => api?.aiGenerateAllImages(scenes) ?? Promise.resolve({ success: false, error: 'Not in Electron' }),
  generateTTS: (text: string, voiceType: string) => api?.aiGenerateTTS(text, voiceType) ?? Promise.resolve({ success: false, error: 'Not in Electron' }),
  composeVideo: (params: any) => api?.videoCompose(params) ?? Promise.resolve({ success: false, error: 'Not in Electron' }),
  listOutputs: () => api?.videoListOutputs() ?? Promise.resolve([]),
  getPlatforms: () => api?.publishGetPlatforms() ?? Promise.resolve([]),
  publishVideo: (platformId: string, videoPath: string, metadata: any) => api?.publishVideo(platformId, videoPath, metadata) ?? Promise.resolve({ success: false, error: 'Not in Electron' }),
  getPublishHistory: () => api?.publishHistory() ?? Promise.resolve([]),
  clearPublishHistory: () => api?.publishClearHistory() ?? Promise.resolve({ success: false }),
  gitStatus: () => api?.gitStatus() ?? Promise.resolve({ branch: 'N/A' }),
  gitSetRemote: (name: string, url: string) => api?.gitSetRemote(name, url) ?? Promise.resolve({}),
  gitRemoveRemote: (name: string) => api?.gitRemoveRemote(name) ?? Promise.resolve({}),
  gitPush: (name: string, branch: string) => api?.gitPush(name, branch) ?? Promise.resolve({}),
  gitCommitAndPush: (msg: string, name: string) => api?.gitCommitAndPush(msg, name) ?? Promise.resolve({}),
  getLicense: () => api?.licenseGet() ?? Promise.resolve({ activated: false, edition: 'community' }),
  activateLicense: (key: string, edition: string) => api?.licenseActivate(key, edition) ?? Promise.resolve({}),
  deactivateLicense: () => api?.licenseDeactivate() ?? Promise.resolve({}),
  getEditions: () => api?.licenseEditions() ?? Promise.resolve([]),
};

// Events from main process
export function onAIProgress(callback: (data: any) => void) {
  const handler = (e: CustomEvent) => callback(e.detail);
  window.addEventListener('ai-progress', handler as EventListener);
  return () => window.removeEventListener('ai-progress', handler as EventListener);
}
