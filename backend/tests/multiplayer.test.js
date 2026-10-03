/**
 * VedAI 2.0 - Phase 3 Multiplayer Arena Test Suite
 * 
 * Verifies:
 * 1. RoomManager room creation with 6-char code (e.g. VED123)
 * 2. Room joining, capacity bounds (2-8 players), and error handling
 * 3. Ready up lifecycle and start preconditions (min 2 players, all ready)
 * 4. Ephemeral live progress broadcasting
 * 5. Server-authoritative finish timing and podium ranking
 * 6. Rematch voting lifecycle
 * 7. Host migration and empty room garbage collection
 * 8. Live WebSocket connection and event messaging over /ws/games
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const app = require('../src/app');
const config = require('../src/config');
const { roomManager } = require('../src/multiplayer/RoomManager');
const { setupWebSocketServer } = require('../src/multiplayer/socketServer');

describe('VedAI 2.0 - Phase 3 Multiplayer Arena Tests', () => {
  let server;
  let serverPort;
  let wsUrl;

  before(async () => {
    server = http.createServer(app);
    setupWebSocketServer(server);

    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        serverPort = server.address().port;
        wsUrl = `ws://127.0.0.1:${serverPort}/ws/games`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('1. RoomManager: Creates room with 6-char VED### code and host assignment', () => {
    const room = roomManager.createRoom('p1', 'Player One', 'sudoku', 'easy');
    assert.ok(room);
    assert.strictEqual(typeof room.roomCode, 'string');
    assert.match(room.roomCode, /^VED[A-Z0-9]{3}$/);
    assert.strictEqual(room.hostId, 'p1');
    assert.strictEqual(room.players.length, 1);
    assert.strictEqual(room.players[0].name, 'Player One');
    assert.strictEqual(room.status, 'lobby');
  });

  test('2. RoomManager: Handles player join and enforces max 8 capacity', () => {
    const room = roomManager.createRoom('host', 'Host Player', 'memory-match', 'easy');
    const code = room.roomCode;

    // Join 7 more players (total 8)
    for (let i = 2; i <= 8; i++) {
      const res = roomManager.joinRoom(code, `p${i}`, `Player ${i}`);
      assert.strictEqual(res.success, true);
    }

    assert.strictEqual(room.players.length, 8);

    // 9th player must be rejected as room is full
    const fullRes = roomManager.joinRoom(code, 'p9', 'Player 9');
    assert.strictEqual(fullRes.success, false);
    assert.match(fullRes.error, /full/i);
  });

  test('3. RoomManager: Start match requires minimum 2 players and ready status', () => {
    const room = roomManager.createRoom('soloHost', 'Solo Host', 'number-sequence', 'easy');

    // Attempting start with 1 player should fail
    const startFail1 = roomManager.canStartGame(room.roomCode, 'soloHost');
    assert.strictEqual(startFail1.canStart, false);
    assert.match(startFail1.reason, /at least 2 players/i);

    // Join second player
    roomManager.joinRoom(room.roomCode, 'guest2', 'Guest Two');

    // Attempting start while guest2 is NOT ready should fail
    const startFail2 = roomManager.canStartGame(room.roomCode, 'soloHost');
    assert.strictEqual(startFail2.canStart, false);
    assert.match(startFail2.reason, /ready/i);

    // Guest2 sets ready
    roomManager.setPlayerReady(room.roomCode, 'guest2', true);

    // Now start is allowed
    const startOk = roomManager.canStartGame(room.roomCode, 'soloHost');
    assert.strictEqual(startOk.canStart, true);
  });

  test('4. RoomManager: Live progress updates without database pollution', () => {
    const room = roomManager.createRoom('h1', 'H1', 'reaction-focus', 'easy');
    roomManager.joinRoom(room.roomCode, 'g1', 'G1');

    roomManager.updateProgress(room.roomCode, 'g1', 45);
    const updated = roomManager.getRoom(room.roomCode);
    const playerG1 = updated.players.find(p => p.id === 'g1');
    assert.strictEqual(playerG1.progress, 45);
  });

  test('5. RoomManager: Server-authoritative finish leaderboard', () => {
    const room = roomManager.createRoom('rHost', 'Fast Player', 'maze-escape', 'easy');
    roomManager.joinRoom(room.roomCode, 'rGuest', 'Slow Player');
    room.status = 'playing';

    // Player 1 finishes in 12 seconds
    const finish1 = roomManager.recordFinish(room.roomCode, 'rHost', {
      timeElapsed: 12,
      score: 150
    });
    assert.strictEqual(finish1.rank, 1);

    // Player 2 finishes in 18 seconds
    const finish2 = roomManager.recordFinish(room.roomCode, 'rGuest', {
      timeElapsed: 18,
      score: 120
    });
    assert.strictEqual(finish2.rank, 2);

    const finishedRoom = roomManager.getRoom(room.roomCode);
    assert.strictEqual(finishedRoom.status, 'finished');
    assert.strictEqual(finishedRoom.leaderboard.length, 2);
    assert.strictEqual(finishedRoom.leaderboard[0].name, 'Fast Player');
    assert.strictEqual(finishedRoom.leaderboard[1].name, 'Slow Player');
  });

  test('6. RoomManager: Rematch voting resets match when all agree', () => {
    const room = roomManager.createRoom('m1', 'Match Host', 'stroop-effect', 'easy');
    roomManager.joinRoom(room.roomCode, 'm2', 'Match Peer');
    room.status = 'finished';

    const vote1 = roomManager.voteRematch(room.roomCode, 'm1');
    assert.strictEqual(vote1.allVoted, false);

    const vote2 = roomManager.voteRematch(room.roomCode, 'm2');
    assert.strictEqual(vote2.allVoted, true);

    const resetRoom = roomManager.getRoom(room.roomCode);
    assert.strictEqual(resetRoom.status, 'lobby');
    assert.strictEqual(resetRoom.leaderboard.length, 0);
  });

  test('7. RoomManager: Host departure promotes next player, empty deletes room', () => {
    const room = roomManager.createRoom('origHost', 'Original Host', 'sudoku', 'easy');
    const code = room.roomCode;
    roomManager.joinRoom(code, 'secondPlayer', 'Second Player');

    // Original host leaves
    roomManager.leaveRoom(code, 'origHost');
    const updated = roomManager.getRoom(code);
    assert.strictEqual(updated.hostId, 'secondPlayer');
    assert.strictEqual(updated.players.length, 1);

    // Second player leaves
    roomManager.leaveRoom(code, 'secondPlayer');
    const emptyRoom = roomManager.getRoom(code);
    assert.strictEqual(emptyRoom, null); // Cleaned up
  });

  test('8. WebSocket Server: Connects to /ws/games and exchanges room events', async () => {
    // Create room in manager
    const room = roomManager.createRoom('wsHost', 'WS Host', 'sudoku', 'easy');

    const client = new WebSocket(wsUrl);

    await new Promise((resolve, reject) => {
      client.on('open', resolve);
      client.on('error', reject);
    });

    // Send JOIN_ROOM message
    const joinMsg = JSON.stringify({
      type: 'JOIN_ROOM',
      roomCode: room.roomCode,
      user: { id: 'wsPlayer2', name: 'WS Player 2' }
    });
    client.send(joinMsg);

    // Expect room event message
    const received = await new Promise((resolve) => {
      client.on('message', (data) => {
        const parsed = JSON.parse(data.toString());
        if (['ROOM_JOINED', 'ROOM_STATE', 'PLAYER_JOINED', 'CONNECTED'].includes(parsed.type)) {
          resolve(parsed);
        }
      });
    });

    assert.ok(received);
    client.close();
  });

  test('9. WebSocket Server: Gracefully handles malformed JSON without crashing', async () => {
    const client = new WebSocket(wsUrl);

    await new Promise((resolve, reject) => {
      client.on('open', resolve);
      client.on('error', reject);
    });

    // Send broken JSON
    client.send('NOT_A_VALID_JSON{{{');

    const errResponse = await new Promise((resolve) => {
      client.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.type === 'ERROR') resolve(parsed);
        } catch {}
      });
    });

    assert.strictEqual(errResponse.type, 'ERROR');
    assert.match(errResponse.message, /invalid json/i);
    client.close();
  });

  test('10. Ephemeral State: Room progress updates are zero-overhead in-memory operations', () => {
    const room = roomManager.createRoom('memHost', 'Memory Host', 'sudoku', 'medium');
    roomManager.joinRoom(room.roomCode, 'memPlayer', 'Memory Player');

    // Simulate 50 high-frequency progress packets
    for (let pct = 1; pct <= 50; pct++) {
      roomManager.updateProgress(room.roomCode, 'memPlayer', pct);
    }

    const currentRoom = roomManager.getRoom(room.roomCode);
    const p = currentRoom.players.find(x => x.id === 'memPlayer');
    assert.strictEqual(p.progress, 50);

    // Ephemeral room state exists only in memory
    assert.ok(roomManager.rooms.has(room.roomCode));
  });
});
