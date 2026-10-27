import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { HelpCircle, Moon, Sun, Settings, ShieldCheck } from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { StatusBadge } from '../common/StatusBadge';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenHelp: () => void;
  isBackendConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onOpenHelp,
  isBackendConnected = false,
}) => {
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return { title: 'Sign Language Translator', breadcrumb: 'Workspace / Real-Time Translator' };
      case '/conversation':
        return { title: 'Bidirectional Conversation', breadcrumb: 'Workspace / Dual-Participant Mode' };
      case '/history':
        return { title: 'Translation History', breadcrumb: 'Records / Saved Sessions' };
      case '/learn':
        return { title: 'Learn Signs', breadcrumb: 'Education / Sign Dictionary' };
      case '/settings':
        return { title: 'Settings & Privacy', breadcrumb: 'Preferences / AI Engine Configuration' };
      default:
        return { title: 'AISLT', breadcrumb: 'Workspace' };
    }
  };

  const { title, breadcrumb } = getPageTitle(location.pathname);

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-[#0B1020]/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
      {/* Zone 1: Breadcrumb and Title */}
      <div className="flex flex-col justify-center min-w-0">
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-medium tracking-wide">
          <span>{breadcrumb}</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#22D3EE] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Zero-Cloud Video Stream
          </span>
        </div>
        <h1 className="text-base md:text-lg font-bold tracking-tight text-white truncate">
          {title}
        </h1>
      </div>

      {/* Zone 2: Status & Quick Action Controls */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <div className="hidden sm:block">
          <StatusBadge
            status={isBackendConnected ? 'connected' : 'demo'}
            label={isBackendConnected ? 'AI Live' : 'Demo Mode'}
          />
        </div>

        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Help Guide */}
        <button
          onClick={onOpenHelp}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition"
          title="How it works & Privacy guide"
          aria-label="Open help guide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition"
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-200" />}
        </button>

        {/* Settings shortcut */}
        <Link
          to="/settings"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition hidden md:flex"
          title="Application Settings"
          aria-label="Application Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
};
