const JournalEntry = require('../models/JournalEntry');
const { FileCollection } = require('./fileStore');
const { getDBStatus } = require('../config/db');

const fileJournals = new FileCollection('journals');

const journalRepository = {
  async findByUser(userId, filter = {}) {
    if (getDBStatus().connected) {
      const query = { userId };
      if (filter.tag) query.tags = filter.tag;
      if (filter.search) {
        query.$or = [
          { rawUserInput: { $regex: filter.search, $options: 'i' } },
          { userReflectionNotes: { $regex: filter.search, $options: 'i' } }
        ];
      }
      return await JournalEntry.find(query).sort({ createdAt: -1 });
    }

    let entries = fileJournals.find(j => String(j.userId) === String(userId));
    if (filter.tag) {
      entries = entries.filter(j => j.tags && j.tags.includes(filter.tag));
    }
    if (filter.search) {
      const s = filter.search.toLowerCase();
      entries = entries.filter(j => 
        (j.rawUserInput && j.rawUserInput.toLowerCase().includes(s)) ||
        (j.userReflectionNotes && j.userReflectionNotes.toLowerCase().includes(s)) ||
        (j.finalWorkingContext && j.finalWorkingContext.toLowerCase().includes(s))
      );
    }
    return entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async create(entryData) {
    if (getDBStatus().connected) {
      return await JournalEntry.create(entryData);
    }
    return fileJournals.create(entryData);
  },

  async findByIdAndUser(id, userId) {
    if (getDBStatus().connected) {
      return await JournalEntry.findOne({ _id: id, userId });
    }
    return fileJournals.findOne(j => String(j._id) === String(id) && String(j.userId) === String(userId));
  },

  async deleteByIdAndUser(id, userId) {
    if (getDBStatus().connected) {
      return await JournalEntry.findOneAndDelete({ _id: id, userId });
    }
    const entry = fileJournals.findOne(j => String(j._id) === String(id) && String(j.userId) === String(userId));
    if (!entry) return null;
    return fileJournals.findByIdAndDelete(id);
  },

  async deleteByUser(userId) {
    if (getDBStatus().connected) {
      return await JournalEntry.deleteMany({ userId });
    }
    return fileJournals.deleteMany(j => String(j.userId) === String(userId));
  },

  async countByUser(userId) {
    if (getDBStatus().connected) {
      return await JournalEntry.countDocuments({ userId });
    }
    return fileJournals.countDocuments(j => String(j.userId) === String(userId));
  }
};

module.exports = journalRepository;
