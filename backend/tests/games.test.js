/**
 * VedAI 2.0 - Phase 3 Games & Cognitive Practice Test Suite
 * 
 * Verifies:
 * 1. Server-side anti-cheat validator (minimum physical completion times and move bounds)
 * 2. Mandatory non-diagnostic disclaimer persistence
 * 3. Saving factual game results via API (authenticated and guest)
 * 4. Anti-cheat rejection of impossible completion times (< min feasibility threshold)
 * 5. Rejection of invalid / negative metrics
 * 6. Retrieving factual game history and filtering by gameType
 * 7. Factual stats aggregation (sessions, total duration, top score)
 * 8. Deletion / User data erasure of game history
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const jwt = require('jsonwebtoken');

const app = require('../src/app');
const config = require('../src/config');
const gameValidator = require('../src/features/games/gameValidator');
const gameRepository = require('../src/repositories/gameRepository');

let server;
let serverPort;

function httpRequest(path, options = {}) {
  const method = options.method || 'GET';
  const headers = options.headers || {};
  let body = options.body;

  if (body && typeof body === 'object' && !Buffer.isBuffer(body) && !(typeof body === 'string')) {
    body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: serverPort,
        path,
        method,
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

describe('VedAI 2.0 - Phase 3 Games & Cognitive Practice Tests', () => {
  let authToken;
  const testUserId = 'test-player-' + Date.now();

  before(async () => {
    // Generate valid JWT test token
    authToken = jwt.sign(
      { userId: testUserId, email: 'player@gmail.com' },
      config.jwt?.secret || config.jwtSecret || process.env.JWT_SECRET || 'vedai-dev-secret-key-fallback-never-use-in-prod',
      { expiresIn: '1h' }
    );

    // Bind server to an ephemeral port
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        serverPort = server.address().port;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('1. Anti-Cheat Validator: Validates supported games and reasonable thresholds', () => {
    // Sudoku with 60 seconds and 30 moves is valid
    const validSudoku = gameValidator.validateGameResult({
      gameType: 'sudoku',
      durationSeconds: 65,
      movesCount: 40,
      score: 120
    });
    assert.strictEqual(validSudoku.isValid, true);

    // Memory Match with 25 seconds is valid
    const validMemory = gameValidator.validateGameResult({
      gameType: 'memory-match',
      durationSeconds: 25,
      movesCount: 16,
      score: 160
    });
    assert.strictEqual(validMemory.isValid, true);
  });

  test('2. Anti-Cheat Validator: Rejects physically impossible completion times', () => {
    // Sudoku completed in 3 seconds is physically impossible
    const impossibleSudoku = gameValidator.validateGameResult({
      gameType: 'sudoku',
      durationSeconds: 3,
      movesCount: 81,
      score: 500
    });
    assert.strictEqual(impossibleSudoku.isValid, false);
    assert.match(impossibleSudoku.reason, /physically impossible/i);

    // Reaction game completed in 10ms is superhuman / bot spoof
    const impossibleReaction = gameValidator.validateGameResult({
      gameType: 'reaction-focus',
      durationSeconds: 0.1,
      score: 1000
    });
    assert.strictEqual(impossibleReaction.isValid, false);
  });

  test('3. Anti-Cheat Validator: Rejects negative durations and astronomical scores', () => {
    const negativeDuration = gameValidator.validateGameResult({
      gameType: 'maze-escape',
      durationSeconds: -10,
      score: 50
    });
    assert.strictEqual(negativeDuration.isValid, false);

    const astronomicalScore = gameValidator.validateGameResult({
      gameType: 'number-sequence',
      durationSeconds: 30,
      score: 99999999
    });
    assert.strictEqual(astronomicalScore.isValid, false);
  });

  test('4. POST /api/games/results: Saves valid game result with non-diagnostic notice', async () => {
    const res = await httpRequest('/api/games/results', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      body: {
        gameType: 'number-sequence',
        difficulty: 'easy',
        durationSeconds: 45,
        score: 100,
        movesCount: 5,
        resultSummary: {
          accuracy: 100,
          roundsCompleted: 5
        }
      }
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.result);
    assert.strictEqual(res.body.result.gameType, 'number-sequence');
    assert.strictEqual(res.body.result.score, 100);
    // Mandatory non-diagnostic disclaimer must be included in response
    assert.ok(res.body.disclaimer);
    assert.match(res.body.disclaimer, /not diagnostic/i);
  });

  test('5. POST /api/games/results: Rejects spoofed / impossible speedrun submission', async () => {
    const res = await httpRequest('/api/games/results', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      body: {
        gameType: 'sudoku',
        difficulty: 'hard',
        durationSeconds: 2, // 2 seconds is impossible for Sudoku
        score: 500,
        movesCount: 81
      }
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /impossible/i);
  });

  test('6. GET /api/games/history: Retrieves recorded game sessions for user', async () => {
    // Add second result
    await httpRequest('/api/games/results', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`
      },
      body: {
        gameType: 'stroop-effect',
        difficulty: 'easy',
        durationSeconds: 25,
        score: 80,
        movesCount: 10
      }
    });

    const res = await httpRequest('/api/games/history', {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.history));
    assert.ok(res.body.history.length >= 2);
  });

  test('7. GET /api/games/history?gameType=stroop-effect: Filters history by gameType', async () => {
    const res = await httpRequest('/api/games/history?gameType=stroop-effect', {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.history.every(item => item.gameType === 'stroop-effect'));
  });

  test('8. GET /api/games/stats: Returns factual aggregated statistics', async () => {
    const res = await httpRequest('/api/games/stats', {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.stats);
    assert.ok(res.body.stats.totalSessions >= 2);
    assert.ok(res.body.stats.totalTimePlayed >= 70); // 45s + 25s
    assert.strictEqual(res.body.stats.topScore, 100);
    // Non-diagnostic disclaimer must be present
    assert.ok(res.body.disclaimer);
  });

  test('9. DELETE /api/games/history: Clears user game history on demand', async () => {
    const res = await httpRequest('/api/games/history', {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    // Verify empty history
    const checkRes = await httpRequest('/api/games/history', {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    assert.strictEqual(checkRes.body.history.length, 0);
  });

  test('10. Data Ownership & IDOR: User B cannot access User A game history', async () => {
    // 1. User A records a session
    await httpRequest('/api/games/results', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        gameType: 'sudoku',
        difficulty: 'easy',
        durationSeconds: 90,
        score: 250,
        movesCount: 20
      }
    });

    // 2. User B creates independent token
    const userBToken = jwt.sign(
      { userId: 'user-b-' + Date.now(), email: 'userb@gmail.com' },
      config.jwt?.secret || config.jwtSecret || process.env.JWT_SECRET || 'vedai-dev-secret-key-fallback-never-use-in-prod',
      { expiresIn: '1h' }
    );

    // 3. User B queries /api/games/history
    const resB = await httpRequest('/api/games/history', {
      headers: { Authorization: `Bearer ${userBToken}` }
    });

    assert.strictEqual(resB.status, 200);
    assert.strictEqual(resB.body.history.length, 0); // User B cannot see User A's data
  });

  test('11. Protected Routes: Unauthenticated request rejected (401)', async () => {
    const res = await httpRequest('/api/games/history', {
      headers: {} // No token
    });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Access denied|log in/i);
  });

  test('12. Non-Diagnostic Boundary: Output strictly contains neutral practice terminology', async () => {
    const res = await httpRequest('/api/games/stats', {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    assert.strictEqual(res.status, 200);
    const serialized = JSON.stringify(res.body).toLowerCase();

    // Must NOT claim clinical diagnoses, IQ, or mental illness classification
    assert.strictEqual(serialized.includes('iq score'), false);
    assert.strictEqual(serialized.includes('psychiatric diagnosis'), false);
    assert.strictEqual(serialized.includes('clinical impairment'), false);
    assert.strictEqual(serialized.includes('medical assessment'), false);

    // Must contain neutral factual disclaimers
    assert.ok(res.body.disclaimer);
    assert.match(res.body.disclaimer, /practice|engagement|not diagnostic/i);
  });
});
