// AutoDetect Engine v2 - Dual Mode: Domestic (China) + Overseas (Global)
// Automatically detects platform rules and adapts content by region

const { webFetch } = require('./web-fetch-shim');

// ============================================================
// MODE: 国内模式 🇨🇳
// ============================================================
const DOMESTIC_PLATFORMS = {
  douyin: {
    id: 'douyin', name: '抖音', nameEn: 'Douyin', region: 'domestic', icon: '🎵', color: '#000000',
    format: 'portrait', aspectRatio: '9:16',
    resolutions: [{ width: 1080, height: 1920, label: '1080P竖屏' }, { width: 720, height: 1280 }],
    maxDuration: 300, shortDuration: { min: 15, max: 60, ideal: 45 }, dramaDuration: { min: 60, max: 600, ideal: 180 },
    videoFormat: 'mp4', maxFileSize_MB: 1024, audioCodec: 'aac', audioBitrate: 128000,
    videoCodec: 'h264', videoBitrate: 4000000, fps: { min: 24, max: 60, ideal: 30 },
    subtitleFormat: 'hardcode', maxHashtags: 5, tagsPerScene: 2,
    contentPolicy: { bannedWordsChinese: ['色情','暴力血腥','政治敏感'], needSoftViolence: true, noMusicCopyright: true, watermark: '自动添加' },
    imageStyle: '中国风短剧, 电影级质感', sceneDuration: { min: 2, max: 10, ideal: 4 },
    dialoguePerScene: { min: 1, max: 3, ideal: 2 }, hookSeconds: 2, cliffhangerPer: 5,
    language: 'zh-CN', subtitleDirection: 'ltr',
  },
  kuaishou: {
    id: 'kuaishou', name: '快手', nameEn: 'Kuaishou', region: 'domestic', icon: '📺', color: '#FF6F00',
    format: 'portrait', aspectRatio: '9:16',
    resolutions: [{ width: 1080, height: 1920 }, { width: 720, height: 1280 }],
    maxDuration: 300, shortDuration: { min: 10, max: 60, ideal: 30 }, dramaDuration: { min: 60, max: 600, ideal: 120 },
    videoFormat: 'mp4', maxFileSize_MB: 500, audioCodec: 'aac', audioBitrate: 96000,
    videoCodec: 'h264', videoBitrate: 3000000, fps: { min: 24, max: 60, ideal: 24 },
    subtitleFormat: 'both', maxHashtags: 10,
    contentPolicy: { bannedWordsChinese: ['色情','过度暴力'], needSoftViolence: true, noMusicCopyright: true },
    imageStyle: '接地气, 生活化, 真实感', sceneDuration: { min: 2, max: 8, ideal: 3 },
    dialoguePerScene: { min: 1, max: 4, ideal: 2 }, hookSeconds: 2, cliffhangerPer: 4,
    language: 'zh-CN',
  },
  bilibili: {
    id: 'bilibili', name: 'B站', nameEn: 'Bilibili', region: 'domestic', icon: '📺', color: '#FB7299',
    format: 'both', aspectRatio: '16:9', altAspectRatio: '9:16',
    resolutions: [{ width: 1920, height: 1080, label: '1080P横屏' }, { width: 1080, height: 1920 }, { width: 1280, height: 720 }],
    maxDuration: 600, shortDuration: { min: 15, max: 60, ideal: 45 }, dramaDuration: { min: 120, max: 1800, ideal: 300 },
    videoFormat: 'mp4', maxFileSize_MB: 4096, audioCodec: 'aac', audioBitrate: 192000,
    videoCodec: 'h264', videoBitrate: 6000000, fps: { min: 24, max: 60, ideal: 30 },
    subtitleFormat: 'ass', maxHashtags: 10, subtitleStyle: 'ass_with_danmaku',
    contentPolicy: { bannedWordsChinese: ['色情','过度暴力','违规翻墙'], needSoftViolence: true, noMusicCopyright: false, hasAudioLibrary: true },
    imageStyle: '二次元/国风/影视质感, 精致画风', sceneDuration: { min: 3, max: 15, ideal: 5 },
    dialoguePerScene: { min: 1, max: 5, ideal: 3 }, hookSeconds: 3, cliffhangerPer: 6,
    language: 'zh-CN',
  },
  shipinhao: {
    id: 'shipinhao', name: '微信视频号', nameEn: 'WeChat Channels', region: 'domestic', icon: '📺', color: '#07C160',
    format: 'portrait', aspectRatio: '9:16',
    resolutions: [{ width: 1080, height: 1920 }, { width: 720, height: 1280 }],
    maxDuration: 300, shortDuration: { min: 5, max: 60, ideal: 30 }, dramaDuration: { min: 60, max: 600, ideal: 120 },
    videoFormat: 'mp4', maxFileSize_MB: 200, audioCodec: 'aac', audioBitrate: 96000,
    videoCodec: 'h264', videoBitrate: 2500000, fps: { min: 24, max: 60, ideal: 30 },
    subtitleFormat: 'hardcode', maxHashtags: 3,
    contentPolicy: { bannedWordsChinese: ['色情','政治','暴力'], needSoftViolence: true, noMusicCopyright: true },
    imageStyle: '温暖, 真实感, 家庭向', sceneDuration: { min: 2, max: 6, ideal: 3 },
    dialoguePerScene: { min: 1, max: 2, ideal: 1 }, hookSeconds: 1, cliffhangerPer: 3,
    language: 'zh-CN',
  },
  xiaohongshu: {
    id: 'xiaohongshu', name: '小红书', nameEn: 'Xiaohongshu (RED)', region: 'domestic', icon: '📕', color: '#FF2442',
    format: 'portrait', aspectRatio: '3:4', altAspectRatio: '9:16',
    resolutions: [{ width: 1080, height: 1440, label: '3:4竖屏' }, { width: 1080, height: 1920 }],
    maxDuration: 300, shortDuration: { min: 15, max: 60, ideal: 30 }, dramaDuration: { min: 60, max: 600, ideal: 90 },
    videoFormat: 'mp4', maxFileSize_MB: 500, audioCodec: 'aac', audioBitrate: 96000,
    videoCodec: 'h264', videoBitrate: 3000000, fps: { min: 24, max: 60, ideal: 30 },
    subtitleFormat: 'hardcode', maxHashtags: 30, tagsPerScene: 10,
    contentPolicy: { bannedWordsChinese: ['色情','过度营销','虚假宣传'], needSoftViolence: true, needAesthetic: true, noMusicCopyright: true },
    imageStyle: '精致, 氛围感, 高级感, 小红书审美', sceneDuration: { min: 2, max: 8, ideal: 3 },
    dialoguePerScene: { min: 0, max: 2, ideal: 1 }, hookSeconds: 2, cliffhangerPer: 4,
    language: 'zh-CN',
  },
};

