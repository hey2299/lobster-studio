import React from 'react';

const SettingsPage: React.FC = () => {
  return (
    <div className="animate-fade-in" style={{ maxWidth: 700 }}>
      {[
        { title: 'AI 模型配置', desc: '配置语言模型、图像模型、视频模型、语音合成的 API 密钥', icon: '🧠' },
        { title: '发布平台绑定', desc: '绑定抖音、快手、视频号等平台的发布账号', icon: '🔗' },
        { title: '输出设置', desc: '短片默认分辨率、格式、字幕样式', icon: '⚙️' },
        { title: '角色记忆库', desc: '管理跨短剧角色记忆存储位置和备份', icon: '💾' },
        { title: '音色更新', desc: '设置音色库自动更新时间，跟踪最新 TTS 模型', icon: '🔄' },
        { title: '授权与更新', desc: '软件激活、许可证信息、自动更新', icon: '🔑' },
      ].map((section) => (
        <div key={section.title} style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '16px 20px',
          marginBottom: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          transition: 'all 0.2s',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
          <div style={{ fontSize: 24 }}>{section.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{section.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{section.desc}</div>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>›</span>
        </div>
      ))}
    </div>
  );
};

export default SettingsPage;
