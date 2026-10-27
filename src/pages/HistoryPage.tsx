import React, { useState, useEffect } from 'react';
import {
  Search,
  Trash2,
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  Volume2,
  Calendar,
  Sparkles,
  Filter,
} from 'lucide-react';
import { TranslationResult } from '../types/translation';
import { historyService } from '../services/historyService';
import { speechService } from '../services/speechService';
import { SIGN_LANGUAGES, SPOKEN_LANGUAGES } from '../data/languages';
import { DEMO_PRESETS, createDemoTranslationResult } from '../data/demoTranslations';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<TranslationResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>('all');
  const [provenanceFilter, setProvenanceFilter] = useState<'all' | 'live' | 'demo'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const items = historyService.getHistory();
    // If empty on first visit, pre-seed with demo presets so user has realistic records to explore
    if (items.length === 0) {
      const seeded = DEMO_PRESETS.slice(0, 4).map((p) => createDemoTranslationResult(p));
      seeded.forEach((s) => historyService.saveItem(s));
      setHistory(seeded);
    } else {
      setHistory(items);
    }
  };

  const handleToggleFavorite = (id: string) => {
    historyService.toggleFavorite(id);
    loadHistory();
  };

  const handleDeleteItem = (id: string) => {
    historyService.deleteItem(id);
    loadHistory();
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all saved translation records? This action cannot be undone.')) {
      historyService.clearAll();
      setHistory([]);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleSpeak = (text: string, spokenLangId: string) => {
    const lang = SPOKEN_LANGUAGES.find((s) => s.id === spokenLangId);
    if (lang) {
      speechService.speak(text, lang.bcp47);
    }
  };

  // Filter items
  const filteredItems = history.filter((item) => {
    // Search matching
    const matchesSearch =
      item.sourceText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.translatedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    // Language matching
    const matchesLang =
      selectedLanguageFilter === 'all' ||
      item.sourceSignLanguageId === selectedLanguageFilter ||
      item.targetSpokenLanguageId === selectedLanguageFilter;

    // Provenance matching
    const matchesProvenance =
      provenanceFilter === 'all' || item.provenance === provenanceFilter;

    // Favorite matching
    const matchesFav = !onlyFavorites || !!item.isFavorite;

    return matchesSearch && matchesLang && matchesProvenance && matchesFav;
  });

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Translation History
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            Locally stored records of sign language recognition and spoken translations. No camera footage is stored.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-medium self-start md:self-auto transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-[#121A2B] border border-white/5 p-4 space-y-3 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search source or translated phrase..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#182338] border border-white/10 text-xs md:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          {/* Language Filter Dropdown */}
          <div>
            <select
              value={selectedLanguageFilter}
              onChange={(e) => setSelectedLanguageFilter(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-[#182338] border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="all">All Languages</option>
              <optgroup label="Sign Languages">
                {SIGN_LANGUAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Spoken Languages">
                {SPOKEN_LANGUAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.nativeName})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Provenance Filter */}
          <div>
            <select
              value={provenanceFilter}
              onChange={(e) => setProvenanceFilter(e.target.value as 'all' | 'live' | 'demo')}
              className="w-full py-2 px-3 rounded-xl bg-[#182338] border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="all">All Sources (Live & Demo)</option>
              <option value="demo">Demo Sample Only</option>
              <option value="live">Live Recognized Only</option>
            </select>
          </div>
        </div>

        {/* Favorite Filter Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyFavorites}
              onChange={(e) => setOnlyFavorites(e.target.checked)}
              className="rounded bg-[#182338] border-white/10 text-[#8B5CF6] focus:ring-0"
            />
            <span>Show starred favorites only</span>
          </label>

          <span className="font-mono tabular-nums">
            Showing {filteredItems.length} of {history.length} record{history.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* History Items List */}
      <div className="space-y-3">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const signLang = SIGN_LANGUAGES.find((s) => s.id === item.sourceSignLanguageId);
            const sourceSpokenLang = SPOKEN_LANGUAGES.find((s) => s.id === item.sourceSignLanguageId);
            const spokenLang = SPOKEN_LANGUAGES.find((s) => s.id === item.targetSpokenLanguageId);

            const sourceName = signLang?.name || sourceSpokenLang?.name || item.sourceSignLanguageId.toUpperCase();
            const sourceCode = signLang?.code || sourceSpokenLang?.code || item.sourceSignLanguageId.toUpperCase();

            return (
              <div
                key={item.id}
                className="rounded-2xl bg-[#121A2B] border border-white/5 p-4 md:p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-white/15"
              >
                {/* Content */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-white">
                      {sourceName}
                    </span>
                    <span className="font-mono text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-[#8B5CF6]">
                      {sourceCode}
                    </span>
                    <span>→</span>
                    <span className="font-semibold text-[#22D3EE]">
                      {spokenLang?.name || item.targetSpokenLanguageId}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {new Date(item.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {item.provenance === 'demo' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-400 font-mono text-[11px]">Demo Sample</span>
                      </>
                    )}
                  </div>

                  {/* Primary Translated Output */}
                  <div className="text-base md:text-lg font-semibold text-white tracking-tight">
                    {item.translatedText}
                  </div>

                  {/* Source Transcription */}
                  <div className="text-xs md:text-sm text-slate-300 italic">
                    "{item.sourceText}"
                  </div>

                  {item.notes && (
                    <div className="text-[11px] text-slate-400">{item.notes}</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSpeak(item.translatedText, item.targetSpokenLanguageId)}
                    className="p-2 rounded-xl bg-[#182338] hover:bg-[#1E2E4A] text-slate-300 hover:text-white transition"
                    title="Speak translated text"
                    aria-label="Speak translated text"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(item.translatedText, item.id)}
                    className="p-2 rounded-xl bg-[#182338] hover:bg-[#1E2E4A] text-slate-300 hover:text-white transition"
                    title="Copy translated text"
                    aria-label="Copy translated text"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleFavorite(item.id)}
                    className="p-2 rounded-xl bg-[#182338] hover:bg-[#1E2E4A] text-slate-300 hover:text-amber-400 transition"
                    title={item.isFavorite ? 'Unfavorite' : 'Add to favorites'}
                    aria-label="Favorite toggle"
                  >
                    {item.isFavorite ? (
                      <BookmarkCheck className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 rounded-xl bg-[#182338] hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition"
                    title="Delete item"
                    aria-label="Delete history item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl bg-[#121A2B] border border-white/5 p-12 text-center max-w-md mx-auto space-y-3">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-base font-semibold text-white">No Records Found</h3>
            <p className="text-xs text-slate-400">
              No translation sessions match your selected filters. Try searching for a different keyword or clearing filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
