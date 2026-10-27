export type SignCategory = 
  | 'Greetings'
  | 'Daily Life'
  | 'Food & Drink'
  | 'Travel & Directions'
  | 'Emergency & Health'
  | 'Numbers & Time';

export interface SignItem {
  id: string;
  signLanguageId: string; // 'isl' | 'asl' | 'bsl' | 'jsl'
  term: string;
  meaning: string;
  category: SignCategory;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  handShape: string;
  movement: string;
  culturalNote?: string;
  exampleSentence: string;
  exampleTranslation: string;
  isVerifiedAsset: boolean;
  isFavorite?: boolean;
}
