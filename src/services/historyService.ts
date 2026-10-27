import { TranslationResult } from '../types/translation';

const STORAGE_KEY = 'signbridge_history_v1';

class HistoryService {
  public getHistory(): TranslationResult[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  }

  public saveItem(item: TranslationResult): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getHistory();
      // Prepend so newest is at the top, limit to 200 items to avoid quota issues
      const updated = [item, ...current.filter((i) => i.id !== item.id)].slice(0, 200);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // quota or private mode
    }
  }

  public deleteItem(id: string): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getHistory();
      const updated = current.filter((i) => i.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  public toggleFavorite(id: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const current = this.getHistory();
      let newFavState = false;
      const updated = current.map((i) => {
        if (i.id === id) {
          newFavState = !i.isFavorite;
          return { ...i, isFavorite: newFavState };
        }
        return i;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return newFavState;
    } catch {
      return false;
    }
  }

  public clearAll(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

export const historyService = new HistoryService();
