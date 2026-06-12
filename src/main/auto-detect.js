// AutoDetect Engine - Automatically detects platform rules and adapts content
// Scans target platforms for short drama creation/publishing rules
// Returns optimized parameters for script, image, TTS, and video generation

const { webFetch } = require('./web-fetch-shim');
const fs = require('fs');
const path = require('path');

// ============================================================
// Platform Rule Database (manually curated + updateable)
// ============================================================
const PLATFORM_RULES = {
  douyin: {
    name: '抖音',
    nameEn: 'Douyin / TikTok CN',
    icon: '🎵',
    color: '#000000',
    format: 'portrait',     // 竖屏短剧
    aspectRatio: '9:16',
    resolutions: [
      { width: 1080, height: 1920, label: '1080P竖屏' },
      { width: 720, height: 1280, label: '720P竖屏' },
    ],
    maxDuration: 300,        // 秒，普通视频
    shortDuration: { min: 15, max: 60, ideal: 45 }, // 短视频推荐时长
    dramaDuration: { min: 60, max: 600, ideal: 180 }, // 短剧推荐时长
    videoFormat: 'mp4',
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    audioCodec: 'aac',
    audioBitrate: 128000,
    videoCodec: 'h264',
    videoBitrate: 4000000,
    fps: { min: 24, max: 60, ideal: 30 },
    subtitleFormat: 'hardcode', // 抖音需要硬编码字幕
    subtitleStyle: 'bottom_center', 
    watermarkRequired: true,  // 抖音自动加水印，无需额外处理
    maxHashtags: 5,
    tagsPerScene: 2,
    contentPolicy: {
      bannedWords: ['色情', '暴力血腥', '政治敏感'],
      needSoftViolence: true,  // 暴力内容需弱化
      noMusicCopyright: true,  // 不能有未经授权的音乐
      watermark: '自动添加',
    },
    imageStyle: '中国风短剧',
    sceneDuration: { min: 2, max: 10, ideal: 4 },
    dialoguePerScene: { min: 1, max: 3, ideal: 2 },
    hookSeconds: 2,          // 前2秒必须有钩子
    cliffhangerPer: 5,       // 每5个场景一个小悬念
  },

  kuaishou: {
    name: '快手',
    nameEn: 'Kuaishou',
    icon: '📺',
    color: '#FF6F00',
    format: 'portrait',
    aspectRatio: '9:16',
    resolutions: [
      { width: 1080, height: 1920, label: '1080P竖屏' },
      { width: 720, height: 1280, label: '720P竖屏' },
    ],
    maxDuration: 300,
    shortDuration: { min: 10, max: 60, ideal: 30 },
    dramaDuration: { min: 60, max: 600, ideal: 120 },
    videoFormat: 'mp4',
    maxFileSize: 500 * 1024 * 1024, // 500MB
    audioCodec: 'aac',
    audioBitrate: 96000,
    videoCodec: 'h264',
    videoBitrate: 3000000,
    fps: { min: 24, max: 60, ideal: 24 },
    subtitleFormat: 'both',   // 支持字幕文件+硬编码
    maxHashtags: 10,
    contentPolicy: {
      bannedWords: ['色情', '过度暴力'],
      needSoftViolence: true,
      noMusicCopyright: true,
    },
    imageStyle: '接地气/生活化',
    sceneDuration: { min: 2, max: 8, ideal: 3 },
    dialoguePerScene: { min: 1, max: 4, ideal: 2 },
    hookSeconds: 2,
    cliffhangerPer: 4,
  },

  bilibili: {
    name: 'B站',
    nameEn: 'Bilibili',
    icon: '📺',
    color: '#FB7299',
    format: 'both',          // 横屏+竖屏都支持
    aspectRatio: '16:9',
    altAspectRatio: '9:16',
    resolutions: [
      { width: 1920, height: 1080, label: '1080P横屏' },
      { width: 1080, height: 1920, label: '1080P竖屏' },
      { width: 1280, height: 720, label: '720P横屏' },
    ],
    maxDuration: 600,
    shortDuration: { min: 15, max: 60, ideal: 45 },
    dramaDuration: { min: 120, max: 1800, ideal: 300 },
    videoFormat: 'mp4',
    maxFileSize: 4 * 1024 * 1024 * 1024, // 4GB
    audioCodec: 'aac',
    audioBitrate: 192000,
    videoCodec: 'h264',
    videoBitrate: 6000000,
    fps: { min: 24, max: 60, ideal: 30 },
    subtitleFormat: 'ass',   // B站支持ASS字幕（弹幕风格）
    subtitleStyle: 'ass_with_danmaku',
    maxHashtags: 10,
    contentPolicy: {
      bannedWords: ['色情', '过度暴力', '违规翻墙'],
      needSoftViolence: true,
      noMusicCopyright: false, // B站有音频库
      allowOriginalBG: true,
    },
    imageStyle: '二次元/国风/影视质感',
    sceneDuration: { min: 3, max: 15, ideal: 5 },
    dialoguePerScene: { min: 1, max: 5, ideal: 3 },
    hookSeconds: 3,
    cliffhangerPer: 6,
  },

  shipinhao: {
    name: '微信视频号',
    nameEn: 'WeChat Channels',
    icon: '📺',
    color: '#07C160',
    format: 'portrait',
    aspectRatio: '9:16',
    resolutions: [
      { width: 1080, height: 1920, label: '1080P竖屏' },
      { width: 720, height: 1280, label: '720P竖屏' },
    ],
    maxDuration: 300,
    shortDuration: { min: 5, max: 60, ideal: 30 },
    dramaDuration: { min: 60, max: 600, ideal: 120 },
    videoFormat: 'mp4',
    maxFileSize: 200 * 1024 * 1024, // 200MB
    audioCodec: 'aac',
    audioBitrate: 96000,
    videoCodec: 'h264',
    videoBitrate: 2500000,
    fps: { min: 24, max: 60, ideal: 30 },
    subtitleFormat: 'hardcode',
    maxHashtags: 3,
    contentPolicy: {
      bannedWords: ['色情', '政治', '暴力'],
      needSoftViolence: true,
      noMusicCopyright: true,
      noWatermark: false,  // 微信本身会加
    },
    imageStyle: '温暖/真实感',
    sceneDuration: { min: 2, max: 6, ideal: 3 },
    dialoguePerScene: { min: 1, max: 2, ideal: 1 },
    hookSeconds: 1,
    cliffhangerPer: 3,
  },

  xiaohongshu: {
    name: '小红书',
    nameEn: 'Xiaohongshu / RED',
    icon: '📕',
    color: '#FF2442',
    format: 'portrait',
    aspectRatio: '3:4',     // 小红书特殊比例
    altAspectRatio: '9:16',
    resolutions: [
      { width: 1080, height: 1440, label: '3:4竖屏' },
      { width: 1080, height: 1920, label: '9:16全屏' },
    ],
    maxDuration: 300,
    shortDuration: { min: 15, max: 60, ideal: 30 },
    dramaDuration: { min: 60, max: 600, ideal: 90 },
    videoFormat: 'mp4',
    maxFileSize: 500 * 1024 * 1024,
    audioCodec: 'aac',
    audioBitrate: 96000,
    videoCodec: 'h264',
    videoBitrate: 3000000,
    fps: { min: 24, max: 60, ideal: 30 },
    subtitleFormat: 'hardcode',
    maxHashtags: 30,
    tagsPerPost: 10,
    contentPolicy: {
      bannedWords: ['色情', '过度营销', '虚假宣传'],
      needSoftViolence: true,
      needAesthetic: true,   // 小红书重视审美
      noMusicCopyright: true,
    },
    imageStyle: '精致/氛围感/高级感',
    sceneDuration: { min: 2, max: 8, ideal: 3 },
    dialoguePerScene: { min: 0, max: 2, ideal: 1 },
    hookSeconds: 2,
    cliffhangerPer: 4,
  },

  youtube: {
    name: 'YouTube',
    nameEn: 'YouTube Shorts',
    icon: '▶️',
    color: '#FF0000',
    format: 'portrait',
    aspectRatio: '9:16',
    altAspectRatio: '1:1',  // YouTube方形也支持
    resolutions: [
      { width: 1080, height: 1920, label: '1080P竖屏' },
      { width: 1920, height: 1080, label: '1080P横屏' },
      { width: 3840, height: 2160, label: '4K' },
    ],
    maxDuration: 60,          // Shorts最长60秒
    shortDuration: { min: 15, max: 60, ideal: 45 },
    dramaDuration: { min: 30, max: 60, ideal: 45 }, // Shorts只支持短
    videoFormat: 'mp4',
    maxFileSize: 256 * 1024 * 1024, // 256MB
    audioCodec: 'aac',
    audioBitrate: 128000,
    videoCodec: 'h264',
    videoBitrate: 5000000,
    fps: { min: 24, max: 60, ideal: 30 },
    subtitleFormat: 'srt',    // YouTube支持单独的SRT字幕文件
    subtitleStyle: 'srt_cc',  // 支持字幕和CC
    maxHashtags: 15,
    contentPolicy: {
      bannedWords: ['暴力', '仇恨', '侵犯版权'],
      needSoftViolence: true,
      noMusicCopyright: true,
      canMonetize: true,
    },
    imageStyle: '国际化/吸睛',
    sceneDuration: { min: 2, max: 8, ideal: 3 },
    dialoguePerScene: { min: 1, max: 3, ideal: 2 },
    hookSeconds: 2,
    cliffhangerPer: 4,
  },
};

