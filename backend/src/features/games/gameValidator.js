/**
 * VedAI 2.0 — Server Authority Game Result & Move Validator
 * 
 * Guarantees that submitted scores, durations, and game completion events
 * adhere to physical and algorithmic boundaries, preventing client-side spoofing.
 */

const { SUPPORTED_GAMES } = require('../../models/GameResult');

const MIN_FEASIBLE_DURATIONS_SEC = {
  sudoku: 15,
  memory_match: 5,
  'memory-match': 5,
  number_sequence: 3,
  'number-sequence': 3,
  pattern_recognition: 3,
  'pattern-recognition': 3,
  reaction_focus: 0.5,
  'reaction-focus': 0.5,
  word_recall: 4,
  'word-recall': 4,
  stroop: 3,
  'stroop-effect': 3,
  logic_puzzles: 5,
  'logic-puzzles': 5,
  maze: 3,
  'maze-escape': 3
};

function validateGameSubmission(params = {}) {
  const {
    gameType,
    difficulty = 'standard',
    durationSeconds,
    resultSummary = {}
  } = params;

  const errors = [];

  // 1. Game Type
  if (!gameType || !SUPPORTED_GAMES.includes(gameType)) {
    errors.push(`Invalid gameType. Must be one of: ${SUPPORTED_GAMES.join(', ')}`);
    return {
      valid: false,
      isValid: false,
      reason: errors.join('; '),
      errors
    };
  }

  // 2. Duration Validation (Physically impossible completion threshold)
  const duration = Number(durationSeconds);
  if (isNaN(duration) || duration < 0) {
    errors.push('Duration must be a positive number.');
  }

  const minFeasible = MIN_FEASIBLE_DURATIONS_SEC[gameType] || 2;
  // If marked completed, duration cannot be sub-human
  if (resultSummary.completed !== false && duration < minFeasible) {
    errors.push(`Physically impossible completion duration (${duration}s) for ${gameType}. Minimum feasible threshold is ${minFeasible}s.`);
  }

  // 3. Score & Stat Sanity Bounds
  const extractedScore = params.score !== undefined ? params.score : resultSummary.score;
  const score = Number(extractedScore !== undefined ? extractedScore : 0);
  if (isNaN(score) || score < 0 || score > 1000000) {
    errors.push('Score is out of acceptable physical boundaries.');
  }

  // 4. Move Sanity
  const extractedMoves = params.movesCount !== undefined ? params.movesCount : resultSummary.movesCount;
  const moves = Number(extractedMoves || 0);
  if (moves < 0 || moves > 5000) {
    errors.push('Move count is invalid or excessive.');
  }

  const isValid = errors.length === 0;

  return {
    valid: isValid,
    isValid,
    reason: errors.join('; '),
    errors,
    sanitized: {
      gameType,
      difficulty,
      durationSeconds: Math.max(0, Math.round(duration || 0)),
      score: Math.max(0, Math.round(score || 0)),
      movesCount: Math.max(0, Math.round(moves || 0))
    }
  };
}

module.exports = {
  validateGameSubmission,
  validateGameResult: validateGameSubmission,
  MIN_FEASIBLE_DURATIONS_SEC
};
