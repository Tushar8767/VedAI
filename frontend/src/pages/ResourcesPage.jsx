import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Video, ExternalLink, Search } from 'lucide-react';

export const ResourcesPage = () => {
  const [resources, setResources] = useState([]);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResources();
  }, [category]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const res = await api.getResources(category === 'All' ? '' : category);
      if (res.success) {
        setResources(res.resources);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Wisdom &amp; Mindfulness Resources
        </h1>
        <p className="text-xs text-stone-500">
          Curated lectures, guided breathing, and philosophical explorations hosted on YouTube.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 border-b border-[#E8E1D5] pb-3">
        {['All', 'Gita', 'Meditation', 'Breathing', 'Focus', 'Reflection', 'Learning'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              category === cat
                ? 'bg-amber-800 text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Resources Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {resources.map((item) => (
          <div key={item.id} className="p-5 rounded-2xl bg-white border border-[#E8E1D5] flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md transition">
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 px-2 py-0.5 rounded-full">
                  {item.category}
                </span>
                <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200">
                  External Resource &bull; YouTube
                </span>
              </div>

              <h3 className="font-serif text-base font-bold text-stone-900 leading-snug">
                {item.title}
              </h3>

              <p className="text-xs text-stone-500 line-clamp-2">
                {item.description}
              </p>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[11px] text-stone-500 font-medium">
                {item.channel}
              </span>

              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-900 hover:underline"
              >
                <span>Watch on YouTube</span>
                <ExternalLink size={12} />
              </a>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
