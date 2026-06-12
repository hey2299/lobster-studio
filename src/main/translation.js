// Multi-Language Translation Engine v1
// Translates scripts, subtitles, and metadata for overseas publishing
// Uses existing AI engine providers (DeepSeek/OpenAI/SiliconFlow/GLM)
// No external translation API required

// Language definitions (we support translating FROM zh-CN)
const LANGUAGES = {
  en: {
    name: 'English', nativeName: 'English', flag: '🇬🇧',
    code: 'en', ttsVoice: 'en-US', direction: 'ltr',
    subtitleFormat: 'srt',
    googleLang: 'en', awsPollyVoice: 'Joanna',
  },
  ja: {
    name: 'Japanese', nativeName: '日本語', flag: '🇯🇵',
    code: 'ja', ttsVoice: 'ja-JP', direction: 'ltr',
    subtitleFormat: 'ass',
    googleLang: 'ja',
  },
  ko: {
    name: 'Korean', nativeName: '한국어', flag: '🇰🇷',
    code: 'ko', ttsVoice: 'ko-KR', direction: 'ltr',
    subtitleFormat: 'ass',
    googleLang: 'ko',
  },
  vi: {
    name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳',
    code: 'vi', ttsVoice: 'vi-VN', direction: 'ltr',
    subtitleFormat: 'srt',
    googleLang: 'vi',
  },
  th: {
    name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭',
    code: 'th', ttsVoice: 'th-TH', direction: 'ltr',
    subtitleFormat: 'srt',
    googleLang: 'th',
  },
  es: {
    name: 'Spanish', nativeName: 'Español', flag: '🇪🇸',
    code: 'es', ttsVoice: 'es-ES', direction: 'ltr',
    subtitleFormat: 'srt',
    googleLang: 'es', awsPollyVoice: 'Mia',
  },
  id: {
    name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩',
    code: 'id', ttsVoice: 'id-ID', direction: 'ltr',
    subtitleFormat: 'srt',
    googleLang: 'id',
  },
};

class TranslationEngine {
  constructor(aiProvider) {
    this.ai = aiProvider;
    this.stats = { totalChars: 0, totalTranslations: 0, cacheHits: 0 };
    this.cache = new Map(); // zhText + targetLang => translatedText
  }

  getAvailableLanguages() {
    return Object.entries(LANGUAGES).map(([code, info]) => ({
      code, ...info,
      supported: true,
    }));
  }

  getLanguageInfo(code) {
    return LANGUAGES[code] || null;
  }

  // Translate a batch of scenes (for script adaptation)
  async translateScript(scenes, targetLang, options = {}) {
    const lang = LANGUAGES[targetLang];
    if (!lang) throw new Error(`Unsupported target language: ${targetLang}`);

    const results = [];
    const batchSize = options.batchSize || 5;

    for (let i = 0; i < scenes.length; i += batchSize) {
      const batch = scenes.slice(i, i + batchSize);
      const translated = await this._translateBatch(batch, targetLang, options);
      results.push(...translated);
    }

    return results.map((scene, idx) => ({
      ...scenes[idx],
      ...scene,
      _translated: true,
      _targetLang: targetLang,
    }));
  }

  // Translate subtitle segments
  async translateSubtitles(subtitles, targetLang, options = {}) {
    // subtitles: [{index, start, end, text}, ...]
    const lang = LANGUAGES[targetLang];
    if (!lang) throw new Error(`Unsupported target language: ${targetLang}`);

    const results = [];
    const batchSize = options.batchSize || 10;
    const bilingual = options.bilingual !== false;

    for (let i = 0; i < subtitles.length; i += batchSize) {
      const batch = subtitles.slice(i, i + batchSize);
      const translated = await this._translateBatch(
        batch.map(s => ({ dialogue: s.text })),
        targetLang,
        options
      );
      batch.forEach((sub, j) => {
        const t = translated[j];
        results.push({
          ...sub,
          originalText: sub.text,
          translatedText: t?.dialogue || sub.text,
          text: bilingual ? `${sub.text}\n${t?.dialogue || sub.text}` : (t?.dialogue || sub.text),
          language: targetLang,
          bilingual,
        });
      });
    }

    return results;
  }

  // Translate text in batch
  async translateText(text, targetLang, sourceLang = 'zh-CN') {
    const cacheKey = `${text}|${targetLang}`;
    if (this.cache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.cache.get(cacheKey);
    }

    const prompt = this._buildTranslationPrompt(text, targetLang, sourceLang);
    const translated = await this._callAI(prompt);

    this.cache.set(cacheKey, translated);
    this.stats.totalTranslations++;
    this.stats.totalChars += text.length;

    return translated;
  }

