const noteRepository = require('../repositories/noteRepository');

// GET /api/notes
const getNotes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search, tag } = req.query;

    const notes = await noteRepository.findByUser(userId, { search, tag });
    return res.json({ success: true, count: notes.length, notes });
  } catch (error) {
    next(error);
  }
};

// POST /api/notes
const createNote = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      title,
      content,
      attachedToType = 'GENERAL',
      attachedRefId = null,
      tags = []
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required to create a note.'
      });
    }

    const note = await noteRepository.create({
      userId,
      title: title.trim(),
      content: content.trim(),
      attachedToType,
      attachedRefId,
      tags
    });

    return res.status(201).json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notes/:id
const updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, content, tags } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = content.trim();
    if (tags !== undefined) updates.tags = tags;

    const updated = await noteRepository.update(id, userId, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    return res.json({ success: true, note: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notes/:id
const deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await noteRepository.deleteByIdAndUser(id, userId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    return res.json({ success: true, message: 'Note permanently deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotes,
  createNote,
  updateNote,
  deleteNote
};
