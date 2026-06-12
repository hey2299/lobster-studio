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
      aiGenerateImage: (scene: any) => Promise<{ success: boolean; data?: { sceneIndex: number; imageUrl: string }; error?: string }>;
      aiGenerateAllImages: (scenes: any[]) => Promise<{ success: boolean; data?: { sceneIndex: number; imageUrl: string }[]; error?: string }>;
      aiGenerateTTS: (text: string, voiceType: string) => Promise<{ success: boolean; data?: { audioUrl: string }; error?: string }>;
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

export const ai = {
  generateScript: (params: any) => api?.aiGenerateScript(params) ?? Promise.resolve({ success: false, error: 'Not in Electron' }),
  generateCharacterPrompt: (char: any) => api?.aiGenerateCharacterPrompt(char) ?? Promise.resolve({ success: false, error: 'Not in Electron' }),
  expandStoryboard: (scenes: any[]) => api?.aiExpandStoryboard(scenes) ?? Promise.resolve({ success: false, error: 'Not in Electron' }),
  configure: (provider: string, apiKey: string, model: string) => api?.aiConfigure(provider, apiKey, model) ?? Promise.resolve(false),
  generateImage: (scene: any) => api?.aiGenerateImage(scene) ?? Promise.resolve({ success: false, error: 'Not in Electron' }),
  generateAllImages: (scenes: any[]) => api?.aiGenerateAllImages(scenes) ?? Promise.resolve({ success: false, error: 'Not in Electron' }),
  generateTTS: (text: string, voiceType: string) => api?.aiGenerateTTS(text, voiceType) ?? Promise.resolve({ success: false, error: 'Not in Electron' }),
};

// Events from main process
export function onAIProgress(callback: (data: any) => void) {
  const handler = (e: CustomEvent) => callback(e.detail);
  window.addEventListener('ai-progress', handler as EventListener);
  return () => window.removeEventListener('ai-progress', handler as EventListener);
}
