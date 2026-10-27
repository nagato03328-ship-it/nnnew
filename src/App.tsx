import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { preferencesService } from './services/preferencesService';
import { translationService } from './services/translationService';
import { UserPreferences } from './types/settings';
import { OutputMode } from './types/translation';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNavigation } from './components/layout/MobileNavigation';
import { HelpModal } from './components/layout/HelpModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { TranslatorPage } from './pages/TranslatorPage';
import { ConversationPage } from './pages/ConversationPage';
import { HistoryPage } from './pages/HistoryPage';
import { LearnSignsPage } from './pages/LearnSignsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    preferencesService.getPreferences()
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Sync theme with DOM
  useEffect(() => {
    const root = document.documentElement;
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [preferences.theme]);

  // Check backend status on mount
  useEffect(() => {
    translationService.getBackendStatus().then((status) => {
      setIsBackendConnected(status.connected);
    });
  }, [preferences.apiBaseUrl]);

  const handleUpdatePreferences = (updated: Partial<UserPreferences>) => {
    const newPrefs = preferencesService.savePreferences(updated);
    setPreferences(newPrefs);
  };

  const handleToggleTheme = () => {
    const nextTheme = preferences.theme === 'dark' ? 'light' : 'dark';
    handleUpdatePreferences({ theme: nextTheme });
  };

  const handleLanguagePairChange = (signId: string, spokenId: string) => {
    handleUpdatePreferences({
      preferredInputSignLanguage: signId,
      preferredOutputSpokenLanguage: spokenId,
    });
  };

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-[#0B1020] text-[#F8FAFC]">
        {/* Desktop Collapsible Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main Application Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          {/* Header */}
          <Header
            theme={preferences.theme}
            onToggleTheme={handleToggleTheme}
            onOpenHelp={() => setIsHelpOpen(true)}
            isBackendConnected={isBackendConnected}
          />

          {/* Page Routing */}
          <main className="flex-1 flex flex-col overflow-y-auto">
            <Routes>
              <Route
                path="/"
                element={
                  <TranslatorPage
                    fontSize={preferences.fontSize}
                    onChangeFontSize={(size) => handleUpdatePreferences({ fontSize: size })}
                    outputMode={preferences.defaultOutputMode}
                    onChangeOutputMode={(mode: OutputMode) =>
                      handleUpdatePreferences({ defaultOutputMode: mode })
                    }
                    preferredSignLangId={preferences.preferredInputSignLanguage}
                    preferredSpokenLangId={preferences.preferredOutputSpokenLanguage}
                    onLanguagePairChange={handleLanguagePairChange}
                    experimentalLandmarks={preferences.experimentalLandmarks}
                    onToggleLandmarks={() =>
                      handleUpdatePreferences({
                        experimentalLandmarks: !preferences.experimentalLandmarks,
                      })
                    }
                    avatarSpeed={preferences.avatarPlaybackSpeed}
                    onAvatarSpeedChange={(speed) =>
                      handleUpdatePreferences({ avatarPlaybackSpeed: speed })
                    }
                  />
                }
              />
              <Route path="/conversation" element={<ConversationPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/learn" element={<LearnSignsPage />} />
              <Route
                path="/settings"
                element={
                  <SettingsPage
                    preferences={preferences}
                    onUpdatePreferences={handleUpdatePreferences}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Offline Connectivity Notification */}
          <OfflineIndicator />
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileNavigation />

        {/* Informational & Privacy Modal */}
        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </div>
    </BrowserRouter>
  );
}