// ============================================================
// MODE: 海外模式 🌍
// ============================================================
const OVERSEAS_PLATFORMS = {
  tiktok: {
    id: 'tiktok', name: 'TikTok', nameEn: 'TikTok', region: 'overseas', icon: '🎵', color: '#000000',
    format: 'portrait', aspectRatio: '9:16',
    resolutions: [{ width: 1080, height: 1920, label: '1080P竖屏' }, { width: 720, height: 1280 }],
    maxDuration: 60, shortDuration: { min: 15, max: 60, ideal: 30 },
    videoFormat: 'mp4', maxFileSize_MB: 256, audioCodec: 'aac', audioBitrate: 128000,
    videoCodec: 'h264', videoBitrate: 5000000, fps: { min: 24, max: 60, ideal: 30 },
    subtitleFormat: 'srt_cc', maxHashtags: 12,
    contentPolicy: { bannedWordsEnglish: ['violence','hate','nsfw'], noMusicCopyright: true, communityGuidelines: 'strict' },
    imageStyle: 'Western aesthetics, cinematic, vibrant colors, Gen Z appeal',
    sceneDuration: { min: 2, max: 7, ideal: 3 }, dialoguePerScene: { min: 1, max: 2, ideal: 1 },
    hookSeconds: 1.5, cliffhangerPer: 3, language: 'en, i18n', subtitleDirection: 'ltr',
    paceFactor: 1.2, // 海外节奏更快（画面切换频率×1.2）
  },
  youtubeShorts: {
    id: 'youtubeShorts', name: 'YouTube Shorts', nameEn: 'YouTube Shorts', region: 'overseas', icon: '▶️', color: '#FF0000',
    format: 'portrait', aspectRatio: '9:16', altAspectRatio: '1:1',
    resolutions: [{ width: 1080, height: 1920 }, { width: 1920, height: 1080 }],
    maxDuration: 60, shortDuration: { min: 15, max: 60, ideal: 45 },
    videoFormat: 'mp4', maxFileSize_MB: 256, audioCodec: 'aac', audioBitrate: 128000,
    videoCodec: 'h264', videoBitrate: 5000000, fps: { min: 24, max: 60, ideal: 30 },
    subtitleFormat: 'srt', maxHashtags: 15, subtitleStyle: 'srt_cc_separate',
    contentPolicy: { bannedWordsEnglish: ['violence','hate','copyright'], canMonetize: true, noMusicCopyright: true },
    imageStyle: 'International, eye-catching, high contrast, YouTube thumbnail style',
    sceneDuration: { min: 2, max: 8, ideal: 3 }, dialoguePerScene: { min: 1, max: 3, ideal: 2 },
    hookSeconds: 2, cliffhangerPer: 4, language: 'en, multi-language CC',
  },
  youtubeStandard: {
    id: 'youtubeStandard', name: 'YouTube 标准', nameEn: 'YouTube Standard', region: 'overseas', icon: '▶️', color: '#FF0000',
    format: 'landscape', aspectRatio: '16:9', altAspectRatio: '4:3',
    resolutions: [{ width: 1920, height: 1080, label: '1080P' }, { width: 3840, height: 2160, label: '4K' }, { width: 1280, height: 720 }],
    maxDuration: 43200, // 12h
    shortDuration: { min: 60, max: 600, ideal: 180 }, dramaDuration: { min: 300, max: 3600, ideal: 600 },
    videoFormat: 'mp4', maxFileSize_MB: 256000, audioCodec: 'aac', audioBitrate: 192000,
    videoCodec: 'h264', videoBitrate: 12000000, fps: { min: 24, max: 60, ideal: 30 },
    subtitleFormat: 'srt', maxHashtags: 15, subtitleStyle: 'srt_multilang',
    contentPolicy: { bannedWordsEnglish: ['violence','hate','copyright'], canMonetize: true, needsThumbnail: true },
    imageStyle: 'Professional cinematic, 4K ready, high production value',
    sceneDuration: { min: 3, max: 20, ideal: 6 }, dialoguePerScene: { min: 2, max: 6, ideal: 3 },
    hookSeconds: 5, cliffhangerPer: 8, language: 'en + auto-captions',
    needsSEO: true, needsThumbnail: true, needsChapters: true,
  },
  instagramReels: {
    id: 'instagramReels', name: 'Instagram Reels', nameEn: 'Instagram Reels', region: 'overseas', icon: '📸', color: '#E4405F',
    format: 'portrait', aspectRatio: '9:16', altAspectRatio: '1:1',
    resolutions: [{ width: 1080, height: 1920 }, { width: 1080, height: 1080 }],
    maxDuration: 90, shortDuration: { min: 15, max: 90, ideal: 30 },
    videoFormat: 'mp4', maxFileSize_MB: 256,
    audioCodec: 'aac', audioBitrate: 128000, videoCodec: 'h264', videoBitrate: 3500000,
    fps: { min: 24, max: 60, ideal: 30 },
    subtitleFormat: 'hardcode', maxHashtags: 30, tagsPerScene: 8,
    contentPolicy: { bannedWordsEnglish: ['violence','hate','nsfw'], noMusicCopyright: true, needAesthetic: true },
    imageStyle: 'Aesthetic, trendy, high-contrast, Instagram-worthy composition',
    sceneDuration: { min: 2, max: 6, ideal: 2.5 }, dialoguePerScene: { min: 0, max: 2, ideal: 1 },
    hookSeconds: 1.5, cliffhangerPer: 3, language: 'en, i18n',
    paceFactor: 1.3,
  },
  facebookVideo: {
    id: 'facebookVideo', name: 'Facebook/IG TV', nameEn: 'Facebook & IG TV', region: 'overseas', icon: '📘', color: '#1877F2',
    format: 'both', aspectRatio: '16:9', altAspectRatio: '1:1',
    resolutions: [{ width: 1920, height: 1080, label: '1080P' }, { width: 1280, height: 720 }],
    maxDuration: 14400, // 4h
    shortDuration: { min: 15, max: 120, ideal: 60 }, dramaDuration: { min: 120, max: 3600, ideal: 600 },
    videoFormat: 'mp4', maxFileSize_MB: 10240, audioCodec: 'aac', audioBitrate: 128000,
    videoCodec: 'h264', videoBitrate: 4000000, fps: { min: 24, max: 60, ideal: 30 },
    subtitleFormat: 'srt', maxHashtags: 30,
    contentPolicy: { bannedWordsEnglish: ['violence','hate'], noMusicCopyright: true },
    imageStyle: 'Social media friendly, bright colors, engaging composition',
    sceneDuration: { min: 2, max: 12, ideal: 4 }, dialoguePerScene: { min: 1, max: 4, ideal: 2 },
    hookSeconds: 2, cliffhangerPer: 5, language: 'en, i18n',
  },
  twitterX: {
    id: 'twitterX', name: 'Twitter / X', nameEn: 'Twitter / X', region: 'overseas', icon: '🐦', color: '#1DA1F2',
    format: 'landscape', aspectRatio: '16:9', altAspectRatio: '1:1',
    resolutions: [{ width: 1920, height: 1080 }, { width: 1280, height: 720 }],
    maxDuration: 140, shortDuration: { min: 10, max: 140, ideal: 60 },
    videoFormat: 'mp4', maxFileSize_MB: 512,
    audioCodec: 'aac', audioBitrate: 64000, videoCodec: 'h264', videoBitrate: 2500000,
    fps: { min: 24, max: 60, ideal: 24 },
    subtitleFormat: 'hardcode', maxHashtags: 10,
    contentPolicy: { bannedWordsEnglish: ['violence','hate','nsfw','misinformation'], noMusicCopyright: true },
    imageStyle: 'Concise, news-like, direct visual communication',
    sceneDuration: { min: 1.5, max: 5, ideal: 2.5 }, dialoguePerScene: { min: 1, max: 2, ideal: 1 },
    hookSeconds: 1, cliffhangerPer: 3, language: 'en',
    paceFactor: 1.4,
  },
  kakaoTV: {
    id: 'kakaoTV', name: 'KakaoTV', nameEn: 'KakaoTV', region: 'overseas', icon: '🇰🇷', color: '#FFEB00',
    format: 'both', aspectRatio: '16:9', altAspectRatio: '9:16',
    resolutions: [{ width: 1920, height: 1080 }, { width: 1080, height: 1920 }],
    maxDuration: 1800, // 30min
    shortDuration: { min: 30, max: 300, ideal: 120 }, dramaDuration: { min: 300, max: 1800, ideal: 600 },
    videoFormat: 'mp4', maxFileSize_MB: 2000,
    audioCodec: 'aac', audioBitrate: 128000, videoCodec: 'h264', videoBitrate: 5000000,
    fps: { min: 24, max: 60, ideal: 30 },
    subtitleFormat: 'ass', maxHashtags: 10,
    contentPolicy: { bannedWordsKorean: ['폭력','성인'], noMusicCopyright: true },
    imageStyle: 'Korean drama aesthetics, K-culture style, soft cinematic',
    sceneDuration: { min: 3, max: 10, ideal: 4 }, dialoguePerScene: { min: 2, max: 5, ideal: 3 },
    hookSeconds: 3, cliffhangerPer: 5, language: 'ko, en',
  },
  naverTV: {
    id: 'naverTV', name: 'Naver TV', nameEn: 'Naver TV', region: 'overseas', icon: '🇰🇷', color: '#03C75A',
    format: 'landscape', aspectRatio: '16:9',
    resolutions: [{ width: 1920, height: 1080 }, { width: 1280, height: 720 }],
    maxDuration: 3000, // 50min
    shortDuration: { min: 30, max: 300, ideal: 120 }, dramaDuration: { min: 300, max: 3000, ideal: 900 },
    videoFormat: 'mp4', maxFileSize_MB: 4000,
    audioCodec: 'aac', audioBitrate: 192000, videoCodec: 'h264', videoBitrate: 8000000,
    fps: { min: 24, max: 60, ideal: 30 },
    subtitleFormat: 'ass', maxHashtags: 5,
    contentPolicy: { bannedWordsKorean: ['폭력','성인','혐오'], noMusicCopyright: true },
    imageStyle: 'Korean cinematic, K-drama quality, Southeast Asian appeal',
    sceneDuration: { min: 4, max: 15, ideal: 6 }, dialoguePerScene: { min: 2, max: 6, ideal: 3 },
    hookSeconds: 5, cliffhangerPer: 6, language: 'ko, en, vi, th',
  },
};

