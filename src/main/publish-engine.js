// Publish Engine v0.2 - Multi-platform video publishing
// Each platform adapter handles auth + upload according to its API

const { getSetting, setSetting } = require('./database');
const fs = require('fs');
const path = require('path');

// --- Platform adapter interface ---
// Each platform implements: { name, icon, color, checkAuth(), saveAuth(credentials), upload(videoPath, metadata) }

const PLATFORMS = {
  douyin: {
    name: '抖音',
    icon: '🎵',
    color: '#333333',
    checkAuth: async () => {
      const token = await getSetting('publish_douyin_token');
      return { authed: !!token, account: await getSetting('publish_douyin_account') || '' };
    },
    saveAuth: async (credentials) => {
      await setSetting('publish_douyin_token', credentials.token);
      await setSetting('publish_douyin_account', credentials.account);
      await setSetting('publish_douyin_expires', String(Date.now() + 86400000 * 180));
    },
    getUploadUrl: async (videoPath) => {
      // Douyin Open Platform v2: POST /video/upload/
      // For now, return a guide URL for manual upload
      return 'https://creator.douyin.com/upload';
    },
    upload: async (videoPath, metadata) => {
      // Stage 1: Get upload params
      const token = await getSetting('publish_douyin_token');
      if (!token) throw new Error('抖音未授权');
      
      // Read file and get size
      const stats = fs.statSync(videoPath);
      const fileSize = stats.size;
      const fileName = path.basename(videoPath);

      // Douyin requires: init upload → upload chunks → complete
      // For now, we return upload-ready info for manual steps
      return {
        platform: 'douyin',
        fileName,
        fileSize,
        metadata,
        guideUrl: 'https://developer.douyin.com/doc',
        manualStep: '请在抖音创作者平台手动上传此视频',
      };
    },
  },

  kuaishou: {
    name: '快手',
    icon: '🎮',
    color: '#ff6b35',
    checkAuth: async () => {
      const token = await getSetting('publish_kuaishou_token');
      return { authed: !!token, account: await getSetting('publish_kuaishou_account') || '' };
    },
    saveAuth: async (credentials) => {
      await setSetting('publish_kuaishou_token', credentials.token);
      await setSetting('publish_kuaishou_account', credentials.account);
    },
    getUploadUrl: async () => 'https://cp.kuaishou.com/upload',
    upload: async (videoPath, metadata) => {
      const token = await getSetting('publish_kuaishou_token');
      if (!token) throw new Error('快手未授权');
      const stats = fs.statSync(videoPath);
      return {
        platform: 'kuaishou',
        fileName: path.basename(videoPath),
        fileSize: stats.size,
        metadata,
        guideUrl: 'https://cp.kuaishou.com/upload',
        manualStep: '请在快手创作者平台手动上传此视频',
      };
    },
  },

  bilibili: {
    name: 'B站',
    icon: '📺',
    color: '#00a1d6',
    checkAuth: async () => {
      const token = await getSetting('publish_bilibili_token');
      return { authed: !!token, account: await getSetting('publish_bilibili_account') || '' };
    },
    saveAuth: async (credentials) => {
      await setSetting('publish_bilibili_token', credentials.token);
      await setSetting('publish_bilibili_account', credentials.account);
    },
    getUploadUrl: async () => 'https://member.bilibili.com/platform/upload/video',
    upload: async (videoPath, metadata) => {
      const token = await getSetting('publish_bilibili_token');
      if (!token) throw new Error('B站未授权');
      const stats = fs.statSync(videoPath);
      return {
        platform: 'bilibili',
        fileName: path.basename(videoPath),
        fileSize: stats.size,
        metadata,
        guideUrl: 'https://member.bilibili.com/platform/upload/video',
        manualStep: '请在B站创作者中心手动上传此视频',
      };
    },
  },

  weixin: {
    name: '视频号',
    icon: '💬',
    color: '#07c160',
    checkAuth: async () => {
      const token = await getSetting('publish_weixin_token');
      return { authed: !!token, account: await getSetting('publish_weixin_account') || '' };
    },
    saveAuth: async (credentials) => {
      await setSetting('publish_weixin_token', credentials.token);
      await setSetting('publish_weixin_account', credentials.account);
    },
    getUploadUrl: async () => 'https://channels.weixin.qq.com/platform',
    upload: async (videoPath, metadata) => {
      const token = await getSetting('publish_weixin_token');
      if (!token) throw new Error('视频号未授权');
      const stats = fs.statSync(videoPath);
      return {
        platform: 'weixin',
        fileName: path.basename(videoPath),
        fileSize: stats.size,
        metadata,
        guideUrl: 'https://channels.weixin.qq.com/platform',
        manualStep: '请在视频号助手手动上传此视频',
      };
    },
  },

  xiaohongshu: {
    name: '小红书',
    icon: '📕',
    color: '#ff2442',
    checkAuth: async () => {
      const token = await getSetting('publish_xiaohongshu_token');
      return { authed: !!token, account: await getSetting('publish_xiaohongshu_account') || '' };
    },
    saveAuth: async (credentials) => {
      await setSetting('publish_xiaohongshu_token', credentials.token);
      await setSetting('publish_xiaohongshu_account', credentials.account);
    },
    getUploadUrl: async () => 'https://creator.xiaohongshu.com/upload',
    upload: async (videoPath, metadata) => {
      if (!await getSetting('publish_xiaohongshu_token')) throw new Error('小红书未授权');
      return {
        platform: 'xiaohongshu',
        fileName: path.basename(videoPath),
        metadata,
        manualStep: '请在小红书创作者平台手动上传',
      };
    },
  },

  youtube: {
    name: 'YouTube',
    icon: '▶️',
    color: '#ff0000',
    checkAuth: async () => {
      const token = await getSetting('publish_youtube_token');
      return { authed: !!token, account: await getSetting('publish_youtube_account') || '' };
    },
    saveAuth: async (credentials) => {
      await setSetting('publish_youtube_token', credentials.token);
      await setSetting('publish_youtube_account', credentials.account);
    },
    getUploadUrl: async () => 'https://studio.youtube.com/channel',
    upload: async (videoPath, metadata) => {
      if (!await getSetting('publish_youtube_token')) throw new Error('YouTube未授权');
      const stats = fs.statSync(videoPath);
      return {
        platform: 'youtube',
        fileName: path.basename(videoPath),
        fileSize: stats.size,
        metadata,
        manualStep: '请在YouTube Studio手动上传此视频',
      };
    },
  },
};

