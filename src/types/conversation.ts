export type ParticipantRole = 'signer' | 'speaker';

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  languageId: string; // SignLanguage id for signer, SpokenLanguage id for speaker
  avatarBg?: string;
}

export interface ConversationMessage {
  id: string;
  senderId: string;
  senderRole: ParticipantRole;
  senderName: string;
  originalText: string;
  translatedText: string;
  sourceLanguageId: string;
  targetLanguageId: string;
  timestamp: number;
  provenance: 'live' | 'demo';
  inputModality?: 'text' | 'voice' | 'camera';
  audioAvailable?: boolean;
  engine?: string;
  glossText?: string;
}

export interface ConversationSession {
  id: string;
  startTime: number;
  isActive: boolean;
  signerParticipant: Participant;
  speakerParticipant: Participant;
  messages: ConversationMessage[];
}
