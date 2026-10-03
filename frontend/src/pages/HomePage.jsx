import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Feather, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Gamepad2,
  HelpCircle,
  SunMedium
} from 'lucide-react';

const SUGGESTIONS = [
  "Feeling overwhelmed by expectations at work...",
  "Struggling to make a tough career decision...",
  "How to cultivate calmness when feeling anxious?",
  "Finding focus and mental clarity today..."
];

export const HomePage = ({ setTab, setInitialPrompt }) => {
  const [prompt, setPrompt] = useState('');

  const handleStartReflection = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setInitialPrompt(prompt);
    setTab('reflect');
  };

  const handleSuggestionClick = (text) => {
    setPrompt(text);
  };

  return (
    <div className="space-y-16 py-6 max-w-4xl mx-auto px-4">
      
      {/* Hero Welcome */}
      <section className="text-center space-y-4 pt-4 sm:pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-700/10 dark:bg-amber-400/15 text-amber-900 dark:text-amber-300 mb-2 border border-amber-800/15 dark:border-amber-400/30 shadow-xs">
          <Sparkles size={14} className="text-amber-700 dark:text-amber-400" />
          <span>Personal Self-Reflection &amp; Wisdom Sanctuary</span>
        </div>
        
        <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-stone-900 dark:text-stone-100 leading-tight">
          Understand. Reflect. Learn.
        </h1>
        
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-stone-700 dark:text-stone-300 font-normal leading-relaxed">
          A quiet, gentle space to express what you are navigating, understand your emotional signals, 
          and discover grounded clarity from the timeless Bhagavad Gita.
        </p>

        {/* Central Entry Point: "What is on your mind today?" */}
        <div className="max-w-2xl mx-auto pt-4">
          <form 
            onSubmit={handleStartReflection}
            className="glass-panel p-3 sm:p-4 rounded-2xl shadow-sm hover:shadow-md transition-all border border-stone-300/80 dark:border-stone-700/80 bg-white/95 dark:bg-stone-900/90 text-left"
          >
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What is on your mind today? (Type freely in English, Hindi, Marathi, or mixed...)"
                rows={3}
                className="w-full p-3 text-sm sm:text-base text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none font-normal"
              />
            </div>
            
            {/* Quick Prompts Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 pb-2 px-1">
              <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 mr-1 flex items-center gap-1">
                <SunMedium size={12} className="text-amber-600 dark:text-amber-400" />
                Try:
              </span>
              {SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(item)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200/80 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition truncate max-w-[200px] sm:max-w-none"
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2.5 px-1 border-t border-stone-200/60 dark:border-stone-800">
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                Spelling mistakes &amp; slang are welcome &bull; 100% private
              </span>
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-semibold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <span>Reflect</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* The Three Pillars */}
      <section className="grid sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white/90 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 space-y-3 shadow-xs hover:border-amber-700/30 transition">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-base">
            1
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">Understand</h3>
          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-normal">
            Express yourself freely in your own words. VedAI identifies possible emotional signals without medical labels or diagnoses.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/90 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 space-y-3 shadow-xs hover:border-emerald-700/30 transition">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-base">
            2
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">Reflect</h3>
          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-normal">
            Validate or refine what VedAI noticed. Answer thoughtful inquiry questions tailored to uncover perspective and inner calm.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/90 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 space-y-3 shadow-xs hover:border-sky-700/30 transition">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 flex items-center justify-center font-bold text-base">
            3
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">Learn</h3>
          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-normal">
            Explore authentic Bhagavad Gita teachings tailored to your dilemma, with transparent explanations of why each verse was chosen.
          </p>
        </div>
      </section>

      {/* Quick Action Cards */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 text-center">
          Explore VedAI Features
        </h2>
        
        <div className="grid sm:grid-cols-3 gap-4">
          <button
            onClick={() => setTab('gita')}
            className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 hover:bg-white dark:hover:bg-stone-900 text-left transition flex items-start gap-3.5 group shadow-xs hover:shadow-sm"
          >
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 group-hover:scale-105 transition shrink-0">
              <BookOpen size={20} />
            </div>
            <div>
              <h4 className="font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition text-sm">
                Explore Bhagavad Gita
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-snug">
                Browse 18 chapters and 700 verses with translations &amp; life themes.
              </p>
            </div>
          </button>

          <button
            onClick={() => setTab('practice')}
            className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 hover:bg-white dark:hover:bg-stone-900 text-left transition flex items-start gap-3.5 group shadow-xs hover:shadow-sm"
          >
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 group-hover:scale-105 transition shrink-0">
              <Feather size={20} />
            </div>
            <div>
              <h4 className="font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition text-sm">
                3-Minute Practice
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-snug">
                Guided Box Breathing, silent meditation, and verse contemplation.
              </p>
            </div>
          </button>

          <button
            onClick={() => setTab('games')}
            className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 hover:bg-white dark:hover:bg-stone-900 text-left transition flex items-start gap-3.5 group shadow-xs hover:shadow-sm"
          >
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-400 group-hover:scale-105 transition shrink-0">
              <Gamepad2 size={20} />
            </div>
            <div>
              <h4 className="font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition text-sm">
                Cognitive Games
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-snug">
                9 focus, logic, and memory games with multiplayer rooms.
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Trust & Privacy Principles */}
      <section className="p-6 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="text-amber-700 dark:text-amber-400" size={20} />
          <h3 className="font-serif font-bold text-amber-950 dark:text-amber-300">Our Trust Principles</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 text-xs text-stone-700 dark:text-stone-300">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-amber-700 dark:text-amber-400 mt-0.5 shrink-0" />
            <span><strong className="text-stone-900 dark:text-stone-100">You remain in control:</strong> AI suggests interpretations, but your feedback always takes priority.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-amber-700 dark:text-amber-400 mt-0.5 shrink-0" />
            <span><strong className="text-stone-900 dark:text-stone-100">Never a medical diagnosis:</strong> We estimate signals, never label mental disorders.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-amber-700 dark:text-amber-400 mt-0.5 shrink-0" />
            <span><strong className="text-stone-900 dark:text-stone-100">Privacy first:</strong> Zero raw camera footage stored; all personal notes belong solely to you.</span>
          </div>
        </div>
      </section>

    </div>
  );
};
