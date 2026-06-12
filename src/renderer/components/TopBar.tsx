import React from 'react';
import { PageKey } from '../App';

type Props = { activePage: PageKey };

const pageTitles: Record<PageKey, string> = {
  dashboard: '工作台',
  script: '剧本工厂 — 一键生成或上传改编',
  characters: '人物工坊 — 创建和管理角色形象',
  storyboard: '分镜导演 — 剧本到画面的桥梁',
  voice: '音色工坊 — 配音与音色管理',
  pipeline: '合成管线 — 一键合成完整短剧',
  publish: '一键发布 — 全平台分发',
  settings: '设置',
};

const TopBar: React.FC<Props> = ({ activePage }) => {
  return (
    <header style={{
      height: 48,
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 12,
    }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
        {pageTitles[activePage]?.split(' — ')[0]}
      </span>
      {pageTitles[activePage]?.includes(' — ') && (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          — {pageTitles[activePage].split(' — ')[1]}
        </span>
      )}
    </header>
  );
};

export default TopBar;
