/**
 * VedAI 2.0 — Game Backend API Service
 * 
 * Synchronizes completed game sessions and fetches user statistics.
 */

const API_BASE = '/api/games';

function getAuthHeader() {
  const token = localStorage.getItem('vedai_token') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const gameApiService = {
  async saveResult(gameResult) {
    try {
      const res = await fetch(`${API_BASE}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(gameResult)
      });
      return await res.json();
    } catch (err) {
      console.warn('[GameAPI] Save failed, operating offline:', err.message);
      return { success: false, offline: true };
    }
  },

  async getHistory(gameType = null) {
    try {
      const url = gameType ? `${API_BASE}/history?gameType=${gameType}` : `${API_BASE}/history`;
      const res = await fetch(url, {
        headers: getAuthHeader()
      });
      return await res.json();
    } catch (err) {
      console.warn('[GameAPI] Fetch history failed:', err.message);
      return { success: false, history: [] };
    }
  },

  async getStats() {
    try {
      const res = await fetch(`${API_BASE}/stats`, {
        headers: getAuthHeader()
      });
      return await res.json();
    } catch (err) {
      return { success: false, stats: null };
    }
  },

  async clearHistory() {
    try {
      const res = await fetch(`${API_BASE}/history`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      return await res.json();
    } catch (err) {
      return { success: false };
    }
  },

  async checkRoom(roomCode) {
    try {
      const res = await fetch(`${API_BASE}/rooms/${roomCode}`);
      return await res.json();
    } catch (err) {
      return { success: false, message: 'Could not connect to room server' };
    }
  }
};

export const gameApi = gameApiService;
export default gameApiService;