// ============================================================
// Auto-Detection & Adaptation Logic
// ============================================================

// Get all platforms' rules
function getAllPlatformRules() {
  return PLATFORM_RULES;
}

// Get rules for a specific platform
function getPlatformRules(platformId) {
  return PLATFORM_RULES[platformId] || null;
}

// Analyze a script and detect which platforms it's suitable for
function analyzeScriptForPlatforms(script, options = {}) {
  const {
    totalDuration,   // estimated total duration in seconds
    sceneCount,      // number of scenes
    hasNSFW,         // has adult content
    hasViolence,     // has violent content
    aspectRatio,     // '9:16' or '16:9'
  } = options;

  const analysis = {};

  for (const [platformId, rules] of Object.entries(PLATFORM_RULES)) {
    const suitability = { score: 0, warnings: [], passes: [], fails: [] };
    let issues = 0;

    // 1. Duration check
    if (totalDuration) {
      if (rules.dramaDuration) {
        if (totalDuration >= rules.dramaDuration.min && totalDuration <= rules.dramaDuration.max) {
          suitability.passes.push(`时长 ${totalDuration}s 在推荐范围内`);
          suitability.score += 30;
        } else {
          const adjusted = Math.max(rules.dramaDuration.min, Math.min(rules.dramaDuration.max, totalDuration));
          suitability.warnings.push(`建议时长调整为 ${rules.dramaDuration.min}-${rules.dramaDuration.max}s（当前${totalDuration}s）`);
          issues++;
        }
      }
      if (rules.maxDuration && totalDuration > rules.maxDuration) {
        suitability.fails.push(`超过最大时长 ${rules.maxDuration}s`);
        issues += 2;
      }
    }

    // 2. Format check
    if (aspectRatio) {
      if (rules.aspectRatio === aspectRatio || rules.altAspectRatio === aspectRatio) {
        suitability.passes.push(`画面比例 ${aspectRatio} 符合平台要求`);
        suitability.score += 20;
      } else {
        suitability.warnings.push(`建议使用 ${rules.aspectRatio} 比例（当前${aspectRatio}）`);
        issues++;
      }
    }

    // 3. Content policy check
    if (hasNSFW) {
      suitability.warnings.push('包含成人内容，部分平台可能限流');
      issues++;
    }
    if (hasViolence && rules.contentPolicy?.needSoftViolence) {
      suitability.warnings.push('暴力内容需弱化处理');
      issues++;
    }

    // 4. Scene pacing
    if (sceneCount && rules.cliffhangerPer) {
      const cliffhangerCount = Math.floor(sceneCount / rules.cliffhangerPer);
      if (cliffhangerCount >= 1) {
        suitability.passes.push(`剧情节奏：每${rules.cliffhangerPer}场景一个悬念点`);
        suitability.score += 10;
      }
    }

    // 5. Hashtag compatibility
    if (rules.maxHashtags) {
      suitability.passes.push(`支持最多 ${rules.maxHashtags} 个标签`);
      suitability.score += 5;
    }

    // Calculate final score
    suitability.score = Math.max(0, Math.min(100, suitability.score));
    suitability.score -= issues * 10;

    analysis[platformId] = {
      platformId,
      platformName: rules.name,
      icon: rules.icon,
      color: rules.color,
      score: Math.max(0, suitability.score),
      passes: suitability.passes,
      warnings: suitability.warnings,
      fails: suitability.fails,
      recommended: suitability.score >= 50,
      adaptations: generateAdaptations(rules, options),
    };
  }

  return analysis;
}

