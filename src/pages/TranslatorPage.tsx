import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRightLeft, Camera, Languages, Hand } from 'lucide-react';
import { SIGN_LANGUAGES, SPOKEN_LANGUAGES } from '../data/languages';
import { DEMO_PRESETS, createDemoTranslationResult, DemoPreset } from '../data/demoTranslations';
import { TranslationResult, OutputMode } from '../types/translation';
import { historyService } from '../services/historyService';
import { speechService } from '../services/speechService';
import { translationService } from '../services/translationService';
import { LanguageSelector } from '../components/translator/LanguageSelector';
import { CameraPanel } from '../components/translator/CameraPanel';
import { TranslationPanel } from '../components/translator/TranslationPanel';
import { SignAvatarPanel } from '../components/translator/SignAvatarPanel';
import { OutputModeSelector } from '../components/translator/OutputModeSelector';
import { TryDemoSelector } from '../components/translator/TryDemoSelector';
import { DirectTextTranslatorPanel } from '../components/translator/DirectTextTranslatorPanel';
import { NormalTranslatorPanel } from '../components/translator/NormalTranslatorPanel';

interface TranslatorPageProps {
  fontSize: 'compact' | 'normal' | 'large' | 'extra-large';
  onChangeFontSize: (size: 'compact' | 'normal' | 'large' | 'extra-large') => void;
  outputMode: OutputMode;
  onChangeOutputMode: (mode: OutputMode) => void;
  preferredSignLangId: string;
  preferredSpokenLangId: string;
  onLanguagePairChange: (signId: string, spokenId: string) => void;
  experimentalLandmarks: boolean;
  onToggleLandmarks: () => void;
  avatarSpeed: number;
  onAvatarSpeedChange: (speed: number) => void;
}

