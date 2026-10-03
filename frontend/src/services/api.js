const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('vedai_token');
  const guestSessionId = localStorage.getItem('vedai_guest_session_id') || 'guest_default';
  
  const headers = {
    'Content-Type': 'application/json',
    'x-guest-session-id': guestSessionId
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export const api = {
  // Authentication & Guest
  async getGuestSession() {
    const res = await fetch(`${API_BASE}/auth/guest`);
    return res.json();
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async register(name, email, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    return res.json();
  },

  async forgotPassword(email) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  async verifyResetToken(token) {
    const res = await fetch(`${API_BASE}/auth/verify-reset-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    return res.json();
  },

  async resetPassword(token, newPassword) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Core Reflection Orchestrator
  async orchestrateReflection(userInput, faceData = null, validation = null) {
    const res = await fetch(`${API_BASE}/reflect/orchestrate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userInput, faceData, validation })
    });
    return res.json();
  },

  // Gita Knowledge Base
  async getChapters() {
    const res = await fetch(`${API_BASE}/gita/chapters`);
    return res.json();
  },

  async getChapter(chapterNum) {
    const res = await fetch(`${API_BASE}/gita/chapters/${chapterNum}`);
    return res.json();
  },

  async searchGita(query) {
    const res = await fetch(`${API_BASE}/gita/search?q=${encodeURIComponent(query)}`);
    return res.json();
  },

  // Practices
  async getPractices() {
    const res = await fetch(`${API_BASE}/practices`);
    return res.json();
  },

  async logPracticeCompletion(practiceId, durationMinutes, userNote = '') {
    const res = await fetch(`${API_BASE}/practices/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ practiceId, durationMinutes, userNote })
    });
    return res.json();
  },

  // Journal
  async getJournalEntries(search = '', tag = '') {
    let url = `${API_BASE}/journal?`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (tag) url += `tag=${encodeURIComponent(tag)}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return res.json();
  },

  async saveJournalEntry(entryData) {
    const res = await fetch(`${API_BASE}/journal`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(entryData)
    });
    return res.json();
  },

  async deleteJournalEntry(id) {
    const res = await fetch(`${API_BASE}/journal/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async exportJournal() {
    const res = await fetch(`${API_BASE}/journal/export`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Notes
  async getNotes(search = '', tag = '') {
    let url = `${API_BASE}/notes?`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (tag) url += `tag=${encodeURIComponent(tag)}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return res.json();
  },

  async createNote(noteData) {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(noteData)
    });
    return res.json();
  },

  async updateNote(id, noteData) {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(noteData)
    });
    return res.json();
  },

  async deleteNote(id) {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // My Journey
  async getJourneyDashboard() {
    const res = await fetch(`${API_BASE}/journey/dashboard`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Resources
  async getResources(category = '') {
    const url = category ? `${API_BASE}/resources?category=${encodeURIComponent(category)}` : `${API_BASE}/resources`;
    const res = await fetch(url);
    return res.json();
  },

  // Bookmarks
  async getBookmarks() {
    const res = await fetch(`${API_BASE}/gita/bookmarks`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async saveBookmark(bookmarkData) {
    const res = await fetch(`${API_BASE}/gita/bookmarks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookmarkData)
    });
    return res.json();
  },

  async deleteBookmark(id) {
    const res = await fetch(`${API_BASE}/gita/bookmarks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Settings & Privacy
  async getPrivacySummary() {
    const res = await fetch(`${API_BASE}/settings/privacy-summary`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async exportAllData() {
    const res = await fetch(`${API_BASE}/settings/export`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async updatePreferences(preferences) {
    const res = await fetch(`${API_BASE}/settings/preferences`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(preferences)
    });
    return res.json();
  },

  async deleteContentOnly() {
    const res = await fetch(`${API_BASE}/settings/delete-content-only`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async purgeAllData() {
    const res = await fetch(`${API_BASE}/settings/account`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Research Telemetry (Privacy-Preserving & De-identified)
  async sendTelemetryEvent(telemetryData) {
    const res = await fetch(`${API_BASE}/telemetry/event`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(telemetryData)
    });
    return res.json();
  },

  async getTelemetrySummary() {
    const res = await fetch(`${API_BASE}/telemetry/summary`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};