// Combined lookup
const ALL_PLATFORMS = { ...DOMESTIC_PLATFORMS, ...OVERSEAS_PLATFORMS };

// ============================================================
// Core API
// ============================================================

function getAllPlatformRules(mode) {
  if (mode === 'domestic') return DOMESTIC_PLATFORMS;
  if (mode === 'overseas') return OVERSEAS_PLATFORMS;
  return ALL_PLATFORMS;
}

function getPlatformRules(platformId) {
  return ALL_PLATFORMS[platformId] || null;
}

function analyzeScriptForPlatforms(script, options = {}) {
  const {
    totalDuration, sceneCount, hasNSFW, hasViolence, aspectRatio, mode,
  } = options;

  // If mode specified, only analyze that region
  const platforms = !mode ? ALL_PLATFORMS
    : mode === 'domestic' ? DOMESTIC_PLATFORMS
    : OVERSEAS_PLATFORMS;

  const analysis = {};

  for (const [platformId, rules] of Object.entries(platforms)) {
    const suitability = { score: 50, warnings: [], passes: [], fails: [], recommendations: [] };
    let issues = 0;

    // 1. Duration
    if (totalDuration) {
      if (rules.maxDuration && totalDuration > rules.maxDuration) {
        suitability.fails.push(`时长 ${totalDuration}s > 平台上限 ${rules.maxDuration}s`);
        issues += 2;
        suitability.recommendations.push(`建议时长 ≤ ${rules.maxDuration}s`);
      }
      if (rules.dramaDuration && totalDuration >= rules.dramaDuration.min && totalDuration <= rules.dramaDuration.max) {
        suitability.passes.push(`时长 ${totalDuration}s 在推荐范围 (${rules.dramaDuration.min}-${rules.dramaDuration.max}s)`);
        suitability.score += 20;
      } else if (rules.shortDuration && totalDuration >= rules.shortDuration.min && totalDuration <= rules.shortDuration.max) {
        suitability.passes.push(`时长 ${totalDuration}s 适合短视频`);
        suitability.score += 15;
      }
    }

    // 2. Aspect ratio
    if (aspectRatio) {
      if (rules.aspectRatio === aspectRatio || rules.altAspectRatio === aspectRatio) {
        suitability.passes.push(`画幅 ${aspectRatio} 支持`);
        suitability.score += 15;
      } else {
        suitability.warnings.push(`建议画幅 ${rules.aspectRatio}${rules.altAspectRatio ? '/' + rules.altAspectRatio : ''}（当前${aspectRatio}）`);
        issues++;
      }
    }

    // 3. Scene pacing
    if (sceneCount) {
      if (rules.paceFactor) {
        const adjustedSceneDuration = (rules.sceneDuration?.ideal || 3) / (rules.paceFactor || 1);
        if (adjustedSceneDuration < 3) {
          suitability.recommendations.push(`海外平台节奏快，建议单场景 ${adjustedSceneDuration.toFixed(1)}s`);
          issues += 0.5;
        }
      }
      if (rules.cliffhangerPer && sceneCount >= rules.cliffhangerPer) {
        suitability.passes.push(`剧情节奏匹配：每${rules.cliffhangerPer}场景一个悬念点`);
        suitability.score += 10;
      }
    }

    // 4. Content policy
    if (hasNSFW) {
      suitability.warnings.push('⚠️ 成人内容，多数平台会限流/下架');
      issues++;
    }
    if (hasViolence && rules.contentPolicy?.needSoftViolence) {
      suitability.warnings.push('⚠️ 暴力内容需弱化处理');
      issues++;
    }

    // 5. Subtitle format match
    if (rules.subtitleFormat) {
      suitability.passes.push(`字幕格式: ${rules.subtitleFormat === 'hardcode' ? '硬编码' : rules.subtitleFormat === 'ass' ? 'ASS弹幕' : 'SRT文件'}`);
      suitability.score += 5;
    }

    // 6. Hashtag support
    if (rules.maxHashtags) {
      suitability.passes.push(`标签上限: ${rules.maxHashtags}个`);
      suitability.score += 5;
    }

    // 7. Language match (estimate)
    if (rules.language) {
      if (rules.language.startsWith('zh')) {
        // Domestic - assume Chinese content is fine
        suitability.passes.push('中文内容适配');
      } else {
        suitability.recommendations.push(`需要 ${rules.language} 语言支持`);
      }
    }

    // 8. File size
    if (rules.maxFileSize_MB) {
      suitability.passes.push(`文件上限: ${rules.maxFileSize_MB}MB`);
      suitability.score += 5;
    }

    // Calculate final score
    suitability.score = Math.max(0, Math.min(100, suitability.score - issues * 12));

    analysis[platformId] = {
      platformId, platformName: rules.name, nameEn: rules.nameEn,
      icon: rules.icon, color: rules.color, region: rules.region,
      score: Math.max(0, suitability.score),
      passes: suitability.passes,
      warnings: suitability.warnings,
      fails: suitability.fails,
      recommendations: suitability.recommendations,
      recommended: suitability.score >= 50,
      adaptedParams: generateOptimizedParams(platformId, options),
    };
  }

  return analysis;
}

