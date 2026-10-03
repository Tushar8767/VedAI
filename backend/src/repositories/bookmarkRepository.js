const Bookmark = require('../models/Bookmark');
const { FileCollection } = require('./fileStore');
const { getDBStatus } = require('../config/db');

const fileBookmarks = new FileCollection('bookmarks');

const bookmarkRepository = {
  async findByUser(userId) {
    if (getDBStatus().connected) {
      return await Bookmark.find({ userId }).sort({ savedAt: -1 });
    }
    return fileBookmarks.find(b => String(b.userId) === String(userId));
  },

  async create(data) {
    if (getDBStatus().connected) {
      return await Bookmark.create(data);
    }
    return fileBookmarks.create(data);
  },

  async countByUser(userId) {
    if (getDBStatus().connected) {
      return await Bookmark.countDocuments({ userId });
    }
    return fileBookmarks.countDocuments(b => String(b.userId) === String(userId));
  },

  async deleteByUser(userId) {
    if (getDBStatus().connected) {
      return await Bookmark.deleteMany({ userId });
    }
    return fileBookmarks.deleteMany(b => String(b.userId) === String(userId));
  },

  async deleteByIdAndUser(id, userId) {
    if (getDBStatus().connected) {
      return await Bookmark.findOneAndDelete({ _id: id, userId });
    }
    const existing = fileBookmarks.findOne(b => String(b._id) === String(id) && String(b.userId) === String(userId));
    if (!existing) return null;
    return fileBookmarks.findByIdAndDelete(id);
  }
};

module.exports = bookmarkRepository;
