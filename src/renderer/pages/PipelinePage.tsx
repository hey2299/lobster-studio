import React from 'react';

const PipelinePage: React.FC = () => {
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
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>合成管线</p>
        <p style={{ fontSize: 13, marginBottom: 24 }}>将剧本、角色、配音、画面一键合成为完整短剧</p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          {['📝 剧本', '🎭 角色', '🖼️ 分镜', '🎙️ 配音', '🎵 BGM', '🎬 成片'].map((step, i) => (
            <React.Fragment key={step}>
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                color: 'var(--text-secondary)',
              }}>
                {step}
              </div>
              {i < 5 && <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>→</span>}
            </React.Fragment>
          ))}
        </div>

        <button style={{
          padding: '12px 32px',
          borderRadius: 10,
          border: 'none',
          background: 'linear-gradient(135deg, #e84142, #ff6b6b)',
          color: '#fff',
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer',
          opacity: 0.5,
        }} disabled>
          🔄 请先完成分镜和配音
        </button>
      </div>
    </div>
  );
};

export default PipelinePage;