// Generate optimized creation parameters for a specific platform
function generateOptimizedParams(platformId, options = {}) {
  const rules = ALL_PLATFORMS[platformId];
  if (!rules) return null;

  const { genre = 'romance', style = 'modern', totalDuration, targetSceneCount } = options;
  const duration = totalDuration || rules.dramaDuration?.ideal || rules.shortDuration?.ideal || 60;
  const sceneDuration = (rules.sceneDuration?.ideal || 4) / (rules.paceFactor || 1);
  const sceneCount = targetSceneCount || Math.round(duration / sceneDuration);

  // Generate hashtags
  const hashtags = generateHashtags(platformId, genre, style);

  // Image style prompt enrichment
  const imageStyle = rules.imageStyle || 'cinematic';

  return {
    platformId, platformName: rules.name, region: rules.region,
    format: rules.format || 'portrait',
    sceneCount, totalDuration: duration * (rules.paceFactor || 1), // adjust for pace
    sceneDuration: Math.round(sceneDuration * 10) / 10,
    dialoguePerScene: rules.dialoguePerScene?.ideal || 2,
    hookSeconds: rules.hookSeconds || 2,
    cliffhangerPer: rules.cliffhangerPer || 4,
    resolution: rules.resolutions?.[0] || { width: 1080, height: 1920 },
    aspectRatio: rules.aspectRatio || '9:16',
    fps: rules.fps?.ideal || 30,
    videoBitrate: rules.videoBitrate || 4000000,
    subtitleFormat: rules.subtitleFormat || 'hardcode',
    hashtags, maxHashtags: rules.maxHashtags || 10,
    language: rules.language || 'zh-CN',
    imageStyle: `${imageStyle}, ${genre}, ${style}`,
    scriptPromptEnhancement: [
      `[Platform: ${rules.name} (${rules.nameEn})]`,
      `[Duration: ${duration}s | ${sceneCount} scenes | ~${sceneDuration}s each]`,
      `[Hook: first ${rules.hookSeconds || 2}s | Cliffhanger: every ${rules.cliffhangerPer || 4} scenes]`,
      `[Language: ${rules.language || 'Chinese'}]`,
      `[Style: ${imageStyle}]`,
      ...(rules.paceFactor ? [`[Pace: ${rules.paceFactor}x faster scene cuts (overseas)]`] : []),
    ].join('\n'),
  };
}

