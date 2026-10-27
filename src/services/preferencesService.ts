import { UserPreferences } from '../types/settings';

const STORAGE_KEY = 'signbridge_preferences_v1';

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  preferredInputSignLanguage: 'isl',
  preferredOutputSpokenLanguage: 'ml',
  defaultOutputMode: 'text_voice',
  fontSize: 'normal',
  autoPlayVoice: false,
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVolume: 1.0,
  experimentalLandmarks: false,
  reduceMotion: false,
  avatarPlaybackSpeed: 1.0,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.signbridge.internal',
};

class PreferencesService {
  public getPreferences(): UserPreferences {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_PREFERENCES;
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  public savePreferences(prefs: Partial<UserPreferences>): UserPreferences {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...prefs };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  public resetDefaults(): UserPreferences {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES));
    } catch {
      // ignore
    }
    return DEFAULT_PREFERENCES;
  }
}

export const preferencesService = new PreferencesService();
