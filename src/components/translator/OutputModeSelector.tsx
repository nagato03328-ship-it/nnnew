import React from 'react';
import { FileText, Volume2, UserCheck, Layers } from 'lucide-react';
import { OutputMode } from '../../types/translation';

interface OutputModeSelectorProps {
  currentMode: OutputMode;
  onChange: (mode: OutputMode) => void;
}

export const OutputModeSelector: React.FC<OutputModeSelectorProps> = ({
  currentMode,
  onChange,
}) => {
  const modes: { id: OutputMode; label: string; icon: React.ReactNode }[] = [
    { id: 'text', label: 'Text', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'voice', label: 'Voice', icon: <Volume2 className="w-3.5 h-3.5" /> },
    { id: 'sign', label: 'Sign Avatar', icon: <UserCheck className="w-3.5 h-3.5" /> },
    { id: 'text_voice', label: 'Text + Voice', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'text_sign', label: 'Text + Sign', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'voice_sign', label: 'Voice + Sign', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'all', label: 'All Outputs', icon: <Layers className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Output Mode
        </span>
        <span className="text-[11px] text-slate-400">
          Controls active translation display channels
        </span>
      </div>

      <div className="flex items-center gap-1 p-1 bg-[#0B1020] rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
        {modes.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'bg-[#182338] text-[#22D3EE] shadow-sm border border-white/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