// Generate platform-aware hashtags
function generateHashtags(platformId, genre, style) {
  const region = ALL_PLATFORMS[platformId]?.region || 'domestic';
  const maxTags = ALL_PLATFORMS[platformId]?.maxHashtags || 10;

  const domesticTags = {
    douyin: ['#短剧','#甜宠短剧','#原创短剧','#短剧推荐','#一分钟追剧'],
    kuaishou: ['#短剧','#快手短剧','#追剧','#每天一部好剧','#短剧推荐'],
    bilibili: ['#短剧','#自制短剧','#剧情','#原创','#国风'],
    shipinhao: ['#短剧','#视频号','#推荐','#好剧推荐'],
    xiaohongshu: ['#短剧推荐','#甜剧','#原创短剧','#好剧分享','#碎片时间追剧',
                  '#沉浸式追剧','#高颜值短剧','#上头短剧','#宝藏短剧','#短剧安利'],
  };

  const overseasTags = {
    tiktok: ['#drama','#shortdrama','#storytime','#series','#dramatiktok','#fyp'],
    youtubeShorts: ['#shorts','#shortdrama','#cdrama','#kdrama','#story','#drama'],
    youtubeStandard: ['#shortdrama','#cdrama','#kdrama','#webdrama','#microdrama','#drama'],
    instagramReels: ['#drama','#reels','#shortfilm','#storytelling','#dramareel'],
    facebookVideo: ['#drama','#shortfilm','#storytelling','#videodrama','#entertainment'],
    twitterX: ['#drama','#shortstory','#video','#entertainment'],
    kakaoTV: ['#드라마','#숏드라마','#웹드라마','#K드라마','#story'],
    naverTV: ['#드라마','#웹드라마','#숏폼','#한국드라마','#Kdrama'],
  };

  const baseTags = region === 'domestic'
    ? (domesticTags[platformId] || domesticTags.douyin)
    : (overseasTags[platformId] || overseasTags.tiktok);

  // Genre-specific
  const genreTags = region === 'domestic' ? {
    '霸道总裁': ['#霸总','#霸道总裁'], '甜宠': ['#甜宠','#甜甜的恋爱'],
    '穿越': ['#穿越','#古装'], '重生': ['#重生','#复仇'],
    '悬疑': ['#悬疑','#反转'], '搞笑': ['#搞笑','#喜剧'], '虐恋': ['#虐恋','#虐心'],
  } : {
    'romance': ['#romance','#love'], 'comedy': ['#comedy','#funny'],
    'suspense': ['#suspense','#thriller'], 'fantasy': ['#fantasy','#magical'],
    'historical': ['#historical','#costume'], 'action': ['#action','#exciting'],
  };

  const extraTags = genreTags[genre] || [];
  const allTags = [...baseTags];
  for (const tag of extraTags) {
    if (allTags.length < maxTags && !allTags.includes(tag)) allTags.push(tag);
  }

  return allTags.slice(0, maxTags);
}

