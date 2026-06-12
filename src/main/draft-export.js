// CapCut/Draft Export - generates editable project files for 剪映专业版
// Exports a .draft folder that can be imported into CapCut
// Also supports: Premiere Pro XML (FCPX XML format)

const fs = require('fs');
const path = require('path');

// Generate a CapCut-compatible project draft
// CapCut draft format (based on reverse engineering):
// - draft_content.json (main project file)
// - draft_meta_info.json (metadata)
// - materials/ (media references)
function exportCapCutDraft(project, scenes, options = {}) {
  const {
    projectName = project.title || '龙虾短剧工坊',
    outputDir = path.join(process.cwd(), '.output', 'drafts'),
    fps = 24,
    width = 1920,
    height = 1080,
  } = options;
  
  const draftDir = path.join(outputDir, sanitizeFilename(projectName));
  const materialsDir = path.join(draftDir, 'materials');
  const draftDirSanitized = draftDir.replace(/\\/g, '/');
  
  fs.mkdirSync(materialsDir, { recursive: true });
  
  // Build material references for each scene
  let totalDuration = 0; // in microseconds
  const materials = [];
  const segments = [];
  const tracks = [];
  
  // Video track (track 0)
  const videoTracks = [];
  
  // Subtitle track (track 1)
  const subtitleTracks = [];
  
  let videoTrackId = 'T0';
  let subtitleTrackId = 'T1';
  
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const sceneDuration = (scene.duration || 3) * 1000000; // seconds to microseconds
    const startTime = totalDuration;
    const endTime = totalDuration + sceneDuration;
    
    // Create material entry for scene image
    const materialId = `M${i + 1}`;
    const imageFileName = `scene_${i + 1}.png`;
    
    // Copy scene image to materials if provided
    if (scene.imageDataUrl) {
      const imgBuffer = dataUrlToBuffer(scene.imageDataUrl);
      fs.writeFileSync(path.join(materialsDir, imageFileName), imgBuffer);
    }
    
    materials.push({
      id: materialId,
      type: 'video',
      path: `materials/${imageFileName}`,
      width,
      height,
      duration: sceneDuration,
      fps,
    });
    
    // Video segment
    videoTracks.push({
      id: `S${i + 1}`,
      material_id: materialId,
      type: 'video',
      start_time: startTime,
      end_time: endTime,
      duration: sceneDuration,
      transform: {
        scale: 1,
        rotation: 0,
        position: { x: 0, y: 0 },
      },
      speed: 1,
      volume: 1,
    });
    
    // Audio segment (TTS)
    if (scene.audioDataUrl) {
      const audioId = `A${i + 1}`;
      const audioFileName = `audio_${i + 1}.mp3`;
      const audioBuffer = dataUrlToBuffer(scene.audioDataUrl);
      fs.writeFileSync(path.join(materialsDir, audioFileName), audioBuffer);
      
      materials.push({
        id: audioId,
        type: 'audio',
        path: `materials/${audioFileName}`,
        duration: sceneDuration,
      });
      
      videoTracks.push({
        id: `SA${i + 1}`,
        material_id: audioId,
        type: 'audio',
        start_time: startTime,
        end_time: endTime,
        duration: sceneDuration,
        volume: 1,
      });
    }
    
    // Subtitle segments
    if (scene.dialogue && scene.dialogue.length > 0) {
      const perLineDuration = sceneDuration / scene.dialogue.length;
      
      for (let j = 0; j < scene.dialogue.length; j++) {
        const line = scene.dialogue[j];
        const subStart = startTime + j * perLineDuration;
        const subEnd = subStart + perLineDuration;
        const subId = `SUB_${i + 1}_${j + 1}`;
        
        subtitleTracks.push({
          id: subId,
          type: 'subtitle',
          start_time: subStart,
          end_time: subEnd,
          content: line.characterName ? `${line.characterName}：${line.line}` : line.line,
          style: {
            font_size: 36,
            font_color: '#FFFFFF',
            outline_color: '#000000',
            outline_width: 2,
            alignment: 'bottom_center',
            font_family: 'Microsoft YaHei',
            bold: false,
          },
        });
      }
    }
    
    totalDuration += sceneDuration;
  }
  
  // BGM material
  if (scenes.bgmDataUrl) {
    const bgmId = 'BGM';
    const bgmBuffer = dataUrlToBuffer(scenes.bgmDataUrl);
    fs.writeFileSync(path.join(materialsDir, 'bgm.wav'), bgmBuffer);
    
    materials.push({
      id: bgmId,
      type: 'audio',
      path: 'materials/bgm.wav',
      duration: totalDuration,
    });
    
    videoTracks.push({
      id: 'SBGM',
      material_id: bgmId,
      type: 'audio',
      start_time: 0,
      end_time: totalDuration,
      duration: totalDuration,
      volume: 0.3,
      is_bgm: true,
    });
  }
  
  // Build draft_content.json (CapCut project format)
  const draftContent = {
    version: '3.2.0',
    canvas: {
      width,
      height,
      fps,
    },
    materials,
    tracks: [
      {
        id: videoTrackId,
        type: 'main',
        segments: videoTracks,
      },
    ],
    duration: totalDuration,
    subtitles: subtitleTracks,
    audio_settings: {
      master_volume: 1,
    },
    export_settings: {
      resolution: `${width}x${height}`,
      fps,
      bitrate: 8000000,
      format: 'mp4',
      codec: 'h264',
    },
  };
  
  // Write draft files
  fs.writeFileSync(
    path.join(draftDir, 'draft_content.json'),
    JSON.stringify(draftContent, null, 2)
  );
  
  fs.writeFileSync(
    path.join(draftDir, 'draft_meta_info.json'),
    JSON.stringify({
      name: projectName,
      create_time: Date.now(),
      modify_time: Date.now(),
      version: '3.2.0',
      platform: 'pc',
    }, null, 2)
  );
  
  return draftDir;
}

