// AI Engine - LLM calls for script generation, character portraits, storyboarding
const OpenAI = require('openai');

let client = null;
let currentModel = 'deepseek-chat';

// Memory injection - populated at init time
let memoryModule = null;
function injectMemory(memModule) {
  memoryModule = memModule;
}

function getMemoryContext() {
  if (!memoryModule) return '';
  try {
    const stats = memoryModule.getMemoryStats();
    if (!stats || stats.characters === 0) return '';

    // Get a sample of recent characters as memory context
    const sampleChars = [];
    // Read all character memories for injection
    const allMemories = memoryModule.getAllCharacterMemories();
    if (allMemories && allMemories.length > 0) {
      const shown = new Set();
      for (const char of allMemories) {
        if (shown.size >= 5) break;
        if (!shown.has(char.name)) {
          shown.add(char.name);
          sampleChars.push(char);
        }
      }
    }

    if (sampleChars.length === 0) return '';

    const charDesc = sampleChars.map(c =>
      `- ${c.name}（${c.role}）性格：${c.personality || '未知'}，声音：${c.voiceType || '默认'}，${c.appearance ? '外形：' + c.appearance : ''}`
    ).join('\n');

    return `\n\n【角色记忆库 - 已有角色，如果合适请复用】\n${charDesc}\n\n`;
  } catch (e) {
    console.warn('Memory injection failed:', e.message);
    return '';
  }
}

function getClient(apiKey, baseUrl) {
  if (client && baseUrl === undefined) return client;
  return new OpenAI({
    apiKey: apiKey || 'sk-placeholder',
    baseURL: baseUrl || 'https://api.deepseek.com',
    dangerouslyAllowBrowser: false,
  });
}

function configureAI(provider, apiKey, model) {
  currentModel = model || 'deepseek-chat';
  const baseUrls = {
    deepseek: 'https://api.deepseek.com',
    openai: 'https://api.openai.com/v1',
    siliconflow: 'https://api.siliconflow.cn/v1',
    glm: 'https://open.bigmodel.cn/api/paas/v4',
  };
  client = getClient(apiKey, baseUrls[provider] || baseUrls.deepseek);
}

