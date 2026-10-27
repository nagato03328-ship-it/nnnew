import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Globe } from 'lucide-react';
import { SignLanguage, SpokenLanguage } from '../../types/language';

interface LanguageSelectorProps {
  type: 'sign' | 'spoken';
  selectedId: string;
  signLanguages?: SignLanguage[];
  spokenLanguages?: SpokenLanguage[];
  onSelect: (id: string) => void;
  label: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  type,
  selectedId,
  signLanguages = [],
  spokenLanguages = [],
  onSelect,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const currentSign = signLanguages.find((l) => l.id === selectedId);
  const currentSpoken = spokenLanguages.find((l) => l.id === selectedId);

  const filteredSignLanguages = signLanguages.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSpokenLanguages = spokenLanguages.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative flex-1 min-w-[200px]" ref={dropdownRef}>
      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[#121A2B] hover:bg-[#182338] border border-white/10 hover:border-white/20 text-[#F8FAFC] transition text-left focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 shadow-sm"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#0B1020] border border-white/5 flex items-center justify-center shrink-0">
            {type === 'sign' ? (
              <span className="text-xs font-mono font-bold text-[#8B5CF6]">
                {currentSign?.code || 'SIGN'}
              </span>
            ) : (
              <Globe className="w-3.5 h-3.5 text-[#22D3EE]" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs md:text-sm font-semibold truncate">
              {type === 'sign' ? currentSign?.name : currentSpoken?.name}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {type === 'sign' ? currentSign?.nativeName : `${currentSpoken?.nativeName} (${currentSpoken?.code})`}
            </div>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 rounded-2xl bg-[#121A2B] border border-white/15 shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Search Bar */}
          <div className="p-2.5 border-b border-white/10 bg-[#0B1020]/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  type === 'sign'
                    ? 'Search sign language (ISL, ASL, BSL...)'
                    : 'Search spoken language (Malayalam, Hindi...)'
                }
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#182338] border border-white/5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#8B5CF6]"
                autoFocus
              />
            </div>
          </div>

          {/* List Options */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1" role="listbox">
            {type === 'sign' ? (
              filteredSignLanguages.length > 0 ? (
                filteredSignLanguages.map((lang) => {
                  const isSelected = lang.id === selectedId;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => {
                        onSelect(lang.id);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition ${
                        isSelected
                          ? 'bg-[#8B5CF6]/20 text-white font-medium border border-[#8B5CF6]/30'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">
                            {lang.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-[#8B5CF6]">
                            {lang.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {lang.nativeName} · {lang.region}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#22D3EE] shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  No sign languages found matching "{searchQuery}"
                </div>
              )
            ) : filteredSpokenLanguages.length > 0 ? (
              filteredSpokenLanguages.map((lang) => {
                const isSelected = lang.id === selectedId;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => {
                      onSelect(lang.id);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition ${
                      isSelected
                        ? 'bg-[#22D3EE]/20 text-white font-medium border border-[#22D3EE]/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">
                          {lang.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-[#22D3EE]">
                          {lang.code}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {lang.nativeName} ({lang.script})
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#22D3EE] shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No spoken languages found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