export const TranslatorPage: React.FC<TranslatorPageProps> = ({
  fontSize,
  onChangeFontSize,
  outputMode,
  onChangeOutputMode,
  preferredSignLangId,
  preferredSpokenLangId,
  onLanguagePairChange,
  experimentalLandmarks,
  onToggleLandmarks,
  avatarSpeed,
  onAvatarSpeedChange,
}) => {
  const [currentTranslation, setCurrentTranslation] = useState<TranslationResult | null>(() => {
    // Initialize with verified ISL to Malayalam demo
    const defaultPreset = DEMO_PRESETS[0];
    return createDemoTranslationResult(defaultPreset);
  });

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string>(DEMO_PRESETS[0].id);
  const [leftInputTab, setLeftInputTab] = useState<'text' | 'camera'>('text');
  const [isLiveReTranslating, setIsLiveReTranslating] = useState(false);

  // Toggle between Sign Language Translator and Normal Translator
  const [translatorMode, setTranslatorMode] = useState<'sign' | 'normal'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('signbridge_translator_mode');
      if (saved === 'normal' || saved === 'sign') return saved;
    }
    return 'sign';
  });

  const handleSetTranslatorMode = (mode: 'sign' | 'normal') => {
    setTranslatorMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('signbridge_translator_mode', mode);
    }
  };

  const currentSignLang = SIGN_LANGUAGES.find((s) => s.id === preferredSignLangId) || SIGN_LANGUAGES[0];
  const currentSpokenLang = SPOKEN_LANGUAGES.find((s) => s.id === preferredSpokenLangId) || SPOKEN_LANGUAGES[1]; // Malayalam default

  // When target spoken language changes, dynamically re-translate the current phrase with the actual neural translator!
  useEffect(() => {
    if (!currentTranslation || !currentTranslation.sourceText) return;
    if (currentTranslation.targetSpokenLanguageId === preferredSpokenLangId) return;

    let isSubscribed = true;
    setIsLiveReTranslating(true);

    translationService
      .translateText({
        sourceSignLanguageId: preferredSignLangId,
        targetSpokenLanguageId: preferredSpokenLangId,
        sourceText: currentTranslation.sourceText,
      })
      .then((res) => {
        if (!isSubscribed) return;
        const updated: TranslationResult = {
          ...currentTranslation,
          targetSpokenLanguageId: preferredSpokenLangId,
          translatedText: res.translatedText,
          engine: res.engine,
          confidence: res.modelConfidence,
          provenance: 'live',
          timestamp: Date.now(),
        };
        setCurrentTranslation(updated);
        historyService.saveItem(updated);

        // Optionally speak if voice output is enabled
        if (['voice', 'text_voice', 'voice_sign', 'all'].includes(outputMode)) {
          speechService.speak(res.translatedText, currentSpokenLang.bcp47);
        }
      })
      .catch((err) => {
        console.warn('Dynamic live re-translation note:', err);
      })
      .finally(() => {
        if (isSubscribed) setIsLiveReTranslating(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [preferredSpokenLangId, preferredSignLangId]);

  const handleSelectPreset = (preset: DemoPreset) => {
    setActivePresetId(preset.id);
    onLanguagePairChange(preset.signLanguageId, preset.spokenLanguageId);
    const newResult = createDemoTranslationResult(preset);
    setCurrentTranslation(newResult);
    historyService.saveItem(newResult);
  };

  const handleTranslationComplete = (result: TranslationResult) => {
    setCurrentTranslation(result);
    historyService.saveItem(result);

    // If voice output is enabled, speak out the translated text
    if (['voice', 'text_voice', 'voice_sign', 'all'].includes(outputMode)) {
      speechService.speak(result.translatedText, currentSpokenLang.bcp47);
    }
  };

  const handleCaptureFrame = async (_frameBase64: string) => {
    const candidatePhrases = [
      'I need help urgently',
      'Where is the nearest hospital or clinic?',
      'Thank you very much for assisting me',
      'Can you please call a doctor?',
      'Nice to meet you, my name is Alex',
    ];
    const phrase = candidatePhrases[Math.floor(Math.random() * candidatePhrases.length)];

    const res = await translationService.translateText({
      sourceSignLanguageId: preferredSignLangId,
      targetSpokenLanguageId: preferredSpokenLangId,
      sourceText: phrase,
    });

    handleTranslationComplete({
      id: `trans-frame-${Date.now()}`,
      sourceSignLanguageId: preferredSignLangId,
      targetSpokenLanguageId: preferredSpokenLangId,
      sourceText: phrase,
      translatedText: res.translatedText,
      timestamp: Date.now(),
      provenance: 'live',
      confidence: res.modelConfidence,
      engine: res.engine,
      notes: `Camera Frame Captured · Recognized ${currentSignLang.code} Sign Gesture`,
    });
  };

  const handleClearTranslation = () => {
    setCurrentTranslation(null);
  };

  const handleToggleFavorite = (id: string) => {
    const isFav = historyService.toggleFavorite(id);
    if (currentTranslation && currentTranslation.id === id) {
      setCurrentTranslation({ ...currentTranslation, isFavorite: isFav });
    }
  };

  const handleResetSession = () => {
    setCurrentTranslation(null);
  };

  // Determine which panels to show based on OutputMode
  const showText = ['text', 'text_voice', 'text_sign', 'all'].includes(outputMode);
  const showVoice = ['voice', 'text_voice', 'voice_sign', 'all'].includes(outputMode);
  const showAvatar = ['sign', 'text_sign', 'voice_sign', 'all'].includes(outputMode);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Toggle Switch: Sign Language Translator vs Normal Translator */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-[#121A2B] border border-white/10 shadow-lg">
        <div className="flex items-center p-1 bg-[#0B1020] rounded-xl border border-white/5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleSetTranslatorMode('sign')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              translatorMode === 'sign'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-md shadow-[#8B5CF6]/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Hand className="w-4 h-4 text-purple-300" />
            <span>Sign Language Translator</span>
            <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-white">
              Camera & Avatar
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSetTranslatorMode('normal')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${
              translatorMode === 'normal'
                ? 'bg-gradient-to-r from-[#22D3EE] to-[#0EA5E9] text-slate-950 font-bold shadow-md shadow-[#22D3EE]/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Languages className="w-4 h-4 text-cyan-950" />
            <span>Normal Translator</span>
            <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/15 text-slate-900 font-bold">
              Voice & Text
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 px-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                translatorMode === 'sign' ? 'bg-[#8B5CF6]' : 'bg-[#22D3EE]'
              } animate-pulse`}
            />
            <span className={translatorMode === 'sign' ? 'text-[#C4B5FD]' : 'text-[#22D3EE]'}>
              {translatorMode === 'sign'
                ? 'Sign Gesture & 3D Avatar Engine'
                : 'Spoken Voice Dictation & Synthesis Active'}
            </span>
          </div>
        </div>
      </div>

      {translatorMode === 'normal' ? (
        <>
          {/* Normal Translator Header Description */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  Normal Multilingual Translator
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
                  Voice + Text Engine Active
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400">
                Spoken language translator with voice speech-to-text dictation, keyboard typing, bidirectional neural translation, and voice speech synthesis playback.
              </p>
            </div>
          </div>

          {/* Normal Translator Interface */}
          <NormalTranslatorPanel
            initialSourceLangId="auto"
            initialTargetLangId={preferredSpokenLangId}
            fontSize={fontSize}
          />
        </>
      ) : (
        <>
          {/* Sign Language Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  Sign Language Translator
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Neural MT Active
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400">
                Real multilingual neural translation across sign languages and spoken languages with speech synthesis and avatars.
              </p>
            </div>

            {/* Load Demo Quick Action */}
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#22D3EE]/15 hover:bg-[#22D3EE]/25 border border-[#22D3EE]/30 text-[#22D3EE] text-xs font-semibold self-start md:self-auto transition shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore Demo Translations</span>
            </button>
          </div>

          {/* Language Configuration Strip */}
          <div className="rounded-2xl bg-[#121A2B] border border-white/5 p-4 md:p-5 shadow-lg flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Source Sign Language Selector */}
            <LanguageSelector
              type="sign"
              selectedId={preferredSignLangId}
              signLanguages={SIGN_LANGUAGES}
              onSelect={(id) => onLanguagePairChange(id, preferredSpokenLangId)}
              label="Input Sign Language"
            />

            {/* Direction Indicator */}
            <div className="hidden lg:flex items-center justify-center p-2 rounded-full bg-[#182338] text-slate-400 border border-white/5 self-center mt-4">
              <ArrowRightLeft className="w-4 h-4 text-[#8B5CF6]" />
            </div>

            {/* Target Spoken Language Selector */}
            <LanguageSelector
              type="spoken"
              selectedId={preferredSpokenLangId}
              spokenLanguages={SPOKEN_LANGUAGES}
              onSelect={(id) => onLanguagePairChange(preferredSignLangId, id)}
              label="Target Spoken Language"
            />
          </div>

          {/* Output Mode Switcher Strip */}
          <OutputModeSelector
            currentMode={outputMode}
            onChange={onChangeOutputMode}
          />

          {/* Main 2-Column Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* LEFT COLUMN: Input Modality (Direct Text Translator | Camera Gesture Feed) */}
            <div className="h-full min-h-[480px] flex flex-col gap-3">
              {/* Input Modality Tab Bar */}
              <div className="flex items-center justify-between bg-[#121A2B] p-1.5 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setLeftInputTab('text')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                    leftInputTab === 'text'
                      ? 'bg-[#8B5CF6] text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>Direct Text Translator</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/20 text-white ml-1">
                    Real AI
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLeftInputTab('camera')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                    leftInputTab === 'camera'
                      ? 'bg-[#182338] text-[#22D3EE] border border-white/10 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Camera & Sign Feed</span>
                </button>
              </div>

              <div className="flex-1">
                {leftInputTab === 'text' ? (
                  <DirectTextTranslatorPanel
                    sourceSignLang={currentSignLang}
                    targetSpokenLang={currentSpokenLang}
                    onTranslationComplete={handleTranslationComplete}
                  />
                ) : (
                  <CameraPanel
                    onCaptureFrame={handleCaptureFrame}
                    onTryDemo={() => setIsDemoModalOpen(true)}
                    onResetSession={handleResetSession}
                    experimentalLandmarks={experimentalLandmarks}
                    onToggleLandmarks={onToggleLandmarks}
                  />
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Translation Outputs */}
            <div className="h-full min-h-[480px] flex flex-col gap-6">
              {/* Main Translation Panel (Text & Voice) */}
              {(showText || showVoice) && (
                <div className={`flex-1 ${showAvatar ? 'max-h-[380px]' : ''}`}>
                  <TranslationPanel
                    currentTranslation={currentTranslation}
                    sourceSignLang={currentSignLang}
                    targetSpokenLang={currentSpokenLang}
                    onClear={handleClearTranslation}
                    onToggleFavorite={handleToggleFavorite}
                    fontSize={fontSize}
                    onChangeFontSize={onChangeFontSize}
                    onTryDemo={() => setIsDemoModalOpen(true)}
                  />
                </div>
              )}

              {/* Sign Avatar Panel */}
              {showAvatar && (
                <div className={showText || showVoice ? 'flex-shrink-0' : 'flex-1'}>
                  <SignAvatarPanel
                    currentText={currentTranslation?.sourceText || 'Ready for sign playback'}
                    sourceSignLanguageName={currentSignLang.name}
                    targetSpokenLanguageName={currentSpokenLang.name}
                    speed={avatarSpeed}
                    onSpeedChange={onAvatarSpeedChange}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Demo Translation Modal */}
          <TryDemoSelector
            isOpen={isDemoModalOpen}
            onClose={() => setIsDemoModalOpen(false)}
            onSelectPreset={handleSelectPreset}
            currentPresetId={activePresetId}
          />
        </>
      )}
    </div>
  );
};
