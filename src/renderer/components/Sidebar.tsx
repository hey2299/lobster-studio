import React from 'react';
import { PageKey } from '../App';

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  isOpen: boolean;
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

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, isOpen }) => {
  let lastGroup = '';

  return (
    <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <nav style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}>
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 0' }}>
          {navItems.map((item) => {
            const showGroup = item.group !== lastGroup;
            lastGroup = item.group;
            const isActive = activePage === item.key;
            return (
              <React.Fragment key={item.key}>
                {showGroup && item.group && (
                  <div className="sidebar-group-label">
                    {groupLabels[item.group]}
                  </div>
                )}
                <button
                  onClick={() => onNavigate(item.key)}
                  className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  <span className="sidebar-item-label">{item.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Bottom branding */}
        <div className="sidebar-branding">
          v1.0.0-alpha
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
