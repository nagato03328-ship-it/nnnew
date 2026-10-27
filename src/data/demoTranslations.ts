import { TranslationResult } from '../types/translation';

export interface DemoPreset {
  id: string;
  title: string;
  signLanguageId: string;
  spokenLanguageId: string;
  sourceText: string;
  translatedText: string;
  context: string;
  description: string;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'demo-isl-ml-1',
    title: 'Emergency Assistance (ISL → Malayalam)',
    signLanguageId: 'isl',
    spokenLanguageId: 'ml',
    sourceText: 'I need help urgently.',
    translatedText: 'എനിക്ക് അടിയന്തരമായി സഹായം വേണം.',
    context: 'Medical or immediate emergency sign sequence',
    description: 'Demonstrates two-handed emergency gesture sequence recognized into Malayalam.',
  },
  {
    id: 'demo-asl-en-1',
    title: 'Greeting & Introduction (ASL → English)',
    signLanguageId: 'asl',
    spokenLanguageId: 'en',
    sourceText: 'Nice to meet you. My name is Alex.',
    translatedText: 'Nice to meet you. My name is Alex.',
    context: 'Standard conversational introduction',
    description: 'Manual signs for "Nice / Meet / You" followed by fingerspelled name.',
  },
  {
    id: 'demo-isl-hi-1',
    title: 'Hospital Directions (ISL → Hindi)',
    signLanguageId: 'isl',
    spokenLanguageId: 'hi',
    sourceText: 'Where is the nearest medical center or clinic?',
    translatedText: 'निकटतम चिकित्सा केंद्र या क्लिनिक कहाँ है?',
    context: 'Wayfinding in a healthcare facility',
    description: 'Directional inquiry sign sequence translated into Hindi.',
  },
  {
    id: 'demo-bsl-en-1',
    title: 'Gratitude & Communication (BSL → English)',
    signLanguageId: 'bsl',
    spokenLanguageId: 'en',
    sourceText: 'Thank you very much for communicating with me today.',
    translatedText: 'Thank you very much for communicating with me today.',
    context: 'Closing courtesy in business or public service',
    description: 'Two-handed BSL gratitude syntax rendered to natural English.',
  },
  {
    id: 'demo-jsl-ja-1',
    title: 'Transit Inquiry (JSL → Japanese)',
    signLanguageId: 'jsl',
    spokenLanguageId: 'ja',
    sourceText: 'Hello, what time does the next express train arrive?',
    translatedText: 'こんにちは、次の急行電車は何時に到着しますか？',
    context: 'Public transit counter conversation',
    description: 'JSL directional sign with facial inquiry marker into Japanese.',
  },
  {
    id: 'demo-isl-ta-1',
    title: 'Clarification Request (ISL → Tamil)',
    signLanguageId: 'isl',
    spokenLanguageId: 'ta',
    sourceText: 'Could you please repeat that once more slowly?',
    translatedText: 'தயவுசெய்து அதை மீண்டும் ஒருமுறை மெதுவாகச் சொல்ல முடியுமா?',
    context: 'Classroom or interview interaction',
    description: 'Repetition request translated to Tamil.',
  },
  {
    id: 'demo-asl-es-1',
    title: 'Daily Assistance (ASL → Spanish)',
    signLanguageId: 'asl',
    spokenLanguageId: 'es',
    sourceText: 'Can you show me where the water station is?',
    translatedText: '¿Puede mostrarme dónde está la estación de agua?',
    context: 'Community building navigation',
    description: 'ASL location classifier translated into Spanish.',
  },
];

export function createDemoTranslationResult(preset: DemoPreset): TranslationResult {
  return {
    id: `trans-${preset.id}-${Date.now()}`,
    sourceSignLanguageId: preset.signLanguageId,
    targetSpokenLanguageId: preset.spokenLanguageId,
    sourceText: preset.sourceText,
    translatedText: preset.translatedText,
    timestamp: Date.now(),
    provenance: 'demo',
    notes: preset.context,
  };
}
