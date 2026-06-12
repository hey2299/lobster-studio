// BGM Engine - AI-powered background music generation based on scene mood
// Uses free sound resources (Internet Archive, Freesound) as fallback
// Primary: generates pure tone / procedural audio via Web Audio API node
// The AudioContext work happens in renderer; here we provide mood-to-music metadata
// and pre-built procedural audio generation helpers

// Mood categories mapped to musical parameters
const MOOD_MUSIC_MAP = {
  '紧张':   { tempo: 140, key: 'Dm', genre: 'dramatic', instruments: ['strings', 'brass'], energy: 0.9 },
  '浪漫':   { tempo: 70,  key: 'Cmaj', genre: 'romantic', instruments: ['piano', 'strings'], energy: 0.3 },
  '幸福':   { tempo: 100, key: 'Fmaj', genre: 'happy', instruments: ['piano', 'flute'], energy: 0.7 },
  '焦虑':   { tempo: 120, key: 'Am', genre: 'suspense', instruments: ['strings', 'synth'], energy: 0.8 },
  '悲伤':   { tempo: 60,  key: 'Em', genre: 'sad', instruments: ['piano', 'cello'], energy: 0.2 },
  '神秘':   { tempo: 90,  key: 'Bdim', genre: 'mysterious', instruments: ['synth', 'bells'], energy: 0.5 },
  '激动':   { tempo: 150, key: 'Em', genre: 'epic', instruments: ['brass', 'drums'], energy: 1.0 },
  '平静':   { tempo: 65,  key: 'Cmaj', genre: 'calm', instruments: ['piano', 'ambient'], energy: 0.2 },
  '愤怒':   { tempo: 160, key: 'Fm', genre: 'aggressive', instruments: ['drums', 'guitar'], energy: 0.95 },
  '温馨':   { tempo: 80,  key: 'Gmaj', genre: 'warm', instruments: ['piano', 'acoustic'], energy: 0.4 },
  '恐怖':   { tempo: 50,  key: 'Ddim', genre: 'horror', instruments: ['synth', 'strings_pizz'], energy: 0.6 },
  '悬疑':   { tempo: 100, key: 'Am', genre: 'mysterious', instruments: ['synth', 'bass'], energy: 0.6 },
};

// Procedural tone generator parameters for Web Audio API
function getBGMParams(mood = '平静', sceneCount = 4) {
  const music = MOOD_MUSIC_MAP[mood] || MOOD_MUSIC_MAP['平静'];
  
  // Generate a sequence of notes based on mood scale
  let scale;
  if (music.key.includes('m') || music.key.includes('dim')) {
    // Minor scale (sad/dark)
    scale = [0, 2, 3, 5, 7, 8, 10, 12];
  } else {
    // Major scale (happy/bright)
    scale = [0, 2, 4, 5, 7, 9, 11, 12];
  }
  
  // Base frequency (A4 = 440Hz, tuned to the key)
  const keyMap = {
    'Dm': 293.66, 'Cmaj': 261.63, 'Fmaj': 349.23, 'Am': 220.00,
    'Em': 329.63, 'Bdim': 246.94, 'Fm': 174.61, 'Gmaj': 392.00,
    'Ddim': 293.66,
  };
  const baseFreq = keyMap[music.key] || 261.63;
  
  // Generate note sequence: 4 bars, 4 beats each, 3 notes per beat = 48 notes
  const notes = [];
  const beatsPerScene = 16; // 4 bars of 4/4
  const totalBeats = beatsPerScene * sceneCount;
  
  for (let beat = 0; beat < totalBeats; beat++) {
    const sceneIdx = Math.floor(beat / beatsPerScene);
    // Get a note from the scale with some variation
    const scaleIdx = (beat * 3 + sceneIdx * 2) % scale.length;
    const octave = Math.floor(beat / 16) % 2;
    const semitones = scale[scaleIdx] + octave * 12;
    const freq = baseFreq * Math.pow(2, semitones / 12);
    
    // Duration: quarter note mostly, some variations
    const isDownbeat = beat % 4 === 0;
    const duration = isDownbeat ? 0.5 : (Math.random() > 0.7 ? 0.25 : 0.125);
    const velocity = isDownbeat ? 0.8 : (0.4 + Math.random() * 0.3);
    
    notes.push({
      freq,
      startTime: beat * 0.5,
      duration,
      velocity: velocity * music.energy,
      sceneIndex: sceneIdx,
    });
    
    // Add harmony note (third or fifth) on downbeats
    if (isDownbeat) {
      const harmonyIdx = (scaleIdx + 2) % scale.length;
      const harmonyFreq = baseFreq * Math.pow(2, scale[harmonyIdx] / 12);
      notes.push({
        freq: harmonyFreq,
        startTime: beat * 0.5,
        duration: 0.5,
        velocity: 0.3 * music.energy,
        sceneIndex: sceneIdx,
        harmony: true,
      });
    }
  }
  
  return {
    params: music,
    baseFreq,
    notes,
    sampleRate: 44100,
    channels: 2,
    bpm: music.tempo,
    totalDuration: totalBeats * 0.5,
  };
}