// Adapt a generated script to fit a specific platform
function adaptScriptForPlatform(script, platformId, options = {}) {
  const rules = ALL_PLATFORMS[platformId];
  if (!rules) return script;

  const adapted = { ...script, platformId, platformName: rules.name, region: rules.region };
  const params = generateOptimizedParams(platformId, options);
  if (!params) return adapted;

  if (script.scenes) {
    const targetCount = Math.min(params.sceneCount, script.scenes.length);
    adapted.scenes = script.scenes.slice(0, targetCount);

    // Hook first scene
    if (adapted.scenes.length > 0) {
      adapted.scenes[0].hook = true;
      adapted.scenes[0].hookSeconds = rules.hookSeconds || 2;
    }

    // Cliffhanger markers
    if (rules.cliffhangerPer) {
      adapted.scenes.forEach((scene, i) => {
        if ((i + 1) % rules.cliffhangerPer === 0) {
          scene.cliffhanger = true;
          scene.description += '\n[悬念转折]';
        }
      });
    }

    // Adjust dialogue density for overseas (shorter, snappier)
    if (rules.paceFactor) {
      adapted.scenes.forEach(scene => {
        if (scene.dialogue) {
          const maxDialogue = rules.dialoguePerScene?.ideal || 2;
          if (scene.dialogue.length > maxDialogue) {
            scene.dialogue = scene.dialogue.slice(0, maxDialogue);
          }
        }
      });
    }
  }

  adapted.platformTags = generateHashtags(platformId, options.genre || '', options.style || '');
  adapted.language = rules.language || 'zh-CN';

  return adapted;
}

// Check if a platform is domestic or overseas
function getPlatformRegion(platformId) {
  if (DOMESTIC_PLATFORMS[platformId]) return 'domestic';
  if (OVERSEAS_PLATFORMS[platformId]) return 'overseas';
  return null;
}

// Get region summary
function getRegionSummary(mode) {
  const platforms = mode === 'domestic' ? DOMESTIC_PLATFORMS : OVERSEAS_PLATFORMS;
  return Object.values(platforms).map(p => ({
    id: p.id, name: p.name, icon: p.icon, color: p.color,
    format: p.format, aspectRatio: p.aspectRatio,
    maxDuration: p.maxDuration, language: p.language,
    subtitleFormat: p.subtitleFormat,
  }));
}

module.exports = {
  getAllPlatformRules, getPlatformRules,
  analyzeScriptForPlatforms, generateOptimizedParams,
  generateHashtags, adaptScriptForPlatform,
  getPlatformRegion, getRegionSummary,
  DOMESTIC_PLATFORMS, OVERSEAS_PLATFORMS,
};
