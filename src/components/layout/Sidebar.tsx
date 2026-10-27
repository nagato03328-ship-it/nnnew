import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Languages,
  MessageSquare,
  History,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
  Cpu,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const navItems = [
    {
      to: '/',
      label: 'Translator',
      icon: Languages,
      description: 'Camera & Multilingual Translation',
    },
    {
      to: '/conversation',
      label: 'Conversation',
      icon: MessageSquare,
      description: 'Bidirectional Sign & Speech',
    },
    {
      to: '/history',
      label: 'History',
      icon: History,
      description: 'Saved Translations',
    },
    {
      to: '/learn',
      label: 'Learn Signs',
      icon: BookOpen,
      description: 'Interactive Sign Dictionary',
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings,
      description: 'Preferences & AI Backend',
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col flex-shrink-0 bg-[#0B1020] border-r border-white/5 transition-all duration-200 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
      aria-label="Main Navigation"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
        <NavLink
          to="/"
          className="flex items-center gap-3 overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] rounded-lg p-1"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#22D3EE] p-[1.5px] shrink-0 shadow-lg shadow-[#8B5CF6]/20">
            <div className="w-full h-full bg-[#0B1020] rounded-[10px] flex items-center justify-center overflow-hidden">
              <img
                src="/icon.svg"
                alt="AISLT Logo"
                className="w-6 h-6 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-base font-bold tracking-tight text-white truncate">
                AI<span className="text-[#22D3EE]">SLT</span>
              </span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest truncate">
                Sign Language Translator
              </span>
            </div>
          )}
        </NavLink>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition focus:outline-none focus:ring-1 focus:ring-white/20"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#182338] text-[#22D3EE] shadow-sm border border-white/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && (
                <div className="flex flex-col truncate">
                  <span className="truncate">{item.label}</span>
                  <span className="text-[11px] font-normal text-slate-400 truncate">
                    {item.description}
                  </span>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Model Status Card at bottom */}
      <div className="p-3 border-t border-white/5">
        <div
          className={`rounded-xl bg-[#121A2B] border border-white/5 p-3 flex flex-col gap-2 ${
            isCollapsed ? 'items-center text-center p-2' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            {!isCollapsed && (
              <span className="text-xs font-semibold text-slate-200 truncate">
                System Status
              </span>
            )}
          </div>
          {!isCollapsed ? (
            <div>
              <div className="text-[11px] text-amber-300 font-medium">Demo Mode Active</div>
              <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                Camera feed stays local. Continuous recognition requires external AI engine.
              </div>
            </div>
          ) : (
            <span title="Demo mode - AI engine disconnected">
              <Cpu className="w-4 h-4 text-slate-400" />
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
