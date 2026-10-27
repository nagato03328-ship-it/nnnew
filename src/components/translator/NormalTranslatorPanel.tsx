import React, { useState, useEffect, useRef } from 'react';
import {
  Languages,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  ArrowRightLeft,
  Sparkles,
  Send,
  Star,
  AlertCircle,
  HelpCircle,
  Trash2,
  CheckCircle2,
  Clock,
  Settings2,
  Volume1,
} from 'lucide-react';
import { SPOKEN_LANGUAGES } from '../../data/languages';
import { SpokenLanguage } from '../../types/language';
import { TranslationResult } from '../../types/translation';
import { translationService } from '../../services/translationService';
import { speechService } from '../../services/speechService';
import { historyService } from '../../services/historyService';

interface NormalTranslatorPanelProps {
  initialSourceLangId?: string;
  initialTargetLangId?: string;
  fontSize?: 'compact' | 'normal' | 'large' | 'extra-large';
}

// Language sample presets for one-click testing
const SAMPLE_PHRASES: Record<string, string[]> = {
  en: [
    'Where is the nearest hospital or clinic?',
    'Hello, how are you doing today?',
    'Thank you very much for your kind assistance.',
    'I need urgent medical help, please call an ambulance.',
    'Could you please speak a little slower?',
  ],
  ml: [
    'നമസ്കാരം, സുഖമാണോ?',
    'അടുത്തുള്ള ആശുപത്രി എവിടെയാണ്?',
    'എനിക്ക് അടിയന്തരമായി സഹായം വേണം.',
    'വളരെ നന്ദി, താങ്കളെ കണ്ടതിൽ സന്തോഷം.',
  ],
  hi: [
    'नमस्ते, आप कैसे हैं?',
    'निकटतम अस्पताल कहाँ है?',
    'मुझे तत्काल सहायता चाहिए।',
    'बहुत-बहुत धन्यवाद, आपसे मिलकर खुशी हुई।',
  ],
  ta: [
    'வணக்கம், எப்படி இருக்கிறீர்கள்?',
    'அருகிலுள்ள மருத்துவமனை எங்கே இருக்கிறது?',
    'எனக்கு உடனடியாக உதவி தேவை.',
    'மிக்க நன்றி, உங்களை சந்தித்ததில் மகிழ்ச்சி.',
  ],
  es: [
    'Hola, ¿cómo estás hoy?',
    '¿Dónde está el hospital o la farmacia más cercana?',
    'Muchas gracias por toda tu ayuda.',
    'Necesito asistencia médica urgente por favor.',
  ],
  fr: [
    'Bonjour, comment allez-vous aujourd’hui?',
    'Où se trouve l’hôpital le plus proche?',
    'Merci beaucoup pour votre précieuse aide.',
    'J’ai besoin d’une assistance urgente s’il vous plaît.',
  ],
  de: [
    'Guten Tag, wie geht es Ihnen?',
    'Wo befindet sich das nächste Krankenhaus?',
    'Vielen Dank für Ihre freundliche Hilfe.',
    'Ich brauche bitte dringende Unterstützung.',
  ],
  ja: [
    'こんにちは、お元気ですか？',
    '一番近い病院はどこにありますか？',
    'ご親切にありがとうございます。',
    '緊急の助けが必要です。',
  ],
  ko: [
    '안녕하세요, 오늘 어떻게 지내세요?',
    '가장 가까운 병원은 어디에 있습니까?',
    '도와주셔서 정말 감사합니다.',
    '긴급한 도움이 필요합니다.',
  ],
  ar: [
    'مرحبا، كيف حالك اليوم؟',
    'أين يقع أقرب مستشفى أو صيدلية؟',
    'شكرا جزيلا لك على مساعدتك.',
    'أحتاج إلى مساعدة عاجلة من فضلك.',
  ],
  pt: [
    'Olá, como você está hoje?',
    'Onde fica o hospital mais próximo?',
    'Muito obrigado pela sua gentileza e ajuda.',
    'Preciso de ajuda urgente por favor.',
  ],
};

