import React from 'react';

const PublishPage: React.FC = () => {
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
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>一键发布</p>
        <p style={{ fontSize: 13, marginBottom: 24 }}>将完成的短剧一键发布到各大平台</p>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { name: '抖音', icon: '🎵', color: '#333' },
            { name: '视频号', icon: '💬', color: '#07c160' },
            { name: '快手', icon: '🎮', color: '#ff6b35' },
            { name: '小红书', icon: '📕', color: '#ff2442' },
            { name: 'YouTube', icon: '▶️', color: '#ff0000' },
            { name: 'B站', icon: '📺', color: '#00a1d6' },
          ].map((p) => (
            <div key={p.name} style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '20px 24px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              opacity: 0.5,
              minWidth: 100,
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{p.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{p.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>即将支持</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublishPage;