// Generate specific adaptations needed for a platform
function generateAdaptations(rules, options = {}) {
  const adaptations = [];

  // Resolution
  if (rules.resolutions && rules.resolutions.length > 0) {
    adaptations.push({
      type: 'resolution',
      value: rules.resolutions[0],
      description: `输出分辨率: ${rules.resolutions[0].label}`,
    });
  }

  // Duration
  if (rules.dramaDuration) {
    adaptations.push({
      type: 'duration',
      value: rules.dramaDuration.ideal || rules.dramaDuration.max,
      description: `目标时长: ${rules.dramaDuration.ideal || rules.dramaDuration.max}s`,
    });
  }

  // Subtitle format
  if (rules.subtitleFormat) {
    adaptations.push({
      type: 'subtitle',
      value: rules.subtitleFormat,
      description: `字幕格式: ${rules.subtitleFormat === 'hardcode' ? '硬编码字幕' : rules.subtitleFormat === 'ass' ? 'ASS弹幕风格' : 'SRT文件'}`,
    });
  }

  // FPS
  if (rules.fps) {
    adaptations.push({
      type: 'fps',
      value: rules.fps.ideal,
      description: `帧率: ${rules.fps.ideal}fps`,
    });
  }

  // Scene pacing
  if (rules.hookSeconds) {
    adaptations.push({
      type: 'hook',
      value: rules.hookSeconds,
      description: `前${rules.hookSeconds}秒必须设置剧情钩子`,
    });
  }

  // Dialogue per scene
  if (rules.dialoguePerScene) {
    adaptations.push({
      type: 'dialogue_density',
      value: rules.dialoguePerScene.ideal || rules.dialoguePerScene.max,
      description: `每场景最佳对话数: ${rules.dialoguePerScene.ideal || rules.dialoguePerScene.max}句`,
    });
  }

  // Image style
  if (rules.imageStyle) {
    adaptations.push({
      type: 'image_style',
      value: rules.imageStyle,
      description: `画面风格: ${rules.imageStyle}`,
    });
  }

  // File size
  if (rules.maxFileSize) {
    adaptations.push({
      type: 'file_size',
      value: rules.maxFileSize,
      description: `最大文件大小: ${(rules.maxFileSize / 1024 / 1024).toFixed(0)}MB`,
    });
  }

  // Watermark
  if (rules.watermarkRequired === false || rules.contentPolicy?.noWatermark === false) {
    adaptations.push({
      type: 'watermark',
      value: false,
      description: '平台自动添加水印，无需手动处理',
    });
  }

  return adaptations;
}

