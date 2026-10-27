import React from 'react';
import { NavLink } from 'react-router-dom';
import { Languages, MessageSquare, History, BookOpen, Settings } from 'lucide-react';

export const MobileNavigation: React.FC = () => {
  const tabs = [
    { to: '/', label: 'Translator', icon: Languages },
    { to: '/conversation', label: 'Converse', icon: MessageSquare },
    { to: '/history', label: 'History', icon: History },
    { to: '/learn', label: 'Learn', icon: BookOpen },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0B1020]/95 backdrop-blur-lg border-t border-white/10 z-40 px-2 flex items-center justify-around"
      aria-label="Mobile Navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl px-2 transition-all ${
                isActive
                  ? 'text-[#22D3EE] font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] mt-1 tracking-tight truncate">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
