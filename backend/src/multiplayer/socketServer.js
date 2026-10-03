/**
 * VedAI 2.0 — Multiplayer WebSocket Server
 * 
 * Binds to Node.js HTTP server on path '/ws/games'.
 * Dispatches real-time room and synchronized game events with server authority.
 */

const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server || WebSocket.WebSocketServer || WebSocket;
const jwt = require('jsonwebtoken');
const config = require('../config');
const { roomManager } = require('./RoomManager');

function parseToken(req) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    if (token) {
      return jwt.verify(token, config.jwt.secret);
    }
  } catch {
    // Guest or unauthenticated player
  }
  return null;
}

function setupWebSocketServer(httpServer) {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws/games'
  });

  console.log('[Multiplayer] WebSocket server mounted on /ws/games');

  wss.on('connection', (ws, req) => {
    // Resolve user identity (authenticated or guest)
    const tokenUser = parseToken(req);
    const user = tokenUser ? {
      id: tokenUser.id,
      name: tokenUser.name || 'Seeker',
      isGuest: false
    } : {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      name: 'Guest Player ' + Math.floor(Math.random() * 900 + 100),
      isGuest: true
    };

    ws.user = user;
    ws.currentRoomCode = null;
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.send(JSON.stringify({
      type: 'CONNECTED',
      user: { id: user.id, name: user.name, isGuest: user.isGuest },
      message: 'Connected to VedAI Cognitive Practice Multiplayer Service'
    }));

    ws.on('message', (rawMessage) => {
      try {
        const msg = JSON.parse(rawMessage);
        handleClientMessage(ws, msg);
      } catch (err) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid JSON payload' }));
      }
    });

    ws.on('close', () => {
      handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error(`[Multiplayer WS Error] ${ws.user.id}:`, err.message);
      handleDisconnect(ws);
    });
  });

  // Heartbeat ping interval (every 30 seconds)
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  if (pingInterval.unref) pingInterval.unref();

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  return wss;
}

function handleClientMessage(ws, msg) {
  const user = ws.user;
  const type = msg.type;

  switch (type) {
    case 'CREATE_ROOM': {
      const room = roomManager.createRoom({
        hostUser: user,
        gameType: msg.gameType || 'reaction_focus',
        maxPlayers: msg.maxPlayers || 8,
        config: msg.config || {}
      });
      room.players.get(user.id).ws = ws;
      ws.currentRoomCode = room.code;

      ws.send(JSON.stringify({
        type: 'ROOM_CREATED',
        room: room.getState()
      }));
      break;
    }

    case 'JOIN_ROOM': {
      const roomCode = msg.roomCode;
      const result = roomManager.joinRoom({ roomCode, user, ws });
      if (!result.success) {
        ws.send(JSON.stringify({
          type: 'JOIN_ERROR',
          reason: result.reason,
          message: getReasonMessage(result.reason)
        }));
        return;
      }

      ws.currentRoomCode = result.room.code;
      ws.send(JSON.stringify({
        type: 'ROOM_JOINED',
        room: result.room.getState()
      }));

      // Broadcast player joined to other room members
      result.room.broadcast({
        type: 'PLAYER_JOINED',
        player: result.room.players.get(user.id),
        room: result.room.getState()
      }, ws);
      break;
    }

    case 'SET_READY': {
      const room = roomManager.getRoom(ws.currentRoomCode);
      if (!room) return;
      const ok = room.setReady(user.id, msg.isReady);
      if (ok) {
        room.broadcast({
          type: 'PLAYER_READY_CHANGED',
          userId: user.id,
          isReady: Boolean(msg.isReady),
          room: room.getState()
        });
      }
      break;
    }

    case 'START_GAME': {
      const room = roomManager.getRoom(ws.currentRoomCode);
      if (!room) return;
      const check = room.canStart(user.id);
      if (!check.canStart) {
        ws.send(JSON.stringify({
          type: 'START_ERROR',
          reason: check.reason,
          message: getStartErrorMessage(check.reason)
        }));
        return;
      }

      const state = room.start();
      room.broadcast({
        type: 'GAME_STARTED',
        room: state
      });
      break;
    }

    case 'UPDATE_PROGRESS': {
      const room = roomManager.getRoom(ws.currentRoomCode);
      if (!room) return;
      const updated = room.updatePlayerProgress(user.id, msg);
      if (updated) {
        room.broadcast({
          type: 'PROGRESS_UPDATED',
          userId: user.id,
          progress: updated.progress,
          score: updated.score
        }, ws);
      }
      break;
    }

    case 'SUBMIT_FINISH': {
      const room = roomManager.getRoom(ws.currentRoomCode);
      if (!room) return;
      const finishResult = room.submitPlayerFinish(user.id, msg);
      if (finishResult) {
        room.broadcast({
          type: 'PLAYER_FINISHED',
          player: finishResult.player,
          allFinished: finishResult.allFinished,
          leaderboard: finishResult.leaderboard,
          room: room.getState()
        });
      }
      break;
    }

    case 'VOTE_REMATCH': {
      const room = roomManager.getRoom(ws.currentRoomCode);
      if (!room) return;
      const rematchRes = room.voteRematch(user.id);
      room.broadcast({
        type: 'REMATCH_UPDATE',
        shouldReset: rematchRes.shouldReset,
        votesCount: rematchRes.votesCount,
        required: rematchRes.required,
        room: room.getState()
      });
      break;
    }

    case 'LEAVE_ROOM': {
      handleDisconnect(ws);
      ws.send(JSON.stringify({ type: 'LEFT_ROOM' }));
      break;
    }

    default:
      ws.send(JSON.stringify({ type: 'UNKNOWN_COMMAND', command: type }));
  }
}

function handleDisconnect(ws) {
  if (!ws.currentRoomCode) return;
  const room = roomManager.getRoom(ws.currentRoomCode);
  const code = ws.currentRoomCode;
  ws.currentRoomCode = null;

  const res = roomManager.leaveRoom(code, ws.user.id);
  if (res && !res.roomDestroyed && room) {
    room.broadcast({
      type: 'PLAYER_LEFT',
      userId: ws.user.id,
      newHostId: res.newHostId,
      room: room.getState()
    });
  }
}

function getReasonMessage(reason) {
  switch (reason) {
    case 'ROOM_NOT_FOUND': return 'Room not found. Please check the 6-character room code.';
    case 'ROOM_FULL': return 'This room has reached its maximum capacity of 8 players.';
    case 'GAME_ALREADY_IN_PROGRESS': return 'This game has already started. Please join after completion or create a new room.';
    default: return 'Could not join room.';
  }
}

function getStartErrorMessage(reason) {
  switch (reason) {
    case 'NOT_HOST': return 'Only the room host can start the game.';
    case 'NEED_MIN_2_PLAYERS': return 'Multiplayer practice requires at least 2 players.';
    case 'NOT_ALL_PLAYERS_READY': return 'All players must be marked Ready before starting.';
    default: return 'Unable to start game.';
  }
}

module.exports = {
  setupWebSocketServer
};
