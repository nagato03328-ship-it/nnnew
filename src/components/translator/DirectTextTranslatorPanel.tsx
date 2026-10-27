import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  RotateCcw,
  Languages,
  Check,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { SignLanguage, SpokenLanguage } from '../../types/language';
import { TranslationResult } from '../../types/translation';
import { translationService } from '../../services/translationService';

interface DirectTextTranslatorPanelProps {
  sourceSignLang: SignLanguage;
  targetSpokenLang: SpokenLanguage;
  onTranslationComplete: (result: TranslationResult) => void;
}

/**
 * Detect script / language family based on Unicode character blocks
 */
function detectInputLanguage(text: string): { langCode: string; label: string } {
  if (/[\u0D00-\u0D7F]/.test(text)) return { langCode: 'ml', label: 'Malayalam (മലയാളം)' };
  if (/[\u0900-\u097F]/.test(text)) return { langCode: 'hi', label: 'Hindi (हिन्दी)' };
  if (/[\u0B80-\u0BFF]/.test(text)) return { langCode: 'ta', label: 'Tamil (தமிழ்)' };
  if (/[\u3040-\u30FF\u4E00-\u9FAF]/.test(text)) return { langCode: 'ja', label: 'Japanese (日本語)' };
  if (/[\uAC00-\uD7AF]/.test(text)) return { langCode: 'ko', label: 'Korean (한국어)' };
  if (/[\u0600-\u06FF]/.test(text)) return { langCode: 'ar', label: 'Arabic (العربية)' };
  if (/[áéíóúñ¿¡]/i.test(text)) return { langCode: 'es', label: 'Spanish (Español)' };
  if (/[àâçéèêëîïôûùüÿœæ]/i.test(text)) return { langCode: 'fr', label: 'French (Français)' };
  if (/[äöüß]/i.test(text)) return { langCode: 'de', label: 'German (Deutsch)' };
  if (/[ãõç]/i.test(text)) return { langCode: 'pt', label: 'Portuguese (Português)' };
  return { langCode: 'en', label: 'English' };
}

export const DirectTextTranslatorPanel: React.FC<DirectTextTranslatorPanelProps> = ({
  sourceSignLang,
  targetSpokenLang,
  onTranslationComplete,
}) => {
  const [inputText, setInputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [lastTranslated, setLastTranslated] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const detected = detectInputLanguage(inputText);

  const samplePrompts = [
    'Where is the nearest hospital?',
    'I need help immediately',
    'Thank you, nice to meet you',
    'Please bring water',
    'What is your name?',
    'Can you understand sign language?',
  ];

  const handleTranslate = async (textToUse?: string) => {
    const text = (textToUse || inputText).trim();
    if (!text || isTranslating) return;

    setIsTranslating(true);
    setErrorMessage(null);

    try {
      const detectedInfo = detectInputLanguage(text);
      const srcCode = detectedInfo.langCode;
      // If user typed in the target language already, translate to English for bidirectional utility
      const tgtCode = srcCode === targetSpokenLang.id ? 'en' : targetSpokenLang.id;

      // 1. Run actual Neural Machine Translation
      const translationRes = await translationService.translateSpokenText(
        text,
        srcCode,
        tgtCode
      );

      // 2. Generate authentic Sign Language Gloss for the avatar & linguistics
      const glossRes = await translationService.generateSignLanguageGloss(
        text,
        srcCode,
        sourceSignLang.id
      );

      const result: TranslationResult = {
        id: `trans-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sourceSignLanguageId: sourceSignLang.id,
        targetSpokenLanguageId: tgtCode,
        sourceText: text,
        translatedText: translationRes.translatedText,
        timestamp: Date.now(),
        provenance: 'live',
        confidence: translationRes.match,
        engine: translationRes.engine,
        gloss: glossRes.glossText,
        notes: `Translated using ${translationRes.engine} · ${glossRes.nonManualMarkers}`,
      };

      setLastTranslated(translationRes.translatedText);
      onTranslationComplete(result);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(`Translation failed: ${error.message || 'Network error'}`);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121A2B] rounded-2xl border border-white/5 overflow-hidden shadow-xl p-5 md:p-6 justify-between space-y-5">
      <div className="space-y-4">
        {/* Top Header Strip */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#8B5CF6]">
              <Languages className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Direct Multilingual Translator</h3>
              <p className="text-[11px] text-slate-400">
                Translate any text into {targetSpokenLang.name} using the live neural translation engine.
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-md flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Neural MT
          </span>
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-medium text-slate-300">
              <label htmlFor="translator-text-input">Input Text</label>
              {inputText.trim() && (
                <span className="text-[10px] font-mono text-[#22D3EE] bg-[#22D3EE]/10 px-1.5 py-0.5 rounded">
                  Detected: {detected.label}
                </span>
              )}
            </div>
            <span className="text-[11px] font-mono">{inputText.length} characters</span>
          </div>

          <textarea
            id="translator-text-input"
            rows={5}
            value={inputText}
            disabled={isTranslating}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleTranslate();
              }
            }}
            placeholder={`Type any phrase here in English, Malayalam, Hindi, or any language (e.g. "Where is the nearest hospital?" or "നമസ്കാരം")...`}
            className="w-full p-3.5 rounded-xl bg-[#0B1020] border border-white/10 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/50 resize-none transition"
          />
        </div>

        {/* Translation route display */}
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#0B1020]/60 px-3 py-2 rounded-xl border border-white/5">
          <span className="text-slate-300 font-medium">{detected.label}</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span className="text-[#22D3EE] font-medium">
            {detected.langCode === targetSpokenLang.id
              ? 'English (Auto-inversion)'
              : `${targetSpokenLang.name} (${targetSpokenLang.nativeName})`}
          </span>
        </div>

        {/* Suggested Quick Prompts */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            Suggested Phrases to Test Real Translation
          </span>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  setInputText(prompt);
                  handleTranslate(prompt);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#182338] hover:bg-[#1E2E4A] border border-white/10 text-[11px] text-slate-300 hover:text-white transition"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
          <span>Real multilingual neural engine converts text to speech & sign avatar.</span>
        </div>

        <div className="flex items-center gap-2">
          {inputText && (
            <button
              type="button"
              onClick={() => {
                setInputText('');
                setLastTranslated(null);
                setErrorMessage(null);
              }}
              className="p-2.5 rounded-xl bg-[#182338] hover:bg-white/5 text-slate-400 hover:text-white transition"
              title="Clear input text"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            disabled={!inputText.trim() || isTranslating}
            onClick={() => handleTranslate()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-lg shadow-[#8B5CF6]/25 transition"
          >
            {isTranslating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Translating...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Translate with Real Engine</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
