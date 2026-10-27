import React from 'react';
import { X, Sparkles, Check, ArrowRight } from 'lucide-react';
import { DEMO_PRESETS, DemoPreset } from '../../data/demoTranslations';
import { SIGN_LANGUAGES, SPOKEN_LANGUAGES } from '../../data/languages';

interface TryDemoSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: DemoPreset) => void;
  currentPresetId?: string;
}

export const TryDemoSelector: React.FC<TryDemoSelectorProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  currentPresetId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="w-full max-w-2xl rounded-2xl bg-[#121A2B] border border-white/10 p-6 shadow-2xl text-[#F8FAFC] my-8 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-labelledby="demo-selector-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#22D3EE]/20 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="demo-selector-title" className="text-base font-semibold text-white">
                Select a Verified Demo Translation
              </h2>
              <p className="text-xs text-slate-400">
                Load authentic sample sign recognition pairs to evaluate voice, avatar, and text pipelines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
            aria-label="Close demo picker"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Cards List */}
        <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
          {DEMO_PRESETS.map((preset) => {
            const isSelected = preset.id === currentPresetId;
            const signLang = SIGN_LANGUAGES.find((s) => s.id === preset.signLanguageId);
            const spokenLang = SPOKEN_LANGUAGES.find((s) => s.id === preset.spokenLanguageId);

            return (
              <div
                key={preset.id}
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
                className={`p-4 rounded-xl border text-left cursor-pointer transition flex flex-col gap-2.5 ${
                  isSelected
                    ? 'bg-[#182338] border-[#22D3EE]/60 shadow-md ring-1 ring-[#22D3EE]/30'
                    : 'bg-[#182338]/60 hover:bg-[#182338] border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      {preset.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#8B5CF6] bg-[#8B5CF6]/15 px-2 py-0.5 rounded">
                      {signLang?.code} → {spokenLang?.code}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[#22D3EE]">
                      <Check className="w-3.5 h-3.5" />
                      Loaded
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-[#0B1020]/60 p-2.5 rounded-lg border border-white/5">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
                      Source Meaning ({signLang?.name})
                    </span>
                    <span className="text-slate-200 italic font-medium">"{preset.sourceText}"</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#22D3EE] block mb-0.5">
                      Translated ({spokenLang?.name} · {spokenLang?.nativeName})
                    </span>
                    <span className="text-white font-semibold">{preset.translatedText}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{preset.description}</span>
                  <span className="text-[#8B5CF6] flex items-center gap-1 font-medium group-hover:translate-x-0.5 transition-transform">
                    Load <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>* Demo results are clearly marked and never attributed to live camera.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
