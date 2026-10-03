const PracticeLog = require('../models/PracticeLog');
const { FileCollection } = require('./fileStore');
const { getDBStatus } = require('../config/db');

const filePractices = new FileCollection('practices');

const practiceRepository = {
  async findByUser(userId, limit = 10) {
    if (getDBStatus().connected) {
      return await PracticeLog.find({ userId }).sort({ completedAt: -1 }).limit(limit);
    }
    const list = filePractices.find(p => String(p.userId) === String(userId));
    return list.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)).slice(0, limit);
  },

  async create(logData) {
    if (getDBStatus().connected) {
      return await PracticeLog.create(logData);
    }
    return filePractices.create(logData);
  },

  async countByUser(userId) {
    if (getDBStatus().connected) {
      return await PracticeLog.countDocuments({ userId });
    }
    return filePractices.countDocuments(p => String(p.userId) === String(userId));
  },

  async deleteByUser(userId) {
    if (getDBStatus().connected) {
      return await PracticeLog.deleteMany({ userId });
    }
    return filePractices.deleteMany(p => String(p.userId) === String(userId));
  }
};

module.exports = practiceRepository;
