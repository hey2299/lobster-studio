import React from 'react';
import { PageKey } from '../App';

interface Props {
  onNavigate: (page: PageKey) => void;
  stats: { projects: number; characters: number };
}

const quickActions = [
  { key: 'script' as PageKey, title: '一键生成短剧', desc: '输入想法，AI 自动完成全部', icon: '✨', color: '#e84142' },
  { key: 'script' as PageKey, title: '上传剧本改编', desc: '上传小说或剧本，AI 改编', icon: '📂', color: '#4a6cf7' },
  { key: 'characters' as PageKey, title: '创建角色', desc: '设计新角色形象和声线', icon: '👤', color: '#7c3aed' },
  { key: 'storyboard' as PageKey, title: '继续上次制作', desc: '回到最近的项目', icon: '▶️', color: '#10b981' },
];

const DashboardPage: React.FC<Props> = ({ onNavigate, stats }) => {
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, background: 'linear-gradient(135deg, #e84142, #ff6b6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          欢迎回来
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
          选择下方操作开始创作，或继续上次的项目
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }}>
        {quickActions.map((action) => (
          <button
            key={action.title}
            onClick={() => onNavigate(action.key)}
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '20px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = action.color;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 4px 20px ${action.color}22`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>{action.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>
              {action.title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {action.desc}
            </div>
          </button>
        ))}
      </div>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
          最近项目
        </h2>
        {stats.projects === 0 ? (
          <div style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200,
            color: 'var(--text-muted)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
            <p style={{ fontSize: 15, marginBottom: 4 }}>还没有项目</p>
            <p style={{ fontSize: 13 }}>点击「一键生成短剧」开始你的第一部作品</p>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            你有 {stats.projects} 个项目和 {stats.characters} 个角色
          </div>
        )}
      </section>

      <div style={{
        display: 'flex',
        gap: 24,
        padding: '16px 20px',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
        borderRadius: 12,
      }}>
        {[
          { label: '已创作', value: String(stats.projects), unit: '部' },
          { label: '角色库', value: String(stats.characters), unit: '个' },
          { label: '音色库', value: '20+', unit: '种' },
          { label: 'AI 引擎', value: 'DeepSeek', unit: '' },
        ].map((stat) => (
          <div key={stat.label} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>
              {stat.value}<span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{stat.unit}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
