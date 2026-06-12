// === 剧本相关 ===
export interface Script {
  id: string;
  title: string;
  genre: string;
  style: string;
  duration: number;
  scenes: Scene[];
  createdAt: number;
  updatedAt: number;
}

export interface Scene {
  id: string;
  index: number;
  location: string;
  description: string;
  dialogue: DialogueLine[];
  cameraAngle: string;
  mood: string;
  imagePrompt: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface DialogueLine {
  characterId: string;
  characterName: string;
  line: string;
  emotion: string;
}

// === 角色相关 ===
export interface Character {
  id: string;
  name: string;
  role: '主角' | '反派' | '配角' | '客串';
  personality: string;
  appearance: string;
  voiceType: string;
  avatarUrl: string;
  portraitPrompt: string;
  scriptsUsed: string[];  // 跨剧记忆——哪些短剧用过
  createdAt: number;
}

// === 项目 ===
export interface Project {
  id: string;
  title: string;
  scriptId?: string;
  characterIds: string[];
  voiceIds: string[];
  status: 'draft' | 'generating' | 'complete' | 'published';
  createdAt: number;
  updatedAt: number;
}

// === 设置 ===
export interface AppSettings {
  llmProvider: string;
  llmApiKey: string;
  llmModel: string;
  imageProvider: string;
  imageApiKey: string;
  imageModel: string;
  videoProvider: string;
  videoApiKey: string;
  ttsProvider: string;
  ttsApiKey: string;
  outputDir: string;
  watermark: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  llmProvider: 'deepseek',
  llmApiKey: '',
  llmModel: 'deepseek-chat',
  imageProvider: 'openai',
  imageApiKey: '',
  imageModel: 'dall-e-3',
  videoProvider: 'seedance',
  videoApiKey: '',
  ttsProvider: 'openai',
  ttsApiKey: '',
  outputDir: '',
  watermark: false,
};