// Generate raw PCM audio data from parameters (can be used in main process for WAV export)
function generateAudioBuffer(bgmParams) {
  // Generate a simple procedural audio mix
  // Returns Float32Array interleaved stereo
  const { sampleRate, channels, notes, totalDuration } = bgmParams;
  const totalSamples = Math.ceil(sampleRate * totalDuration);
  const buffer = new Float32Array(totalSamples * channels);
  
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const startSample = Math.floor(note.startTime * sampleRate);
    const durationSamples = Math.floor(note.duration * sampleRate);
    
    for (let s = 0; s < durationSamples; s++) {
      const sampleIdx = startSample + s;
      if (sampleIdx >= totalSamples) break;
      
      // Simple sine wave + harmonics for richer sound
      const t = s / sampleRate;
      const envelope = Math.exp(-t * 3 / note.duration); // natural decay
      const fundamental = Math.sin(2 * Math.PI * note.freq * t);
      const harmonic = Math.sin(2 * Math.PI * note.freq * 2 * t) * 0.3;
      const sub = Math.sin(2 * Math.PI * note.freq * 0.5 * t) * 0.15;
      
      const sample = (fundamental + harmonic + sub) * note.velocity * envelope;
      
      for (let ch = 0; ch < channels; ch++) {
        const bufIdx = sampleIdx * channels + ch;
        if (bufIdx < buffer.length) {
          buffer[bufIdx] = Math.max(-1, Math.min(1, sample));
        }
      }
    }
  }
  
  return buffer;
}

// Export buffer as WAV (can be written to file or converted to data URL)
function bufferToWavDataUrl(buffer, sampleRate = 44100, channels = 2) {
  const numSamples = buffer.length / channels;
  const dataLength = buffer.length * 2; // 16-bit samples
  const headerLength = 44;
  const totalLength = headerLength + dataLength;
  
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM
  view.setUint16(20, 1, true); // 1 = PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true); // byte rate
  view.setUint16(32, channels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);
  
  // Write 16-bit samples (interleaved)
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    const sample = Math.max(-1, Math.min(1, buffer[i]));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }
  
  // Convert to base64 data URL
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  
  return 'data:audio/wav;base64,' + base64;
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Generate full BGM for a script: mixes moods across scenes
function generateBGMForScript(scenes, moodOverrides = {}) {
  // If scenes have different moods, create a composite BGM
  // moodOverrides: { sceneIndex: 'moodName' }
  if (scenes.length === 1) {
    const mood = moodOverrides[0] || scenes[0].mood || '平静';
    const params = getBGMParams(mood, 1);
    const buffer = generateAudioBuffer(params);
    return bufferToWavDataUrl(buffer, params.sampleRate, params.channels);
  }
  
  // Multiple scenes: merge audio from each scene's mood
  const allNotes = [];
  let totalDuration = 0;
  
  for (let i = 0; i < scenes.length; i++) {
    const mood = moodOverrides[i] || scenes[i]?.mood || '平静';
    const params = getBGMParams(mood, 1);
    
    // Offset notes by scene position
    for (const note of params.notes) {
      allNotes.push({
        ...note,
        startTime: note.startTime + totalDuration,
      });
    }
    totalDuration += params.totalDuration;
  }
  
  const combinedParams = {
    params: scenes.length > 0 ? MOOD_MUSIC_MAP[scenes[0]?.mood || '平静'] : MOOD_MUSIC_MAP['平静'],
    baseFreq: 261.63,
    notes: allNotes,
    sampleRate: 44100,
    channels: 2,
    bpm: 100,
    totalDuration,
  };
  
  const buffer = generateAudioBuffer(combinedParams);
  return bufferToWavDataUrl(buffer, combinedParams.sampleRate, combinedParams.channels);
}

module.exports = {
  MOOD_MUSIC_MAP,
  getBGMParams,
  generateAudioBuffer,
  bufferToWavDataUrl,
  generateBGMForScript,
};
