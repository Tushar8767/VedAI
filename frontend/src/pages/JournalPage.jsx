import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Search, Download, Trash2, Calendar, Tag, ShieldCheck } from 'lucide-react';

export const JournalPage = ({ onOpenAuth }) => {
  const { isGuest } = useAuth();
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isGuest) {
      loadJournals();
    } else {
      setLoading(false);
    }
  }, [isGuest]);

  const loadJournals = async () => {
    setLoading(true);
    try {
      const res = await api.getJournalEntries(search);
      if (res.success) {
        setEntries(res.entries);
      }
    } catch (err) {
      console.error('Failed to load journals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this private journal entry?')) return;
    try {
      const res = await api.deleteJournalEntry(id);
      if (res.success) {
        setEntries(entries.filter(e => e._id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.exportJournal();
      if (res.success) {
        const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vedai-journal-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (isGuest) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-2xl">
          📖
        </div>
        <h2 className="font-serif text-2xl font-bold text-stone-900">
          Private Personal Journal
        </h2>
        <p className="text-xs text-stone-600 leading-relaxed max-w-md mx-auto">
          Your journal is an encrypted, private sanctuary for your reflections and thoughts. Sign in or create an account to begin saving entries.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition shadow-sm"
        >
          Sign In to Open Journal
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            My Private Journal
          </h1>
          <p className="text-xs text-stone-500">
            {entries.length} reflections saved &bull; Encrypted &amp; private
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={entries.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-medium text-stone-700 hover:bg-stone-50 transition disabled:opacity-50"
        >
          <Download size={14} />
          <span>Export Data</span>
        </button>
      </div>

      {/* Entries List */}
      {entries.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E8E1D5] space-y-2">
          <p className="text-sm font-serif text-stone-600">Your journal is currently empty.</p>
          <p className="text-xs text-stone-400">Complete a reflection in the Reflect space and click "Save to Private Journal".</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry._id} className="p-6 rounded-2xl bg-white border border-[#E8E1D5] space-y-4 shadow-sm">
              
              <div className="flex items-center justify-between text-xs text-stone-400 border-b border-stone-100 pb-2">
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  {new Date(entry.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <button
                  onClick={() => handleDelete(entry._id)}
                  className="text-stone-400 hover:text-red-600 transition"
                  title="Delete entry"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Raw User Thought */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Original Thought
                </label>
                <p className="text-sm text-stone-900 font-serif leading-relaxed italic">
                  "{entry.rawUserInput}"
                </p>
              </div>

              {/* Validation & Working Context */}
              <div className="grid sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#FAF8F5] border border-stone-200/60 text-xs">
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">What AI Observed</span>
                  <span className="text-stone-700">{entry.aiEstimatedSignal || 'General thought'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Your Context / Correction</span>
                  <span className="text-stone-900 font-medium">{entry.finalWorkingContext || 'Validated as accurate'}</span>
                </div>
              </div>

              {/* Gita Connection */}
              {entry.linkedVerseRef && (
                <div className="text-xs text-amber-900 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/50">
                  <strong>Connected Scripture:</strong> {entry.linkedVerseRef}
                </div>
              )}

              {/* Personal Notes */}
              {entry.userReflectionNotes && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                    Your Personal Reflection
                  </label>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    {entry.userReflectionNotes}
                  </p>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
