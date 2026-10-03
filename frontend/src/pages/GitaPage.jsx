import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BookOpen, Search, ArrowLeft, Bookmark, Sparkles } from 'lucide-react';

export const GitaPage = () => {
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [chapterDetails, setChapterDetails] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChapters();
  }, []);

  const loadChapters = async () => {
    setLoading(true);
    try {
      const res = await api.getChapters();
      if (res.success) {
        setChapters(res.chapters);
      }
    } catch (err) {
      console.error('Failed to load Gita chapters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChapter = async (num) => {
    setLoading(true);
    try {
      const res = await api.getChapter(num);
      if (res.success) {
        setSelectedChapter(num);
        setChapterDetails(res);
      }
    } catch (err) {
      console.error('Failed to load chapter verses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await api.searchGita(searchQuery);
      if (res.success) {
        setSearchResults(res.results);
      }
    } catch (err) {
      console.error('Failed to search Gita:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">
              Bhagavad Gita Wisdom Library
            </h1>
            <p className="text-sm text-stone-500">
              Explore 18 chapters and authentic verses in Sanskrit, transliteration, and verified translations.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search duty, fear, anger..."
                className="pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-amber-700 bg-white w-48 sm:w-64"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-amber-700 text-white rounded-xl text-xs font-medium hover:bg-amber-800 transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Quick Theme Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {['Duty', 'Fear', 'Anger', 'Mind Mastery', 'Peace', 'Overthinking', 'Burnout'].map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setSearchQuery(tag);
                api.searchGita(tag).then(res => res.success && setSearchResults(res.results));
              }}
              className="text-[11px] px-2.5 py-1 rounded-full bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-900 border border-stone-200 transition"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* SEARCH RESULTS VIEW */}
      {searchResults !== null && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-stone-800">
              Search Results ({searchResults.length} verses found)
            </h3>
            <button
              onClick={clearSearch}
              className="text-xs text-amber-800 hover:underline"
            >
              Clear Search
            </button>
          </div>

          <div className="space-y-4">
            {searchResults.map((verse) => (
              <div key={verse.id} className="p-5 rounded-2xl bg-white border border-[#E8E1D5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-900">
                    Chapter {verse.chapter}, Verse {verse.verse}
                  </span>
                  <div className="flex gap-1">
                    {verse.themes.map((th, i) => (
                      <span key={i} className="text-[10px] bg-stone-100 px-2 py-0.5 rounded-full text-stone-600">
                        {th}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="sanskrit-text text-base text-amber-950 font-medium">
                  {verse.sanskrit}
                </div>
                <div className="text-xs italic text-stone-600">
                  {verse.transliteration}
                </div>
                <div className="text-xs text-stone-800 font-serif border-t border-stone-100 pt-2">
                  <strong>Translation:</strong> {verse.translation}
                </div>
                <div className="p-3 bg-[#F5F2EB]/60 rounded-xl text-xs text-stone-700">
                  <strong className="text-amber-900">Simple Reflection:</strong> {verse.simpleExplanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHAPTER DETAILS VIEW */}
      {selectedChapter !== null && searchResults === null && chapterDetails && (
        <div className="space-y-6">
          <button
            onClick={() => {
              setSelectedChapter(null);
              setChapterDetails(null);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:underline"
          >
            <ArrowLeft size={16} />
            <span>Back to All Chapters</span>
          </button>

          <div className="p-6 rounded-2xl bg-[#F5F2EB] border border-[#E8E1D5] space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-900 font-bold">
              Chapter {chapterDetails.chapter.chapterNumber}
            </span>
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              {chapterDetails.chapter.name}
            </h2>
            <p className="text-sm font-serif italic text-stone-700">
              "{chapterDetails.chapter.translation}"
            </p>
            <p className="text-xs text-stone-600 leading-relaxed pt-2 border-t border-stone-200">
              {chapterDetails.chapter.summary}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-serif text-lg font-bold text-stone-800">
              Verses in this Chapter ({chapterDetails.totalVerses})
            </h3>
            
            {chapterDetails.verses.map((v) => (
              <div key={v.id} className="p-5 rounded-2xl bg-white border border-[#E8E1D5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-900">
                    Verse {v.verse}
                  </span>
                  <div className="flex gap-1">
                    {v.themes.map((th, i) => (
                      <span key={i} className="text-[10px] bg-stone-100 px-2 py-0.5 rounded-full text-stone-600">
                        {th}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="sanskrit-text text-base text-amber-950 font-medium">
                  {v.sanskrit}
                </div>
                <div className="text-xs italic text-stone-600 font-serif">
                  {v.transliteration}
                </div>
                <div className="text-xs text-stone-800 font-serif border-t border-stone-100 pt-2">
                  <strong>Translation:</strong> {v.translation}
                </div>
                <div className="p-3 bg-[#FAF8F5] rounded-xl text-xs text-stone-700 space-y-1">
                  <p><strong className="text-amber-900">Simple Reflection:</strong> {v.simpleExplanation}</p>
                  <p className="text-stone-500 text-[11px]"><strong>Why this verse matters:</strong> {v.whyThisVerse}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ALL CHAPTERS LIST VIEW */}
      {selectedChapter === null && searchResults === null && (
        <div className="grid sm:grid-cols-2 gap-4">
          {chapters.map((ch) => (
            <button
              key={ch.chapterNumber}
              onClick={() => handleSelectChapter(ch.chapterNumber)}
              className="p-5 rounded-2xl bg-white border border-[#E8E1D5] text-left hover:border-amber-700/60 hover:shadow-sm transition group space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full">
                  Chapter {ch.chapterNumber}
                </span>
                <span className="text-xs text-stone-400">
                  {ch.versesCount} verses
                </span>
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-800 group-hover:text-amber-800 transition">
                {ch.name}
              </h3>
              <p className="text-xs italic text-stone-600 font-serif">
                {ch.translation}
              </p>
              <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                {ch.summary}
              </p>
            </button>
          ))}
        </div>
      )}

    </div>
  );
};