// Auto-generate optimized script params for a specific platform
function generateOptimizedParams(platformId, options = {}) {
  const rules = PLATFORM_RULES[platformId];
  if (!rules) return null;

  const {
    genre = '霸道总裁',
    style = '甜宠',
    totalDuration,
    targetSceneCount,
    asVertical = true,
  } = options;

  const duration = totalDuration || rules.dramaDuration.ideal || 120;
  const sceneDuration = rules.sceneDuration.ideal || 4;
  const sceneCount = targetSceneCount || Math.round(duration / sceneDuration);
  const dialoguePerScene = rules.dialoguePerScene.ideal || 2;
  const totalDialogues = sceneCount * dialoguePerScene;

  // Generate optimal hashtags based on platform + genre
  const hashtags = generateHashtags(platformId, genre, style);

  // Image prompts enrichment based on platform image style
  const imageStyleSuffix = rules.imageStyle 
    ? `, ${rules.imageStyle} style, cinematic lighting, 16:9 aspect ratio`
    : ', cinematic, photorealistic';

  return {
    platformId,
    platformName: rules.name,
    format: rules.format || 'portrait',
    
    // Script params
    sceneCount,
    totalDuration: duration,
    sceneDuration,          // seconds per scene
    dialoguePerScene,
    totalDialogues,
    hookRate: rules.hookSeconds || 2,
    cliffhangerPer: rules.cliffhangerPer || 5,
    
    // Video params
    resolution: rules.resolutions?.[0] || { width: 1080, height: 1920 },
    aspectRatio: asVertical ? rules.aspectRatio : (rules.altAspectRatio || '16:9'),
    fps: rules.fps?.ideal || 30,
    videoBitrate: rules.videoBitrate || 4000000,
    audioBitrate: rules.audioBitrate || 128000,
    maxFileSize: rules.maxFileSize || 500 * 1024 * 1024,
    
    // Subtitle
    subtitleFormat: rules.subtitleFormat || 'hardcode',
    
    // Content
    hashtags,
    tagsPerScene: rules.tagsPerScene || 2,
    maxHashtags: rules.maxHashtags || 10,
    imageStyle: `${rules.imageStyle || '电影质感'}, ${genre}, ${style}${imageStyleSuffix}`,
    
    // Prompt injection for script generation
    scriptPromptEnhancement: [
      `Target platform: ${rules.name} (${rules.nameEn})`,
      `Duration: ${duration}s, ${sceneCount} scenes, ~${sceneDuration}s each`,
      `Hook required in first ${rules.hookSeconds || 2} seconds`,
      `Cliffhanger every ${rules.cliffhangerPer || 5} scenes`,
      `Style: ${imageStyleSuffix}`,
    ].join('\n'),
  };
}

