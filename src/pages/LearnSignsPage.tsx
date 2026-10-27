import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Info,
  ChevronRight,
  Hand,
  Layers,
  ArrowRight,
  X,
} from 'lucide-react';
import { INITIAL_SIGNS } from '../data/learningData';
import { SIGN_LANGUAGES } from '../data/languages';
import { SignCategory, SignItem } from '../types/learning';

export const LearnSignsPage: React.FC = () => {
  const [signs, setSigns] = useState<SignItem[]>(INITIAL_SIGNS);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSignModal, setActiveSignModal] = useState<SignItem | null>(null);

  const categories: SignCategory[] = [
    'Greetings',
    'Daily Life',
    'Food & Drink',
    'Travel & Directions',
    'Emergency & Health',
  ];

  const handleToggleFavorite = (id: string) => {
    setSigns((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  const filteredSigns = signs.filter((sign) => {
    const matchesLang =
      selectedLanguage === 'all' || sign.signLanguageId === selectedLanguage;
    const matchesCategory =
      selectedCategory === 'all' || sign.category === selectedCategory;
    const matchesSearch =
      sign.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.handShape.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLang && matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Learn Signs
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30">
              Curated Educational Reference
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400">
            Explore authentic morphology, handshapes, and cultural syntax across Indian, American, British, and Japanese Sign Languages.
          </p>
        </div>

        {/* Academic Note */}
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#121A2B] border border-white/5 px-3 py-1.5 rounded-xl self-start md:self-auto">
          <Info className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>Linguistically verified instructional descriptions</span>
        </div>
      </div>

      {/* Hero Showcase Card featuring Hand Geometry Render */}
      <div className="rounded-2xl bg-gradient-to-r from-[#121A2B] via-[#182338] to-[#121A2B] border border-white/5 p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="space-y-3 z-10 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-[#8B5CF6]">
            <Sparkles className="w-4 h-4 text-[#22D3EE]" />
            <span>LINGUISTIC PRECISION & ACCESSIBILITY</span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
            Signs Are Complete Natural Languages, Not Direct Word Substitutions
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Every sign language possesses its own grammar, spatial directionality, and facial markers. In Indian Sign Language (ISL), two-handed morphology is prevalent, whereas American Sign Language (ASL) uses a distinct one-handed fingerspelling system.
          </p>
        </div>

        <div className="w-full md:w-64 h-36 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-[#070A14] shadow-md relative">
          <img
            src="/src/assets/images/sign_learning_hands_1792593294940.jpg"
            alt="Handshape anatomy demonstration"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] text-slate-200">
            Hand Anatomy Reference
          </div>
        </div>
      </div>

      {/* Filter and Category Strip */}
      <div className="space-y-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-[#8B5CF6] text-white shadow-sm'
                : 'bg-[#121A2B] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            All Categories ({signs.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'bg-[#121A2B] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Language Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sign term, meaning, or handshape description..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#121A2B] border border-white/10 text-xs md:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          <div>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-[#121A2B] border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="all">All Sign Languages</option>
              {SIGN_LANGUAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sign Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSigns.map((sign) => {
          const signLang = SIGN_LANGUAGES.find((s) => s.id === sign.signLanguageId);
          return (
            <div
              key={sign.id}
              className="rounded-2xl bg-[#121A2B] border border-white/5 p-5 shadow-lg flex flex-col justify-between hover:border-white/20 transition group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-[#8B5CF6] uppercase tracking-wider block">
                      {signLang?.name} ({signLang?.code}) · {sign.category}
                    </span>
                    <h3 className="text-base font-bold text-white group-hover:text-[#22D3EE] transition-colors">
                      {sign.term}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleFavorite(sign.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 transition"
                    title={sign.isFavorite ? 'Remove bookmark' : 'Bookmark sign'}
                  >
                    {sign.isFavorite ? (
                      <BookmarkCheck className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {sign.meaning}
                </p>

                {/* Handshape summary */}
                <div className="rounded-xl bg-[#0B1020]/60 p-3 border border-white/5 space-y-1.5 text-xs">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                    <Hand className="w-3.5 h-3.5 text-[#22D3EE]" />
                    <span>Handshape & Motion:</span>
                  </div>
                  <div className="text-slate-200 text-[11px] leading-relaxed">
                    {sign.handShape}
                  </div>
                </div>
              </div>

              {/* Bottom Card Action */}
              <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  {sign.difficulty} Level
                </span>

                <button
                  type="button"
                  onClick={() => setActiveSignModal(sign)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#22D3EE] hover:text-[#38BDF8] transition"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Sign Study Modal */}
      {activeSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div
            className="w-full max-w-xl rounded-2xl bg-[#121A2B] border border-white/10 p-6 md:p-8 shadow-2xl text-[#F8FAFC] my-8 animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono text-[#8B5CF6] uppercase tracking-wider block">
                  {SIGN_LANGUAGES.find((s) => s.id === activeSignModal.signLanguageId)?.name}
                </span>
                <h2 className="text-lg md:text-xl font-bold text-white mt-0.5">
                  Sign: {activeSignModal.term}
                </h2>
              </div>
              <button
                onClick={() => setActiveSignModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs md:text-sm text-slate-300">
              <div>
                <h4 className="font-semibold text-white mb-1">Meaning & Context</h4>
                <p className="text-slate-300 leading-relaxed">{activeSignModal.meaning}</p>
              </div>

              <div className="rounded-xl bg-[#0B1020]/70 p-4 border border-white/5 space-y-2">
                <h4 className="font-semibold text-[#22D3EE] flex items-center gap-1.5">
                  <Hand className="w-4 h-4" />
                  <span>Execution Guide</span>
                </h4>
                <p><strong>Handshape:</strong> {activeSignModal.handShape}</p>
                <p><strong>Movement:</strong> {activeSignModal.movement}</p>
              </div>

              {activeSignModal.culturalNote && (
                <div className="rounded-xl bg-[#182338] p-4 border border-white/5">
                  <h4 className="font-semibold text-amber-300 mb-1">Deaf Culture Note</h4>
                  <p className="text-slate-300 text-xs leading-relaxed">{activeSignModal.culturalNote}</p>
                </div>
              )}

              <div className="rounded-xl bg-[#0B1020]/70 p-4 border border-white/5">
                <h4 className="font-semibold text-white mb-1">Example Sentence</h4>
                <p className="text-slate-200 italic mb-1">"{activeSignModal.exampleSentence}"</p>
                <p className="text-slate-400 text-xs">{activeSignModal.exampleTranslation}</p>
              </div>

              {/* Status Note on 3D validation */}
              <div className="text-[11px] text-slate-400 pt-2 border-t border-white/5">
                * Note: Interactive 3D skeletal capture is awaiting verification by native certified sign language interpreters.
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setActiveSignModal(null)}
                className="px-5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
