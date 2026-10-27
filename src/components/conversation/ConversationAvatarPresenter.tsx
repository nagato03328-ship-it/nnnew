import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Subtitles,
  Activity,
  Layers,
  Sparkles,
  Volume2,
  Check,
} from 'lucide-react';
import { ConversationMessage } from '../../types/conversation';

interface ConversationAvatarPresenterProps {
  currentMessage: ConversationMessage | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReplay: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  autoPresent: boolean;
  onToggleAutoPresent: () => void;
  signLanguageName: string;
}

export const ConversationAvatarPresenter: React.FC<ConversationAvatarPresenterProps> = ({
  currentMessage,
  isPlaying,
  onTogglePlay,
  onReplay,
  speed,
  onSpeedChange,
  autoPresent,
  onToggleAutoPresent,
  signLanguageName,
}) => {
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const onTogglePlayRef = useRef(onTogglePlay);
  onTogglePlayRef.current = onTogglePlay;

  // Smooth animation timeline progression when playing
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        const next = progressRef.current + 1.8 * speed;
        if (next >= 100) {
          progressRef.current = 100;
          setProgress(100);
          clearInterval(timer);
          // Safely notify parent outside of React render/updater cycles
          onTogglePlayRef.current();
        } else {
          progressRef.current = next;
          setProgress(next);
        }
      }, 50);
    }
    return () => clearInterval(timer);
  }, [isPlaying, speed]);

  // Reset progress when message changes
  useEffect(() => {
    if (currentMessage) {
      progressRef.current = 0;
      setProgress(0);
    }
  }, [currentMessage?.id]);

  const speedOptions = [0.5, 0.75, 1.0, 1.25];

  const displaySignText = currentMessage
    ? currentMessage.senderRole === 'signer'
      ? currentMessage.originalText
      : currentMessage.translatedText.replace(/^\[Spoken Meaning\]:\s*/, '')
    : 'Awaiting conversation message to present...';

  return (
    <div className="flex flex-col h-full bg-[#121A2B] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
      {/* Top Bar */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-[#0B1020]/40">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#22D3EE]" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            AI Avatar Presenter
          </h3>
          <span className="text-[10px] font-mono text-[#8B5CF6] bg-[#8B5CF6]/15 px-2 py-0.5 rounded border border-[#8B5CF6]/30">
            Sign Synthesis
          </span>
        </div>

        {/* Subtitles & Auto-present */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSubtitles(!showSubtitles)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition border ${
              showSubtitles
                ? 'bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/40'
                : 'text-slate-400 hover:text-white border-white/5'
            }`}
            title="Toggle sign translation captions"
          >
            <Subtitles className="w-3 h-3" />
            <span className="hidden sm:inline">Captions</span>
          </button>

          <button
            type="button"
            onClick={onToggleAutoPresent}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition border ${
              autoPresent
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                : 'text-slate-400 hover:text-slate-200 border-white/5'
            }`}
            title="Automatically present every incoming message via sign avatar"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Auto-Present</span>
          </button>
        </div>
      </div>

      {/* Main Avatar Viewport */}
      <div className="relative aspect-video sm:aspect-square md:aspect-auto md:flex-1 bg-[#070A14] flex items-center justify-center overflow-hidden min-h-[260px]">
        {/* Render High-Fidelity 3D Avatar Model */}
        <img
          src="/src/assets/images/sign_avatar_model_1792593293922.jpg"
          alt="AI Sign Language Avatar Presenter"
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isPlaying ? 'scale-[1.03]' : 'scale-100'
          }`}
          referrerPolicy="no-referrer"
        />

        {/* Dynamic Skeletal Mesh simulation and ripple when actively presenting */}
        {isPlaying && (
          <div className="absolute inset-0 bg-radial from-transparent to-[#0B1020]/50 pointer-events-none flex flex-col justify-end p-4">
            <div className="self-center flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B1020]/90 border border-[#8B5CF6]/60 backdrop-blur-md text-[11px] text-[#22D3EE] font-mono shadow-lg animate-pulse mb-12">
              <Activity className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Presenting in {signLanguageName} ({Math.round(progress)}%)</span>
            </div>
          </div>
        )}

        {/* Subtitle Caption Overlay */}
        {showSubtitles && (
          <div className="absolute bottom-3 left-3 right-3 z-10 text-center">
            <div className="inline-block max-w-full px-3.5 py-1.5 rounded-xl bg-[#0B1020]/90 border border-white/10 backdrop-blur-md text-xs font-medium text-white shadow-xl truncate">
              {displaySignText}
            </div>
          </div>
        )}

        {/* Sender & Modality Tag */}
        {currentMessage && (
          <div className="absolute top-3 left-3 z-10">
            <div className="px-2.5 py-1 rounded-lg bg-[#0B1020]/85 border border-white/10 backdrop-blur-md flex items-center gap-1.5 text-[10px] text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
              <span>Presenting: {currentMessage.senderName}</span>
            </div>
          </div>
        )}
      </div>

      {/* Progress timeline bar */}
      <div className="w-full bg-white/5 h-1">
        <div
          className="bg-gradient-to-r from-[#8B5CF6] via-[#22D3EE] to-[#8B5CF6] h-1 transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls Bar */}
      <div className="p-3 border-t border-white/5 bg-[#0B1020]/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onTogglePlay}
            disabled={!currentMessage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Present'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              progressRef.current = 0;
              setProgress(0);
              onReplay();
            }}
            disabled={!currentMessage}
            className="p-1.5 rounded-xl bg-[#182338] hover:bg-[#1E2E4A] disabled:opacity-40 text-slate-300 hover:text-white transition"
            title="Replay sign presentation"
            aria-label="Replay presentation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-[#182338] p-1 rounded-lg border border-white/5">
          <span className="text-[10px] text-slate-400 px-1 font-mono">Speed</span>
          {speedOptions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeedChange(s)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                speed === s
                  ? 'bg-[#8B5CF6] text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
