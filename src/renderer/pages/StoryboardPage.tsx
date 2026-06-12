import React from 'react';

const steps = [
  { icon: '📝', label: '剧本→分镜' },
  { icon: '🎭', label: '角色定位' },
  { icon: '🎥', label: '运镜设计' },
  { icon: '🖼️', label: '画面生成' },
  { icon: '✂️', label: '分镜调整' },
];

const StoryboardPage: React.FC = () => {
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
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>分镜导演</p>
        <p style={{ fontSize: 13, marginBottom: 16 }}>创建剧本后，在此将文字转化为分镜头画面</p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
          maxWidth: 600,
          margin: '0 auto',
        }}>
          {steps.map((step) => (
            <div key={step.label} style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 16,
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{step.icon}</div>
              {step.label}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>请先在「剧本工厂」中生成剧本</p>
      </div>
    </div>
  );
};
export default StoryboardPage;
