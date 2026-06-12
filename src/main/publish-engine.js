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

// --- YouTube SEO Generator ---
// Generates localized title, description, and tags for each platform
const SEO_TEMPLATES = {
  youtube: {
    patterns: ['drama', 'shortfilm', 'series', 'love', 'story'],
    maxTitleLength: 100,
    maxDescriptionLength: 5000,
    maxTags: 30,
    lang: { en: 'English', zh: '中文' },
  },
  tiktok: {
    patterns: ['#shorts', 'trending', 'fyp'],
    maxTitleLength: 150,
    maxDescriptionLength: 2200,
    maxTags: 20,
  },
  instagram: {
    patterns: ['reels', 'drama', 'shortfilm'],
    maxTitleLength: 2200,
    maxDescriptionLength: 2200,
    maxTags: 30,
  },
};

// Pre-built SEO keywords for short drama genres (EN + ZH)
const SEO_KEYWORDS = {
  romance: {
    en: ['love story', 'romantic drama', 'romance short film', 'emotional story', 'relationship goals', 'sweet love', 'couple goals', 'heart touching', 'short drama romance', 'love triangle'],
    zh: ['爱情短剧', '霸道总裁', '甜宠', '虐恋情深', '高甜', '玛丽苏', '爱情故事', '女朋友', '男朋友', '情侣'],
  },
  comedy: {
    en: ['comedy sketch', 'funny short film', 'hilarious drama', 'comedy series', 'laugh out loud', 'funny moments', 'comedy gold', 'skit comedy', 'parody short drama', 'humor'],
    zh: ['搞笑短剧', '喜剧', '沙雕', '搞笑视频', '段子', '恶搞', '幽默', '笑到肚子疼'],
  },
  suspense: {
    en: ['suspense drama', 'thriller short film', 'mystery story', 'plot twist', 'psychological thriller', 'edge of seat', 'dark mystery', 'crime drama', 'unexpected ending', 'mind blowing'],
    zh: ['悬疑短剧', '反转', '烧脑', '高能', '惊悚', '推理', '恐怖', '剧情反转', '神秘'],
  },
  fantasy: {
    en: ['fantasy drama', 'supernatural short film', 'magical story', 'fantasy series', 'mythical drama', 'time travel drama', 'portal fantasy', 'otherworldly', 'reborn', 'transmigration'],
    zh: ['玄幻短剧', '穿越', '重生', '修仙', '仙侠', '魔法', '奇幻', '逆袭', '异能'],
  },
  urban: {
    en: ['urban drama', 'modern love', 'city story', 'workplace romance', 'contemporary drama', 'slice of life', 'urban series', 'corporate drama', 'city life', 'modern romance'],
    zh: ['都市短剧', '职场', '豪门', '现代爱情', '商战', '契约婚姻', '都市情感', '破镜重圆'],
  },
  ancient: {
    en: ['historical drama', 'ancient romance', 'costume drama', 'imperial love', 'historical short drama', 'period drama', 'ancient china', 'wuxia short film', 'martial arts', 'royal drama'],
    zh: ['古装短剧', '宫斗', '宅斗', '权谋', '古代爱情', '王妃', '皇帝', '江湖', '武侠', '仙侠'],
  },
  campus: {
    en: ['campus drama', 'school love story', 'teen romance', 'high school drama', 'college romance', 'young love', 'school crush', 'youth drama', 'classroom romance', 'prom'],
    zh: ['校园短剧', '青春', '纯爱', '同桌', '校花', '学霸', '校园恋爱', '初恋'],
  },
};

const SEO_CALL_TO_ACTIONS = {
  en: [
    'Watch till the end for a shocking twist! 🔥',
    'Like and subscribe for more short dramas! 👍',
    "Don't forget to share with your friends!",
    'Comment below what you think will happen next! 💬',
    'New episodes every week! Hit the bell 🔔',
    'Which character is your favorite? Let me know!',
    'This story will change how you see love... 💕',
    'Tag someone who needs to see this! 👇',
  ],
  zh: [
    '看到最后有反转！🔥',
    '点赞关注看更多短剧！👍',
    '转发给你的朋友一起看！',
    '评论区告诉我你觉得接下来会发生什么！💬',
    '每周更新，记得关注！🔔',
    '你最喜欢哪个角色？评论区告诉我！',
    '这个故事让你重新相信爱情了吗？💕',
  ],
};

