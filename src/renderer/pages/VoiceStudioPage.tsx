import React from 'react';

const VoiceStudioPage: React.FC = () => {
  return (
    <div className="animate-fade-in">
      <div style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 48,
        textAlign: 'center',
        color: 'var(--text-muted)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎙️</div>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>音色工坊</p>
        <p style={{ fontSize: 13, marginBottom: 24 }}>AI 配音与音色管理，自动扩充最新音色</p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['霸道总裁', '甜美少女', '沉稳大叔', '清冷御姐', '阳光少年', '阴柔反派'].map((voice) => (
            <div key={voice} style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '16px 24px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              minWidth: 120,
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>{voice}</div>
              <div style={{ fontSize: 11, color: 'var(--accent)' }}>▶ 试听</div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 24 }}>
          🤖 自动扩充：系统将持续跟踪最新 AI 音色模型，新音色自动加入列表
        </p>
      </div>
    </div>
  );
};

export default VoiceStudioPage;
