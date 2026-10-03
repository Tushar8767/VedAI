const mongoose = require('mongoose');

const GMAIL_REGEX = /^[a-zA-Z0-9](\.?[a-zA-Z0-9_-])*@gmail\.com$/i;

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [GMAIL_REGEX, 'Only valid Gmail addresses (e.g. yourname@gmail.com) are allowed']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  resetPasswordToken: {
    type: String,
    default: null,
    index: true
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  resetPasswordUsed: {
    type: Boolean,
    default: false
  },
  preferences: {
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'hi', 'mr', 'auto']
    },
    enableEmotionIntelligence: {
      type: Boolean,
      default: true
    },
    enableFacialAnalysisConsent: {
      type: Boolean,
      default: false
    },
    enableResearchParticipation: {
      type: Boolean,
      default: false
    },
    notifications: {
      dailyReminder: {
        type: Boolean,
        default: false
      },
      weeklyDigest: {
        type: Boolean,
        default: false
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
