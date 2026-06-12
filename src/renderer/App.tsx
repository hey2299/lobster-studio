import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import DashboardPage from './pages/DashboardPage';
import ScriptFactoryPage from './pages/ScriptFactoryPage';
import CharacterWorkshopPage from './pages/CharacterWorkshopPage';
import StoryboardPage from './pages/StoryboardPage';
import VoiceStudioPage from './pages/VoiceStudioPage';
import PipelinePage from './pages/PipelinePage';
import PublishPage from './pages/PublishPage';
import SettingsPage from './pages/SettingsPage';
import { db, ai } from './lib/bridge';

export type PageKey = 'dashboard' | 'script' | 'characters' | 'storyboard' | 'voice' | 'pipeline' | 'publish' | 'settings';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const [initialized, setInitialized] = useState(false);
  const [stats, setStats] = useState({ projects: 0, characters: 0 });

  useEffect(() => {
    // Load saved data on startup
    const loadData = async () => {
      try {
        const chars = await db.getCharacters();
        const projects = await db.getProjects();
        setStats({ projects: projects.length, characters: chars.length });
        
        // Configure AI with defaults (user can change in settings)
        await ai.configure('deepseek', '', 'deepseek-chat');
      } catch (e) {
        console.log('Running outside Electron or DB not ready');
      }
      setInitialized(true);
    };
    loadData();
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage onNavigate={setActivePage} stats={stats} />;
      case 'script': return <ScriptFactoryPage />;
      case 'characters': return <CharacterWorkshopPage />;
      case 'storyboard': return <StoryboardPage />;
      case 'voice': return <VoiceStudioPage />;
      case 'pipeline': return <PipelinePage />;
      case 'publish': return <PublishPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage onNavigate={setActivePage} stats={stats} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <div className="titlebar">
        <span className="titlebar-title">🦞 龙虾短剧工坊 {initialized ? '' : '— 启动中...'}</span>
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TopBar activePage={activePage} />
          <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
            {renderPage()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
