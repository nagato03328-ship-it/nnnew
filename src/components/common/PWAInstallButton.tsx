import React, { useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50"
        title="Install AISLT to your device for offline access"
        aria-label="Install AISLT App"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-lg border border-[#8B5CF6]/40 hover:border-[#8B5CF6] bg-[#121A2B] px-3 py-1.5 text-xs font-medium text-[#22D3EE] transition"
          aria-label="Install on iOS device"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install PWA</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#121A2B] border border-white/10 p-6 shadow-2xl text-[#F8FAFC]">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-base font-semibold">Install on iOS (Safari)</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-md"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center font-bold text-xs">1</span>
                  <span>Tap the <strong>Share</strong> button in Safari toolbar.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center font-bold text-xs">2</span>
                  <span>Scroll down and select <strong>Add to Home Screen</strong>.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center font-bold text-xs">3</span>
                  <span>Launch AISLT from your home screen for full standalone experience.</span>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-white/10 hover:bg-white/15 py-2 text-sm font-medium text-white transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
