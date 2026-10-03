/**
 * VedAI 2.0 — Ephemeral Multiplayer Room Manager
 * 
 * Manages in-memory room lifecycle for 2–8 player synchronous cognitive practice.
 * Modularized with an adapter interface to support Redis clustering when scaled.
 */

const crypto = require('crypto');
const { validateGameSubmission } = require('../features/games/gameValidator');

class Room {
  constructor({ code, hostUser, gameType = 'reaction_focus', maxPlayers = 8, config = {} }) {
    this.code = code;
    this.roomCode = code;
    this.hostId = String(hostUser.id || hostUser._id);
    this.gameType = gameType;
    this.difficulty = config.difficulty || 'standard';
    this.maxPlayers = Math.max(2, Math.min(8, Number(maxPlayers) || 8));
    this.config = config;
    this.status = 'lobby'; // 'lobby' | 'countdown' | 'playing' | 'finished'
    this.playerMap = new Map(); // userId -> player object
    this.leaderboard = [];
    this.rematchVotes = new Set();
    this.createdAt = Date.now();
    this.lastActivity = Date.now();

    // Add host as first player
    this.addPlayer(hostUser, true);
  }

  get players() {
    return Array.from(this.playerMap.values());
  }

  addPlayer(user, isHost = false, ws = null) {
    const userId = String(user.id || user._id);
    if (this.playerMap.size >= this.maxPlayers && !this.playerMap.has(userId)) {
      return { success: false, reason: 'ROOM_FULL', error: 'Room is full' };
    }

    if (this.status !== 'lobby' && !this.playerMap.has(userId)) {
      return { success: false, reason: 'GAME_ALREADY_IN_PROGRESS', error: 'Game in progress' };
    }

    const existing = this.playerMap.get(userId);
    const playerData = {
      id: userId,
      name: user.name || 'Seeker',
      isHost: isHost || (existing ? existing.isHost : false),
      isReady: isHost ? true : (existing ? existing.isReady : false),
      progress: 0,
      score: 0,
      finished: false,
      duration: null,
      timeElapsed: null,
      ws: ws || (existing ? existing.ws : null)
    };

    this.playerMap.set(userId, playerData);
    this.lastActivity = Date.now();
    return { success: true, player: this.getSanitizedPlayer(playerData) };
  }

  removePlayer(userId) {
    const uid = String(userId);
    const player = this.playerMap.get(uid);
    if (!player) return null;

    this.playerMap.delete(uid);
    this.rematchVotes.delete(uid);
    this.lastActivity = Date.now();

    // If host left and other players remain, promote next player to host
    let newHostId = null;
    if (player.isHost && this.playerMap.size > 0) {
      const nextPlayer = this.playerMap.values().next().value;
      nextPlayer.isHost = true;
      nextPlayer.isReady = true;
      this.hostId = nextPlayer.id;
      newHostId = nextPlayer.id;
    }

    return { removedId: uid, newHostId, remainingCount: this.playerMap.size };
  }

  setReady(userId, isReady) {
    const player = this.playerMap.get(String(userId));
    if (!player) return false;
    player.isReady = Boolean(isReady);
    this.lastActivity = Date.now();
    return true;
  }

  canStart(requestingUserId) {
    if (String(requestingUserId) !== this.hostId) {
      return { canStart: false, reason: 'Only the host can start the match.' };
    }
    if (this.playerMap.size < 2) {
      return { canStart: false, reason: 'Waiting for at least 2 players to join.' };
    }
    const nonHostPlayers = Array.from(this.playerMap.values()).filter(p => p.id !== this.hostId);
    const allReady = nonHostPlayers.every(p => p.isReady);
    if (!allReady) {
      return { canStart: false, reason: 'All players must be ready before starting.' };
    }
    return { canStart: true };
  }

  updateProgress(userId, progressPercent) {
    const player = this.playerMap.get(String(userId));
    if (!player) return null;
    player.progress = Math.min(100, Math.max(0, Math.round(progressPercent)));
    this.lastActivity = Date.now();
    return player.progress;
  }

