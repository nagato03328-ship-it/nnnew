import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-18 md:bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/90 text-slate-950 px-3.5 py-2 text-xs font-semibold shadow-lg backdrop-blur-md border border-amber-400"
    >
      <WifiOff className="w-4 h-4 shrink-0 text-slate-950" />
      <span>Offline Mode — Cached data and offline speech active</span>
    </div>
  );
};
