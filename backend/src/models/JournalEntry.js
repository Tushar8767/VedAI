const mongoose = require('mongoose');

const JournalEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // The authentic, untouched words typed by the user
  rawUserInput: {
    type: String,
    required: true
  },
  // Language metadata
  languageDetected: {
    type: String,
    default: 'English'
  },
  // AI-estimated signals (strictly logged as model estimates)
  aiEstimatedSignal: {
    type: String,
    default: null
  },
  aiConfidence: {
    type: String,
    default: null
  },
  multimodalState: {
    type: String,
    default: 'TEXT_ONLY'
  },
  aiExplanation: {
    type: String,
    default: null
  },
  // Human-in-the-loop validation
  userValidationChoice: {
    type: String,
    enum: [
      'YES', 'ACCURATE',
      'PARTLY', 'PARTIALLY_ACCURATE',
      'NOT_REALLY', 'NOT_ACCURATE',
      'TELL_VEDAI', 'USER_CORRECTED',
      'YES_TEXT', 'YES_FACE',
      'SKIPPED', 'CONTINUED_WITHOUT_VALIDATION',
      'FREE_REFLECTION', 'UNVALIDATED',
      null
    ],
    default: null
  },
  userCorrection: {
    type: String,
    default: null
  },
  // The final working context (user correction always takes precedence)
  finalWorkingContext: {
    type: String,
    default: null
  },
  // Connected Gita wisdom (if selected)
  linkedVerseId: {
    type: String,
    default: null
  },
  linkedVerseRef: {
    type: String,
    default: null
  },
  // User's own reflections and insights
  userReflectionNotes: {
    type: String,
    default: ''
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

JournalEntrySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('JournalEntry', JournalEntrySchema);
