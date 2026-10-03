const User = require('../models/User');
const { FileCollection } = require('./fileStore');
const { getDBStatus } = require('../config/db');

const fileUsers = new FileCollection('users');

const userRepository = {
  async findByEmail(email) {
    if (!email) return null;
    const normalized = String(email).trim().toLowerCase();

    if (getDBStatus().connected) {
      return await User.findOne({ email: normalized });
    }
    return fileUsers.findOne(u => u.email.toLowerCase() === normalized);
  },

  async findById(id) {
    if (getDBStatus().connected) {
      return await User.findById(id).select('-passwordHash');
    }
    const user = fileUsers.findById(id);
    if (!user) return null;
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  },

  async findByResetToken(tokenHash) {
    if (!tokenHash) return null;
    if (getDBStatus().connected) {
      return await User.findOne({
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { $gt: new Date() },
        resetPasswordUsed: false
      });
    }
    return fileUsers.findOne(u => 
      u.resetPasswordToken === tokenHash &&
      u.resetPasswordUsed === false &&
      new Date(u.resetPasswordExpires) > new Date()
    );
  },

  async findByRawResetTokenForAudit(tokenHash) {
    if (!tokenHash) return null;
    if (getDBStatus().connected) {
      return await User.findOne({ resetPasswordToken: tokenHash });
    }
    return fileUsers.findOne(u => u.resetPasswordToken === tokenHash);
  },

  async create(userData) {
    const normalizedEmail = String(userData.email).trim().toLowerCase();

    if (getDBStatus().connected) {
      return await User.create({
        ...userData,
        email: normalizedEmail
      });
    }

    // Check duplicate in fileUsers
    const existing = fileUsers.findOne(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      const err = new Error('Duplicate key');
      err.code = 11000;
      throw err;
    }

    return fileUsers.create({
      ...userData,
      email: normalizedEmail,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      resetPasswordUsed: false,
      preferences: userData.preferences || {
        language: 'en',
        enableEmotionIntelligence: true,
        enableFacialAnalysisConsent: false,
        enableResearchParticipation: false
      }
    });
  },

  async setResetToken(userId, { tokenHash, expires }) {
    if (getDBStatus().connected) {
      return await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            resetPasswordToken: tokenHash,
            resetPasswordExpires: expires,
            resetPasswordUsed: false
          }
        },
        { new: true }
      );
    }
    return fileUsers.findByIdAndUpdate(userId, {
      resetPasswordToken: tokenHash,
      resetPasswordExpires: expires,
      resetPasswordUsed: false
    });
  },

  async updatePasswordAndInvalidateToken(userId, newPasswordHash) {
    if (getDBStatus().connected) {
      return await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            passwordHash: newPasswordHash,
            resetPasswordUsed: true
          }
        },
        { new: true }
      );
    }
    return fileUsers.findByIdAndUpdate(userId, {
      passwordHash: newPasswordHash,
      resetPasswordUsed: true
    });
  },

  async updatePreferences(id, preferences) {
    if (getDBStatus().connected) {
      return await User.findByIdAndUpdate(id, { $set: { preferences } }, { new: true });
    }
    const user = fileUsers.findById(id);
    if (!user) return null;
    user.preferences = { ...user.preferences, ...preferences };
    return fileUsers.findByIdAndUpdate(id, { preferences: user.preferences });
  },

  async deleteById(id) {
    if (getDBStatus().connected) {
      return await User.findByIdAndDelete(id);
    }
    return fileUsers.findByIdAndDelete(id);
  }
};

module.exports = userRepository;
