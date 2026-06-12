// Subtitle Engine - generates SRT subtitles and burns them into video
// Supports: SRT export, ASS (Advanced SubStation Alpha) format for styling
// Also supports: hard-burn subtitles during FFmpeg composition

// SRT subtitle generation
function generateSRT(scenes) {
  // scenes: [{ dialogue: [{ characterName, line, emotion }], duration? }]
  // Returns SRT formatted string
  
  let srt = '';
  let subtitleIndex = 1;
  let currentTime = 0; // in seconds
  
  for (const scene of scenes) {
    const sceneDuration = scene.duration || 3;
    
    if (scene.dialogue && scene.dialogue.length > 0) {
      const dialogueDuration = sceneDuration / Math.max(scene.dialogue.length, 1);
      
      for (const line of scene.dialogue) {
        const startTime = currentTime;
        // Each line takes its share of scene time
        const endTime = currentTime + dialogueDuration;
        
        srt += `${subtitleIndex}\n`;
        srt += `${formatSRTTime(startTime)} --> ${formatSRTTime(endTime)}\n`;
        
        // Character name in brackets, then the line
        const subtitleText = line.characterName 
          ? `${line.characterName}：${line.line}`
          : line.line;
        srt += `${subtitleText}\n\n`;
        
        subtitleIndex++;
        currentTime = endTime;
      }
    } else {
      // No dialogue, move time forward
      currentTime += sceneDuration;
    }
  }
  
  return srt;
}

// ASS (Advanced SubStation Alpha) - supports styled subtitles
// More control over font, color, position, shadow
function generateASS(scenes, options = {}) {
  const {
    fontName = 'Microsoft YaHei',
    fontSize = 36,
    primaryColor = '&H00FFFFFF',  // White
    secondaryColor = '&H000000FF', // Blue
    outlineColor = '&H00000000',   // Black
    backColor = '&H80000000',      // Semi-transparent black
    alignment = 2,                 // 2 = bottom center
    marginV = 30,                  // Vertical margin
    bold = 0,                      // 0 = normal, -1 = bold
  } = options;
  
  let ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes
YCbCr Matrix: BT.601

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryColor},${secondaryColor},${outlineColor},${backColor},${bold},0,0,0,100,100,0,0,1,2,1,${alignment},20,20,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text

`;
  
  let currentTime = 0;
  
  for (const scene of scenes) {
    const sceneDuration = scene.duration || 3;
    
    if (scene.dialogue && scene.dialogue.length > 0) {
      const dialogueDuration = sceneDuration / Math.max(scene.dialogue.length, 1);
      
      for (const line of scene.dialogue) {
        const startTime = formatASSTime(currentTime);
        const endTime = formatASSTime(currentTime + dialogueDuration);
        
        // Different color for different characters to aid readability
        const isFirstChar = line.characterName === scenes[0]?.dialogue?.[0]?.characterName;
        const styleName = isFirstChar ? 'Default' : 'Default'; // Could add per-character styles
        
        // Dialogue text with character name prefix
        const text = line.characterName
          ? `{\\b1}${line.characterName}{\\b0}：${line.line}`
          : line.line;
        
        ass += `Dialogue: 0,${startTime},${endTime},${styleName},,0,0,0,,${text}\n`;
        
        currentTime += dialogueDuration;
      }
    } else {
      currentTime += sceneDuration;
    }
  }
  
  return ass;
}

// FFmpeg subtitle filter command for hard-burning subtitles
function getSubtitleFFmpegArgs(subtitleContent, format = 'ass') {
  // Returns FFmpeg args to overlay subtitles on video
  const ext = format === 'ass' ? '.ass' : '.srt';
  const filterName = format === 'ass' ? 'ass' : 'subtitles';
  
  return {
    subtitleFile: subtitleContent,
    filterArg: `${filterName}=subs${ext}`,
  };
}

// Convert SRT content to buffer for FFmpeg
function subtitleToBuffer(srtContent) {
  return Buffer.from(srtContent, 'utf-8');
}

// Generate bilingual subtitles (Chinese + English)
function generateBilingualSRT(scenes, translations) {
  // translations: array parallel to dialogue lines
  let srt = '';
  let subtitleIndex = 1;
  let currentTime = 0;
  let lineIdx = 0;
  
  for (const scene of scenes) {
    const sceneDuration = scene.duration || 3;
    
    if (scene.dialogue && scene.dialogue.length > 0) {
      const dialogueDuration = sceneDuration / Math.max(scene.dialogue.length, 1);
      
      for (const line of scene.dialogue) {
        const startTime = currentTime;
        const endTime = currentTime + dialogueDuration;
        
        const cnText = line.characterName ? `${line.characterName}：${line.line}` : line.line;
        const enText = translations?.[lineIdx] || '';
        
        srt += `${subtitleIndex}\n`;
        srt += `${formatSRTTime(startTime)} --> ${formatSRTTime(endTime)}\n`;
        srt += `${cnText}\n`;
        if (enText) {
          srt += `${enText}\n`;
        }
        srt += '\n';
        
        subtitleIndex++;
        lineIdx++;
        currentTime = endTime;
      }
    } else {
      currentTime += sceneDuration;
    }
  }
  
  return srt;
}

// Utility: format seconds to SRT time format (HH:MM:SS,mmm)
function formatSRTTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
}

// Utility: format seconds to ASS time format (H:MM:SS.cc)
function formatASSTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  
  return `${h}:${pad(m, 2)}:${pad(s, 2)}.${pad(cs, 2)}`;
}

function pad(n, width) {
  const s = String(n);
  return '0'.repeat(Math.max(0, width - s.length)) + s;
}

module.exports = {
  generateSRT,
  generateASS,
  getSubtitleFFmpegArgs,
  subtitleToBuffer,
  generateBilingualSRT,
};