// Generate relevant hashtags for a platform + genre
function generateHashtags(platformId, genre, style) {
  const baseTags = {
    douyin: ['#短剧', '#甜宠短剧', '#原创短剧', '#短剧推荐', '#一分钟追剧'],
    kuaishou: ['#短剧', '#快手短剧', '#追剧', '#每天一部好剧', '#短剧推荐'],
    bilibili: ['#短剧', '#自制短剧', '#剧情', '#原创', '#国风'],
    shipinhao: ['#短剧', '#视频号', '#推荐', '#好剧推荐'],
    xiaohongshu: ['#短剧推荐', '#甜剧', '#原创短剧', '#好剧分享', '#碎片时间追剧',
                  '#沉浸式追剧', '#高颜值短剧', '#上头短剧', '#宝藏短剧', '#短剧安利'],
    youtube: ['#shorts', '#shortdrama', '#cdrama', '#drama', '#story'],
  };

  const platformTags = baseTags[platformId] || baseTags.douyin;
  
  // Add genre-specific tags
  const genreTags = {
    '霸道总裁': ['#霸总', '#霸道总裁', '#霸总短剧'],
    '甜宠': ['#甜宠', '#甜甜的恋爱', '#甜到齁'],
    '穿越': ['#穿越', '#古装穿越', '#时空'],
    '重生': ['#重生', '#复仇', '#女强'],
    '悬疑': ['#悬疑', '#反转', '#烧脑'],
    '搞笑': ['#搞笑', '#喜剧', '#沙雕'],
    '虐恋': ['#虐恋', '#虐心', '#哭戏'],
  };
  
  const extraTags = genreTags[genre] || [];
  const allTags = [...platformTags];
  
  // Add genre-specific tags
  for (const tag of extraTags) {
    if (allTags.length < (PLATFORM_RULES[platformId]?.maxHashtags || 10)) {
      if (!allTags.includes(tag)) allTags.push(tag);
    }
  }

  return allTags;
}

// ============================================================
// Web Detection (fetch rules from platform help pages)
// ============================================================

// Platform help page URLs for real-time rule updates
const PLATFORM_HELP_URLS = {
  douyin: 'https://developer.douyin.com/docs/guide/',
  kuaishou: 'https://open.kuaishou.com/platform/openApi',
  bilibili: 'https://openhome.bilibili.com/',
  shipinhao: 'https://channels.weixin.qq.com/platform',
  xiaohongshu: 'https://open.xiaohongshu.com/',
  youtube: 'https://support.google.com/youtube/answer/',
};

