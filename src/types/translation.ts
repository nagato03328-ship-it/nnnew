export type OutputMode = 
  | 'text'
  | 'voice'
  | 'sign'
  | 'text_voice'
  | 'text_sign'
  | 'voice_sign'
  | 'all';

export type TranslationProvenance = 'demo' | 'live';

export interface TranslationResult {
  id: string;
  sourceSignLanguageId: string;
  targetSpokenLanguageId: string;
  sourceText: string;
  translatedText: string;
  timestamp: number;
  provenance: TranslationProvenance;
  confidence?: number; // Only populated when genuine AI backend responds
  isFavorite?: boolean;
  notes?: string;
  engine?: string;
  gloss?: string;
}

export interface AnimationClip {
  id: string;
  signName: string;
  languageId: string;
  durationMs: number;
  keyframeDescription?: string[];
  isVerified: boolean;
}

export interface BackendStatus {
  connected: boolean;
  url: string;
  modelName: string;
  modelVersion?: string;
  latencyMs?: number;
  statusMessage: string;
}