  recordFinish(userId, { timeElapsed, score }) {
    const player = this.playerMap.get(String(userId));
    if (!player) return null;

    player.finished = true;
    player.progress = 100;
    player.timeElapsed = timeElapsed;
    player.score = score || 0;
    this.lastActivity = Date.now();

    // Add to leaderboard if not already present
    if (!this.leaderboard.some(e => e.id === player.id)) {
      this.leaderboard.push({
        id: player.id,
        name: player.name,
        timeElapsed,
        score: player.score,
        rank: this.leaderboard.length + 1
      });
    }

    // If all players finished, set room status to finished
    const allFinished = Array.from(this.playerMap.values()).every(p => p.finished);
    if (allFinished) {
      this.status = 'finished';
    }

    const entry = this.leaderboard.find(e => e.id === player.id);
    return entry || { rank: this.leaderboard.length };
  }

  voteRematch(userId) {
    this.rematchVotes.add(String(userId));
    this.lastActivity = Date.now();

    const allVoted = this.rematchVotes.size >= this.playerMap.size;
    if (allVoted) {
      // Reset room state back to lobby
      this.status = 'lobby';
      this.leaderboard = [];
      this.rematchVotes.clear();
      for (const p of this.playerMap.values()) {
        p.finished = false;
        p.progress = 0;
        p.timeElapsed = null;
        p.score = 0;
        p.isReady = p.isHost;
      }
    }
    return { allVoted, count: this.rematchVotes.size, total: this.playerMap.size };
  }

  getState() {
    return this.toJSON();
  }

  broadcast(payload, excludeWs = null) {
    const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
    for (const player of this.playerMap.values()) {
      if (player.ws && player.ws !== excludeWs && player.ws.readyState === 1) {
        try {
          player.ws.send(raw);
        } catch {
          // Socket error
        }
      }
    }
  }

  start() {
    this.status = 'playing';
    this.lastActivity = Date.now();
    return this.getState();
  }

  updatePlayerProgress(userId, msg) {
    const progress = msg.progress !== undefined ? msg.progress : 0;
    this.updateProgress(userId, progress);
    const p = this.playerMap.get(String(userId));
    if (p && msg.score !== undefined) p.score = msg.score;
    return p;
  }

  getSanitizedPlayer(player) {
    const { ws, ...clean } = player;
    return clean;
  }

  toJSON() {
    return {
      roomCode: this.code,
      code: this.code,
      hostId: this.hostId,
      gameType: this.gameType,
      difficulty: this.difficulty,
      maxPlayers: this.maxPlayers,
      status: this.status,
      players: this.players.map(p => this.getSanitizedPlayer(p)),
      leaderboard: this.leaderboard,
      rematchVotes: Array.from(this.rematchVotes)
    };
  }
}

