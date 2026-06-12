import React, { useState, useEffect } from 'react';
import { ai, db, bgm, subtitle, draft, translate, onAIProgress } from '../lib/bridge';

interface PipelineScene {
  id: string;
  index: number;
  location: string;
  description: string;
  mood: string;
  cameraAngle: string;
  dialogue: { characterName: string; line: string; emotion?: string }[];
  imageDataUrl: string;
  audioDataUrl: string;
  duration: number;
}

type Step = 'idle' | 'preparing' | 'bgm' | 'composing' | 'done' | 'error';

const PipelinePage: React.FC = () => {
  const [scenes, setScenes] = useState<PipelineScene[]>([]);
  const [projectName, setProjectName] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [outputs, setOutputs] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [subtitleFormat, setSubtitleFormat] = useState<string>('srt');
  const [draftExport, setDraftExport] = useState<string>('none');
  const [translationLang, setTranslationLang] = useState<string>('');
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [previewScene, setPreviewScene] = useState<PipelineScene | null>(null);

  useEffect(() => {
    loadOutputs();
    loadTranslationSettings();
    return onAIProgress((data: any) => {
      setProgressMsg(data.message);
      if (data.done && data.step === 'video') {
        setStep('done');
        loadOutputs();
      }
    });
  }, []);

  const loadOutputs = async () => {
    const list = await ai.listOutputs();
    setOutputs(list);
  };

  const loadDemo = () => {
    const colors = ['#e84142', '#4a6cf7', '#10b981', '#f59e0b'];
    const demoScenes: PipelineScene[] = [
      { id: 'd1', index: 0, location: '顶楼办公室·白天', description: '霸道总裁站在落地窗前', mood: '紧张', cameraAngle: '中景', dialogue: [{ characterName: '林浩宇', line: '这份合同，你签也得签，不签也得签。', emotion: '冷峻' }], imageDataUrl: createPlaceholderImage(colors[0], 'Scene 1: Office', '紧张'), audioDataUrl: '', duration: 4 },
      { id: 'd2', index: 1, location: '酒店大厅·夜晚', description: '女主走下楼梯，男主一眼看到她', mood: '浪漫', cameraAngle: '全景', dialogue: [{ characterName: '苏小雨', line: '我不是来参加宴会的。', emotion: '坚定' }], imageDataUrl: createPlaceholderImage(colors[1], 'Scene 2: Hotel', '浪漫'), audioDataUrl: '', duration: 4 },
      { id: 'd3', index: 2, location: '医院走廊·白天', description: '男主焦急等待手术结果', mood: '焦虑', cameraAngle: '跟拍', dialogue: [{ characterName: '陈管家', line: '少爷，苏小姐不会有事的。', emotion: '安慰' }, { characterName: '林浩宇', line: '如果她出事，我不会原谅自己。', emotion: '痛苦' }], imageDataUrl: createPlaceholderImage(colors[2], 'Scene 3: Hospital', '焦虑'), audioDataUrl: '', duration: 6 },
      { id: 'd4', index: 3, location: '花园·黄昏', description: '男主单膝跪地求婚', mood: '幸福', cameraAngle: '特写', dialogue: [{ characterName: '林浩宇', line: '从见到你的第一天起，我的心就不属于自己了。', emotion: '深情' }, { characterName: '苏小雨', line: '我愿意。', emotion: '感动' }], imageDataUrl: createPlaceholderImage(colors[3], 'Scene 4: Garden', '幸福'), audioDataUrl: '', duration: 6 },
    ];
    setScenes(demoScenes);
    setProjectName('霸道总裁的契约新娘（演示）');
    setProgressMsg('✅ 加载了 4 个分镜演示数据');
    setTimeout(() => setProgressMsg(''), 3000);
  };

  const loadTranslationSettings = async () => {
    const lang = await db.getSetting('translationTargetLang');
    const auto = await db.getSetting('translationAuto');
    if (lang && lang !== 'zh') {
      setTranslationLang(lang);
      setTranslationEnabled(auto !== 'false');
    }
  };

  const createPlaceholderImage = (color: string, text: string, mood: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
      <defs><linearGradient id="bg"><stop offset="0%" style="stop-color:${color}"/><stop offset="100%" style="stop-color:#000"/></linearGradient></defs>
      <rect width="1920" height="1080" fill="url(#bg)"/>
      <rect x="100" y="100" width="1720" height="600" rx="20" fill="rgba(255,255,255,0.05)"/>
      <text x="960" y="350" text-anchor="middle" fill="white" font-size="72" font-family="sans-serif" font-weight="bold">${text}</text>
      <text x="960" y="430" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-size="28" font-family="sans-serif">🎬 ${mood} · 16:9</text>
      <text x="960" y="1000" text-anchor="middle" fill="rgba(255,255,255,0.2)" font-size="18">龙虾短剧工坊 · 演示画面</text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  };

  const startFullPipeline = async () => {
    const validScenes = scenes.filter(s => s.imageDataUrl);
    if (validScenes.length === 0) {
      setError('没有已生成画面的分镜，请先加载演示数据');
      return;
    }

    setError('');
    setProgress(0);
    setStep('preparing');
    setProgressMsg('🎬 开始全自动管线...');
    setOutputPath('');

    try {
      // Step 1: Generate BGM
      let bgmDataUrl = '';
      if (bgmEnabled) {
        setStep('bgm');
        setProgress(20);
        setProgressMsg('🎵 AI 正在生成背景配乐...');
        const bgmResult = await bgm.generate(validScenes);
        if (bgmResult.success && bgmResult.data) {
          bgmDataUrl = bgmResult.data.bgmDataUrl;
          setProgressMsg('✅ 背景配乐生成完成');
        } else {
          console.warn('BGM generation failed, continuing without');
        }
      }

      // Step 2: Translation (if enabled)
      let translatedScenes = validScenes;
      if (translationEnabled && translationLang) {
        setProgress(35);
        setProgressMsg(`🌐 AI 正在翻译为 ${translationLang}...`);
        const transResult = await translate.script(validScenes, translationLang);
        if (transResult.success && transResult.data) {
          translatedScenes = transResult.data;
          setProgressMsg(`✅ 已翻译为 ${translationLang}`);
        } else {
          setProgressMsg('⚠️ 翻译失败，使用中文版');
        }
      }

      // Step 3: Generate subtitles (with translation if applied)
      setProgress(40);
      setProgressMsg('📝 正在生成字幕...');
      let subtitleContent = '';
      if (subtitleFormat === 'srt') {
        subtitleContent = await subtitle.generateSRT(translatedScenes);
      } else if (subtitleFormat === 'ass') {
        subtitleContent = await subtitle.generateASS(translatedScenes);
      }
      setProgressMsg('✅ 字幕生成完成');

      // For composing, use translated scenes
      const composeScenes = translatedScenes;

      // Step 3: Compose video
      setStep('composing');
      setProgress(60);
      setProgressMsg('⚡ 正在合成视频 (1920×1080, H.264)...');

      const composeResult = await ai.composeVideo({
        scenes: composeScenes.map(s => ({
          imageDataUrl: s.imageDataUrl,
          audioDataUrl: s.audioDataUrl || '',
          duration: s.duration || 4,
        })),
        bgmDataUrl: bgmDataUrl || undefined,
        outputName: `${projectName || 'output'}_${Date.now()}.mp4`,
        subtitleContent: subtitleContent || undefined,
      });

      if (composeResult.success && composeResult.data) {
        setProgress(85);
        setOutputPath(composeResult.data.outputPath);
        setProgressMsg('✅ 视频合成完成！');
      } else {
        throw new Error(composeResult.error || '合成失败');
      }

      // Step 4: Export drafts (optional)
      if (draftExport === 'capcut' || draftExport === 'both') {
        setProgress(90);
        setProgressMsg('📦 正在导出剪映草稿...');
        const draftResult = await draft.exportCapCut({
          title: projectName,
          scenes: validScenes,
        }, validScenes.map(s => ({
          dialogue: s.dialogue,
          duration: s.duration,
        })));
        if (draftResult.success) {
          setProgressMsg('✅ 剪映草稿导出成功！');
        }
      }

      if (draftExport === 'fcpxml' || draftExport === 'both') {
        setProgress(95);
        setProgressMsg('📦 正在导出 FCPXML...');
        const xmlResult = await draft.exportFCPXML({
          title: projectName,
        }, validScenes.map(s => ({
          dialogue: s.dialogue,
          duration: s.duration,
        })));
        if (xmlResult.success) {
          setProgressMsg('✅ FCPXML 导出成功！');
        }
      }

      setProgress(100);
      setStep('done');
      setProgressMsg('✅ 全部完成！视频已就绪');
      loadOutputs();

    } catch (e: any) {
      setStep('error');
      setError(e.message || '处理流程出错');
      setProgressMsg('');
    }
  };

  const clearPipeline = () => {
    setScenes([]);
    setStep('idle');
    setOutputPath('');
    setError('');
    setProgress(0);
    setProjectName('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const steps = [
    { key: 'bgm', label: '配乐生成', icon: '🎵', done: step !== 'idle' },
    { key: 'subs', label: '字幕生成', icon: '📝', done: step !== 'idle' },
    { key: 'compose', label: '合成编码', icon: '⚡', done: step === 'composing' || step === 'done' },
    { key: 'output', label: '视频输出', icon: '🎬', done: step === 'done' },
    { key: 'export', label: '剪辑导出', icon: '📦', done: step === 'done' },
  ];

  return (
    <div className="animate-fade-in page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>⚡ 合成管线</h1>
          <p>配乐生成 → 字幕 → 视频合成 → 导出到剪辑软件 — 全自动</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {scenes.length === 0 && (
            <button className="btn-secondary" onClick={loadDemo}>🎲 加载演示</button>
          )}
          {scenes.length > 0 && (
            <button className="btn-ghost" onClick={clearPipeline}>🔄 重置</button>
          )}
        </div>
      </div>

      {/* Progress message */}
      {progressMsg && (
        <div className="card" style={{
          marginBottom: 16, padding: 12,
          background: progressMsg.includes('✅') ? '#10b98111' : progressMsg.includes('❌') ? '#e8414211' : 'var(--bg-secondary)',
          borderColor: progressMsg.includes('✅') ? 'rgba(16,185,129,0.3)' : progressMsg.includes('❌') ? 'rgba(232,65,66,0.3)' : 'var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            {!progressMsg.includes('✅') && !progressMsg.includes('❌') && (
              <span className="animate-spin" style={{ fontSize: 16 }}>⏳</span>
            )}
            {progressMsg}
          </div>
        </div>
      )}

      {/* Pipeline visualization */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex', gap: 0, alignItems: 'center', marginBottom: 20,
        }}>
          {steps.map((item, i) => (
            <React.Fragment key={item.key}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                flex: 1, padding: '8px',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                  background: item.done ? 'linear-gradient(135deg, rgba(232,65,66,0.2), rgba(255,107,107,0.3))' : 'var(--bg-secondary)',
                  border: `2px solid ${item.done ? 'var(--accent)' : 'var(--border)'}`,
                  transition: 'all 0.5s',
                }}>
                  {item.done ? '✅' : item.icon}
                </div>
                <div style={{
                  fontSize: 11, color: item.done ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: item.done ? 600 : 400,
                }}>
                  {item.label}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  flex: 1, height: 3,
                  background: item.done ? 'linear-gradient(90deg, var(--accent), var(--accent))' : 'var(--border)',
                  borderRadius: 2, transition: 'background 1s',
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Progress bar */}
        {progress > 0 && progress < 100 && (
          <div className="progress-bar" style={{ marginBottom: 16 }}>
            <div className="progress-bar-fill" style={{ width: progress + '%' }} />
          </div>
        )}

        {/* Translation toggle */}
        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
          padding: '8px 0',
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={translationEnabled} onChange={e => setTranslationEnabled(e.target.checked)}
              style={{ accentColor: 'var(--accent)' }} />
            🌐 翻译字幕
          </label>
          {translationEnabled && (
            <select value={translationLang} onChange={e => setTranslationLang(e.target.value)}
              style={{ fontSize: 12, padding: '4px 8px', borderRadius: 4 }}>
              <option value="en">🇬🇧 English</option>
              <option value="ja">🇯🇵 日本語</option>
              <option value="ko">🇰🇷 한국어</option>
              <option value="es">🇪🇸 Español</option>
              <option value="fr">🇫🇷 Français</option>
              <option value="pt">🇵🇹 Português</option>
              <option value="vi">🇻🇳 Tiếng Việt</option>
              <option value="th">🇹🇭 ไทย</option>
              <option value="id">🇮🇩 Bahasa</option>
              <option value="hi">🇮🇳 हिन्दी</option>
              <option value="ms">🇲🇾 Melayu</option>
              <option value="ar">🇸🇦 العربية (RTL)</option>
              <option value="ru">🇷🇺 Русский</option>
              <option value="de">🇩🇪 Deutsch</option>
            </select>
          )}
        </div>

        {/* Options row */}
        <div style={{
          display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
          padding: '12px 0', borderTop: '1px solid var(--border)', marginBottom: 12,
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={bgmEnabled} onChange={e => setBgmEnabled(e.target.checked)}
              style={{ accentColor: 'var(--accent)' }} />
            🎵 自动生成背景配乐
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <span>📝 字幕格式:</span>
            <select value={subtitleFormat} onChange={e => setSubtitleFormat(e.target.value)}
              style={{ fontSize: 12, padding: '4px 8px', borderRadius: 4 }}>
              <option value="srt">SRT</option>
              <option value="ass">ASS（带样式）</option>
              <option value="">无字幕</option>
            </select>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <span>📦 导出到:</span>
            <select value={draftExport} onChange={e => setDraftExport(e.target.value)}
              style={{ fontSize: 12, padding: '4px 8px', borderRadius: 4 }}>
              <option value="none">不导出</option>
              <option value="capcut">剪映草稿</option>
              <option value="fcpxml">Premiere/FCPXML</option>
              <option value="both">两者都导出</option>
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {scenes.length > 0 && (
            <button onClick={startFullPipeline} disabled={step === 'composing'}
              className="btn-primary"
              style={{
                opacity: step === 'composing' ? 0.6 : 1,
                cursor: step === 'composing' ? 'not-allowed' : 'pointer',
                fontSize: 16, padding: '14px 48px',
              }}>
              {step === 'composing' ? '⏳ 全自动处理中...' : '🎬 全自动一条龙'}
            </button>
          )}

          {step === 'done' && outputPath && (
            <button onClick={() => {
              const electron: any = (window as any).electronAPI;
              if (electron?.saveFile) electron.saveFile(outputPath.split('/').pop() || 'output.mp4');
            }} className="btn-primary" style={{ background: '#10b981', boxShadow: '0 2px 12px rgba(16,185,129,0.3)' }}>
              💾 保存视频
            </button>
          )}
        </div>
      </div>

      {/* Scene list with preview player + drag-to-reorder */}
      {scenes.length > 0 && (
        <div className="stagger" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {projectName} · {scenes.length} 个分镜
            </h3>
            {scenes.length > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    const reordered = [...scenes];
                    [reordered[0], reordered[reordered.length - 1]] = [reordered[reordered.length - 1], reordered[0]];
                    setScenes(reordered);
                  }}
                  className="btn-ghost" style={{ fontSize: 11 }}
                >
                  🔄 首尾互换
                </button>
                <button
                  onClick={() => {
                    const reordered = [...scenes].reverse();
                    setScenes(reordered);
                  }}
                  className="btn-ghost" style={{ fontSize: 11 }}
                >
                  ⏪ 反转顺序
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {scenes.map((ps, i) => (
              <div key={ps.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
                {/* Preview thumbnail — click to show preview in modal */}
                <div
                  onClick={() => setPreviewScene(ps)}
                  style={{
                    width: 120, height: 67, borderRadius: 6, overflow: 'hidden',
                    background: 'var(--bg-secondary)', flexShrink: 0, position: 'relative',
                    cursor: 'pointer',
                  }}
                  title="点击预览"
                >
                  {ps.imageDataUrl ? (
                    <img src={ps.imageDataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                      无画面
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', top: 3, left: 3, fontSize: 10,
                    background: 'rgba(0,0,0,0.7)', padding: '1px 6px', borderRadius: 3,
                    color: '#fff',
                  }}>
                    #{i + 1}
                  </div>
                  {/* Play overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.2s',
                  }} className="scene-play-overlay">
                    <span style={{ fontSize: 28 }}>▶️</span>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{ps.location}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span>🎬 {ps.cameraAngle}</span>
                    <span>🎭 {ps.mood}</span>
                    <span>⏱ {ps.duration}s</span>
                    {ps.audioDataUrl ? <span>🎙️ 有配音</span> : null}
                  </div>
                  {ps.dialogue && ps.dialogue.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, opacity: 0.7 }}>
                      {ps.dialogue.map(d => d.line).join(' · ').substring(0, 60)}
                      {ps.dialogue.map(d => d.line).join(' · ').length > 60 ? '...' : ''}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div className={`badge ${ps.imageDataUrl ? 'badge-success' : 'badge-warning'}`}>
                    {ps.imageDataUrl ? '✅ 就绪' : '⏳ 待处理'}
                  </div>
                  {/* Move up/down buttons */}
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button
                      onClick={() => {
                        if (i === 0) return;
                        const reordered = [...scenes];
                        [reordered[i-1], reordered[i]] = [reordered[i], reordered[i-1]];
                        setScenes(reordered);
                      }}
                      title="上移"
                      style={{
                        background: 'none', border: '1px solid var(--border)',
                        borderRadius: 4, cursor: 'pointer', padding: '2px 6px',
                        fontSize: 12, color: i === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
                        opacity: i === 0 ? 0.3 : 1,
                      }}
                      disabled={i === 0}
                    >↑</button>
                    <button
                      onClick={() => {
                        if (i === scenes.length - 1) return;
                        const reordered = [...scenes];
                        [reordered[i], reordered[i+1]] = [reordered[i+1], reordered[i]];
                        setScenes(reordered);
                      }}
                      title="下移"
                      style={{
                        background: 'none', border: '1px solid var(--border)',
                        borderRadius: 4, cursor: 'pointer', padding: '2px 6px',
                        fontSize: 12, color: i === scenes.length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                        opacity: i === scenes.length - 1 ? 0.3 : 1,
                      }}
                      disabled={i === scenes.length - 1}
                    >↓</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewScene && (
        <div
          onClick={() => setPreviewScene(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90%', maxHeight: '90%',
              background: '#000', borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 8px 60px rgba(0,0,0,0.8)',
            }}
          >
            {/* Preview canvas (image + dialogue overlay) */}
            {previewScene.imageDataUrl && (
              <div style={{ position: 'relative' }}>
                <img src={previewScene.imageDataUrl} alt="" style={{
                  maxWidth: '100%', maxHeight: '80vh', display: 'block',
                }} />
                {/* Bottom subtitle overlay */}
                {previewScene.dialogue && previewScene.dialogue.length > 0 && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '40px 40px 24px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                  }}>
                    {previewScene.dialogue.map((d, di) => (
                      <div key={di} style={{ marginBottom: di < previewScene.dialogue.length - 1 ? 8 : 0 }}>
                        <div style={{
                          color: '#ff6b6b', fontSize: 14, fontWeight: 600,
                          marginBottom: 2, textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                        }}>
                          {d.characterName}
                        </div>
                        <div style={{
                          color: '#fff', fontSize: 18, fontWeight: 500,
                          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                          lineHeight: 1.4,
                        }}>
                          {d.line}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Scene info bar */}
            <div style={{
              padding: '12px 20px',
              background: '#111',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 12, color: '#888',
            }}>
              <span>📍 {previewScene.location}</span>
              <span>🎭 {previewScene.mood} · {previewScene.cameraAngle}</span>
              <span>⏱ {previewScene.duration}s</span>
              <span style={{ color: '#fff', cursor: 'pointer' }} onClick={() => setPreviewScene(null)}>✕ 关闭</span>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: 20, padding: 12, borderRadius: 8,
          background: 'rgba(232,65,66,0.1)', border: '1px solid rgba(232,65,66,0.3)',
          fontSize: 13, color: '#ff6b6b',
        }}>
          ❌ {error}
        </div>
      )}

      {/* Previous outputs */}
      {outputs.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
            📁 历史输出 ({outputs.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {outputs.slice(0, 10).map((o: any, i: number) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', borderRadius: 6,
                background: 'var(--bg-secondary)', fontSize: 12,
              }}>
                <span style={{ color: 'var(--text-primary)' }}>🎬 {o.name}</span>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{formatFileSize(o.size)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleTimeString()}</span>
                  <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>📂</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelinePage;
