// Video Composer - assembles scene images + TTS audio + BGM into final MP4
// Uses @ffmpeg/ffmpeg WASM (no system FFmpeg required)

const path = require('path');
const fs = require('fs');

let FFmpeg, toBlobURL, fetchFile;
async function loadDeps() {
  if (!FFmpeg) {
    const ffmpegMod = await import('@ffmpeg/ffmpeg');
    const utilMod = await import('@ffmpeg/util');
    FFmpeg = ffmpegMod.FFmpeg;
    toBlobURL = utilMod.toBlobURL;
    fetchFile = utilMod.fetchFile;
  }
}

let ffmpeg = null;
let loaded = false;

const FFMPEG_BASE = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

async function ensureFFmpeg() {
  if (loaded) return ffmpeg;
  await loadDeps();
  
  ffmpeg = new FFmpeg();
  
  // Listen for progress
  ffmpeg.on('progress', ({ progress, time }) => {
    console.log(`FFmpeg: ${(progress * 100).toFixed(1)}% at ${time}us`);
  });

  // Load FFmpeg WASM core
  await ffmpeg.load({
    coreURL: await toBlobURL(`${FFMPEG_BASE}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${FFMPEG_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  
  loaded = true;
  return ffmpeg;
}

function getOutputDir() {
  const outputDir = path.join(process.cwd(), '.output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  return outputDir;
}

async function composeVideo(params) {
  // params: { scenes: [{ imageDataUrl, audioDataUrl, duration }], bgmDataUrl?, outputName? }
  const ff = await ensureFFmpeg();
  const { scenes, bgmDataUrl, outputName } = params;
  
  // Step 1: Write input files into FFmpeg's virtual filesystem
  // Each scene = image frame + optional audio
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    
    // Convert base64 data URL to buffer and write to virtual FS
    if (scene.imageDataUrl) {
      const imgBuffer = dataUrlToBuffer(scene.imageDataUrl);
      await ff.writeFile(`scene_${i}.png`, imgBuffer);
    }
    
    if (scene.audioDataUrl) {
      const audioBuffer = dataUrlToBuffer(scene.audioDataUrl);
      await ff.writeFile(`scene_${i}.mp3`, audioBuffer);
    }
  }
  
  if (bgmDataUrl) {
    const bgmBuffer = dataUrlToBuffer(bgmDataUrl);
    await ff.writeFile('bgm.mp3', bgmBuffer);
  }

  // Step 2: Build concat file for images with durations
  // FFmpeg concat demuxer expects: file 'path' duration X
  let concatContent = '';
  for (let i = 0; i < scenes.length; i++) {
    const duration = scenes[i].duration || 3; // seconds per scene
    concatContent += `file 'scene_${i}.png'\nduration ${duration}\n`;
  }
  concatContent += `file 'scene_${scenes.length - 1}.png'\n`; // last frame repeat
  await ff.writeFile('concat.txt', concatContent);

  // Step 3: Build audio concat list
  let hasAudio = scenes.some(s => s.audioDataUrl);
  let filterComplex = '';

  if (hasAudio) {
    let audioConcat = '';
    for (let i = 0; i < scenes.length; i++) {
      if (scenes[i].audioDataUrl) {
        audioConcat += `file 'scene_${i}.mp3'\n`;
      }
    }
    if (audioConcat) {
      await ff.writeFile('audio_concat.txt', audioConcat);
    }
  }

  // Step 4: Run FFmpeg command
  const outputFile = outputName || `output_${Date.now()}.mp4`;
  
  const args = [
    '-f', 'concat',
    '-safe', '0',
    '-i', 'concat.txt',
  ];

  if (hasAudio) {
    args.push('-f', 'concat', '-safe', '0', '-i', 'audio_concat.txt');
  }

  args.push(
    '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
  );

  if (hasAudio) {
    args.push('-c:a', 'aac', '-b:a', '128k', '-shortest');
  } else {
    args.push('-an');
  }

  args.push(outputFile);

  await ff.exec(args);
  console.log('Video composition complete:', outputFile);

  // Step 5: Read output back from virtual FS
  const outputData = await ff.readFile(outputFile);
  const outputPath = path.join(getOutputDir(), outputFile);
  fs.writeFileSync(outputPath, outputData);

  // Step 6: Cleanup virtual FS
  for (let i = 0; i < scenes.length; i++) {
    try {
      await ff.deleteFile(`scene_${i}.png`);
      await ff.deleteFile(`scene_${i}.mp3`);
    } catch (e) { /* ignore */ }
  }
  try {
    await ff.deleteFile('concat.txt');
    await ff.deleteFile('audio_concat.txt');
    await ff.deleteFile('bgm.mp3');
    await ff.deleteFile(outputFile);
  } catch (e) { /* ignore */ }

  return outputPath;
}

async function exportFrame(imageDataUrl, outputPath) {
  // Simple wrapper: save a single frame as image
  const buffer = dataUrlToBuffer(imageDataUrl);
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

function dataUrlToBuffer(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return Buffer.alloc(0);
  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return Buffer.from(dataUrl, 'base64');
  return Buffer.from(matches[2], 'base64');
}

function getAvailableOutputs() {
  const outputDir = getOutputDir();
  if (!fs.existsSync(outputDir)) return [];
  return fs.readdirSync(outputDir)
    .filter(f => f.endsWith('.mp4'))
    .map(f => ({
      name: f,
      path: path.join(outputDir, f),
      size: fs.statSync(path.join(outputDir, f)).size,
      createdAt: fs.statSync(path.join(outputDir, f)).birthtime,
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

module.exports = { composeVideo, exportFrame, getAvailableOutputs, ensureFFmpeg };