// --- Publish history ---
function getPublishHistory() {
  try {
    const raw = getSetting('publish_history');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function addPublishRecord(record) {
  const history = getPublishHistory();
  history.unshift({
    ...record,
    timestamp: Date.now(),
    id: `pub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  });
  // Keep last 50 records
  if (history.length > 50) history.length = 50;
  setSetting('publish_history', JSON.stringify(history));
  return history;
}

function clearPublishHistory() {
  setSetting('publish_history', '[]');
}

// --- Public API ---
async function getPlatforms() {
  const platforms = [];
  for (const [key, adapter] of Object.entries(PLATFORMS)) {
    const auth = await adapter.checkAuth();
    platforms.push({
      id: key,
      name: adapter.name,
      icon: adapter.icon,
      color: adapter.color,
      authed: auth.authed,
      account: auth.account,
    });
  }
  return platforms;
}

async function publishVideo(platformId, videoPath, metadata) {
  const adapter = PLATFORMS[platformId];
  if (!adapter) throw new Error(`未知平台: ${platformId}`);

  if (!fs.existsSync(videoPath)) {
    throw new Error(`视频文件不存在: ${videoPath}`);
  }

  const result = await adapter.upload(videoPath, metadata);
  
  // Record to history
  addPublishRecord({
    platform: platformId,
    platformName: adapter.name,
    videoName: path.basename(videoPath),
    videoPath,
    metadata,
    status: result.manualStep ? 'manual' : 'published',
    guideUrl: result.guideUrl,
    manualStep: result.manualStep,
    ...result,
  });

  return result;
}

module.exports = { getPlatforms, publishVideo, getPublishHistory, addPublishRecord, clearPublishHistory };
