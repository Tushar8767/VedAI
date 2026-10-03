const Note = require('../models/Note');
const { FileCollection } = require('./fileStore');
const { getDBStatus } = require('../config/db');

const fileNotes = new FileCollection('notes');

const noteRepository = {
  async findByUser(userId, filter = {}) {
    if (getDBStatus().connected) {
      const query = { userId };
      if (filter.tag) query.tags = filter.tag;
      if (filter.search) {
        query.$or = [
          { title: { $regex: filter.search, $options: 'i' } },
          { content: { $regex: filter.search, $options: 'i' } }
        ];
      }
      return await Note.find(query).sort({ updatedAt: -1 });
    }

    let notes = fileNotes.find(n => String(n.userId) === String(userId));
    if (filter.tag) {
      notes = notes.filter(n => n.tags && n.tags.includes(filter.tag));
    }
    if (filter.search) {
      const s = filter.search.toLowerCase();
      notes = notes.filter(n =>
        (n.title && n.title.toLowerCase().includes(s)) ||
        (n.content && n.content.toLowerCase().includes(s))
      );
    }
    return notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  async create(noteData) {
    if (getDBStatus().connected) {
      return await Note.create(noteData);
    }
    return fileNotes.create(noteData);
  },

  async update(id, userId, updates) {
    if (getDBStatus().connected) {
      return await Note.findOneAndUpdate({ _id: id, userId }, { $set: updates }, { new: true });
    }
    const existing = fileNotes.findOne(n => String(n._id) === String(id) && String(n.userId) === String(userId));
    if (!existing) return null;
    return fileNotes.findByIdAndUpdate(id, updates);
  },

  async deleteByIdAndUser(id, userId) {
    if (getDBStatus().connected) {
      return await Note.findOneAndDelete({ _id: id, userId });
    }
    const existing = fileNotes.findOne(n => String(n._id) === String(id) && String(n.userId) === String(userId));
    if (!existing) return null;
    return fileNotes.findByIdAndDelete(id);
  },

  async deleteByUser(userId) {
    if (getDBStatus().connected) {
      return await Note.deleteMany({ userId });
    }
    return fileNotes.deleteMany(n => String(n.userId) === String(userId));
  },

  async countByUser(userId) {
    if (getDBStatus().connected) {
      return await Note.countDocuments({ userId });
    }
    return fileNotes.countDocuments(n => String(n.userId) === String(userId));
  }
};

module.exports = noteRepository;
