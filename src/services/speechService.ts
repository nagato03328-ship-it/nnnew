export interface SpeechSynthesisOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
  onPause?: () => void;
  onResume?: () => void;
}

export interface VoiceInfo {
  name: string;
  lang: string;
  default: boolean;
  localService: boolean;
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices(): void {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  public isSupported(): boolean {
    return !!this.synth;
  }

  public getAvailableVoices(): VoiceInfo[] {
    this.loadVoices();
    return this.voices.map((v) => ({
      name: v.name,
      lang: v.lang,
      default: v.default,
      localService: v.localService,
    }));
  }

  /**
   * Find best matching voice for a BCP-47 tag (e.g. 'ml-IN', 'hi-IN', 'ja-JP', 'en-US')
   */
  public findBestVoice(bcp47: string): { voice: SpeechSynthesisVoice | null; isExact: boolean; note?: string } {
    this.loadVoices();
    if (!this.voices || this.voices.length === 0) {
      return { voice: null, isExact: false, note: 'No voices available in browser speech synthesis.' };
    }

    const cleanTag = bcp47.toLowerCase();
    const primaryLang = cleanTag.split('-')[0];

    // 1. Exact match (e.g. 'ml-IN')
    const exact = this.voices.find((v) => v.lang.toLowerCase() === cleanTag);
    if (exact) {
      return { voice: exact, isExact: true };
    }

    // 2. Prefix match (e.g. any 'ml' or 'hi')
    const prefix = this.voices.find((v) => v.lang.toLowerCase().startsWith(primaryLang));
    if (prefix) {
      return { 
        voice: prefix, 
        isExact: false, 
        note: `Using fallback voice (${prefix.name}) matching language code '${primaryLang}'.` 
      };
    }

    // 3. Fallback to default or English
    const fallback = this.voices.find((v) => v.default) || this.voices.find((v) => v.lang.startsWith('en')) || this.voices[0];
    return { 
      voice: fallback || null, 
      isExact: false, 
      note: `No native voice found for '${bcp47}' in this browser. Using system fallback voice (${fallback?.name || 'Default'}).` 
    };
  }

  public speak(
    text: string,
    bcp47: string,
    options?: SpeechSynthesisOptions
  ): { success: boolean; message?: string } {
    if (!this.synth) {
      options?.onError?.('Speech synthesis is not supported on this browser.');
      return { success: false, message: 'Web Speech API is unsupported.' };
    }

    this.stop();

    if (!text || text.trim().length === 0) {
      return { success: false, message: 'No text provided to speak.' };
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      const voiceResult = this.findBestVoice(bcp47);
      
      if (voiceResult.voice) {
        utterance.voice = voiceResult.voice;
      }
      utterance.lang = bcp47;
      utterance.rate = options?.rate ?? 1.0;
      utterance.pitch = options?.pitch ?? 1.0;
      utterance.volume = options?.volume ?? 1.0;

      utterance.onstart = () => {
        options?.onStart?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        options?.onEnd?.();
      };

      utterance.onerror = (e) => {
        this.currentUtterance = null;
        options?.onError?.(e.error || 'Playback error occurred');
      };

      utterance.onpause = () => {
        options?.onPause?.();
      };

      utterance.onresume = () => {
        options?.onResume?.();
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);

      return {
        success: true,
        message: voiceResult.note,
      };
    } catch (err: unknown) {
      const error = err as Error;
      options?.onError?.(error.message || 'Speech failed');
      return { success: false, message: error.message };
    }
  }

  public pause(): void {
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  public resume(): void {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public stop(): void {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // ignore
      }
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return !!(this.synth && this.synth.speaking);
  }

  public isPaused(): boolean {
    return !!(this.synth && this.synth.paused);
  }

  // Speech Recognition (Speech to Text) for conversation speaking mode
  public isRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && 
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  public createRecognizer(
    bcp47: string,
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ) {
    if (!this.isRecognitionSupported()) {
      return null;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognizer = new SpeechRecognitionConstructor();
      recognizer.continuous = false;
      recognizer.interimResults = true;
      recognizer.lang = bcp47;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognizer.onresult = (event: any) => {
        let transcript = '';
        let isFinal = false;
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }
        onResult(transcript, isFinal);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognizer.onerror = (event: any) => {
        onError(event.error || 'Speech recognition error');
      };

      recognizer.onend = () => {
        onEnd();
      };

      return recognizer;
    } catch {
      return null;
    }
  }
}

export const speechService = new SpeechService();
