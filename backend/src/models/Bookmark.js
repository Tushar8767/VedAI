const mongoose = require('mongoose');

const BookmarkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  verseId: {
    type: String,
    required: true
  },
  chapter: {
    type: Number,
    required: true
  },
  verse: {
    type: Number,
    required: true
  },
  sanskrit: String,
  translation: String,
  personalNote: {
    type: String,
    default: ''
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Bookmark', BookmarkSchema);