// Export as Final Cut Pro XML (FCPXML) - compatible with Premiere Pro, DaVinci Resolve
function exportFCPXML(project, scenes, options = {}) {
  const {
    projectName = project.title || 'Lobster Studio Project',
    fps = 24,
    width = 1920,
    height = 1080,
  } = options;
  
  // FCPXML 1.9 format (works in Premiere Pro 2023+)
  let totalDuration = 0;
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
  <project name="${escapeXml(projectName)}">
    <format frameDuration="${fpsToRational(fps)}" width="${width}" height="${height}" name="FFVideoFormat${height}p${fps}"/>
    <sequence duration="${totalDuration}/1s">
      <spine>
`;
  
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const sceneDuration = scene.duration || 3;
    totalDuration += sceneDuration;
    
    // Video clip
    let imgPath = '';
    if (scene.imageDataUrl) {
      // Save image and reference in XML
      const imgDir = path.join(process.cwd(), '.output', 'fcpxml_assets');
      fs.mkdirSync(imgDir, { recursive: true });
      imgPath = path.join(imgDir, `scene_${i + 1}.png`);
      const imgBuffer = dataUrlToBuffer(scene.imageDataUrl);
      fs.writeFileSync(imgPath, imgBuffer);
    }
    
    xml += `        <clip name="Scene ${i + 1}" duration="${sceneDuration}s" start="0s">
          <adjust-transform scale="1.0" position="0,0"/>
          <video lane="1">
            <ref resource="rsc_vid_${i}"/>
          </video>
`;
    
    // Audio for this scene (if any)
    if (scene.dialogue && scene.dialogue.length > 0) {
      const perLineDuration = sceneDuration / scene.dialogue.length;
      for (let j = 0; j < scene.dialogue.length; j++) {
        // No actual audio file - placeholder for the editor to fill in
        xml += `          <audio lane="${2 + j}">
            <ref resource="rsc_audio_${i}_${j}"/>
          </audio>
`;
      }
    }
    
    xml += `        </clip>
`;
  }
  
  xml += `      </spine>
    </sequence>
  </project>
  
  <resources>
`;
  
  // Resources
  for (let i = 0; i < scenes.length; i++) {
    xml += `    <asset id="rsc_vid_${i}" name="scene_${i + 1}.png" duration="0s" format="FFVideoFormat${height}p${fps}" uid="scene_${i + 1}"/>
`;
    if (scenes[i]?.dialogue) {
      for (let j = 0; j < scenes[i].dialogue.length; j++) {
        xml += `    <asset id="rsc_audio_${i}_${j}" name="audio_${i}_${j}" duration="0s" uid="audio_${i}_${j}"/>
`;
      }
    }
  }
  
  xml += `  </resources>
</fcpxml>`;
  
  // Fix the sequence duration
  xml = xml.replace(`duration="${totalDuration - totalDuration}/1s"`, `duration="${totalDuration}s"`);
  
  return xml;
}

// Export as Aegisub (.ass) subtitle project
function exportASSProject(scenes, options = {}) {
  const {
    fontName = 'Microsoft YaHei',
    fontSize = 36,
  } = options;
  
  const subEngine = require('./subtitle-engine.js');
  return subEngine.generateASS(scenes, { fontName, fontSize });
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
}

function dataUrlToBuffer(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return Buffer.alloc(0);
  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return Buffer.from(dataUrl, 'base64');
  return Buffer.from(matches[2], 'base64');
}

function escapeXml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function fpsToRational(fps) {
  // Returns frame duration as rational number
  const num = Math.round(fps);
  return `${num * 100}/${100}`;
}

module.exports = {
  exportCapCutDraft,
  exportFCPXML,
  exportASSProject,
};
