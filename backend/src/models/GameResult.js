const mongoose = require('mongoose');

const SUPPORTED_GAMES = [
  'sudoku',
  'memory_match',
  'memory-match',
  'number_sequence',
  'number-sequence',
  'pattern_recognition',
  'pattern-recognition',
  'reaction_focus',
  'reaction-focus',
  'word_recall',
  'word-recall',
  'stroop',
  'stroop-effect',
  'logic_puzzles',
  'logic-puzzles',
  'maze',
  'maze-escape'
];

const GameResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true
  },
  gameType: {
    type: String,
    required: true,
    enum: SUPPORTED_GAMES,
    index: true
  },
  difficulty: {
    type: String,
    default: 'standard',
    enum: ['easy', 'standard', 'medium', 'hard', 'expert']
  },
  completed: {
    type: Boolean,
    default: true
  },
  durationSeconds: {
    type: Number,
    required: true,
    min: 0
  },
  resultSummary: {
    score: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    attempts: { type: Number, default: 1 },
    correctAnswers: { type: Number, default: 0 },
    incorrectAnswers: { type: Number, default: 0 },
    movesCount: { type: Number, default: 0 },
    metadata: { type: Object, default: {} }
  },
  isMultiplayer: {
    type: Boolean,
    default: false
  },
  multiplayerRoomCode: {
    type: String,
    default: null
  },
  disclaimer: {
    type: String,
    default: 'Game completed for mindful engagement, focus, and recreation. Not a diagnostic psychological or cognitive assessment.'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GameResult', GameResultSchema);
module.exports.SUPPORTED_GAMES = SUPPORTED_GAMES;
