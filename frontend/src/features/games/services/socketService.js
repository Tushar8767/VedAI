/**
 * VedAI 2.0 — Multiplayer Client WebSocket Service
 * 
 * Manages client connection to ws://localhost:5000/ws/games with automatic reconnection.
 */

class SocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map(); // eventType -> Set of callbacks
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimer = null;
    this.isConnected = false;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = localStorage.getItem('token');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // In dev, frontend is on 5173 and backend on 5000; in prod Nginx proxies
    const host = window.location.port === '5173' ? 'localhost:5000' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/games${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('SOCKET_CONNECTED', {});
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.type, data);
        } catch (err) {
          console.error('[SocketService] Malformed incoming message:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit('SOCKET_DISCONNECTED', {});
        this.attemptReconnect();
      };

      this.ws.onerror = (err) => {
        this.emit('SOCKET_ERROR', err);
      };
    } catch (err) {
      console.warn('[SocketService] Connection attempt error:', err);
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  send(type, payload = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    this.ws.send(JSON.stringify({ type, ...payload }));
    return true;
  }

  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);
    return () => this.off(type, callback);
  }

  off(type, callback) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(callback);
    }
  }

  emit(type, data) {
    if (this.listeners.has(type)) {
      for (const cb of this.listeners.get(type)) {
        try {
          cb(data);
        } catch (err) {
          console.error(`[SocketService] Error in listener for ${type}:`, err);
        }
      }
    }
  }

  disconnect() {
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}

export const socketService = new SocketService();
