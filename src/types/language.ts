export type LanguageType = 'sign' | 'spoken';

export interface SignLanguage {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  region: string;
  description: string;
  family: string;
  isTwoHanded?: boolean;
}

export interface SpokenLanguage {
  id: string;
  code: string;
  bcp47: string; // for SpeechSynthesis and SpeechRecognition
  name: string;
  nativeName: string;
  script: string;
  direction?: 'ltr' | 'rtl';
}

export interface LanguagePair {
  sourceSignLanguageId: string;
  targetSpokenLanguageId: string;
}
