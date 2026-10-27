import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Subtitles,
  Activity,
  Layers,
} from 'lucide-react';

interface SignAvatarPanelProps {
  currentText?: string;
  sourceSignLanguageName?: string;
  targetSpokenLanguageName?: string;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

export const SignAvatarPanel: React.FC<SignAvatarPanelProps> = ({
  currentText = '',
  sourceSignLanguageName = 'Indian Sign Language',
  targetSpokenLanguageName = 'Malayalam',
  isPlaying: externalIsPlaying,
  onTogglePlay: externalTogglePlay,
  speed,
  onSpeedChange,
}) => {
  const [internalPlaying, setInternalPlaying] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [progress, setProgress] = useState(0);
  const progressRef = React.useRef(0);

  const isPlaying = externalIsPlaying !== undefined ? externalIsPlaying : internalPlaying;

  const handleToggle = () => {
    if (externalTogglePlay) {
      externalTogglePlay();
    } else {
      setInternalPlaying((prev) => !prev);
    }
  };

  const handleReset = () => {
    progressRef.current = 0;
    setProgress(0);
    if (externalTogglePlay && isPlaying) externalTogglePlay();
    else setInternalPlaying(false);
  };

  // Simulate smooth animation timeline progress when playing
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        const next = progressRef.current + 2 * speed;
        if (next >= 100) {
          progressRef.current = 0;
          setProgress(0);
          clearInterval(timer);
          if (externalTogglePlay) externalTogglePlay();
          else setInternalPlaying(false);
        } else {
          progressRef.current = next;
          setProgress(next);
        }
      }, 50);
    }
    return () => clearInterval(timer);
  }, [isPlaying, speed, externalTogglePlay]);

  const speedOptions = [0.5, 0.75, 1.0, 1.25];

  return (
    <div className="flex flex-col bg-[#121A2B] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
      {/* Top Bar */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-[#0B1020]/40">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#22D3EE]" />
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Sign Language Avatar
          </h3>
          <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
            3D Studio
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowSubtitles(!showSubtitles)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition border ${
            showSubtitles
              ? 'bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/40'
              : 'text-slate-400 hover:text-white border-white/5'
          }`}
          title="Toggle sign translation subtitles"
        >
          <Subtitles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Captions</span>
        </button>
      </div>

      {/* Avatar Viewport Area */}
      <div className="relative aspect-video sm:aspect-square max-h-[380px] bg-[#070A14] flex items-center justify-center overflow-hidden">
        {/* Render High-Fidelity 3D Avatar Image Asset */}
        <img
          src="/src/assets/images/sign_avatar_model_1792593293922.jpg"
          alt="Sign Language Avatar Interpreter"
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isPlaying ? 'scale-[1.02]' : 'scale-100'
          }`}
          referrerPolicy="no-referrer"
        />

        {/* Dynamic Skeleton Mesh Line Overlay when simulating avatar motion */}
        {isPlaying && (
          <div className="absolute inset-0 bg-radial from-transparent to-[#0B1020]/40 pointer-events-none">
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B1020]/80 border border-[#8B5CF6]/50 backdrop-blur-md text-[11px] text-[#22D3EE] font-mono animate-pulse">
              <Activity className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Synthesizing Keyframe Stream ({Math.round(progress)}%)</span>
            </div>
          </div>
        )}

        {/* Subtitle Caption Bar */}
        {showSubtitles && currentText && (
          <div className="absolute bottom-4 left-4 right-4 z-10 text-center">
            <div className="inline-block max-w-full px-4 py-2 rounded-xl bg-[#0B1020]/90 border border-white/10 backdrop-blur-md text-xs sm:text-sm font-medium text-white shadow-xl truncate">
              {currentText}
            </div>
          </div>
        )}

        {/* Honest Engine Status Badge in corner */}
        <div className="absolute top-3 left-3 z-10">
          <div className="px-2.5 py-1 rounded-lg bg-[#0B1020]/85 border border-white/10 backdrop-blur-md flex items-center gap-1.5 text-[10px] text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Sign generation engine is not connected yet</span>
          </div>
        </div>
      </div>

      {/* Timeline progress indicator */}
      <div className="w-full bg-white/5 h-1">
        <div
          className="bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] h-1 transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Control Bar */}
      <div className="p-3 border-t border-white/5 bg-[#0B1020]/50 flex items-center justify-between gap-3">
        {/* Play / Pause / Replay Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold shadow-sm transition"
            aria-label={isPlaying ? 'Pause avatar animation' : 'Play avatar animation'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-xl bg-[#182338] hover:bg-[#1E2E4A] border border-white/10 text-slate-300 hover:text-white transition"
            title="Replay from start"
            aria-label="Replay animation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Playback Speed Selector */}
        <div className="flex items-center gap-1 bg-[#182338] p-1 rounded-lg border border-white/5">
          <span className="text-[10px] text-slate-400 px-1 font-mono">Speed</span>
          {speedOptions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeedChange(s)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition ${
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
