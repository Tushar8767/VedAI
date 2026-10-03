/**
 * VedAI 2.0 — Offline-First Game Storage Service (IndexedDB + localStorage fallback)
 * 
 * Guarantees that gameplay sessions, scores, and practice records function
 * completely offline without network or MongoDB dependency.
 */

const DB_NAME = 'VedAIGamesDB';
const DB_VERSION = 1;
const STORE_NAME = 'game_sessions';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('gameType', 'gameType', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// LocalStorage Fallback
const LOCAL_STORAGE_KEY = 'vedai_offline_games';

function getLocalStorageSessions() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalStorageSessions(sessions) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.warn('[GameStorage] LocalStorage write failed:', err);
  }
}

export const gameStorageService = {
  async saveSession(session) {
    const record = {
      id: session.id || 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      gameType: session.gameType,
      difficulty: session.difficulty || 'standard',
      completed: session.completed !== false,
      durationSeconds: Number(session.durationSeconds || 0),
      resultSummary: session.resultSummary || {},
      synced: Boolean(session.synced),
      createdAt: session.createdAt || new Date().toISOString()
    };

    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(record);
        tx.oncomplete = () => resolve(record);
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Fallback to localStorage
      const sessions = getLocalStorageSessions();
      sessions.unshift(record);
      // Keep last 100 sessions in localStorage
      if (sessions.length > 100) sessions.pop();
      setLocalStorageSessions(sessions);
      return record;
    }
  },

  async getHistory(gameType = null) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          let list = req.result || [];
          if (gameType) {
            list = list.filter(item => item.gameType === gameType);
          }
          list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      let list = getLocalStorageSessions();
      if (gameType) {
        list = list.filter(item => item.gameType === gameType);
      }
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  },

  async clearHistory() {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return true;
    }
  },

  async getSessions(limit = 50) {
    const list = await this.getHistory();
    return list.slice(0, limit);
  },

  async clearSessions() {
    return this.clearHistory();
  }
};

export const gameStorage = gameStorageService;
export default gameStorageService;
