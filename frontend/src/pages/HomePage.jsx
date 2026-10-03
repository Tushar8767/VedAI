import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Feather, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  HeartHandshake 
} from 'lucide-react';

export const HomePage = ({ setTab, setInitialPrompt }) => {
  const [prompt, setPrompt] = useState('');

  const handleStartReflection = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setInitialPrompt(prompt);
    setTab('reflect');
  };

  return (
    <div className="space-y-16 py-6 max-w-4xl mx-auto px-4">
      
      {/* Hero Welcome */}
      <section className="text-center space-y-4 pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-medium bg-amber-700/10 text-amber-900 mb-2 border border-amber-800/10">
          <Sparkles size={14} className="text-amber-700" />
          <span>Personal Self-Reflection &amp; Wisdom Workspace</span>
        </div>
        
        <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-stone-900 leading-tight">
          Understand. Reflect. Learn.
        </h1>
        
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-stone-600 font-light leading-relaxed">
          A quiet, gentle sanctuary to express what you are experiencing, understand your emotional signals, 
          and discover timeless clarity from the Bhagavad Gita.
        </p>

        {/* Central Entry Point: "What is on your mind today?" */}
        <div className="max-w-2xl mx-auto pt-6">
          <form 
            onSubmit={handleStartReflection}
            className="glass-panel p-2 sm:p-3 rounded-2xl shadow-sm hover:shadow-md transition border border-stone-200/80 bg-white/90"
          >
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What is on your mind today? (Type naturally in English, Hindi, Marathi, or mixed...)"
                rows={3}
                className="w-full p-3.5 text-sm sm:text-base text-stone-800 placeholder-stone-400 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none"
              />
            </div>
            <div className="flex items-center justify-between pt-2 px-2 border-t border-stone-100">
              <span className="text-xs text-stone-400">
                Spelling mistakes &amp; slang are completely okay
              </span>
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-700 text-white font-medium text-sm hover:bg-amber-800 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <span>Reflect</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* The Three Pillars (Explained in simple, non-jargon language) */}
      <section className="grid sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#F5F2EB]/60 border border-[#E8E1D5] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            1
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-800">Understand</h3>
          <p className="text-sm text-stone-600 leading-relaxed">
            Express yourself freely in your own words. VedAI identifies possible emotional signals without medical labels or diagnoses.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#F5F2EB]/60 border border-[#E8E1D5] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            2
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-800">Reflect</h3>
          <p className="text-sm text-stone-600 leading-relaxed">
            Validate or correct what VedAI noticed. Answer thoughtful inquiry questions designed to help you see things clearly.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#F5F2EB]/60 border border-[#E8E1D5] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
            3
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-800">Learn</h3>
          <p className="text-sm text-stone-600 leading-relaxed">
            Explore authentic Bhagavad Gita teachings tailored to your dilemma, with transparent explanations of why each verse was chosen.
          </p>
        </div>
      </section>

      {/* Quick Action Cards */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 text-center">
          Explore VedAI Features
        </h2>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => setTab('gita')}
            className="p-5 rounded-2xl border border-stone-200 bg-white/70 hover:bg-white text-left transition flex items-start gap-4 group hover:shadow-sm"
          >
            <div className="p-3 rounded-xl bg-amber-50 text-amber-800 group-hover:scale-105 transition">
              <BookOpen size={22} />
            </div>
            <div>
              <h4 className="font-serif font-bold text-stone-800 group-hover:text-amber-800 transition">
                Explore the Bhagavad Gita
              </h4>
              <p className="text-xs text-stone-500 mt-1">
                Browse 18 chapters and 700 verses with Sanskrit, translation, and life themes.
              </p>
            </div>
          </button>

          <button
            onClick={() => setTab('practice')}
            className="p-5 rounded-2xl border border-stone-200 bg-white/70 hover:bg-white text-left transition flex items-start gap-4 group hover:shadow-sm"
          >
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 group-hover:scale-105 transition">
              <Feather size={22} />
            </div>
            <div>
              <h4 className="font-serif font-bold text-stone-800 group-hover:text-emerald-800 transition">
                Start a 3-Minute Practice
              </h4>
              <p className="text-xs text-stone-500 mt-1">
                Guided Box Breathing, silent meditation, or verse contemplation.
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Trust & Privacy Principles */}
      <section className="p-6 rounded-2xl bg-amber-50/50 border border-amber-200/60">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="text-amber-700" size={20} />
          <h3 className="font-serif font-bold text-amber-950">Our Trust Principles</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 text-xs text-stone-700">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-amber-700 mt-0.5 shrink-0" />
            <span><strong>You remain in control:</strong> AI suggests interpretations, but your own feedback always takes priority.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-amber-700 mt-0.5 shrink-0" />
            <span><strong>Never a medical diagnosis:</strong> We estimate signals, never label mental disorders.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-amber-700 mt-0.5 shrink-0" />
            <span><strong>Privacy first:</strong> Zero raw camera footage stored; all personal notes belong solely to you.</span>
          </div>
        </div>
      </section>

    </div>
  );
};
