import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Type,
  Share2,
} from 'lucide-react';
import { TranslationResult } from '../../types/translation';
import { speechService } from '../../services/speechService';
import { SignLanguage, SpokenLanguage } from '../../types/language';

interface TranslationPanelProps {
  currentTranslation: TranslationResult | null;
  sourceSignLang?: SignLanguage;
  targetSpokenLang?: SpokenLanguage;
  onClear: () => void;
  onToggleFavorite?: (id: string) => void;
  fontSize: 'compact' | 'normal' | 'large' | 'extra-large';
  onChangeFontSize: (size: 'compact' | 'normal' | 'large' | 'extra-large') => void;
  onTryDemo: () => void;
}

export const TranslationPanel: React.FC<TranslationPanelProps> = ({
  currentTranslation,
  sourceSignLang,
  targetSpokenLang,
  onClear,
  onToggleFavorite,
  fontSize,
  onChangeFontSize,
  onTryDemo,
}) => {
  const [copiedField, setCopiedField] = useState<'source' | 'translated' | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);

  const handleCopy = async (text: string, field: 'source' | 'translated') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleSpeak = () => {
    if (!currentTranslation || !targetSpokenLang) return;

    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    setSpeechNotice(null);

    const result = speechService.speak(
      currentTranslation.translatedText,
      targetSpokenLang.bcp47,
      {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: (err) => {
          setIsSpeaking(false);
          setSpeechNotice(`Audio playback note: ${err}`);
        },
      }
    );

    if (result.message) {
      setSpeechNotice(result.message);
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'compact':
        return 'text-base md:text-lg';
      case 'large':
        return 'text-2xl md:text-3xl';
      case 'extra-large':
        return 'text-3xl md:text-4xl';
      case 'normal':
      default:
        return 'text-xl md:text-2xl';
    }
  };

  const cycleFontSize = () => {
    const sizes: ('compact' | 'normal' | 'large' | 'extra-large')[] = [
      'compact',
      'normal',
      'large',
      'extra-large',
    ];
    const currentIndex = sizes.indexOf(fontSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    onChangeFontSize(sizes[nextIndex]);
  };

  return (
    <div className="flex flex-col h-full bg-[#121A2B] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
      {/* Top Panel Bar */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between gap-3 bg-[#0B1020]/40">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Translation Output
          </h2>
          {currentTranslation?.provenance === 'demo' ? (
            <span className="text-[11px] font-mono text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-md">
              Sample Result
            </span>
          ) : currentTranslation?.provenance === 'live' ? (
            <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Real Neural Translation
            </span>
          ) : null}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={cycleFontSize}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-300 hover:text-white bg-[#182338] hover:bg-[#1E2E4A] border border-white/10 transition"
            title={`Current size: ${fontSize}. Click to resize text`}
            aria-label="Adjust text size"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="capitalize hidden sm:inline">{fontSize}</span>
          </button>

          {currentTranslation && (
            <>
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(currentTranslation.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-white/5 border border-white/5 transition"
                  title={currentTranslation.isFavorite ? 'Remove from favorites' : 'Save to favorites'}
                  aria-label="Toggle favorite"
                >
                  {currentTranslation.isFavorite ? (
                    <BookmarkCheck className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onClear}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 border border-white/5 transition"
                title="Clear translation"
                aria-label="Clear translation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Translation Content Area */}
      <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
        {currentTranslation ? (
          <div className="space-y-6">
            {/* Target Spoken Language Output (Primary) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium text-[#22D3EE]">
                  {targetSpokenLang?.name || 'Spoken Translation'} ({targetSpokenLang?.nativeName})
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(currentTranslation.translatedText, 'translated')}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
                  title="Copy translated text"
                >
                  {copiedField === 'translated' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div
                className={`font-semibold text-white tracking-tight leading-relaxed select-text ${getFontSizeClass()}`}
                dir={targetSpokenLang?.direction || 'ltr'}
              >
                {currentTranslation.translatedText}
              </div>
            </div>

            {/* Source Recognized Meaning / Transcription */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium text-[#8B5CF6]">
                  Recognized {sourceSignLang?.name || 'Sign'} Expression
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(currentTranslation.sourceText, 'source')}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
                  title="Copy recognized sign transcription"
                >
                  {copiedField === 'source' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-sm md:text-base text-slate-300 font-normal leading-normal italic">
                "{currentTranslation.sourceText}"
              </div>
            </div>

            {/* Provenance and Timestamp Metadata (Clean unboxed text, no slop pills) */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
              <span>
                {currentTranslation.provenance === 'demo'
                  ? 'Sample verified dataset'
                  : currentTranslation.engine || 'Live Neural MT Engine'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {new Date(currentTranslation.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              {currentTranslation.notes && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-400 truncate">{currentTranslation.notes}</span>
                </>
              )}
            </div>

            {/* Speech Notice Note if using fallback voice */}
            {speechNotice && (
              <div className="text-[11px] text-slate-400 bg-white/5 p-2 rounded-lg border border-white/5">
                {speechNotice}
              </div>
            )}
          </div>
        ) : (
          /* Empty State when no translation is loaded */
          <div className="my-auto text-center py-10 px-4 space-y-4 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-xl bg-[#182338] border border-white/10 flex items-center justify-center mx-auto text-[#22D3EE]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Awaiting Sign Input
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                When signs are recognized, their translated meaning in {targetSpokenLang?.name || 'spoken language'} will appear here with voice playback and sign avatar synthesis.
              </p>
            </div>
            <button
              type="button"
              onClick={onTryDemo}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/40 text-white text-xs font-medium transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>Load Verified Demo Example</span>
            </button>
          </div>
        )}

        {/* Bottom Audio & Playback Controls Bar */}
        {currentTranslation && (
          <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSpeak}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition ${
                isSpeaking
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-[#22D3EE] text-slate-950 hover:bg-[#06B6D4]'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>Stop Speech</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Speak Translation</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSpeak}
              className="p-2 rounded-xl bg-[#182338] hover:bg-[#1E2E4A] border border-white/10 text-slate-300 hover:text-white transition"
              title="Replay pronunciation"
              aria-label="Replay pronunciation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