function detectLanguageFromText(text: string): { id: string; name: string } {
  if (/[\u0D00-\u0D7F]/.test(text)) return { id: 'ml', name: 'Malayalam' };
  if (/[\u0900-\u097F]/.test(text)) return { id: 'hi', name: 'Hindi' };
  if (/[\u0B80-\u0BFF]/.test(text)) return { id: 'ta', name: 'Tamil' };
  if (/[\u3040-\u30FF\u4E00-\u9FAF]/.test(text)) return { id: 'ja', name: 'Japanese' };
  if (/[\uAC00-\uD7AF]/.test(text)) return { id: 'ko', name: 'Korean' };
  if (/[\u0600-\u06FF]/.test(text)) return { id: 'ar', name: 'Arabic' };
  if (/[áéíóúñ¿¡]/i.test(text)) return { id: 'es', name: 'Spanish' };
  if (/[àâçéèêëîïôûùüÿœæ]/i.test(text)) return { id: 'fr', name: 'French' };
  if (/[äöüß]/i.test(text)) return { id: 'de', name: 'German' };
  if (/[ãõç]/i.test(text)) return { id: 'pt', name: 'Portuguese' };
  return { id: 'en', name: 'English' };
}

export const NormalTranslatorPanel: React.FC<NormalTranslatorPanelProps> = ({
  initialSourceLangId = 'auto',
  initialTargetLangId = 'ml',
  fontSize = 'normal',
}) => {
  const [sourceLangId, setSourceLangId] = useState<string>(initialSourceLangId);
  const [targetLangId, setTargetLangId] = useState<string>(initialTargetLangId);
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [detectedLang, setDetectedLang] = useState<{ id: string; name: string } | null>(null);

  const [isTranslating, setIsTranslating] = useState(false);
  const [translationEngine, setTranslationEngine] = useState('Live Neural Machine Translation');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Speech Recognition (Voice Input)
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognizerRef = useRef<any>(null);

  // Voice Output (Text-to-Speech)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeakingInput, setIsSpeakingInput] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [autoSpeakOutput, setAutoSpeakOutput] = useState<boolean>(false);
  const [autoTranslate, setAutoTranslate] = useState<boolean>(true);

  // Clipboard & Favorite
  const [isCopied, setIsCopied] = useState(false);
  const [currentResultId, setCurrentResultId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Local recent history
  const [recentItems, setRecentItems] = useState<TranslationResult[]>([]);

  // Target spoken language object
  const targetLanguage =
    SPOKEN_LANGUAGES.find((l) => l.id === targetLangId) || SPOKEN_LANGUAGES[1]; // ml default

  // Effective source language (resolved if auto)
  const effectiveSourceLangId =
    sourceLangId === 'auto' ? detectedLang?.id || 'en' : sourceLangId;
  const effectiveSourceLanguage =
    SPOKEN_LANGUAGES.find((l) => l.id === effectiveSourceLangId) || SPOKEN_LANGUAGES[0]; // en default

  // Load recent translations from history on mount
  useEffect(() => {
    loadRecentTranslations();
  }, []);

  const loadRecentTranslations = () => {
    const history = historyService.getHistory();
    // Filter items translated via normal or text engine
    setRecentItems(history.slice(0, 5));
  };

  // Detect language dynamically on text change
  useEffect(() => {
    if (inputText.trim()) {
      const detected = detectLanguageFromText(inputText);
      setDetectedLang(detected);
    } else {
      setDetectedLang(null);
    }
  }, [inputText]);

  // Debounced auto-translate when typing or when target language changes
  useEffect(() => {
    if (!autoTranslate || !inputText.trim()) {
      if (!inputText.trim()) {
        setTranslatedText('');
        setConfidence(null);
      }
      return;
    }

    const timer = setTimeout(() => {
      performTranslation(inputText, false);
    }, 450);

    return () => clearTimeout(timer);
  }, [inputText, sourceLangId, targetLangId, autoTranslate]);

  // Clean up speech recognition & synthesis on unmount
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.abort();
        } catch {
          // ignore
        }
      }
      speechService.stop();
    };
  }, []);

  const performTranslation = async (textToTranslate: string, shouldSpeak = autoSpeakOutput) => {
    const text = textToTranslate.trim();
    if (!text) {
      setTranslatedText('');
      return;
    }

    setIsTranslating(true);
    setErrorMessage(null);

    const srcCode = sourceLangId === 'auto' ? 'auto' : sourceLangId;
    let tgtCode = targetLangId;

    // If source and target are the same, auto-flip to alternate language
    if (srcCode !== 'auto' && srcCode === tgtCode) {
      tgtCode = srcCode === 'en' ? 'ml' : 'en';
    }

    try {
      const res = await translationService.translateSpokenText(text, srcCode, tgtCode);
      setTranslatedText(res.translatedText);
      setTranslationEngine(res.engine);
      setConfidence(res.match);

      const actualSource = res.detectedSourceLang || (sourceLangId === 'auto' ? detectLanguageFromText(text).id : sourceLangId);
      if (sourceLangId === 'auto') {
        const found = SPOKEN_LANGUAGES.find((l) => l.id === actualSource);
        if (found) {
          setDetectedLang({ id: found.id, name: found.name });
        }
      }

      const newId = `normal-trans-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setCurrentResultId(newId);
      setIsFavorite(false);

      const record: TranslationResult = {
        id: newId,
        sourceSignLanguageId: actualSource, // Stored as source spoken code
        targetSpokenLanguageId: tgtCode,
        sourceText: text,
        translatedText: res.translatedText,
        timestamp: Date.now(),
        provenance: 'live',
        confidence: res.match,
        engine: res.engine,
        notes: `Normal Voice/Text Translator · ${res.engine}`,
      };

      historyService.saveItem(record);
      loadRecentTranslations();

      if (shouldSpeak && res.translatedText) {
        handleSpeakOutput(res.translatedText, tgtCode);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(`Translation failed: ${error.message || 'Check network connection'}`);
    } finally {
      setIsTranslating(false);
    }
  };

  // Swap source and target languages
  const handleSwapLanguages = () => {
    // If source is auto, use the detected language as new target
    const newTarget = sourceLangId === 'auto' ? (detectedLang?.id || 'en') : sourceLangId;
    const newSource = targetLangId;

    setSourceLangId(newSource);
    setTargetLangId(newTarget);

    // Also swap input text with translated text if available!
    if (translatedText.trim()) {
      const oldOutput = translatedText;
      setInputText(oldOutput);
      setTranslatedText(inputText);
    }
  };

  // Voice Input (Speech-to-Text)
  const handleToggleVoiceInput = () => {
    if (isListening) {
      stopVoiceInput();
      return;
    }

    if (!speechService.isRecognitionSupported()) {
      setMicError(
        'Speech Recognition is not supported by your browser. Please use Google Chrome, Edge, or Safari, or enter text manually.'
      );
      return;
    }

    setMicError(null);
    setInterimTranscript('');

    const bcp47 = effectiveSourceLanguage.bcp47;

    const recognizer = speechService.createRecognizer(
      bcp47,
      (transcript: string, isFinal: boolean) => {
        if (isFinal) {
          setInputText((prev) => {
            const separator = prev && !prev.endsWith(' ') ? ' ' : '';
            const combined = `${prev}${separator}${transcript}`.trim();
            // Automatically trigger translation for the final transcript
            performTranslation(combined, autoSpeakOutput);
            return combined;
          });
          setInterimTranscript('');
          setIsListening(false);
        } else {
          setInterimTranscript(transcript);
        }
      },
      (error: string) => {
        console.warn('Speech recognition error:', error);
        if (error === 'not-allowed') {
          setMicError('Microphone access was denied. Please allow microphone permissions in your browser.');
        } else if (error === 'no-speech') {
          setMicError('No speech detected. Please speak clearly into the microphone.');
        } else {
          setMicError(`Speech error: ${error}`);
        }
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (recognizer) {
      try {
        recognizer.start();
        recognizerRef.current = recognizer;
        setIsListening(true);
      } catch (err) {
        console.warn('Error starting recognizer:', err);
        setMicError('Could not start microphone dictation.');
        setIsListening(false);
      }
    }
  };

  const stopVoiceInput = () => {
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (interimTranscript.trim()) {
      const textToAppend = interimTranscript.trim();
      setInputText((prev) => {
        const separator = prev && !prev.endsWith(' ') ? ' ' : '';
        const combined = `${prev}${separator}${textToAppend}`.trim();
        performTranslation(combined, autoSpeakOutput);
        return combined;
      });
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  // Voice Output: Speak translated text
  const handleSpeakOutput = (textToSpeak?: string, langCodeToUse?: string) => {
    const text = textToSpeak || translatedText;
    if (!text.trim()) return;

    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
      return;
    }

    const code = langCodeToUse || targetLangId;
    const langObj = SPOKEN_LANGUAGES.find((l) => l.id === code) || targetLanguage;

    setIsSpeaking(true);
    speechService.speak(text, langObj.bcp47, {
      rate: speechRate,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  // Voice Output: Speak input text
  const handleSpeakInput = () => {
    if (!inputText.trim()) return;

    if (isSpeakingInput) {
      speechService.stop();
      setIsSpeakingInput(false);
      return;
    }

    setIsSpeakingInput(true);
    speechService.speak(inputText, effectiveSourceLanguage.bcp47, {
      rate: speechRate,
      onStart: () => setIsSpeakingInput(true),
      onEnd: () => setIsSpeakingInput(false),
      onError: () => setIsSpeakingInput(false),
    });
  };

  // Copy translated text
  const handleCopy = async () => {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // Toggle favorite
  const handleToggleFavorite = () => {
    if (!currentResultId) return;
    const nextFav = historyService.toggleFavorite(currentResultId);
    setIsFavorite(nextFav);
  };

  // Clear all
  const handleClear = () => {
    setInputText('');
    setTranslatedText('');
    setInterimTranscript('');
    setErrorMessage(null);
    setMicError(null);
    setConfidence(null);
    setCurrentResultId(null);
    speechService.stop();
    setIsSpeaking(false);
    setIsSpeakingInput(false);
  };

  // Font size mapping for output
  const fontSizeClasses = {
    compact: 'text-base md:text-lg',
    normal: 'text-lg md:text-xl',
    large: 'text-xl md:text-2xl',
    'extra-large': 'text-2xl md:text-3xl',
  }[fontSize];

  return (
    <div className="space-y-6">
      {/* Top Language Configuration Bar */}
      <div className="rounded-2xl bg-[#121A2B] border border-white/5 p-4 md:p-5 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Source Language Picker */}
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>Input Language</span>
            {sourceLangId === 'auto' && detectedLang && (
              <span className="text-[#22D3EE] font-sans font-medium text-[11px] lowercase">
                (detected: {detectedLang.name})
              </span>
            )}
          </label>
          <div className="relative">
            <select
              aria-label="Input Spoken Language"
              value={sourceLangId}
              onChange={(e) => setSourceLangId(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 rounded-xl bg-[#0B1020] border border-white/10 hover:border-white/20 text-white text-sm font-medium focus:outline-none focus:border-[#22D3EE] transition cursor-pointer pr-10"
            >
              <option value="auto">✨ Detect Language Automatically</option>
              {SPOKEN_LANGUAGES.map((lang) => (
                <option key={`src-${lang.id}`} value={lang.id}>
                  {lang.name} ({lang.nativeName}) · {lang.code}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center items-center self-center sm:self-end sm:mb-1">
          <button
            type="button"
            onClick={handleSwapLanguages}
            title="Swap source and target languages"
            className="p-2.5 rounded-xl bg-[#182338] hover:bg-[#223554] border border-white/10 hover:border-[#22D3EE]/50 text-slate-300 hover:text-[#22D3EE] transition shadow-md group"
          >
            <ArrowRightLeft className="w-4 h-4 transition-transform group-hover:rotate-180 duration-300" />
          </button>
        </div>

        {/* Target Language Picker */}
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Translation Output Language
          </label>
          <div className="relative">
            <select
              aria-label="Target Spoken Language"
              value={targetLangId}
              onChange={(e) => setTargetLangId(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 rounded-xl bg-[#0B1020] border border-white/10 hover:border-white/20 text-white text-sm font-medium focus:outline-none focus:border-[#22D3EE] transition cursor-pointer pr-10"
            >
              {SPOKEN_LANGUAGES.map((lang) => (
                <option key={`tgt-${lang.id}`} value={lang.id}>
                  {lang.name} ({lang.nativeName}) · {lang.code}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Translator Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* LEFT COLUMN: Input Card (Voice & Text) */}
        <div className="flex flex-col bg-[#121A2B] rounded-2xl border border-white/5 overflow-hidden shadow-xl p-5 md:p-6 justify-between space-y-4 min-h-[460px]">
          <div className="space-y-3 flex-1 flex flex-col">
            {/* Input Header Strip */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">
                  {sourceLangId === 'auto'
                    ? `Auto-Detect (${detectedLang?.name || 'Waiting for text...'})`
                    : `${effectiveSourceLanguage.name} (${effectiveSourceLanguage.nativeName})`}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                  Voice & Text Input
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Listen to input text */}
                {inputText.trim() && (
                  <button
                    type="button"
                    onClick={handleSpeakInput}
                    title="Listen to input text"
                    className={`p-2 rounded-lg text-xs transition ${
                      isSpeakingInput
                        ? 'bg-[#22D3EE] text-slate-950 font-bold'
                        : 'bg-[#182338] text-slate-400 hover:text-white'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Clear Button */}
                {inputText.trim() && (
                  <button
                    type="button"
                    onClick={handleClear}
                    title="Clear input"
                    className="p-2 rounded-lg bg-[#182338] text-slate-400 hover:text-white hover:bg-white/10 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Textarea Input */}
            <div className="relative flex-1 flex flex-col min-h-[160px]">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    performTranslation(inputText);
                  }
                }}
                placeholder={`Type or click the microphone to speak in ${
                  sourceLangId === 'auto' ? 'any language' : effectiveSourceLanguage.name
                }...`}
                className="w-full flex-1 p-3.5 rounded-xl bg-[#0B1020] border border-white/10 text-white text-base placeholder-slate-500 focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE]/50 resize-none transition leading-relaxed"
              />

              {/* Character & Word counter */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 px-1">
                <span>
                  {inputText.trim() ? inputText.trim().split(/\s+/).length : 0} words
                </span>
                <span>{inputText.length} characters</span>
              </div>
            </div>

            {/* Live Dictation Active Banner */}
            {isListening && (
              <div className="p-3.5 rounded-xl bg-[#22D3EE]/15 border border-[#22D3EE]/40 text-white flex items-center justify-between gap-3 shadow-lg shadow-[#22D3EE]/10">
                <div className="flex items-center gap-3">
                  {/* Dynamic Soundwave Equalizer */}
                  <div className="flex items-center gap-1 h-5 px-1">
                    <span className="w-1 bg-[#22D3EE] rounded-full animate-pulse h-2.5" />
                    <span className="w-1 bg-[#22D3EE] rounded-full animate-bounce h-5" />
                    <span className="w-1 bg-[#22D3EE] rounded-full animate-pulse h-3" />
                    <span className="w-1 bg-[#22D3EE] rounded-full animate-bounce h-4" />
                    <span className="w-1 bg-[#22D3EE] rounded-full animate-pulse h-2" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#22D3EE] flex items-center gap-1.5">
                      <span>Listening ({effectiveSourceLanguage.name})...</span>
                      <span className="text-[10px] font-mono opacity-80">{effectiveSourceLanguage.bcp47}</span>
                    </p>
                    <p className="text-[11px] text-slate-200 italic">
                      {interimTranscript || 'Speak clearly into your microphone...'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={stopVoiceInput}
                  className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition shadow-md"
                >
                  Done Speaking
                </button>
              </div>
            )}

            {/* Error notifications */}
            {micError && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800 text-xs text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{micError}</span>
              </div>
            )}

            {/* Quick Sample Phrases */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Quick Phrases to Test:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(SAMPLE_PHRASES[effectiveSourceLangId] || SAMPLE_PHRASES.en).map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() => {
                      setInputText(phrase);
                      performTranslation(phrase);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#182338] hover:bg-[#1E2E4A] border border-white/5 hover:border-white/20 text-[11px] text-slate-300 hover:text-white transition text-left"
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Input Controls Footer */}
          <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Microphone Voice Input Toggle */}
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shadow-md ${
                  isListening
                    ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse'
                    : 'bg-[#182338] hover:bg-[#223554] border border-white/10 text-[#22D3EE] hover:text-white'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Voice Input (Speech-to-Text)</span>
                  </>
                )}
              </button>

              {/* Instant translation toggle */}
              <label className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoTranslate}
                  onChange={(e) => setAutoTranslate(e.target.checked)}
                  className="rounded bg-[#0B1020] border-white/10 text-[#22D3EE] focus:ring-0"
                />
                <span>Auto-translate</span>
              </label>
            </div>

            {/* Translate Button */}
            <button
              type="button"
              disabled={!inputText.trim() || isTranslating}
              onClick={() => performTranslation(inputText)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#22D3EE] to-[#0EA5E9] hover:from-[#0EA5E9] hover:to-[#0284C7] disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-bold shadow-lg shadow-[#22D3EE]/20 transition"
            >
              {isTranslating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  <span>Translating...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Translate Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Output Card (Text & Voice) */}
        <div className="flex flex-col bg-[#121A2B] rounded-2xl border border-white/5 overflow-hidden shadow-xl p-5 md:p-6 justify-between space-y-4 min-h-[460px]">
          <div className="space-y-3 flex-1 flex flex-col">
            {/* Output Header Strip */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">
                  {targetLanguage.name} ({targetLanguage.nativeName})
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Text & Voice Output
                </span>
              </div>

              {/* Utility actions */}
              <div className="flex items-center gap-1">
                {translatedText && (
                  <>
                    {/* Favorite Button */}
                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      title="Save to favorites"
                      className={`p-2 rounded-lg text-xs transition ${
                        isFavorite
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-[#182338] text-slate-400 hover:text-white'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
                    </button>

                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={handleCopy}
                      title="Copy translated text"
                      className="p-2 rounded-lg bg-[#182338] text-slate-400 hover:text-white transition flex items-center gap-1"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400 font-medium">Copied!</span>
                        </>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Translated Output View */}
            <div className="flex-1 flex flex-col justify-between p-4 rounded-xl bg-[#0B1020] border border-white/10 min-h-[180px]">
              {isTranslating ? (
                <div className="flex flex-col items-center justify-center flex-1 py-8 space-y-3">
                  <div className="w-6 h-6 border-2 border-[#22D3EE]/30 border-t-[#22D3EE] rounded-full animate-spin" />
                  <p className="text-xs text-slate-400">Processing live neural translation...</p>
                </div>
              ) : translatedText ? (
                <div className="space-y-4">
                  <p
                    dir={targetLanguage.direction || 'ltr'}
                    className={`${fontSizeClasses} text-white font-medium leading-relaxed select-all break-words ${
                      targetLanguage.direction === 'rtl' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {translatedText}
                  </p>

                  {/* Engine & match metadata & Speaking indicator */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px] font-mono text-slate-400">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-[#22D3EE]">
                        {translationEngine}
                      </span>
                      {confidence !== null && (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                          {Math.round(confidence * 100)}% match
                        </span>
                      )}
                    </div>

                    {isSpeaking && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#22D3EE]/20 border border-[#22D3EE]/40 text-[#22D3EE]">
                        <div className="flex items-center gap-0.5 h-3">
                          <span className="w-0.5 bg-[#22D3EE] rounded-full animate-bounce h-2" />
                          <span className="w-0.5 bg-[#22D3EE] rounded-full animate-pulse h-3" />
                          <span className="w-0.5 bg-[#22D3EE] rounded-full animate-bounce h-2.5" />
                        </div>
                        <span className="font-sans text-[11px] font-medium">Playing Voice Output...</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 py-8 text-center space-y-2 text-slate-400">
                  <Languages className="w-8 h-8 opacity-40 text-[#22D3EE]" />
                  <p className="text-xs">
                    Your real-time translation in {targetLanguage.name} will appear here.
                  </p>
                  <p className="text-[11px] opacity-70">
                    Supports high-fidelity voice speech synthesis in {targetLanguage.name}.
                  </p>
                </div>
              )}
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Output Voice & Playback Controls Footer */}
          <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Primary Voice Output Button */}
              <button
                type="button"
                disabled={!translatedText.trim()}
                onClick={() => handleSpeakOutput()}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
                  isSpeaking
                    ? 'bg-[#22D3EE] text-slate-950 shadow-[#22D3EE]/30 animate-pulse font-bold'
                    : 'bg-[#182338] hover:bg-[#223554] border border-white/10 text-white'
                }`}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-[#22D3EE]" />
                    <span>Listen (Voice Output)</span>
                  </>
                )}
              </button>

              {/* Speed selector for audio playback */}
              <div className="flex items-center bg-[#0B1020] rounded-lg border border-white/10 p-0.5 text-[11px] font-mono">
                {[0.8, 1.0, 1.2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setSpeechRate(rate)}
                    className={`px-2 py-1 rounded transition ${
                      speechRate === rate
                        ? 'bg-[#22D3EE] text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-speak toggle */}
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoSpeakOutput}
                onChange={(e) => setAutoSpeakOutput(e.target.checked)}
                className="rounded bg-[#0B1020] border-white/10 text-[#22D3EE] focus:ring-0"
              />
              <span>Auto-speak results</span>
            </label>
          </div>
        </div>
      </div>

      {/* Quick History Strip */}
      {recentItems.length > 0 && (
        <div className="rounded-2xl bg-[#121A2B] border border-white/5 p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Clock className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>Recent Spoken Translations</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Saved automatically
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentItems.map((item) => {
              const src =
                SPOKEN_LANGUAGES.find((l) => l.id === item.sourceSignLanguageId) ||
                { name: item.sourceSignLanguageId.toUpperCase() };
              const tgt =
                SPOKEN_LANGUAGES.find((l) => l.id === item.targetSpokenLanguageId) ||
                { name: item.targetSpokenLanguageId.toUpperCase() };

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setInputText(item.sourceText);
                    setTranslatedText(item.translatedText);
                    setSourceLangId(item.sourceSignLanguageId);
                    setTargetLangId(item.targetSpokenLanguageId);
                  }}
                  className="p-3 rounded-xl bg-[#0B1020] hover:bg-[#182338] border border-white/5 hover:border-[#22D3EE]/30 cursor-pointer transition text-left group space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="text-white group-hover:text-[#22D3EE] transition">
                      {src.name} → {tgt.name}
                    </span>
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-1 font-medium">
                    {item.sourceText}
                  </p>

                  <p className="text-xs text-[#22D3EE] line-clamp-1">
                    {item.translatedText}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
