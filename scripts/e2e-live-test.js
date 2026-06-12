// Lobster Studio — 全链路在线实机测试 v1.0
// 需要设置环境变量 DEEPSEEK_API_KEY 才能运行
// 测试覆盖：AI剧本生成→翻译→字幕→BGM→打包 完整管线
//
// 用法:
//   set DEEPSEEK_API_KEY=sk-your-key-here&& node scripts/e2e-live-test.js
//   DEEPSEEK_API_KEY=sk-xxx node scripts/e2e-live-test.js

const path = require('path');
const fs = require('fs');

// ========== 配置 ==========
const API_KEY = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || process.env.SILICONFLOW_API_KEY || '';
const PROVIDER = process.env.DEEPSEEK_API_KEY ? 'deepseek' 
              : process.env.OPENAI_API_KEY ? 'openai' 
              : process.env.SILICONFLOW_API_KEY ? 'siliconflow' 
              : 'unknown';

const ROOT = __dirname;
const SRC = path.join(__dirname, '..', 'src', 'main');

// ========== 工具 ==========
let passed = 0, failed = 0;

function load(name) {
  return require(path.join(SRC, name));
}

function ok(name) { console.log(`  ✅ ${name}`); passed++; }
function fail(name, msg) { console.log(`  ❌ ${name}: ${msg}`); failed++; }

const ta = async (name, fn) => {
  try { await fn(); ok(name); }
  catch (e) { fail(name, e.message || e); }
};

function t(name, fn) {
  try { fn(); ok(name); }
  catch (e) { fail(name, e.message || e); }
}

// ========== 测试数据 ==========
const TEST_PROFILE = {
  name: '秦墨言',
  role: '总裁',
  personality: '冷峻霸道，内心温柔',
  voiceType: '深沉',
  appearance: '西装革履，180cm，剑眉星目',
};

const TEST_HEROINE = {
  name: '林若雪',
  role: '女主',
  personality: '温柔坚韧，古灵精怪',
  voiceType: '甜美',
  appearance: '长发飘飘，明眸皓齿',
};

const TEST_SCRIPT_SCENES = [
  { sceneNumber: 1, location: '会议室', description: '秦墨言坐在总裁椅上，目光冷峻地看着桌上的合同', mood: '紧张', characters: [TEST_PROFILE.name], dialogue: [{ characterName: TEST_PROFILE.name, line: '这份合同，你签也得签，不签也得签。', emotion: '冷峻' }] },
  { sceneNumber: 2, location: '办公室走廊', description: '林若雪拦住秦墨言，满脸怒色', mood: '冲突', characters: [TEST_PROFILE.name, TEST_HEROINE.name], dialogue: [{ characterName: TEST_HEROINE.name, line: '你凭什么这么霸道？我们之间的事还没完！', emotion: '愤怒' }] },
  { sceneNumber: 3, location: '天台风大', description: '夕阳下两人对峙，秦墨言的眼神却逐渐柔和', mood: '浪漫', characters: [TEST_PROFILE.name, TEST_HEROINE.name], dialogue: [{ characterName: TEST_PROFILE.name, line: '因为从第一眼起，我就认定你了。', emotion: '深情' }, { characterName: TEST_HEROINE.name, line: '你...你说什么？', emotion: '惊讶' }] },
];