async function generateScript(params) {
  const { genre, style, duration, keyword, characterCount = 3 } = params;
  const sceneCount = Math.max(5, Math.min(20, Math.floor(duration / 8)));

  const prompt = [
    'You are a top short drama scriptwriter. Create a ' + genre + ' themed short drama script.',
    'Style: ' + style,
    'Duration: ~' + duration + ' seconds (' + sceneCount + ' scenes)',
    'Keywords: ' + (keyword || 'none'),
    getMemoryContext(),
    'Requirements:',
    '- Tight pacing, hook in first 3 seconds',
    '- Each scene: location, mood, camera angle',
    '- Dialogue: natural, with conflict',
    '- Last scene: twist or cliffhanger',
    '- If memory characters are provided, REUSE them for consistency',
    '- Keep character personality consistent with memory',
    '',
    'Output ONLY valid JSON (no other text):',
    JSON.stringify({
      title: 'Drama Title',
      scenes: [
        {
          location: 'Scene location',
          description: 'Visual description',
          mood: 'Atmosphere (e.g. tense/warm/mysterious)',
          cameraAngle: 'Camera angle (e.g. medium shot/close-up/overhead)',
          imagePrompt: 'English prompt for AI image generation',
          dialogue: [
            { characterName: 'Character name', line: 'Dialogue line', emotion: 'Emotion' }
          ]
        }
      ]
    }, null, 2)
  ].join('\n');

  const completion = await client.chat.completions.create({
    model: currentModel,
    messages: [
      { role: 'system', content: 'You are a professional short drama scriptwriter. Output pure JSON.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,
    max_tokens: 4096,
  });

  const text = completion.choices[0].message.content;
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    const script = JSON.parse(jsonStr);
    script.scenes = script.scenes.map((scene, i) => ({
      ...scene,
      id: 'scene_' + Date.now() + '_' + i,
      index: i,
      dialogue: (scene.dialogue || []).map((d, j) => ({
        characterId: 'char_' + j,
        ...d,
      })),
      imageUrl: '',
      videoUrl: '',
    }));
    return script;
  } catch (e) {
    console.error('JSON parse failed:', e.message);
    return {
      title: keyword || 'Untitled',
      scenes: [{ id: 'scene_' + Date.now() + '_0', index: 0, location: 'Unknown',
        description: text.slice(0, 500), mood: 'Unknown', cameraAngle: 'Medium shot',
        imagePrompt: text.slice(0, 200), dialogue: [] }],
    };
  }
}

async function generateCharacterPrompt(char) {
  const prompt = [
    'Create a detailed character portrait prompt based on:',
    'Name: ' + char.name,
    'Role: ' + char.role,
    'Personality: ' + char.personality,
    '',
    'Generate a photorealistic portrait prompt in English for text-to-image AI.',
    'Include: age, facial features, hairstyle, clothing, expression, lighting, background.',
    'Make it suitable for a Chinese short drama character.',
    'Output ONLY the prompt text, no other words.',
  ].join('\n');

  const completion = await client.chat.completions.create({
    model: currentModel,
    messages: [
      { role: 'system', content: 'You are a character designer for Chinese short dramas. Output only the image prompt.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  return completion.choices[0].message.content;
}

async function expandStoryboard(scenes) {
  const scenesJson = JSON.stringify(scenes.map(s => ({
    location: s.location,
    description: s.description,
    mood: s.mood,
    cameraAngle: s.cameraAngle,
    characters: s.dialogue ? s.dialogue.map(d => d.characterName) : [],
  })));

  const prompt = [
    'You are a storyboard artist. Given these scenes, generate detailed AI image prompts.',
    'Each prompt MUST be in English, photorealistic, cinematic, 16:9 aspect ratio.',
    '',
    'Scenes: ' + scenesJson,
    '',
    'Output JSON array:',
    '[{ "sceneIndex": 0, "imagePrompt": "detailed prompt..." }]',
    'Just JSON, no other text.',
  ].join('\n');

  const completion = await client.chat.completions.create({
    model: currentModel,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const text = completion.choices[0].message.content;
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    return scenes.map((s, i) => ({ sceneIndex: i, imagePrompt: s.imagePrompt }));
  }
}

async function generateImage(scene) {
  // Returns base64 image data via the configured image API
  // Falls back to a lightweight free API if no config set
  const prompt = scene.imagePrompt || (scene.description + ', cinematic, 16:9, photorealistic');

  // Try configured image API first
  const imageApiKey = null; // Will be passed from settings in real usage
  const imageProvider = 'siliconflow';

  const baseUrls = {
    siliconflow: 'https://api.siliconflow.cn/v1',
    openai: 'https://api.openai.com/v1',
  };

  const baseUrl = baseUrls[imageProvider] || baseUrls.siliconflow;

  if (imageApiKey) {
    try {
      const fetch = (await import('node-fetch')).default;
      const resp = await fetch(baseUrl + '/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + imageApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: imageProvider === 'openai' ? 'dall-e-3' : 'black-forest-labs/FLUX.1-schnell',
          prompt: prompt,
          n: 1,
          size: '1024x576',
          response_format: 'b64_json',
        }),
      });
      const json = await resp.json();
      if (json.data && json.data[0] && json.data[0].b64_json) {
        return 'data:image/png;base64,' + json.data[0].b64_json;
      }
      // Also support url format
      if (json.data && json.data[0] && json.data[0].url) {
        return json.data[0].url;
      }
      console.warn('Image generation returned unexpected format:', json);
      return '';
    } catch (e) {
      console.warn('Image generation failed:', e.message);
      return '';
    }
  }

  // No API key configured - return empty (UI will show placeholder)
  return '';
}

async function generateAllSceneImages(scenes) {
  const results = [];
  for (let i = 0; i < scenes.length; i++) {
    const imageUrl = await generateImage(scenes[i]);
    results.push({ sceneIndex: i, imageUrl });
  }
  return results;
}

async function generateTTS(text, voiceType) {
  // Generate speech audio from text
  const ttsApiKey = null; // Will be configured via settings

  if (ttsApiKey) {
    try {
      const fetch = (await import('node-fetch')).default;
      const resp = await fetch('https://api.siliconflow.cn/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + ttsApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'fish-speech-1.5',
          input: text,
          voice: voiceType || 'default',
          response_format: 'mp3',
        }),
      });
      const buffer = await resp.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return 'data:audio/mp3;base64,' + base64;
    } catch (e) {
      console.warn('TTS generation failed:', e.message);
      return '';
    }
  }
  return '';
}

module.exports = { configureAI, generateScript, generateCharacterPrompt, expandStoryboard, generateImage, generateAllSceneImages, generateTTS, getClient, injectMemory };
