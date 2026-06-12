import React from 'react';
import { PageKey } from '../App';

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
}

type NavItem = {
  key: PageKey;
  label: string;
  icon: string;
  group: string;
};

const navItems: NavItem[] = [
  { key: 'dashboard', label: '工作台', icon: '◈', group: 'main' },
  { key: 'script', label: '剧本工厂', icon: '📝', group: 'create' },
  { key: 'characters', label: '人物工坊', icon: '👤', group: 'create' },
  { key: 'storyboard', label: '分镜导演', icon: '🎬', group: 'create' },
  { key: 'voice', label: '音色工坊', icon: '🎙️', group: 'create' },
  { key: 'pipeline', label: '合成管线', icon: '⚡', group: 'create' },
  { key: 'publish', label: '一键发布', icon: '🚀', group: 'business' },
  { key: 'settings', label: '设置', icon: '⚙️', group: 'system' },
];

const groupLabels: Record<string, string> = {
  main: '',
  create: '创作工坊',
  business: '商业',
  system: '系统',
};

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  let lastGroup = '';

  return (
    <nav style={{
      width: 200,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 0' }}>
        {navItems.map((item) => {
          const showGroup = item.group !== lastGroup;
          lastGroup = item.group;
          const isActive = activePage === item.key;
          return (
            <React.Fragment key={item.key}>
              {showGroup && item.group && (
                <div style={{
                  padding: '16px 16px 6px',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontWeight: 600,
                }}>
                  {groupLabels[item.group]}
                </div>
              )}
              <button
                onClick={() => onNavigate(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Bottom branding */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        fontSize: 11,
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}>
        v1.0.0-alpha
      </div>
    </nav>
  );
};

export default Sidebar;