class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> Room
    this.userToRoom = new Map(); // userId -> roomCode
    this.cleanupInterval = setInterval(() => this.cleanupStaleRooms(), 15 * 60 * 1000);
    if (this.cleanupInterval && this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  generateRoomCode() {
    let code;
    let attempts = 0;
    do {
      code = 'VED' + crypto.randomInt(100, 999);
      attempts++;
    } while (this.rooms.has(code) && attempts < 100);
    return code;
  }

  createRoom(arg1, nameOrGameType, maybeGameType, maybeDifficulty) {
    let hostUser, gameType, maxPlayers, config;

    if (typeof arg1 === 'object' && arg1 !== null && !arg1.id && !arg1._id && !arg1.userId) {
      // Object style: { hostUser, gameType, maxPlayers, config }
      ({ hostUser, gameType = 'reaction_focus', maxPlayers = 8, config = {} } = arg1);
    } else {
      // Positional style: (hostId, hostName, gameType, difficulty)
      if (typeof arg1 === 'object' && arg1 !== null) {
        hostUser = arg1;
        gameType = nameOrGameType || 'reaction_focus';
      } else {
        hostUser = { id: arg1, name: nameOrGameType || 'Player' };
        gameType = maybeGameType || 'reaction_focus';
      }
      maxPlayers = 8;
      config = { difficulty: maybeDifficulty || 'easy' };
    }

    const uid = String(hostUser.id || hostUser._id || hostUser.userId);
    const existingCode = this.userToRoom.get(uid);
    if (existingCode) {
      this.leaveRoom(existingCode, uid);
    }

    const code = this.generateRoomCode();
    const room = new Room({ code, hostUser, gameType, maxPlayers, config });
    this.rooms.set(code, room);
    this.userToRoom.set(uid, code);
    return room;
  }

  getRoom(roomCode) {
    if (!roomCode) return null;
    return this.rooms.get(String(roomCode).toUpperCase().trim()) || null;
  }

  joinRoom(arg1, maybeUserId, maybeUserName, maybeWs) {
    let roomCode, user, ws;

    if (typeof arg1 === 'object' && arg1 !== null && arg1.roomCode) {
      ({ roomCode, user, ws = null } = arg1);
    } else {
      roomCode = arg1;
      user = typeof maybeUserId === 'object' ? maybeUserId : { id: maybeUserId, name: maybeUserName || 'Player' };
      ws = maybeWs || null;
    }

    const code = String(roomCode).toUpperCase().trim();
    const room = this.rooms.get(code);
    if (!room) {
      return { success: false, reason: 'ROOM_NOT_FOUND', error: 'Room not found' };
    }

    const userId = String(user.id || user._id || user.userId);
    const currentCode = this.userToRoom.get(userId);
    if (currentCode && currentCode !== code) {
      this.leaveRoom(currentCode, userId);
    }

    const res = room.addPlayer(user, false, ws);
    if (res.success) {
      this.userToRoom.set(userId, code);
      return { success: true, room };
    }
    return { success: false, reason: res.reason, error: res.error || res.reason };
  }

  setPlayerReady(roomCode, userId, isReady) {
    const room = this.getRoom(roomCode);
    if (!room) return false;
    return room.setReady(userId, isReady);
  }

  canStartGame(roomCode, requestingUserId) {
    const room = this.getRoom(roomCode);
    if (!room) return { canStart: false, reason: 'Room not found' };
    return room.canStart(requestingUserId);
  }

  updateProgress(roomCode, userId, progress) {
    const room = this.getRoom(roomCode);
    if (!room) return null;
    return room.updateProgress(userId, progress);
  }

  recordFinish(roomCode, userId, details) {
    const room = this.getRoom(roomCode);
    if (!room) return null;
    return room.recordFinish(userId, details);
  }

  voteRematch(roomCode, userId) {
    const room = this.getRoom(roomCode);
    if (!room) return { allVoted: false };
    return room.voteRematch(userId);
  }

  leaveRoom(roomCode, userId) {
    const code = String(roomCode).toUpperCase().trim();
    const room = this.rooms.get(code);
    const uid = String(userId);

    this.userToRoom.delete(uid);

    if (!room) return null;

    const result = room.removePlayer(uid);
    if (!result) return null;

    // If no players remain, destroy room immediately
    if (result.remainingCount === 0) {
      this.rooms.delete(code);
      return { roomDestroyed: true, code };
    }

    return { roomDestroyed: false, code, ...result };
  }

  cleanupStaleRooms() {
    const now = Date.now();
    const STALE_THRESHOLD = 60 * 60 * 1000; // 1 hour
    for (const [code, room] of this.rooms.entries()) {
      if (now - room.lastActivity > STALE_THRESHOLD) {
        this.rooms.delete(code);
      }
    }
  }

  destroy() {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.rooms.clear();
    this.userToRoom.clear();
  }
}

// Singleton RoomManager instance
const roomManager = new RoomManager();

module.exports = {
  Room,
  RoomManager,
  roomManager
};
