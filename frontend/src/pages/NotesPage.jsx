import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FileText, Plus, Trash2, Edit3, Check, Search, Tag, Calendar } from 'lucide-react';

export const NotesPage = ({ onOpenAuth }) => {
  const { isGuest } = useAuth();
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Note creation / editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [attachedType, setAttachedType] = useState('GENERAL');

  useEffect(() => {
    if (!isGuest) {
      loadNotes();
    } else {
      setLoading(false);
    }
  }, [isGuest]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res = await api.getNotes(search);
      if (res.success) {
        setNotes(res.notes);
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const tags = tagInput ? tagInput.split(',').map(t => t.trim()).filter(Boolean) : [];

    try {
      if (editId) {
        const res = await api.updateNote(editId, { title, content, tags });
        if (res.success) {
          setNotes(notes.map(n => n._id === editId ? res.note : n));
          resetForm();
        }
      } else {
        const res = await api.createNote({
          title,
          content,
          attachedToType: attachedType,
          tags
        });
        if (res.success) {
          setNotes([res.note, ...notes]);
          resetForm();
        }
      }
    } catch (err) {
      console.error('Error saving note:', err);
    }
  };

  const handleStartEdit = (note) => {
    setIsEditing(true);
    setEditId(note._id);
    setTitle(note.title);
    setContent(note.content);
    setTagInput((note.tags || []).join(', '));
    setAttachedType(note.attachedToType || 'GENERAL');
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this personal note?')) return;
    try {
      const res = await api.deleteNote(id);
      if (res.success) {
        setNotes(notes.filter(n => n._id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setTitle('');
    setContent('');
    setTagInput('');
    setAttachedType('GENERAL');
  };

  if (isGuest) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-2xl font-serif">
          📝
        </div>
        <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
          Personal Wisdom Notes
        </h2>
        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed max-w-md mx-auto">
          Capture insights attached to Gita verses, mindfulness practices, or personal reflections. Sign in or create an account to start taking persistent notes.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition shadow-sm"
        >
          Sign In to Open Notes
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">
            Personal Notes
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-300">
            {notes.length} notes saved &bull; Private &amp; attached to your reflections
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition shadow-sm"
          >
            <Plus size={15} />
            <span>New Note</span>
          </button>
        )}
      </div>

      {/* Editor Modal / Inline Form */}
      {isEditing && (
        <form onSubmit={handleSaveNote} className="p-6 rounded-2xl bg-white border border-[#E8E1D5] space-y-4 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-serif text-base font-bold text-stone-800">
              {editId ? 'Edit Personal Note' : 'Create New Note'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-stone-400 hover:text-stone-700"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Insight from Chapter 2 on Detachment"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-amber-700 bg-[#FAF8F5]/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Content</label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your personal takeaway, realization, or question here..."
              className="w-full p-3.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-amber-700 bg-[#FAF8F5]/50 resize-none leading-relaxed"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Gita, Career, Peace"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-amber-700 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Category</label>
              <select
                value={attachedType}
                onChange={(e) => setAttachedType(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-amber-700 bg-white"
              >
                <option value="GENERAL">General Insight</option>
                <option value="GITA_VERSE">Gita Verse Note</option>
                <option value="JOURNAL_ENTRY">Journal Reflection</option>
                <option value="PRACTICE">Mindfulness Practice</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition"
            >
              {editId ? 'Save Changes' : 'Create Note'}
            </button>
          </div>
        </form>
      )}

      {/* Notes List */}
      {notes.length === 0 && !isEditing ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E8E1D5] space-y-2">
          <p className="text-sm font-serif text-stone-600">You have no notes saved yet.</p>
          <p className="text-xs text-stone-400">Click "New Note" above to write down timeless insights or personal lessons.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note._id} className="p-6 rounded-2xl bg-white border border-[#E8E1D5] space-y-3 shadow-sm hover:shadow-md transition">
              
              <div className="flex items-center justify-between text-xs text-stone-400 border-b border-stone-100 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 px-2.5 py-0.5 rounded-full">
                  {note.attachedToType || 'GENERAL'}
                </span>
                
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Calendar size={12} />
                    {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleStartEdit(note)}
                    className="text-stone-400 hover:text-amber-800 transition"
                    title="Edit Note"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(note._id)}
                    className="text-stone-400 hover:text-red-600 transition"
                    title="Delete Note"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <h3 className="font-serif text-lg font-bold text-stone-900">
                {note.title}
              </h3>

              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>

              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {note.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Tag size={10} />
                      {t}
                    </span>
                  ))}
                </div>
              )}

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
