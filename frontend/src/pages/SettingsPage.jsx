import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Settings, 
  ShieldCheck, 
  Camera, 
  Trash2, 
  Check, 
  Download, 
  Bell, 
  Globe, 
  Sliders, 
  Lock, 
  Info, 
  Eye, 
  AlertTriangle 
} from 'lucide-react';

export const SettingsPage = ({ onOpenAuth }) => {
  const { user, isGuest, logout } = useAuth();
  
  // Settings State
  const [language, setLanguage] = useState('en');
  const [emotionAI, setEmotionAI] = useState(true);
  const [cameraConsent, setCameraConsent] = useState(false);
  const [researchConsent, setResearchConsent] = useState(false);
  const [dailyReminder, setDailyReminder] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // Privacy Dashboard State
  const [privacySummary, setPrivacySummary] = useState(null);
  const [loadingPrivacy, setLoadingPrivacy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    if (!isGuest) {
      loadPrivacyDashboard();
    }
  }, [isGuest]);

  const loadPrivacyDashboard = async () => {
    setLoadingPrivacy(true);
    try {
      const res = await api.getPrivacySummary();
      if (res.success) {
        setPrivacySummary(res);
        if (res.consentStatus) {
          setLanguage(res.consentStatus.language || 'en');
          setEmotionAI(res.consentStatus.aiEmotionIntelligence ?? true);
          setCameraConsent(res.consentStatus.facialAnalysis ?? false);
          setResearchConsent(res.consentStatus.researchParticipation ?? false);
          if (res.consentStatus.notifications) {
            setDailyReminder(res.consentStatus.notifications.dailyReminder ?? false);
            setWeeklyDigest(res.consentStatus.notifications.weeklyDigest ?? false);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load privacy dashboard:', err);
    } finally {
      setLoadingPrivacy(false);
    }
  };

  const handleSavePreferences = async () => {
    if (isGuest) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }

    try {
      const res = await api.updatePreferences({
        language,
        enableEmotionIntelligence: emotionAI,
        enableFacialAnalysisConsent: cameraConsent,
        enableResearchParticipation: researchConsent,
        notifications: {
          dailyReminder,
          weeklyDigest
        }
      });
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      console.error('Failed to update preferences:', err);
    }
  };

  const handleExportData = async () => {
    if (isGuest) {
      onOpenAuth();
      return;
    }
    try {
      const res = await api.exportAllData();
      if (res.success) {
        const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vedai-complete-data-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        setActionMessage('Data export downloaded successfully.');
        setTimeout(() => setActionMessage(''), 3000);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleDeleteContentOnly = async () => {
    if (!confirm('This will permanently delete all your private journal entries, notes, practices, and bookmarks. Your account will remain active. Proceed?')) {
      return;
    }
    try {
      const res = await api.deleteContentOnly();
      if (res.success) {
        setActionMessage(res.message);
        loadPrivacyDashboard();
        setTimeout(() => setActionMessage(''), 4000);
      }
    } catch (err) {
      console.error('Delete content failed:', err);
    }
  };

  const handlePurgeAccount = async () => {
    if (!confirm('CRITICAL ACTION: This will permanently delete your user account AND all associated data from the database. This action is irreversible. Proceed?')) {
      return;
    }
    try {
      const res = await api.purgeAllData();
      if (res.success) {
        alert('Your account and all associated data have been permanently removed.');
        logout();
      }
    } catch (err) {
      console.error('Purge failed:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Settings &amp; Privacy Dashboard
        </h1>
        <p className="text-xs text-stone-500">
          Manage your personal workspace, data sovereignty, AI assistance, and security preferences.
        </p>
      </div>

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-medium flex items-center gap-2">
          <Check size={16} className="text-emerald-700" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 1. Profile & Account */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E1D5] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck size={16} className="text-amber-800" />
              <span>Account Identity</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {isGuest ? 'Exploring in anonymous Guest Mode' : `Signed in as ${user?.name || 'Seeker'} (${user?.email})`}
            </p>
          </div>
          {isGuest && (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800"
            >
              Sign In / Register
            </button>
          )}
        </div>

        {/* 2. Privacy Dashboard & Data Sovereignty */}
        {!isGuest && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Your Stored Data Summary (MongoDB Atlas)
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200 text-center">
                <div className="text-lg font-serif font-bold text-amber-900">
                  {privacySummary?.storedDataSummary?.journalEntries ?? 0}
                </div>
                <div className="text-[10px] text-stone-500 uppercase font-semibold">Journals</div>
              </div>
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200 text-center">
                <div className="text-lg font-serif font-bold text-purple-900">
                  {privacySummary?.storedDataSummary?.personalNotes ?? 0}
                </div>
                <div className="text-[10px] text-stone-500 uppercase font-semibold">Notes</div>
              </div>
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200 text-center">
                <div className="text-lg font-serif font-bold text-emerald-900">
                  {privacySummary?.storedDataSummary?.practicesCompleted ?? 0}
                </div>
                <div className="text-[10px] text-stone-500 uppercase font-semibold">Practices</div>
              </div>
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200 text-center">
                <div className="text-lg font-serif font-bold text-sky-900">
                  {privacySummary?.storedDataSummary?.savedVerses ?? 0}
                </div>
                <div className="text-[10px] text-stone-500 uppercase font-semibold">Verses</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={handleExportData}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-medium transition"
              >
                <Download size={14} />
                <span>Export My Complete Data (JSON)</span>
              </button>
              <button
                onClick={handleDeleteContentOnly}
                className="px-3.5 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-medium transition"
              >
                Clear Content (Keep Account)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Language & Localization */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E1D5] shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <Globe size={16} className="text-amber-800" />
          <span>Language &amp; Code-Switching Preferences</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'en', label: 'English' },
            { id: 'hi', label: 'Hindi (हिंदी)' },
            { id: 'mr', label: 'Marathi (मराठी)' },
            { id: 'auto', label: 'Auto-Detect Mixed' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setLanguage(item.id)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                language === item.id
                  ? 'border-amber-800 bg-amber-50 text-amber-900 shadow-xs'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-stone-400">
          VedAI automatically parses Hinglish, Marathinglish, spelling errors, and emojis regardless of primary selection.
        </p>
      </div>

      {/* 4. AI & Camera Consent Controls */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E1D5] shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <Sliders size={16} className="text-amber-800" />
          <span>AI Assistance &amp; Sensory Permissions</span>
        </h3>

        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <div className="pr-4">
              <span className="text-xs font-semibold text-stone-800 block">Emotion Signal Estimation</span>
              <span className="text-[11px] text-stone-500">Provide non-diagnostic emotion interpretations to guide reflection</span>
            </div>
            <input
              type="checkbox"
              checked={emotionAI}
              onChange={(e) => setEmotionAI(e.target.checked)}
              className="w-4 h-4 text-amber-700 rounded focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="pr-4">
              <span className="text-xs font-semibold text-stone-800 block">Facial Analysis Consent (Client-Side)</span>
              <span className="text-[11px] text-stone-500">Permit ephemeral client-side camera landmark estimation (no video stored)</span>
            </div>
            <input
              type="checkbox"
              checked={cameraConsent}
              onChange={(e) => setCameraConsent(e.target.checked)}
              className="w-4 h-4 text-amber-700 rounded focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="pr-4">
              <span className="text-xs font-semibold text-stone-800 block">Anonymous Research Participation</span>
              <span className="text-[11px] text-stone-500">Contribute anonymized telemetry to improve multivariant Gita RAG retrieval</span>
            </div>
            <input
              type="checkbox"
              checked={researchConsent}
              onChange={(e) => setResearchConsent(e.target.checked)}
              className="w-4 h-4 text-amber-700 rounded focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* 5. Notifications */}
      <div className="bg-white rounded-3xl p-6 border border-[#E8E1D5] shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <Bell size={16} className="text-amber-800" />
          <span>Notification Preferences</span>
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-stone-800 block">Daily Mindful Pause Reminder</span>
              <span className="text-[11px] text-stone-500">Receive a gentle prompt for your daily breath or reflection practice</span>
            </div>
            <input
              type="checkbox"
              checked={dailyReminder}
              onChange={(e) => setDailyReminder(e.target.checked)}
              className="w-4 h-4 text-amber-700 rounded focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-stone-800 block">Weekly Reflection Digest</span>
              <span className="text-[11px] text-stone-500">A factual summary of your consistency and explored Gita verses</span>
            </div>
            <input
              type="checkbox"
              checked={weeklyDigest}
              onChange={(e) => setWeeklyDigest(e.target.checked)}
              className="w-4 h-4 text-amber-700 rounded focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleSavePreferences}
          className="px-6 py-2.5 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition shadow-sm"
        >
          Save All Preferences
        </button>

        {saved && (
          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <Check size={14} /> Preferences Saved!
          </span>
        )}
      </div>

      {/* 6. Danger Zone: Permanent Account Deletion */}
      {!isGuest && (
        <div className="p-6 rounded-3xl bg-red-50/70 border border-red-200 space-y-3">
          <h4 className="text-xs font-bold text-red-900 flex items-center gap-2 uppercase tracking-wider">
            <AlertTriangle size={15} /> Permanent Account Erasure
          </h4>
          <p className="text-xs text-red-800 leading-relaxed">
            Permanently delete your user credentials and purge all personal journal entries, notes, practices, and bookmarks from the MongoDB cluster. This operation cannot be reversed.
          </p>
          <button
            onClick={handlePurgeAccount}
            className="px-4 py-2 rounded-xl bg-red-700 text-white text-xs font-semibold hover:bg-red-800 transition shadow-sm"
          >
            Permanently Delete My Account &amp; All Data
          </button>
        </div>
      )}

      {/* 7. About VedAI */}
      <div className="text-center text-xs text-stone-400 space-y-1 pt-4 border-t border-[#E8E1D5]">
        <div className="font-semibold text-stone-600">VedAI 2.0 &bull; Personal Wisdom &amp; Reflection Workspace</div>
        <p>Built with explainable AI principles: AI suggests &bull; Evidence explains &bull; The user decides.</p>
      </div>

    </div>
  );
};
