import React, { useState } from 'react';
import { PageKey } from '../App';
import TRENDING_CONFIGS from './trending-configs';

interface Props {
  onNavigate: (page: PageKey) => void;
  onApplyTrending: (config: any) => void;
  stats: { projects: number; characters: number };
}

const quickActions = [
  { key: 'script' as PageKey, title: '一键生成短剧', desc: '输入想法，AI 自动完成全部', icon: '✨', color: '#e84142' },
  { key: 'characters' as PageKey, title: '创建角色', desc: '设计新角色形象和声线', icon: '👤', color: '#7c3aed' },
  { key: 'storyboard' as PageKey, title: '分镜面板', desc: '剧本到画面的桥梁', icon: '🎬', color: '#10b981' },
  { key: 'pipeline' as PageKey, title: '合成管线', desc: '一键合成完整短剧', icon: '⚡', color: '#f59e0b' },
];

const workflowSteps = [
  { label: '设定角色', page: 'characters' as PageKey, desc: '创建主角和配角信息', icon: '👤' },
  { label: '生成剧本', page: 'script' as PageKey, desc: 'AI 根据角色和设定创作', icon: '📝' },
  { label: '规划分镜', page: 'storyboard' as PageKey, desc: '分解剧本为可视化场景', icon: '🎬' },
  { label: '合成视频', page: 'pipeline' as PageKey, desc: '画面+配音+字幕+BGM', icon: '⚡' },
  { label: '多平台发布', page: 'publish' as PageKey, desc: '国内海外一键分发', icon: '🚀' },
];

const DashboardPage: React.FC<Props> = ({ onNavigate, onApplyTrending, stats }) => {
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const handleApplyAndMake = (config: any) => {
    setApplyingId(config.id);
    // Save trending config to sessionStorage so Pipeline can pick it up
    try {
      sessionStorage.setItem('lobster_trending_config', JSON.stringify(config));
    } catch {}
    // Navigate to pipeline which will auto-detect and apply
    onApplyTrending(config);
    onNavigate('pipeline');
    setTimeout(() => setApplyingId(null), 2000);
  };
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontSize: 30, fontWeight: 700, marginBottom: 6,
          background: 'linear-gradient(135deg, #e84142, #ff6b6b)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          欢迎回来 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          选择下方操作开始创作，或继续上次的项目
        </p>
      </div>

      {/* Stat cards row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 12, marginBottom: 24,
      }}>
        <StatCard icon="📦" label="项目数" value={stats.projects} color="#4a6cf7" />
        <StatCard icon="👤" label="角色数" value={stats.characters} color="#7c3aed" />
        <StatCard icon="🔑" label="版本" value="社区版" color="#6b7280" badge="free" />
        <StatCard icon="🤖" label="AI 引擎" value="DeepSeek" color="#e84142" badge="ready" />
      </div>

      {/* Quick actions grid */}
      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: 0.5 }}>
        快捷操作
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 12, marginBottom: 28,
      }}>
        {quickActions.map((action) => (
          <button
            key={action.title}
            onClick={() => onNavigate(action.key)}
            className="card"
            style={{
              padding: 20, cursor: 'pointer', textAlign: 'left',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              transition: 'all 0.2s',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: action.color + '22',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>
              {action.icon}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{action.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{action.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Trending configs — 系统推荐 */}
      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
        🔥 热门推荐
        <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>根据市场热度自动更新 · 一键制作并发布</span>
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 12, marginBottom: 28,
      }}>
        {TRENDING_CONFIGS.slice(0, 6).map((cfg) => (
          <div key={cfg.id} className="card" style={{
            padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
            border: `1px solid ${cfg.badgeColor}33`,
            background: `linear-gradient(135deg, ${cfg.badgeColor}08, transparent)`,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Badge */}
            <div style={{
              position: 'absolute', top: 0, right: 0,
              background: cfg.badgeColor,
              color: '#fff', fontSize: 10, fontWeight: 700,
              padding: '3px 10px',
              borderBottomLeftRadius: 8,
            }}>
              {cfg.badge}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{cfg.title.split(' ')[0]}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {cfg.title.replace(/^\S+\s/, '')}
              </span>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {cfg.description}
            </div>

            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {cfg.tags.map(tag => (
                <span key={tag} style={{
                  padding: '1px 8px', borderRadius: 4, fontSize: 10,
                  background: cfg.badgeColor + '18',
                  color: cfg.badgeColor,
                }}>
                  #{tag}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <button
                onClick={() => handleApplyAndMake(cfg)}
                disabled={applyingId === cfg.id || applyingId !== null}
                className="btn-primary"
                style={{
                  flex: 1, fontSize: 12, padding: '8px 12px',
                  background: `linear-gradient(135deg, ${cfg.badgeColor}, ${cfg.badgeColor}88)`,
                  opacity: applyingId === cfg.id ? 0.6 : 1,
                }}
              >
                {applyingId === cfg.id ? '⏳ 正在启动...' : '🎬 一键制作并发布'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Workflow guide */}
      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: 0.5 }}>
        创作流程
      </h3>
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div style={{
          display: 'flex', gap: 0, alignItems: 'flex-start',
        }}>
          {workflowSteps.map((step, i) => (
            <React.Fragment key={step.label}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <button
                  onClick={() => onNavigate(step.page)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: '8px 4px', background: 'none', border: 'none', cursor: 'pointer',
                    width: '100%', borderRadius: 8, transition: 'background 0.15s',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                    background: 'linear-gradient(135deg, rgba(232,65,66,0.15), rgba(255,107,107,0.25))',
                  }}>
                    {step.icon}
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                  }}>
                    {step.label}
                  </div>
                  <div style={{
                    fontSize: 10, color: 'var(--text-muted)', textAlign: 'center',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120,
                  }}>
                    {step.desc}
                  </div>
                </button>
              </div>
              {i < workflowSteps.length - 1 && (
                <div style={{
                  flex: '0 0 12px', height: 2,
                  background: 'var(--border)',
                  marginTop: 25,
                }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Quick tips */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
      }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>💡 使用提示</div>
          <ul style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 16 }}>
            <li>先在「设置」中配置 AI API Key</li>
            <li>从「角色工坊」开始创建人物</li>
            <li>使用「合成管线」一键全自动</li>
            <li>支持导出到剪映/Premiere</li>
          </ul>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>📋 快速状态</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 2 }}>
            <div>📦 项目包格式：.lspack</div>
            <div>🌐 翻译目标：50 种语言</div>
            <div>📤 发布平台：13 个</div>
            <div>📺 视频格式：1920×1080 H.264</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ====== Stat Card ======
function StatCard({ icon, label, value, color, badge }: {
  icon: string; label: string; value: number | string; color: string; badge?: string;
}) {
  return (
    <div className="card" style={{
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: color + '18', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 20,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
        <div style={{
          fontSize: 18, fontWeight: 700, color: 'var(--text-primary)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {value}
          {badge && (
            <span style={{
              fontSize: 10, fontWeight: 600,
              background: color + '22', color, padding: '1px 6px',
              borderRadius: 4,
            }}>
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
