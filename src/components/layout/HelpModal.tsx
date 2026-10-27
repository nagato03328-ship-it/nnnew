import React from 'react';
import { X, ShieldCheck, Camera, Volume2, Sparkles, AlertCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        className="w-full max-w-xl rounded-2xl bg-[#121A2B] border border-white/10 p-6 md:p-8 shadow-2xl text-[#F8FAFC] my-8"
        role="dialog"
        aria-labelledby="help-modal-title"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#22D3EE]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="help-modal-title" className="text-lg font-semibold text-white">How AISLT Works</h2>
              <p className="text-xs text-slate-400">Prototype Guide & Privacy Standard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm text-slate-300">
          <div className="rounded-xl bg-[#182338] p-4 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium text-sm">
              <Camera className="w-4 h-4 text-[#22D3EE]" />
              <span>Camera Privacy & Transparency</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your camera operates strictly client-side. The prototype does not record or upload your video feed anywhere without explicit permission. When camera is stopped, all hardware streams terminate immediately.
            </p>
          </div>

          <div className="rounded-xl bg-[#182338] p-4 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium text-sm">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Realistic Demo Mode vs Live AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Continuous sign language recognition requires high-bandwidth neural models. In this standalone frontend prototype, click <strong className="text-white">"Try demo translation"</strong> to test how recognized phrases flow through spoken translation, voice synthesis, and avatar outputs. We never pretend the camera is recognizing signs when an AI backend is not connected.
            </p>
          </div>

          <div className="rounded-xl bg-[#182338] p-4 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium text-sm">
              <Volume2 className="w-4 h-4 text-[#8B5CF6]" />
              <span>Speech & Output Modes</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The Voice output mode utilizes your browser's Web Speech API. If a native voice for Malayalam, Hindi, or Tamil is installed on your OS, it will speak naturally. Switch between Text, Voice, and Sign Avatar output modes at any time.
            </p>
          </div>

          <div className="rounded-xl bg-[#182338] p-4 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Natural Sign Languages</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Indian Sign Language (ISL), American Sign Language (ASL), British Sign Language (BSL), and Japanese Sign Language (JSL) are sovereign natural languages with distinct grammatical rules, two-handed/one-handed systems, and vocabulary. AISLT honors their linguistic independence.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-sm font-medium transition shadow-md"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
