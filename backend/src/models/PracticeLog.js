const mongoose = require('mongoose');

const PracticeLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  practiceId: {
    type: String,
    required: true
  },
  practiceTitle: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  durationMinutes: {
    type: Number,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  userNote: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('PracticeLog', PracticeLogSchema);
