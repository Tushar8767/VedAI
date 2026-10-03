const mongoose = require('mongoose');

// De-identified, privacy-preserving research telemetry log
// STRICT PRIVACY GUARANTEE:
// 1. NO raw camera frames or image buffers are ever stored.
// 2. NO raw user journal thoughts or personal text are ever stored.
// 3. User corrections are recorded ONLY as a boolean presence flag (userCorrectionPresent: true),
//    never storing the user's private text.
const ResearchLogSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    index: true
  },
  anonymousSessionId: {
    type: String,
    required: true,
    index: true
  },
  pipelineVersion: {
    type: String,
    default: '2.0.0-phase2g'
  },
  modalitiesAvailable: [String],
  modalitiesUsed: [String],
  fusionState: {
    type: String,
    default: 'TEXT_ONLY'
  },
  textModel: String,
  textVersion: String,
  faceModel: String,
  faceVersion: String,
  textQuality: Number,
  faceQuality: Number,
  uncertainty: {
    isUncertain: Boolean,
    entropy: Number,
    confidenceMargin: Number
  },
  conflictScore: Number,
  cosineDistance: Number,
  languageDetected: String,
  estimatedSignal: String,
  confidenceLevel: String,
  userValidationChoice: {
    type: String,
    default: 'UNVALIDATED'
  },
  userCorrectionPresent: {
    type: Boolean,
    default: false
  },
  agreementLevel: {
    type: String,
    enum: ['FULL_AGREEMENT', 'PARTIAL_AGREEMENT', 'DISAGREEMENT', 'UNVALIDATED'],
    default: 'UNVALIDATED'
  },
  gitaRetrieved: {
    type: Boolean,
    default: false
  },
  gitaVerseRetrievedId: String,
  safetyTier: {
    type: String,
    default: 'NORMAL'
  },
  consentGiven: {
    type: Boolean,
    default: false
  },
  latencyMs: Number,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ResearchLog', ResearchLogSchema);
