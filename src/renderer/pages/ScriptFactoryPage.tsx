import React, { useState, useEffect } from 'react';
import { ai, onAIProgress } from '../lib/bridge';
import type { Script } from '../types';

const genres = ['甜宠', '赘婿', '逆袭', '穿越', '霸总', '重生', '修仙', '悬疑', '古风', '都市', '科幻', '喜剧'];
const lengths = [
  { value: 30, label: '30 秒', desc: '极短视频' },
  { value: 60, label: '1 分钟', desc: '标准短剧' },
  { value: 120, label: '2 分钟', desc: '深度短剧' },
  { value: 300, label: '5 分钟', desc: '长篇短剧' },
];
const styles = ['原生真人风', '二次元动漫', '水墨国风', '3D 渲染', '像素复古', '剪影风格'];

const ScriptFactoryPage: React.FC = () => {
  const [mode, setMode] = useState<'generate' | 'upload' | 'manual'>('generate');
  const [selectedGenre, setSelectedGenre] = useState('甜宠');
  const [selectedLength, setSelectedLength] = useState(60);
  const [selectedStyle, setSelectedStyle] = useState('原生真人风');
  const [keyword, setKeyword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<Script | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    return onAIProgress((data: any) => {
      setProgress(data.message);
      if (data.done) {
        setTimeout(() => setProgress(''), 2000);
      }
    });
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');
    setProgress('AI 正在创作剧本...');
    setResult(null);

    const response = await ai.generateScript({
      genre: selectedGenre,
      style: selectedStyle,
      duration: selectedLength,
      keyword,
    });

    if (response.success && response.data) {
      const script: Script = {
        id: `script_${Date.now()}`,
        title: response.data.title || '未命名短剧',
        genre: selectedGenre,
        style: selectedStyle,
        duration: selectedLength,
        scenes: response.data.scenes || [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setResult(script);
      setProgress(`✅ 剧本《${script.title}》生成完成！共 ${script.scenes.length} 个分镜`);
    } else {
      setError(response.error || '生成失败，请检查 API 配置');
      setProgress('');
    }
    setIsGenerating(false);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1200 }}>
      {/* Mode tabs */}
      <div style={{ display: 'inline-flex', gap: 8, marginBottom: 24, background: 'var(--bg-tertiary)', borderRadius: 10, padding: 4 }}>
        {([
          { key: 'generate', label: '✨ 一键生成' },
          { key: 'upload', label: '📂 上传改编' },
          { key: 'manual', label: '✏️ 手动创作' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMode(tab.key)}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: mode === tab.key ? 'var(--accent)' : 'transparent',
              color: mode === tab.key ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: mode === tab.key ? 600 : 400,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { if (mode !== tab.key) e.currentTarget.style.background = 'var(--border)'; }}
            onMouseLeave={(e) => { if (mode !== tab.key) e.currentTarget.style.background = 'transparent'; }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === 'generate' && (
        <div style={{ display: 'flex', gap: 32 }}>
          {/* Left: Config Panel */}
          <div style={{ flex: 1, maxWidth: 500 }}>
            <section style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>题材</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {genres.map((g) => (
                  <button key={g} onClick={() => setSelectedGenre(g)}
                    style={{
                      padding: '5px 14px', borderRadius: 20,
                      border: `1px solid ${g === selectedGenre ? 'var(--accent)' : 'var(--border)'}`,
                      background: g === selectedGenre ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: g === selectedGenre ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
                    }}
                  >{g}</button>
                ))}
              </div>
            </section>

            <section style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>时长</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {lengths.map((l) => (
                  <button key={l.value} onClick={() => setSelectedLength(l.value)}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 10,
                      border: `1px solid ${selectedLength === l.value ? 'var(--accent)' : 'var(--border)'}`,
                      background: selectedLength === l.value ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                      cursor: 'pointer', textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, color: selectedLength === l.value ? 'var(--accent)' : 'var(--text-primary)' }}>{l.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.desc}</div>
                  </button>
                ))}
              </div>
            </section>

            <section style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>视觉风格</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {styles.map((s) => (
                  <button key={s} onClick={() => setSelectedStyle(s)}
                    style={{
                      padding: '5px 14px', borderRadius: 20,
                      border: `1px solid ${s === selectedStyle ? 'var(--accent)' : 'var(--border)'}`,
                      background: s === selectedStyle ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: s === selectedStyle ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: 13,
                    }}
                  >{s}</button>
                ))}
              </div>
            </section>

            <section style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>故事灵感（选填）</h3>
              <textarea value={keyword} onChange={(e) => setKeyword(e.target.value)}
                placeholder="比如：一个外卖小哥意外获得读心术..."
                style={{
                  width: '100%', minHeight: 70, padding: 10, borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)', fontSize: 14, resize: 'vertical',
                  outline: 'none', fontFamily: 'inherit',
                }}
              />
            </section>

            <button onClick={handleGenerate} disabled={isGenerating}
              style={{
                width: '100%', padding: '14px 24px', borderRadius: 10, border: 'none',
                background: isGenerating ? 'var(--border)' : 'linear-gradient(135deg, #e84142, #ff6b6b)',
                color: '#fff', fontSize: 16, fontWeight: 600, cursor: isGenerating ? 'not-allowed' : 'pointer',
                opacity: isGenerating ? 0.6 : 1,
              }}
            >
              {isGenerating ? '⏳ AI 创作中...' : '🚀 一键生成完整剧本'}
            </button>

            {progress && (
              <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-tertiary)', fontSize: 13, color: progress.includes('✅') ? '#10b981' : 'var(--text-secondary)' }}>
                {progress}
              </div>
            )}

            {error && (
              <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: '#e8414222', border: '1px solid #e84142', fontSize: 13, color: '#ff6b6b' }}>
                ❌ {error}
                <div style={{ fontSize: 11, marginTop: 4, color: 'var(--text-muted)' }}>
                  提示：请先在「设置」页面配置 AI API 密钥，或使用默认的 DeepSeek 引擎
                </div>
              </div>
            )}
          </div>

          {/* Right: Result Panel */}
          <div style={{ flex: 1 }}>
            {result ? (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>📖 {result.title}</h2>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <span style={{ padding: '2px 10px', borderRadius: 12, background: 'var(--accent)22', color: 'var(--accent)', fontSize: 12 }}>{result.genre}</span>
                  <span style={{ padding: '2px 10px', borderRadius: 12, background: '#4a6cf722', color: '#4a6cf7', fontSize: 12 }}>{result.style}</span>
                  <span style={{ padding: '2px 10px', borderRadius: 12, background: '#10b98122', color: '#10b981', fontSize: 12 }}>{result.scenes.length} 个分镜</span>
                </div>

                <div style={{ maxHeight: 500, overflow: 'auto' }}>
                  {result.scenes.map((scene, i) => (
                    <div key={scene.id} style={{
                      background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                      borderRadius: 10, padding: 16, marginBottom: 12,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>#{i + 1} {scene.location}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{scene.cameraAngle}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
                        {scene.description}
                      </p>
                      {scene.dialogue && scene.dialogue.length > 0 && (
                        <div style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 12, marginTop: 8 }}>
                          {scene.dialogue.map((d, j) => (
                            <div key={j} style={{ marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{d.characterName}</span>
                              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>（{d.emotion}）：</span>
                              <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{d.line}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <details style={{ marginTop: 8 }}>
                        <summary style={{ fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>查看图像提示词</summary>
                        <pre style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {scene.imagePrompt}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                background: 'var(--bg-tertiary)', border: '1px dashed var(--border)',
                borderRadius: 12, padding: 48, textAlign: 'center', color: 'var(--text-muted)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 300,
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
                <p style={{ fontSize: 14 }}>配置完成后点击「一键生成」</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>AI 将在 10-20 秒内完成剧本创作</p>
              </div>
            )}
          </div>
        </div>
      )}

      {mode === 'upload' && (
        <div style={{
          background: 'var(--bg-tertiary)', border: '2px dashed var(--border)',
          borderRadius: 12, padding: 48, textAlign: 'center', cursor: 'pointer',
          transition: 'all 0.2s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = '#1a1a2e'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>点击上传剧本文件</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>支持 TXT / MD / DOCX / PDF，AI 自动解析为分镜</p>
        </div>
      )}

      {mode === 'manual' && (
        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, maxWidth: 700 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>输入剧本大纲</h3>
          <textarea placeholder="第1集：男主角在公司被当众羞辱，意外触发神秘系统..."
            style={{
              width: '100%', minHeight: 200, padding: 12, borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--bg-secondary)',
              color: 'var(--text-primary)', fontSize: 14, resize: 'vertical',
              outline: 'none', fontFamily: 'inherit', marginBottom: 16,
            }}
          />
          <button style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: 'var(--accent)', color: '#fff', fontWeight: 600,
            cursor: 'pointer', fontSize: 14,
          }}>
            ✨ AI 扩写为完整剧本
          </button>
        </div>
      )}
    </div>
  );
};

export default ScriptFactoryPage;
