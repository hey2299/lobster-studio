import React, { useState } from 'react';

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
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLength, setSelectedLength] = useState(60);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [keyword, setKeyword] = useState('');

  return (
    <div className="animate-fade-in" style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'var(--bg-tertiary)', borderRadius: 10, padding: 4, display: 'inline-flex' }}>
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
        <>
          <section style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
              选择题材
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(g === selectedGenre ? '' : g)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 20,
                    border: `1px solid ${g === selectedGenre ? 'var(--accent)' : 'var(--border)'}`,
                    background: g === selectedGenre ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: g === selectedGenre ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 13,
                    transition: 'all 0.2s',
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
              短剧时长
            </h3>
            <div style={{ display: 'flex', gap: 12 }}>
              {lengths.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setSelectedLength(l.value)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: `1px solid ${selectedLength === l.value ? 'var(--accent)' : 'var(--border)'}`,
                    background: selectedLength === l.value ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 600, color: selectedLength === l.value ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {l.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {l.desc}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
              视觉风格
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {styles.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStyle(s === selectedStyle ? '' : s)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 20,
                    border: `1px solid ${s === selectedStyle ? 'var(--accent)' : 'var(--border)'}`,
                    background: s === selectedStyle ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: s === selectedStyle ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 13,
                    transition: 'all 0.2s',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
              输入故事灵感（选填）
            </h3>
            <textarea
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="比如：一个外卖小哥意外获得读心术，在都市中逆袭成为商业精英..."
              style={{
                width: '100%',
                minHeight: 80,
                padding: 12,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                fontSize: 14,
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </section>

          <button
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #e84142, #ff6b6b)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            🚀 一键生成完整短剧
          </button>
        </>
      )}

      {mode === 'upload' && (
        <div style={{
          background: 'var(--bg-tertiary)',
          border: '2px dashed var(--border)',
          borderRadius: 12,
          padding: 48,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = '#1a1a2e'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>点击上传剧本文件</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>支持 TXT / MD / DOCX / PDF 格式，AI 自动解析</p>
        </div>
      )}

      {mode === 'manual' && (
        <div style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 24,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
            输入剧本大纲
          </h3>
          <textarea
            placeholder="第1集：男主角在公司被当众羞辱，意外触发神秘系统..."
            style={{
              width: '100%',
              minHeight: 200,
              padding: 12,
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: 14,
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              marginBottom: 16,
            }}
          />
          <button style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
          }}>
            ✨ AI 扩写为完整剧本
          </button>
        </div>
      )}
    </div>
  );
};

export default ScriptFactoryPage;
