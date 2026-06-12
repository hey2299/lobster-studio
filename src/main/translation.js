// Multi-Language Translation Engine v1
// Translates scripts, subtitles, and metadata for overseas publishing
// Uses existing AI engine providers (DeepSeek/OpenAI/SiliconFlow/GLM)
// No external translation API required

// Language definitions — 50 major world languages sorted by speaker population
// All supported as translation targets (translate FROM zh-CN)
const LANGUAGES = {
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧', code: 'en', ttsVoice: 'en-US', direction: 'ltr', subtitleFormat: 'srt', awsPollyVoice: 'Joanna', googleLang: 'en' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳', code: 'zh', ttsVoice: 'zh-CN', direction: 'ltr', subtitleFormat: 'ass', googleLang: 'zh' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', code: 'hi', ttsVoice: 'hi-IN', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'hi' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', code: 'es', ttsVoice: 'es-ES', direction: 'ltr', subtitleFormat: 'srt', awsPollyVoice: 'Mia', googleLang: 'es' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷', code: 'fr', ttsVoice: 'fr-FR', direction: 'ltr', subtitleFormat: 'srt', awsPollyVoice: 'Lea', googleLang: 'fr' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', code: 'ar', ttsVoice: 'ar-SA', direction: 'rtl', subtitleFormat: 'srt', googleLang: 'ar' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', code: 'bn', ttsVoice: 'bn-BD', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'bn' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', code: 'ru', ttsVoice: 'ru-RU', direction: 'ltr', subtitleFormat: 'srt', awsPollyVoice: 'Tatyana', googleLang: 'ru' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', code: 'pt', ttsVoice: 'pt-PT', direction: 'ltr', subtitleFormat: 'srt', awsPollyVoice: 'Camila', googleLang: 'pt' },
  ur: { name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', code: 'ur', ttsVoice: 'ur-PK', direction: 'rtl', subtitleFormat: 'srt', googleLang: 'ur' },
  id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', code: 'id', ttsVoice: 'id-ID', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'id' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', code: 'de', ttsVoice: 'de-DE', direction: 'ltr', subtitleFormat: 'srt', awsPollyVoice: 'Marlene', googleLang: 'de' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', code: 'ja', ttsVoice: 'ja-JP', direction: 'ltr', subtitleFormat: 'ass', googleLang: 'ja' },
  sw: { name: 'Swahili', nativeName: 'Kiswahili', flag: '🇹🇿', code: 'sw', ttsVoice: 'sw-TZ', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'sw' },
  mr: { name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', code: 'mr', ttsVoice: 'mr-IN', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'mr' },
  te: { name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', code: 'te', ttsVoice: 'te-IN', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'te' },
  tr: { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', code: 'tr', ttsVoice: 'tr-TR', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'tr' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', code: 'ta', ttsVoice: 'ta-IN', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'ta' },
  vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', code: 'vi', ttsVoice: 'vi-VN', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'vi' },
  ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷', code: 'ko', ttsVoice: 'ko-KR', direction: 'ltr', subtitleFormat: 'ass', googleLang: 'ko' },
  it: { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', code: 'it', ttsVoice: 'it-IT', direction: 'ltr', subtitleFormat: 'srt', awsPollyVoice: 'Carla', googleLang: 'it' },
  th: { name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', code: 'th', ttsVoice: 'th-TH', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'th' },
  gu: { name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', code: 'gu', ttsVoice: 'gu-IN', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'gu' },
  pl: { name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', code: 'pl', ttsVoice: 'pl-PL', direction: 'ltr', subtitleFormat: 'srt', awsPollyVoice: 'Ewa', googleLang: 'pl' },
  uk: { name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦', code: 'uk', ttsVoice: 'uk-UA', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'uk' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', code: 'ml', ttsVoice: 'ml-IN', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'ml' },
  kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', code: 'kn', ttsVoice: 'kn-IN', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'kn' },
  or: { name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳', code: 'or', ttsVoice: 'or-IN', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'or' },
  my: { name: 'Burmese', nativeName: 'မြန်မာဘာသာ', flag: '🇲🇲', code: 'my', ttsVoice: 'my-MM', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'my' },
  km: { name: 'Khmer', nativeName: 'ភាសាខ្មែរ', flag: '🇰🇭', code: 'km', ttsVoice: 'km-KH', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'km' },
  tl: { name: 'Filipino', nativeName: 'Tagalog', flag: '🇵🇭', code: 'tl', ttsVoice: 'tl-PH', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'tl' },
  ne: { name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵', code: 'ne', ttsVoice: 'ne-NP', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'ne' },
  ro: { name: 'Romanian', nativeName: 'Română', flag: '🇷🇴', code: 'ro', ttsVoice: 'ro-RO', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'ro' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', code: 'nl', ttsVoice: 'nl-NL', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'nl' },
  el: { name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', code: 'el', ttsVoice: 'el-GR', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'el' },
  hu: { name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺', code: 'hu', ttsVoice: 'hu-HU', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'hu' },
  cs: { name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿', code: 'cs', ttsVoice: 'cs-CZ', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'cs' },
  sv: { name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', code: 'sv', ttsVoice: 'sv-SE', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'sv' },
  da: { name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', code: 'da', ttsVoice: 'da-DK', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'da' },
  fi: { name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', code: 'fi', ttsVoice: 'fi-FI', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'fi' },
  he: { name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', code: 'he', ttsVoice: 'he-IL', direction: 'rtl', subtitleFormat: 'srt', googleLang: 'he' },
  fa: { name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', code: 'fa', ttsVoice: 'fa-IR', direction: 'rtl', subtitleFormat: 'srt', googleLang: 'fa' },
  ms: { name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾', code: 'ms', ttsVoice: 'ms-MY', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'ms' },
  si: { name: 'Sinhala', nativeName: 'සිංහල', flag: '🇱🇰', code: 'si', ttsVoice: 'si-LK', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'si' },
  am: { name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹', code: 'am', ttsVoice: 'am-ET', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'am' },
  ka: { name: 'Georgian', nativeName: 'ქართული', flag: '🇬🇪', code: 'ka', ttsVoice: 'ka-GE', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'ka' },
  hy: { name: 'Armenian', nativeName: 'Հայերեն', flag: '🇦🇲', code: 'hy', ttsVoice: 'hy-AM', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'hy' },
  mn: { name: 'Mongolian', nativeName: 'Монгол', flag: '🇲🇳', code: 'mn', ttsVoice: 'mn-MN', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'mn' },
  lo: { name: 'Lao', nativeName: 'ລາວ', flag: '🇱🇦', code: 'lo', ttsVoice: 'lo-LA', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'lo' },
  bo: { name: 'Tibetan', nativeName: 'བོད་སྐད།', flag: '🇨🇳', code: 'bo', ttsVoice: 'bo-CN', direction: 'ltr', subtitleFormat: 'srt', googleLang: 'bo' },
};

class TranslationEngine {
  constructor(aiProvider) {
    this.ai = aiProvider;
    this.stats = { totalChars: 0, totalTranslations: 0, cacheHits: 0 };
    this.cache = new Map(); // zhText + targetLang => translatedText
  }

  _getRegionForCode(code) {
    const regionDefs = {
      global: ['en'],
      china: ['zh','bo'],
      southAsia: ['hi','bn','mr','te','ta','gu','ml','kn','or','ne','si'],
      spanish: ['es'],
      french: ['fr'],
      middleEast: ['ar','ur','he','fa'],
      slavic: ['ru','uk'],
      romance: ['pt','it','ro'],
      germanic: ['de','nl'],
      nordic: ['sv','da'],
      eastAsia: ['ja','ko'],
      seAsia: ['id','vi','th','my','km','tl','ms','lo'],
      westSlavic: ['pl','cs'],
      finnoUgric: ['hu','fi'],
      balkan: ['el','tr'],
      africa: ['sw','am'],
      centralAsia: ['ka','hy','mn'],
    };
    for (const [region, codes] of Object.entries(regionDefs)) {
      if (codes.includes(code)) return region;
    }
    return 'other';
  }

  getAvailableLanguages() {
    return Object.entries(LANGUAGES).map(([code, info]) => ({
      code, ...info,
      region: this._getRegionForCode(code),
      supported: true,
    }));
  }

  getLanguageInfo(code) {
    const info = LANGUAGES[code];
    if (!info) return null;
    return { ...info, region: this._getRegionForCode(code) };
  }

  // Group languages by region
  groupByRegion() {
    const regionDefs = {
      global: { name: '全球通用', codes: ['en'] },
      china: { name: '中国', codes: ['zh','bo'] },
      southAsia: { name: '南亚', codes: ['hi','bn','mr','te','ta','gu','ml','kn','or','ne','si'] },
      spanish: { name: '西班牙语区', codes: ['es'] },
      french: { name: '法语区', codes: ['fr'] },
      middleEast: { name: '中东/阿拉伯', codes: ['ar','ur','he','fa'] },
      slavic: { name: '斯拉夫语系', codes: ['ru','uk'] },
      romance: { name: '罗曼语系', codes: ['pt','it','ro'] },
      germanic: { name: '日耳曼语系', codes: ['de','nl'] },
      nordic: { name: '北欧', codes: ['sv','da'] },
      eastAsia: { name: '东亚', codes: ['ja','ko'] },
      seAsia: { name: '东南亚', codes: ['id','vi','th','my','km','tl','ms','lo'] },
      westSlavic: { name: '西斯拉夫', codes: ['pl','cs'] },
      finnoUgric: { name: '芬兰-乌戈尔', codes: ['hu','fi'] },
      balkan: { name: '巴尔干', codes: ['el','tr'] },
      africa: { name: '非洲', codes: ['sw','am'] },
      centralAsia: { name: '中亚/高加索', codes: ['ka','hy','mn'] },
    };

    const result = {};
    for (const [key, def] of Object.entries(regionDefs)) {
      const codes = def.codes.filter(c => LANGUAGES[c]);
      if (codes.length > 0) {
        result[key] = {
          name: def.name,
          languages: codes.map(c => LANGUAGES[c]),
        };
      }
    }
    return result;
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
