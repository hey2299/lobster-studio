// Project Pack — export/import projects as standalone files
// Packages all project data (script, characters, scenes, images, audio) into a single .lspack file
// .lspack = ZIP archive with JSON manifest + assets

const path = require('path');
const fs = require('fs');

// Use pure-JS zip — we'll use a simple JSON + base64 approach
// since we can't rely on system zip or archiver

function exportProject(projectData, options = {}) {
  const {
    outputPath = path.join(process.cwd(), '.output', 'projects'),
    includeImages = true,
    includeAudio = true,
    compress = true,
  } = options;

  if (!projectData || !projectData.title) {
    return { success: false, error: '无效的项目数据' };
  }

  const safeName = projectData.title.replace(/[<>:"/\\|?*]/g, '_').substring(0, 80);
  fs.mkdirSync(outputPath, { recursive: true });

  // Build package structure
  const pkg = {
    format: 'lobster-studio-pack',
    version: '1.0',
    exportedAt: Date.now(),
    exportedBy: options.username || 'anonymous',
    project: {
      title: projectData.title,
      description: projectData.description || '',
      createdAt: projectData.createdAt || Date.now(),
      genre: projectData.genre || '',
    },
    characters: (projectData.characters || []).map(c => ({
      id: c.id,
      name: c.name,
      role: c.role,
      personality: c.personality,
      voiceType: c.voiceType,
      appearance: c.appearance,
      // No images — they go in assets
      portraitStyle: c.portraitStyle || '',
    })),
    script: {
      scenes: (projectData.scenes || []).map(s => ({
        id: s.id,
        sceneNumber: s.sceneNumber,
        location: s.location,
        timeOfDay: s.timeOfDay,
        mood: s.mood,
        dialogue: s.dialogue || [],
        duration: s.duration || 4,
        // Images and audio are stored as base64 attachments
        imageAttachment: includeImages && s.imageDataUrl ? `scene_${s.sceneNumber || s.id}.png` : null,
        audioAttachment: includeAudio && s.audioDataUrl ? `scene_${s.sceneNumber || s.id}.mp3` : null,
        narration: s.narration || '',
      })),
    },
    bgm: projectData.bgmDataUrl ? { attachment: 'bgm.wav' } : null,
    metadata: {
      totalScenes: (projectData.scenes || []).length,
      totalCharacters: (projectData.characters || []).length,
      totalDuration: (projectData.scenes || []).reduce((s, c) => s + (c.duration || 4), 0),
      hasBgm: !!projectData.bgmDataUrl,
      subtitleFormat: projectData.subtitleFormat || '',
      translationLang: projectData.translationLang || '',
    },
    assets: {},
  };

  // Collect assets (images, audio) as base64
  const assets = {};

  if (includeImages) {
    for (const scene of (projectData.scenes || [])) {
      if (scene.imageDataUrl) {
        const key = `scene_${scene.sceneNumber || scene.id}.png`;
        assets[key] = scene.imageDataUrl;
      }
    }
    // Character portraits
    for (const char of (projectData.characters || [])) {
      if (char.portraitDataUrl) {
        const key = `portrait_${char.name}.png`;
        assets[key] = char.portraitDataUrl;
      }
    }
  }

  if (includeAudio) {
    for (const scene of (projectData.scenes || [])) {
      if (scene.audioDataUrl) {
        const key = `scene_${scene.sceneNumber || scene.id}.mp3`;
        assets[key] = scene.audioDataUrl;
      }
    }
    if (projectData.bgmDataUrl) {
      assets['bgm.wav'] = projectData.bgmDataUrl;
    }
  }

  pkg.assets = assets;

  // Write as a JSON package (single .lspack file, actually .json)
  const packName = `${safeName}_${Date.now()}.lspack`;
  const packPath = path.join(outputPath, packName);
  fs.writeFileSync(packPath, JSON.stringify(pkg, null, compress ? undefined : 2));

  const stats = fs.statSync(packPath);
  return {
    success: true,
    data: {
      packPath,
      packName,
      size: stats.size,
      sizeFormatted: formatSize(stats.size),
      sceneCount: pkg.project.scenes?.length || 0,
      characterCount: pkg.characters?.length || 0,
    },
  };
}

function importProject(packPath) {
  try {
    if (!fs.existsSync(packPath)) {
      return { success: false, error: '文件不存在' };
    }

    const raw = fs.readFileSync(packPath, 'utf-8');
    const pkg = JSON.parse(raw);

    // Validate format
    if (pkg.format !== 'lobster-studio-pack') {
      return { success: false, error: '不是有效的龙虾工坊项目文件' };
    }

    // Reconstruct scenes with assets
    const scenes = (pkg.script?.scenes || []).map(s => ({
      ...s,
      imageDataUrl: s.imageAttachment ? (pkg.assets[s.imageAttachment] || null) : null,
      audioDataUrl: s.audioAttachment ? (pkg.assets[s.audioAttachment] || null) : null,
    }));

    const characters = (pkg.characters || []).map(c => ({
      ...c,
      portraitDataUrl: pkg.assets[`portrait_${c.name}.png`] || null,
    }));

    return {
      success: true,
      data: {
        title: pkg.project?.title || '导入项目',
        description: pkg.project?.description || '',
        genre: pkg.project?.genre || '',
        createdAt: pkg.project?.createdAt || Date.now(),
        scenes,
        characters,
        bgmDataUrl: pkg.bgm?.attachment ? pkg.assets[pkg.bgm.attachment] : null,
        metadata: pkg.metadata || {},
        exportedBy: pkg.exportedBy || 'unknown',
        exportedAt: pkg.exportedAt,
      },
    };
  } catch (e) {
    return { success: false, error: '文件解析失败: ' + e.message };
  }
}

function listPacks(options = {}) {
  const packDir = options.packDir || path.join(process.cwd(), '.output', 'projects');
  if (!fs.existsSync(packDir)) return [];
  
  return fs.readdirSync(packDir)
    .filter(f => f.endsWith('.lspack'))
    .map(f => {
      const fp = path.join(packDir, f);
      const stat = fs.statSync(fp);
      return { name: f, path: fp, size: stat.size, sizeFormatted: formatSize(stat.size), createdAt: stat.birthtimeMs };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

module.exports = { exportProject, importProject, listPacks };