  // Batch translate text array
  async translateBatch(texts, targetLang, sourceLang = 'zh-CN') {
    const results = [];
    const batchSize = 5;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(text => this.translateText(text, targetLang, sourceLang))
      );
      results.push(...batchResults);
    }

    return results;
  }

  // Generate bilingual subtitles (zh + target side-by-side)
  generateBilingualSubtitles(zhSubtitles, translatedSubtitles) {
    return zhSubtitles.map((zh, idx) => {
      const t = translatedSubtitles[idx] || {};
      return {
        index: zh.index,
        start: zh.start,
        end: zh.end,
        text: `${zh.text}\n${t.translatedText || zh.text}`,
        original: zh.text,
        translated: t.translatedText || zh.text,
        bilingual: true,
      };
    });
  }

  // Generate ASS subtitle with bilingual styling
  generateBilingualASS(zhSubtitles, translatedSubtitles, lang = 'en') {
    const Info = `[Script Info]
Title: Bilingual Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: DefaultCN,Microsoft YaHei,36,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,1,2,10,10,30,1
Style: DefaultEN,Arial,30,&H00CCFFCC,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,1,2,10,10,30,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

    const langInfo = LANGUAGES[lang] || LANGUAGES.en;
    const subStyle = lang === 'ko' || lang === 'ja' ? 'DefaultCN' : 'DefaultEN';

    let events = '\n';
    zhSubtitles.forEach((zh, idx) => {
      const t = translatedSubtitles[idx] || {};
      const start = this._formatASSTime(zh.start);
      const end = this._formatASSTime(zh.end);
      const zhText = zh.text;
      const enText = t.translatedText || zh.text;

      events += `Dialogue: 0,${start},${end},DefaultCN,,0,0,0,,${zhText}\n`;
      events += `Dialogue: 1,${start},${end},${subStyle},,0,0,0,,${enText}\n`;
    });

    return Info + events;
  }

  // Generate SRT for translated content
  generateSRT(subtitles) {
    let srt = '';
    subtitles.forEach((sub) => {
      srt += `${sub.index}\n`;
      srt += `${this._formatSRTTime(sub.start)} --> ${this._formatSRTTime(sub.end)}\n`;
      srt += `${sub.text}\n\n`;
    });
    return srt;
  }

  // === Private ===

  _buildTranslationPrompt(text, targetLang, sourceLang) {
    const lang = LANGUAGES[targetLang];
    const langName = lang ? lang.nativeName : targetLang;

    // If it's a batch of dialogues
    if (Array.isArray(text)) {
      return JSON.stringify({
        system: `You are a professional short drama subtitle translator. Translate from ${sourceLang} to ${langName} (${targetLang}).`,
        rules: [
          'Keep character names untranslated (e.g., 王总 → Wang or 王总)',
          'Maintain emotional tone (angry/loving/sad) in translation',
          'Keep line breaks and formatting',
          'Do not add or remove content - translate exactly',
          'For puns/idioms, use equivalent expressions in target language',
          'Output as valid JSON array of translated strings only',
        ],
        input: text.map(s => s.dialogue || s.text || s),
      });
    }

    // Single text
    return JSON.stringify({
      system: `Translate from ${sourceLang} to ${langName}.`,
      input: typeof text === 'string' ? text : JSON.stringify(text),
    });
  }

  async _translateBatch(batch, targetLang, options = {}) {
    const prompt = this._buildTranslationPrompt(batch, targetLang, 'zh-CN');

    try {
      const result = await this._callAIStructure(prompt, batch.length);
      // result should be an array of translated texts
      return batch.map((item, idx) => ({
        dialogue: result[idx] || item.dialogue || item.text || '',
      }));
    } catch (e) {
      // Fallback: return original
      return batch.map(item => ({
        dialogue: item.dialogue || item.text || '',
      }));
    }
  }

  async _callAI(prompt) {
    if (!this.ai) return prompt;

    if (typeof this.ai === 'function') {
      return await this.ai(prompt);
    }

    if (this.ai.chat) {
      const response = await this.ai.chat({
        model: 'deepseek-chat', // or use default
        messages: [
          { role: 'system', content: 'You are a professional translator. Translate text accurately while keeping character names. Output only the translated text, no explanation.' },
          { role: 'user', content: prompt },
        ],
      });
      return response.choices?.[0]?.message?.content || prompt;
    }

    return prompt;
  }

  async _callAIStructure(prompt, expectedCount) {
    if (!this.ai) return [];

    try {
      const response = await this.ai.chat({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: `You are a translator. Translate ${expectedCount} lines from Chinese to the target language. Output ONLY a JSON array of strings. Example: ["line1","line2"]` },
          { role: 'user', content: typeof prompt === 'string' ? prompt : JSON.stringify(prompt) },
        ],
      });

      const text = response.choices?.[0]?.message?.content || '[]';
      // Try to parse JSON
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    // Fallback
    return Array(expectedCount).fill('');
  }

  _formatSRTTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const ms = Math.floor((s - Math.floor(s)) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(Math.floor(s)).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  _formatASSTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s.toFixed(2)).padStart(5, '0')}`;
  }

  getStats() {
    return { ...this.stats };
  }
}

module.exports = {
  TranslationEngine,
  LANGUAGES,
};