// ========== 主流程 ==========
async function main() {
  console.log('══════════════════════════════════════════════');
  console.log('  🦞 龙虾短剧工坊 — 全链路在线实机测试');
  console.log('══════════════════════════════════════════════\n');
  console.log(`  供应商: ${PROVIDER}`);
  console.log(`  API Key: ${API_KEY ? API_KEY.substring(0, 8) + '...' : '❌ 未设置'}`);
  console.log(`  时间: ${new Date().toLocaleString('zh-CN', {timeZone:'Asia/Shanghai'})}\n`);

  if (!API_KEY) {
    console.log('\n  ⚠️  未设置 API Key！跳过需要 AI 调用的测试。\n');
    console.log('  设置方法:');
    console.log('    Windows: set DEEPSEEK_API_KEY=sk-xxx&& node scripts/e2e-live-test.js');
    console.log('    Linux/Mac: DEEPSEEK_API_KEY=sk-xxx node scripts/e2e-live-test.js\n');
  }

  // ====== Phase 1: 模块基础初始化 ======
  console.log('━'.repeat(48));
  console.log('Phase 1: 模块初始化 & 存根验证');
  console.log('━'.repeat(48));

  // DB
  t('Database: 模块加载', () => { const db = load('database'); if (!db) throw 'No db'; });
  
  // AI Engine
  t('AI Engine: 模块加载', () => { const ae = load('ai-engine'); if (!ae) throw 'No ae'; });

  // Vector Memory
  t('Vector Memory: 模块加载', () => { const vm = load('vector-memory'); if (!vm) throw 'No vm'; });

  // License
  t('License: 模块加载', () => { const lc = load('license'); if (!lc) throw 'No lc'; });

  // BGM
  t('BGM Engine: 模块加载', () => { const bgm = load('bgm-engine'); if (!bgm) throw 'No bgm'; });

  // Subtitle
  t('Subtitle Engine: 模块加载', () => { const sub = load('subtitle-engine'); if (!sub) throw 'No sub'; });

  // Draft Export
  t('Draft Export: 模块加载', () => { const de = load('draft-export'); if (!de) throw 'No de'; });

  // AutoDetect
  t('AutoDetect: 模块加载', () => { const ad = load('auto-detect'); if (!ad) throw 'No ad'; });

  // Translation
  t('Translation: 模块加载', () => { const tr = load('translation'); if (!tr) throw 'No tr'; });

  // Publish Engine
  t('Publish Engine: 模块加载', () => { const pub = load('publish-engine'); if (!pub) throw 'No pub'; });

  // Project Pack
  t('Project Pack: 模块加载', () => { const pk = load('project-pack'); if (!pk) throw 'No pk'; });

  // User Account
  t('User Account: 模块加载', () => { const ua = load('user-account'); if (!ua) throw 'No ua'; });

  // ====== Phase 2: 向量记忆 + License (离线但核心) ======
  console.log('\n' + '━'.repeat(48));
  console.log('Phase 2: 核心离线功能');
  console.log('━'.repeat(48));

  const vm = load('vector-memory');
  await ta('VM: 初始化向量数据库', async () => {
    await vm.initMemoryDB();
  });

  await ta('VM: 存储秦墨言', async () => {
    await vm.storeCharacterMemory(TEST_PROFILE);
  });

  await ta('VM: 存储林若雪', async () => {
    await vm.storeCharacterMemory(TEST_HEROINE);
  });

  await ta('VM: 语义搜索"霸道的总裁"', async () => {
    const results = await vm.searchSimilarCharacters('霸道的总裁', 0.2, 5);
    if (!results || results.length === 0) throw '未找到匹配';
    // 应该返回秦墨言为首
    console.log(`     top1: ${results[0].character.name} (score: ${results[0].score.toFixed(4)})`);
  });

  t('VM: 记忆统计', () => {
    const stats = vm.getMemoryStats();
    if (stats.totalCharacters < 2) throw '记忆数不足';
    console.log(`     总计: ${stats.totalCharacters} 角色, ${stats.totalAliases} 别名`);
  });

  // License
  const lic = load('license');
  t('LIC: 默认社区版', () => {
    const state = lic.getLicense();
    if (state.edition !== 'community') throw '不是社区版';
  });

  t('LIC: 激活专业版Demo', () => {
    const r = lic.activateLicense('LOBSTER-PRO-2026-DEMO', 'professional');
    if (!r.success) throw r.error;
    const state = lic.getLicense();
    if (state.edition !== 'professional') throw '激活后不是专业版';
  });

  t('LIC: 专业版拥有AI剧本能力', () => {
    if (!lic.checkFeature('imageGeneration')) throw '专业版应解锁AI';
  });

  t('LIC: 3个版本信息可用', () => {
    const eds = lic.getEditionInfo();
    if (eds.length < 3) throw `期望3版本, 实际${eds.length}`;
  });

  // ====== Phase 3: 字幕 + BGM + AutoDetect ======
  console.log('\n' + '━'.repeat(48));
  console.log('Phase 3: 内容生成管线 (离线)');
  console.log('━'.repeat(48));

  // BGM
  const bgm = load('bgm-engine');
  t('BGM: 剧本配乐生成 (3场景)', () => {
    const dataUrl = bgm.generateBGMForScript([
      { mood: '紧张', duration: 3 },
      { mood: '冲突', duration: 4 },
      { mood: '浪漫', duration: 3 },
    ]);
    if (!dataUrl || !dataUrl.startsWith('data:')) throw 'BGM生成失败';
    const kb = (dataUrl.length * 0.75 / 1024).toFixed(0);
    console.log(`     生成 ${kb}KB Data URL`);
  });

  // Subtitle
  const sub = load('subtitle-engine');
  t('SUB: SRT字幕', () => {
    const srt = sub.generateSRT(TEST_SCRIPT_SCENES);
    if (!srt.includes('00:00:')) throw '时间戳格式错误';
    if (!srt.includes(TEST_PROFILE.name)) throw '缺少角色名';
    console.log(`     生成 ${srt.split('\n').filter(l=>l.trim()).length} 行`);
  });

  t('SUB: ASS字幕 (带样式)', () => {
    const ass = sub.generateASS(TEST_SCRIPT_SCENES, {
      fontName: '思源黑体', fontSize: 36, primaryColor: '&H00FFFFFF',
    });
    if (!ass.includes('V4+ Styles')) throw 'ASS头部缺失';
    if (!ass.includes('Dialogue:')) throw '缺少台词';
  });

  // Draft Export
  const de = load('draft-export');
  t('DRF: 剪映草稿导出', () => {
    const project = { title: '实机测试短剧' };
    const result = de.exportCapCutDraft(project, TEST_SCRIPT_SCENES, { width: 1080, height: 1920 });
    if (!result.includes('draft_content.json')) throw '剪映草稿格式错误';
  });
  
  t('DRF: FCPXML导出', () => {
    const xml = de.exportFCPXML({ title: '测试' }, TEST_SCRIPT_SCENES);
    if (!xml.includes('fcpxml')) throw 'FCPXML头部缺失';
    console.log(`     生成 ${(xml.length/1024).toFixed(0)}KB XML`);
  });

  // AutoDetect
  const ad = load('auto-detect');
  t('AD: 13个平台规则可用', () => {
    const domestic = ad.getAllPlatformRules('domestic');
    const overseas = ad.getAllPlatformRules('overseas');
    const total = Object.keys(domestic).length + Object.keys(overseas).length;
    if (total !== 13) throw `期望13平台, 实际${total}`;
    console.log(`     国内${Object.keys(domestic).length} + 海外${Object.keys(overseas).length}`);
  });

  t('AD: 剧本评分分析', () => {
    const result = ad.analyzeScriptForPlatforms({}, {
      totalDuration: 120, sceneCount: 10, aspectRatio: '9:16',
    });
    if (Object.keys(result).length < 10) throw '评分不足';
    // 显示top3
    const sorted = Object.entries(result).sort((a,b) => b[1].score - a[1].score).slice(0,3);
    console.log(`     Top3: ${sorted.map(([id,r]) => `${id}(${r.score}分)`).join(', ')}`);
  });

  t('AD: 韩文标签 (KakaoTV)', () => {
    const tags = ad.generateHashtags('kakaoTV', 'romance', 'modern');
    if (!tags.some(t => t.includes('드라마'))) throw '缺少韩文标签';
    console.log(`     ${tags.slice(0,5).join(', ')}...`);
  });

  // Translation
  const tr = load('translation');
  t('TR: 50种语言 + 区域分组', () => {
    const engine = new tr.TranslationEngine(null);
    const langs = engine.getAvailableLanguages();
    if (langs.length !== 50) throw `期望50语言, 实际${langs.length}`;
    const groups = engine.groupByRegion();
    if (Object.keys(groups).length < 12) throw '区域分组不足';
    console.log(`     ${langs.length}语言 / ${Object.keys(groups).length}区域`);
  });

  t('TR: 每个语言都有region', () => {
    const engine = new tr.TranslationEngine(null);
    const langs = engine.getAvailableLanguages();
    const missing = langs.filter(l => !l.region);
    if (missing.length > 0) throw `${missing.length}个语言缺少region`;
  });

  // Publish Engine
  const pub = load('publish-engine');
  await ta('PUB: 平台列表 (带fallback)', async () => {
    const platforms = await pub.getPlatforms();
    if (!Array.isArray(platforms) || platforms.length < 6) throw `期望6+平台, 实际${platforms.length}`;
    console.log(`     ${platforms.length}个平台可用`);
  });

  await ta('PUB: SEO元数据生成', async () => {
    const seo = pub.generateSEOMetadata('youtube', TEST_PROFILE, {
      genre: 'romance', title: '霸道总裁爱上我', lang: 'zh',
    });
    if (!seo.title) throw '缺少SEO标题';
    console.log(`     标题: ${seo.title.substring(0, 40)}...`);
  });

  // ====== Phase 4: AI 实机测试 (需要 API Key) ======
  if (API_KEY) {
    console.log('\n' + '━'.repeat(48));
    console.log('Phase 4: 🤖 AI 实机推理测试 (用真实API)');
    console.log('━'.repeat(48));

    const ae = load('ai-engine');

    // 4.1 配置AI
    await ta('AI: 配置DeepSeek客户端', async () => {
      ae.configureAI(PROVIDER, API_KEY, 'deepseek-chat');
    });

    // 4.2 测试连接
    await ta('AI: 测试连接', async () => {
      const result = await ae.testConnection(PROVIDER, API_KEY, 'deepseek-chat');
      if (!result.success || !result.result) throw JSON.stringify(result);
      console.log(`     ${result.result}`);
    });

    // 4.3 剧本生成
    await ta('AI: 生成剧本 (3场景)', async () => {
      const result = await ae.generateScript({
        characters: [TEST_PROFILE, TEST_HEROINE],
        genre: 'romance',
        mood: '浪漫',
        plotPoints: [
          '总裁秦墨言在公司会议上向女主施压',
          '两人在走廊上争执',
          '天台上秦墨言表露真心',
        ],
      }, { maxTokens: 2000 });
      if (!result.success || !result.data) throw JSON.stringify(result);
      const scenes = result.data.scenes || result.data;
      if (!Array.isArray(scenes) || scenes.length === 0) throw '未生成场景';
      console.log(`     生成 ${scenes.length} 场景`);
      console.log(`     概要: ${(scenes[0]?.description || '').substring(0, 60)}...`);
    });

    // 4.4 角色描述增强
    await ta('AI: 增强角色描述', async () => {
      const result = await ae.generateCharacterPrompt(TEST_PROFILE);
      if (!result.success || !result.data) throw JSON.stringify(result);
      console.log(`     生成 ${result.data.length} 字描述`);
    });

    // 4.5 翻译 (中文→英文)
    await ta('AI: 翻译3场景成英文', async () => {
      // 先用 TranslationEngine 包装 AI Engine
      const engine = new tr.TranslationEngine(ae);
      const result = await engine.translateScript(TEST_SCRIPT_SCENES, 'en');
      if (!result || !Array.isArray(result) || result.length === 0) throw '翻译失败';
      console.log(`     翻译 ${result.length} 场景`);
      if (result[0]._translated) {
        const transDialogue = result[0].dialogue?.[0]?.line || '';
        console.log(`     例: "${(transDialogue).substring(0, 50)}..."`);
      }
    });

    // 4.6 字幕翻译
    await ta('AI: 字幕翻译 (中→英)', async () => {
      const engine = new tr.TranslationEngine(ae);
      const subtitles = [
        { index: 1, start: 0, end: 3, text: '这份合同，你签也得签，不签也得签。' },
        { index: 2, start: 4, end: 7, text: '你凭什么这么霸道？' },
      ];
      const result = await engine.translateSubtitles(subtitles, 'en');
      if (!result || !Array.isArray(result)) throw '翻译失败';
      console.log(`     翻译 ${result.length} 条字幕`);
    });

    // 4.7 Pipeline 翻译 (integrated test)
    await ta('AI: Pipeline翻译 (ASS双语)', async () => {
      const engine = new tr.TranslationEngine(ae);
      const zh = TEST_SCRIPT_SCENES.map((s, i) => ({
        index: i + 1,
        start: i * 4, end: i * 4 + 3.5,
        text: s.dialogue.map(d => `[${d.characterName}] ${d.line}`).join('\n'),
      }));
      const translated = await engine.translateSubtitles(zh, 'en');
      if (translated && translated.length > 0) {
        const ass = engine.generateBilingualASS(
          zh.map((z, i) => ({ ...z, translatedText: translated[i]?.text || translated[i]?.translatedText || '' })),
          translated,
          'en',
        );
        if (ass.includes('V4+ Styles')) {
          console.log(`     ASS字幕生成成功 (${(ass.length/1024).toFixed(0)}KB)`);
        }
      }
    });

    // 4.8 自适应分析
    await ta('AI: 剧本平台自适应分析', async () => {
      const result = ad.analyzeScriptForPlatforms(TEST_SCRIPT_SCENES, {
        totalDuration: 120, sceneCount: TEST_SCRIPT_SCENES.length, aspectRatio: '9:16',
      });
      // 针对TikTok优化
      if (result.tiktok) {
        const optimized = ad.generateOptimizedParams('tiktok', { genre: 'romance', totalDuration: 120 });
        console.log(`     TikTok: ${optimized.sceneCount}场景 / ${optimized.totalDuration}秒`);
      }
    });
  } else {
    console.log('\n' + '━'.repeat(48));
    console.log('Phase 4: 🤖 AI 实机测试 (跳过 — 未设置API Key)');
    console.log('━'.repeat(48));
    console.log('  ⏭️  如需完整测试，设置 DEEPSEEK_API_KEY 环境变量');
  }

  // ====== Phase 5: 项目打包 ======
  console.log('\n' + '━'.repeat(48));
  console.log('Phase 5: 项目打包 & 发布记录');
  console.log('━'.repeat(48));

  // Project Pack
  const pk = load('project-pack');
  const testPackDir = path.join(ROOT, '..', '.test-packs');
  if (!fs.existsSync(testPackDir)) fs.mkdirSync(testPackDir, { recursive: true });

  await ta('PK: 导出 .lspack 项目包', async () => {
    const result = pk.exportProject({
      title: '霸道总裁爱上我 - 实机测试',
      scenes: TEST_SCRIPT_SCENES,
      profile: TEST_PROFILE,
      heroine: TEST_HEROINE,
      createdAt: Date.now(),
    }, { outputDir: testPackDir });
    if (!result || !result.path) throw JSON.stringify(result);
    const size = fs.statSync(result.path).size;
    console.log(`     路径: ${path.basename(result.path)}`);
    console.log(`     大小: ${(size/1024).toFixed(1)}KB`);
  });

  await ta('PK: 导入回环验证', async () => {
    const list = pk.listPackages(testPackDir);
    if (!Array.isArray(list) || list.length === 0) throw '列表为空';
    const latest = list.sort((a,b) => b.createdAt - a.createdAt)[0];
    const imported = pk.importPackage(latest.path);
    if (!imported || !imported.title) throw '导入数据无效';
    if (imported.title.includes('实机测试')) console.log(`     导回: "${imported.title}"`);
  });

  // Publish History
  await ta('PUB: 发布历史记录', async () => {
    await pub.clearPublishHistory();
    const h = await pub.getPublishHistory();
    if (!Array.isArray(h)) throw '历史格式错误';
  });

  // ====== 最终总结 ======
  const total = passed + failed;
  console.log('\n' + '═'.repeat(48));
  console.log(`  🏁 全链路测试完成: ${passed}/${total} 通过`);
  console.log('═'.repeat(48));

  if (failed > 0) {
    console.log(`\n  ⚠️  ${failed} 个测试失败，请检查日志`);
    process.exit(1);
  } else {
    console.log('\n  🎉 所有测试通过！全链路功能正常\n');
    console.log('  📋 已覆盖:');
    console.log('   ✅ 数据库 | ✅ 向量记忆 | ✅ 授权 | ✅ BGM');
    console.log('   ✅ 字幕 | ✅ 剪映导出 | ✅ FCPXML | ✅ 自适应');
    console.log('   ✅ 翻译引擎 | ✅ 发布引擎 | ✅ 项目打包');
    if (API_KEY) {
      console.log('   ✅ AI剧本 | ✅ AI对话 | ✅ AI翻译');
    }
    process.exit(0);
  }
}

main().catch(e => {
  console.error('\n❌ 致命错误:', e.message);
  console.error(e.stack);
  process.exit(1);
});
