import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Activity, BookOpen, Feather, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

export const JourneyPage = ({ onOpenAuth }) => {
  const { isGuest } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isGuest) {
      loadDashboard();
    } else {
      setLoading(false);
    }
  }, [isGuest]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getJourneyDashboard();
      if (res.success) {
        setDashboard(res);
      }
    } catch (err) {
      console.error('Failed to load journey dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isGuest) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-2xl font-serif">
          🌿
        </div>
        <h2 className="font-serif text-2xl font-bold text-stone-900">
          Your Personal Journey
        </h2>
        <p className="text-xs text-stone-600 leading-relaxed max-w-md mx-auto">
          Track your mindful consistency, completed reflections, and breathing sessions. Create an account or sign in to start recording your personal journey.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition shadow-sm"
        >
          Sign In to View Journey
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">
          My Personal Journey
        </h1>
        <p className="text-xs text-stone-600 dark:text-stone-300">
          A factual record of your mindful reflections and practices.
        </p>
      </div>

      {/* Factual Activity Metrics (Strictly NO fake mental health scores) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E8E1D5] space-y-1 text-center">
          <div className="font-serif text-3xl font-bold text-amber-900">
            {dashboard?.stats?.reflectionsAndJournals || 0}
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Reflections
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8E1D5] space-y-1 text-center">
          <div className="font-serif text-3xl font-bold text-emerald-800">
            {dashboard?.stats?.practicesCompleted || 0}
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Practices Done
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8E1D5] space-y-1 text-center">
          <div className="font-serif text-3xl font-bold text-sky-800">
            {dashboard?.stats?.savedVerses || 0}
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Saved Verses
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E8E1D5] space-y-1 text-center">
          <div className="font-serif text-3xl font-bold text-purple-800">
            {dashboard?.stats?.personalNotes || 0}
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Personal Notes
          </div>
        </div>
      </div>

      {/* Philosophy Box */}
      <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-start gap-3">
        <ShieldCheck size={18} className="text-amber-800 mt-0.5 shrink-0" />
        <div className="text-xs text-stone-700 leading-relaxed">
          <strong>Factual Growth, Not Gamification:</strong> VedAI celebrates your consistent mindful presence. 
          We never calculate synthetic "wellness scores" or "happiness percentages", because inner growth is deeply human and cannot be simplified into an artificial score.
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8E1D5] space-y-4">
        <h3 className="font-serif text-lg font-bold text-stone-800">
          Recent Activities
        </h3>

        {dashboard?.recentActivities && dashboard.recentActivities.length > 0 ? (
          <div className="space-y-3">
            {dashboard.recentActivities.map((act, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF8F5] border border-stone-100">
                <CheckCircle2 size={16} className="text-amber-700 mt-0.5 shrink-0" />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-800">{act.title}</span>
                    <span className="text-[10px] text-stone-400">
                      {new Date(act.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-stone-500 mt-0.5">{act.snippet}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-400 italic">
            No recent activity recorded yet. Start a reflection or complete a practice session to see your progress here!
          </p>
        )}
      </div>

    </div>
  );
};
