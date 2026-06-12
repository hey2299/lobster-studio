import React, { useState } from 'react';
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

export type PageKey = 'dashboard' | 'script' | 'characters' | 'storyboard' | 'voice' | 'pipeline' | 'publish' | 'settings';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage onNavigate={setActivePage} />;
      case 'script': return <ScriptFactoryPage />;
      case 'characters': return <CharacterWorkshopPage />;
      case 'storyboard': return <StoryboardPage />;
      case 'voice': return <VoiceStudioPage />;
      case 'pipeline': return <PipelinePage />;
      case 'publish': return <PublishPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage onNavigate={setActivePage} />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      {/* macOS-style title bar */}
      <div className="titlebar">
        <span className="titlebar-title">🦞 龙虾短剧工坊</span>
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