// Attempt to fetch latest rules from platform help pages
// Returns true if updated, false if offline/same
async function fetchLatestRules(platformId) {
  const url = PLATFORM_HELP_URLS[platformId];
  if (!url) return false;
  
  try {
    const response = await webFetch(url);
    if (response && response.text) {
      // Parse the page for duration/resolution/subtitle info
      const updates = parsePlatformPage(platformId, response.text);
      if (updates) {
        // Merge updates into our rules
        Object.assign(PLATFORM_RULES[platformId], updates);
        console.log(`Updated rules for ${platformId} from web`);
        return true;
      }
    }
  } catch (e) {
    console.log(`Offline: could not fetch ${platformId} rules`);
  }
  return false;
}

function parsePlatformPage(platformId, html) {
  // Simple HTML parser to extract platform rules
  // Returns partial rules object or null
  const updates = {};
  
  // Look for duration info in page
  const durationMatch = html.match(/(\d+)[秒分钟]*时[长间]/i);
  if (durationMatch) {
    const val = parseInt(durationMatch[1]);
    if (platformId === 'youtube') {
      updates.maxDuration = Math.min(val, 60);
    } else {
      updates.maxDuration = val;
    }
  }

  // Look for resolution info
  const resMatch = html.match(/(\d+)[xX×*](\d+)/);
  if (resMatch) {
    const w = parseInt(resMatch[1]);
    const h = parseInt(resMatch[2]);
    if (w > 0 && h > 0) {
      updates.resolutions = [{ width: w, height: h, label: `${w}P` }];
    }
  }

  return Object.keys(updates).length > 0 ? updates : null;
}

// ============================================================
// Script Adaptation
// ============================================================

// Adapt a generated script to fit a platform's rules
function adaptScriptForPlatform(script, platformId, options = {}) {
  const rules = PLATFORM_RULES[platformId];
  if (!rules) return script;

  const adapted = { ...script };
  const platformParams = generateOptimizedParams(platformId, options);

  // 1. Adjust scene count
  if (platformParams && script.scenes) {
    const targetCount = platformParams.sceneCount;
    if (script.scenes.length > targetCount) {
      // Trim trailing scenes
      adapted.scenes = script.scenes.slice(0, targetCount);
    } else if (script.scenes.length < targetCount) {
      // Add more scenes by duplicating last with variation
      const extra = targetCount - script.scenes.length;
      for (let i = 0; i < extra; i++) {
        const lastScene = { ...script.scenes[script.scenes.length - 1] };
        lastScene.id = 'adapted_' + Date.now() + '_' + i;
        lastScene.index = script.scenes.length + i;
        lastScene.location = lastScene.location + ' (续)';
        adapted.scenes.push(lastScene);
      }
    }
  }

  // 2. Add hook info to first scene
  if (rules.hookSeconds && adapted.scenes && adapted.scenes.length > 0) {
    adapted.scenes[0].hook = true;
    adapted.scenes[0].hookSeconds = rules.hookSeconds;
  }

  // 3. Mark cliffhanger scenes
  if (rules.cliffhangerPer && adapted.scenes) {
    for (let i = 0; i < adapted.scenes.length; i++) {
      if ((i + 1) % rules.cliffhangerPer === 0) {
        adapted.scenes[i].cliffhanger = true;
        adapted.scenes[i].description += '（惊！悬念突转）';
      }
    }
  }

  // 4. Adjust dialogue density
  if (platformParams && adapted.scenes) {
    const idealDialogue = platformParams.dialoguePerScene;
    for (const scene of adapted.scenes) {
      if (scene.dialogue) {
        if (scene.dialogue.length > idealDialogue) {
          scene.dialogue = scene.dialogue.slice(0, idealDialogue);
        }
      }
    }
  }

  // 5. Add platform-specific tags
  adapted.platformTags = generateHashtags(platformId, options.genre || '', options.style || '');
  adapted.platformId = platformId;
  adapted.platformName = rules.name;

  return adapted;
}

module.exports = {
  getAllPlatformRules,
  getPlatformRules,
  analyzeScriptForPlatforms,
  generateOptimizedParams,
  generateHashtags,
  fetchLatestRules,
  adaptScriptForPlatform,
};
