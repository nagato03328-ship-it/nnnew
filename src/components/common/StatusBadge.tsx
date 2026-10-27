import React from 'react';

interface StatusBadgeProps {
  status: 'demo' | 'connected' | 'disconnected' | 'recording';
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
}) => {
  let badgeStyles = 'bg-slate-800 text-slate-300 border-slate-700';
  let defaultLabel = 'Demo mode';

  if (status === 'connected') {
    badgeStyles = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';
    defaultLabel = 'AI Engine Connected';
  } else if (status === 'recording') {
    badgeStyles = 'bg-rose-950/80 text-rose-300 border-rose-800';
    defaultLabel = 'Camera Active';
  } else if (status === 'disconnected') {
    badgeStyles = 'bg-slate-900 text-slate-400 border-slate-800';
    defaultLabel = 'Backend Disconnected';
  } else {
    // demo mode
    badgeStyles = 'bg-amber-950/50 text-amber-300 border-amber-800/70';
    defaultLabel = 'Demo Mode (No Live AI)';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium tracking-wide border ${badgeStyles} ${className}`}
    >
      {status === 'recording' && (
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" aria-hidden="true" />
      )}
      {status === 'connected' && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      )}
      {status === 'demo' && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden="true" />
      )}
      <span>{label || defaultLabel}</span>
    </span>
  );
};
