const gameRepository = require('../repositories/gameRepository');
const { validateGameSubmission } = require('../features/games/gameValidator');

// Helper to extract userId safely
function getEffectiveUserId(req) {
  if (!req.user) return 'guest';
  return req.user.id || req.user._id || req.user.userId || req.user.sessionId || 'guest';
}

// POST /api/games/results
const saveGameResult = async (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    const {
      gameType,
      difficulty = 'standard',
      completed = true,
      durationSeconds = 0,
      resultSummary = {},
      score: rawScore,
      movesCount: rawMoves,
      isMultiplayer = false,
      multiplayerRoomCode = null
    } = req.body;

    const score = rawScore !== undefined ? rawScore : resultSummary.score;
    const movesCount = rawMoves !== undefined ? rawMoves : resultSummary.movesCount;

    // Server-Side Authority Validation
    const validation = validateGameSubmission({
      gameType,
      difficulty,
      durationSeconds,
      score,
      movesCount,
      resultSummary
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errorCode: 'INVALID_GAME_RESULT',
        message: validation.reason || 'Game result submission failed validation checks.',
        details: validation.errors
      });
    }

    const saved = await gameRepository.create({
      userId,
      gameType: validation.sanitized.gameType,
      difficulty: validation.sanitized.difficulty,
      completed: Boolean(completed),
      durationSeconds: validation.sanitized.durationSeconds,
      resultSummary: {
        score: validation.sanitized.score,
        level: Number(resultSummary.level || 1),
        attempts: Number(resultSummary.attempts || 1),
        correctAnswers: Number(resultSummary.correctAnswers || 0),
        incorrectAnswers: Number(resultSummary.incorrectAnswers || 0),
        movesCount: validation.sanitized.movesCount,
        accuracy: resultSummary.accuracy !== undefined ? resultSummary.accuracy : null,
        metadata: resultSummary.metadata || {}
      },
      isMultiplayer: Boolean(isMultiplayer),
      multiplayerRoomCode: multiplayerRoomCode ? String(multiplayerRoomCode).trim() : null
    });

    const responsePayload = {
      ...(saved.toObject ? saved.toObject() : saved),
      score: validation.sanitized.score,
      movesCount: validation.sanitized.movesCount
    };

    return res.status(201).json({
      success: true,
      result: responsePayload,
      disclaimer: 'VedAI games are designed for cognitive practice and engagement and are not diagnostic.',
      message: 'Game session recorded.'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/games/history
const getGameHistory = async (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    const { gameType, limit, skip } = req.query;

    const history = await gameRepository.findByUser(userId, { gameType, limit, skip });
    const totalCount = await gameRepository.countByUser(userId, { gameType });

    return res.json({
      success: true,
      count: history.length,
      totalCount,
      history
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/games/stats
const getGameStats = async (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    const stats = await gameRepository.getStatsByUser(userId);

    let topScore = 0;
    if (stats.statsByGame) {
      for (const k of Object.keys(stats.statsByGame)) {
        if (stats.statsByGame[k].bestScore > topScore) {
          topScore = stats.statsByGame[k].bestScore;
        }
      }
    }

    return res.json({
      success: true,
      stats: {
        ...stats,
        totalTimePlayed: stats.totalPlayTimeSeconds,
        topScore
      },
      disclaimer: stats.disclaimer
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/games/history
const clearGameHistory = async (req, res, next) => {
  try {
    const userId = getEffectiveUserId(req);
    const deletedCount = await gameRepository.deleteByUser(userId);

    return res.json({
      success: true,
      deletedCount,
      message: 'Game history cleared.'
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/games/validate
const validateResult = async (req, res) => {
  const validation = validateGameSubmission(req.body);
  return res.json({
    success: validation.valid,
    ...validation
  });
};

module.exports = {
  saveGameResult,
  getGameHistory,
  getGameStats,
  clearGameHistory,
  validateResult
};
