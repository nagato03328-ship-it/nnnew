import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Server,
  Trash2,
  RotateCcw,
  Check,
  Moon,
  Sun,
  Volume2,
  Sliders,
  Camera,
  Layers,
  Lock,
} from 'lucide-react';
import { UserPreferences } from '../types/settings';
import { OutputMode } from '../types/translation';
import { preferencesService } from '../services/preferencesService';
import { historyService } from '../services/historyService';
import { translationService } from '../services/translationService';
import { SIGN_LANGUAGES, SPOKEN_LANGUAGES } from '../data/languages';
import { BackendStatus } from '../types/translation';

interface SettingsPageProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updated: Partial<UserPreferences>) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  preferences,
  onUpdatePreferences,
}) => {
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [testingEndpoint, setTestingEndpoint] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [apiInput, setApiInput] = useState(preferences.apiBaseUrl);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setTestingEndpoint(true);
    const status = await translationService.getBackendStatus();
    setBackendStatus(status);
    setTestingEndpoint(false);
  };

  const handleSaveApiUrl = () => {
    onUpdatePreferences({ apiBaseUrl: apiInput.trim() });
    setSaveFeedback(true);
    setTimeout(() => {
      setSaveFeedback(false);
      checkStatus();
    }, 600);
  };

  const handleClearAllHistory = () => {
    if (confirm('Permanently wipe all locally stored translation logs and favorites?')) {
      historyService.clearAll();
      alert('Local history has been completely wiped.');
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all application preferences to original defaults?')) {
      const def = preferencesService.resetDefaults();
      onUpdatePreferences(def);
      setApiInput(def.apiBaseUrl);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/5">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Settings & Privacy
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            Configure system preferences, audio synthesis parameters, and AI model endpoints.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121A2B] hover:bg-[#182338] border border-white/10 text-slate-300 text-xs font-medium self-start md:self-auto transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Section 1: Language & Default Output Preferences */}
      <div className="rounded-2xl bg-[#121A2B] border border-white/5 p-5 md:p-6 space-y-5 shadow-lg">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#8B5CF6]" />
          <span>Translation Preferences</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Default Sign Language */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Default Input Sign Language
            </label>
            <select
              value={preferences.preferredInputSignLanguage}
              onChange={(e) => onUpdatePreferences({ preferredInputSignLanguage: e.target.value })}
              className="w-full py-2 px-3 rounded-xl bg-[#182338] border border-white/10 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
            >
              {SIGN_LANGUAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) - {s.region}
                </option>
              ))}
            </select>
          </div>

          {/* Default Spoken Language */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Default Output Spoken Language
            </label>
            <select
              value={preferences.preferredOutputSpokenLanguage}
              onChange={(e) => onUpdatePreferences({ preferredOutputSpokenLanguage: e.target.value })}
              className="w-full py-2 px-3 rounded-xl bg-[#182338] border border-white/10 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
            >
              {SPOKEN_LANGUAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.nativeName}) - {s.code}
                </option>
              ))}
            </select>
          </div>

          {/* Default Output Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Default Output Channels
            </label>
            <select
              value={preferences.defaultOutputMode}
              onChange={(e) => onUpdatePreferences({ defaultOutputMode: e.target.value as OutputMode })}
              className="w-full py-2 px-3 rounded-xl bg-[#182338] border border-white/10 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="text">Text Only</option>
              <option value="voice">Voice Only</option>
              <option value="sign">Sign Avatar Only</option>
              <option value="text_voice">Text + Voice (Recommended)</option>
              <option value="text_sign">Text + Sign Avatar</option>
              <option value="voice_sign">Voice + Sign Avatar</option>
              <option value="all">All Channels (Text, Voice, Avatar)</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Translation Text Scale
            </label>
            <select
              value={preferences.fontSize}
              onChange={(e) => onUpdatePreferences({ fontSize: e.target.value as any })}
              className="w-full py-2 px-3 rounded-xl bg-[#182338] border border-white/10 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="compact">Compact (Standard scannable)</option>
              <option value="normal">Normal (Balanced)</option>
              <option value="large">Large (High legibility)</option>
              <option value="extra-large">Extra Large (High accessibility)</option>
            </select>
          </div>
        </div>

        {/* Checkbox Toggles */}
        <div className="pt-2 border-t border-white/5 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={preferences.autoPlayVoice}
              onChange={(e) => onUpdatePreferences({ autoPlayVoice: e.target.checked })}
              className="rounded bg-[#182338] border-white/10 text-[#8B5CF6] focus:ring-0"
            />
            <span>Auto-play speech synthesis automatically when translation completes</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={preferences.experimentalLandmarks}
              onChange={(e) => onUpdatePreferences({ experimentalLandmarks: e.target.checked })}
              className="rounded bg-[#182338] border-white/10 text-[#8B5CF6] focus:ring-0"
            />
            <span>Show experimental camera landmark mesh overlay (client-side render)</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={preferences.reduceMotion}
              onChange={(e) => onUpdatePreferences({ reduceMotion: e.target.checked })}
              className="rounded bg-[#182338] border-white/10 text-[#8B5CF6] focus:ring-0"
            />
            <span>Reduce interface motion and animations (WCAG compliance)</span>
          </label>
        </div>
      </div>

      {/* Section 2: Speech Synthesis Controls */}
      <div className="rounded-2xl bg-[#121A2B] border border-white/5 p-5 md:p-6 space-y-4 shadow-lg">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-[#22D3EE]" />
          <span>Speech Synthesis Controls</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Speech Speed Rate</span>
              <span className="font-mono">{preferences.speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={preferences.speechRate}
              onChange={(e) => onUpdatePreferences({ speechRate: parseFloat(e.target.value) })}
              className="w-full accent-[#8B5CF6]"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Speech Pitch</span>
              <span className="font-mono">{preferences.speechPitch}x</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.1"
              value={preferences.speechPitch}
              onChange={(e) => onUpdatePreferences({ speechPitch: parseFloat(e.target.value) })}
              className="w-full accent-[#22D3EE]"
            />
          </div>
        </div>
      </div>

      {/* Section 3: AI Backend Engine & Architecture Status */}
      <div className="rounded-2xl bg-[#121A2B] border border-white/5 p-5 md:p-6 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>AI Backend Engine Integration</span>
          </h2>
          <button
            type="button"
            onClick={checkStatus}
            disabled={testingEndpoint}
            className="text-[11px] font-mono text-[#22D3EE] hover:underline"
          >
            {testingEndpoint ? 'Pinging endpoint...' : 'Test Connection'}
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0B1020]/70 border border-white/5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Current Architecture State:</span>
            <span className="font-mono text-amber-300">
              {backendStatus?.statusMessage || 'Standalone Prototype Mode'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Model Engine:</span>
            <span className="font-mono text-slate-300">
              {backendStatus?.modelName || 'None (Client Previews Active)'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-300 block">
            Custom AI Backend Base URL (VITE_API_BASE_URL)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={apiInput}
              onChange={(e) => setApiInput(e.target.value)}
              placeholder="https://api.signbridge.ai"
              className="flex-1 py-2 px-3 rounded-xl bg-[#182338] border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#8B5CF6]"
            />
            <button
              type="button"
              onClick={handleSaveApiUrl}
              className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-xl text-white text-xs font-semibold transition flex items-center gap-1.5"
            >
              {saveFeedback ? <Check className="w-3.5 h-3.5 text-white" /> : null}
              <span>Save</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Accepts REST endpoints matching AISLT specification (e.g. POST /api/translation/recognize).
          </p>
        </div>
      </div>

      {/* Section 4: Privacy & Data Safeguards */}
      <div className="rounded-2xl bg-[#121A2B] border border-white/5 p-5 md:p-6 space-y-4 shadow-lg">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Privacy & Data Sovereignty</span>
        </h2>

        <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
          <p>
            • <strong>No Automatic Video Streaming:</strong> The camera only initiates upon explicit user action ("Start Camera") and can be revoked instantly.
          </p>
          <p>
            • <strong>Local Processing:</strong> Neither video frames nor audio speech waveforms are transmitted to external servers in prototype mode.
          </p>
          <p>
            • <strong>Clear Storage:</strong> You can purge all cached translations, favorites, and session records with one click.
          </p>
        </div>

        <div className="pt-2 flex justify-start">
          <button
            type="button"
            onClick={handleClearAllHistory}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-medium transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge All Local Records</span>
          </button>
        </div>
      </div>
    </div>
  );
};