function generateSEOMetadata(platformId, project, options = {}) {
  const {
    genre = 'romance',
    title = project.title || 'Untitled Drama',
    description = '',
    lang = 'zh',
    characters = [],
    episodeNumber = 1,
    totalEpisodes = 1,
  } = options;

  const template = SEO_TEMPLATES[platformId] || SEO_TEMPLATES.youtube;
  const keywords = SEO_KEYWORDS[genre] || SEO_KEYWORDS.romance;
  const ctaList = SEO_CALL_TO_ACTIONS[lang] || SEO_CALL_TO_ACTIONS.zh;

  // Generate title
  const baseTitle = title.length > 40 ? title.substring(0, 37) + '...' : title;
  const episodeStr = totalEpisodes > 1 ? ` Ep.${episodeNumber}/${totalEpisodes}` : '';
  const langSuffix = lang === 'en' ? ' | Short Drama' : ' | 短剧';
  let seoTitle = `${baseTitle}${episodeStr}${langSuffix}`;
  if (seoTitle.length > template.maxTitleLength) {
    seoTitle = seoTitle.substring(0, template.maxTitleLength - 3) + '...';
  }

  // Generate description (structured)
  const cta = ctaList[Math.floor(Math.random() * ctaList.length)];
  const genreNames = {
    en: { romance: 'Romance', comedy: 'Comedy', suspense: 'Suspense', fantasy: 'Fantasy', urban: 'Urban', ancient: 'Period', campus: 'Campus' },
    zh: { romance: '浪漫', comedy: '喜剧', suspense: '悬疑', fantasy: '奇幻', urban: '都市', ancient: '古装', campus: '校园' },
  };
  const genreName = (genreNames[lang] || genreNames.en)[genre] || genre;

  let seoDescription = '';
  if (lang === 'en') {
    seoDescription = `${genreName} short drama\n\n${description || title}\n\n`;
    seoDescription += `📺 Episode ${episodeNumber}${totalEpisodes > 1 ? ` / ${totalEpisodes}` : ''}\n`;
    if (characters.length > 0) {
      seoDescription += `👥 Characters: ${characters.map(c => c.name + (c.role ? ` (${c.role})` : '')).join(', ')}\n`;
    }
    seoDescription += `\n${cta}\n\n`;
    seoDescription += `#shortdrama #${genre} #series\n`;
  } else {
    seoDescription = `【${genreName}短剧】\n\n${description || title}\n\n`;
    seoDescription += `📺 第${episodeNumber}集${totalEpisodes > 1 ? ` / 共${totalEpisodes}集` : ''}\n`;
    if (characters.length > 0) {
      seoDescription += `👥 角色：${characters.map(c => c.name + (c.role ? `（${c.role}）` : '')).join('、')}\n`;
    }
    seoDescription += `\n${cta}\n\n`;
    seoDescription += `#短剧 #${genre} #系列\n`;
  }

  if (seoDescription.length > template.maxDescriptionLength) {
    seoDescription = seoDescription.substring(0, template.maxDescriptionLength - 3) + '...';
  }

  // Generate optimized tags
  const kwList = lang === 'en' ? keywords.en : keywords.zh;
  const baseTags = [...kwList];
  
  // Add platform-specific tags
  if (platformId === 'youtube') {
    baseTags.push('short drama', 'short film', 'drama series');
  } else if (platformId === 'tiktok') {
    baseTags.push('fyp', 'viral', 'foryou', 'foryoupage');
  }
  
  // Add genre tags in both languages if bilingual
  if (lang === 'en') {
    baseTags.push('短剧', genre);
  } else {
    baseTags.push('short drama', 'kdrama', genre);
  }

  // Deduplicate and limit
  const tags = [...new Set(baseTags.map(t => t.toLowerCase().replace(/[^a-z一-鿿0-9#]/g, '')))]
    .filter(Boolean)
    .slice(0, template.maxTags);

  return {
    title: seoTitle,
    description: seoDescription,
    tags,
    // Also export raw fields so user can edit
    raw: {
      title: options.title || project.title || '',
      description: options.description || '',
    },
  };
}

function getSEOKeywords(genre) {
  const kw = SEO_KEYWORDS[genre];
  if (!kw) return { en: [], zh: [] };
  return {
    en: [...kw.en],
    zh: [...kw.zh],
  };
}

module.exports = { getPlatforms, publishVideo, getPublishHistory, addPublishRecord, clearPublishHistory, generateSEOMetadata, getSEOKeywords };
