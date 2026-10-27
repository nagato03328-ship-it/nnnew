import { OutputMode } from './translation';

export interface UserPreferences {
  theme: 'dark' | 'light';
  preferredInputSignLanguage: string;
  preferredOutputSpokenLanguage: string;
  defaultOutputMode: OutputMode;
  fontSize: 'compact' | 'normal' | 'large' | 'extra-large';
  autoPlayVoice: boolean;
  speechRate: number; // 0.8 to 1.5
  speechPitch: number; // 0.8 to 1.2
  speechVolume: number; // 0 to 1
  experimentalLandmarks: boolean;
  reduceMotion: boolean;
  avatarPlaybackSpeed: number; // 0.5, 0.75, 1, 1.25
  apiBaseUrl: string;
}
