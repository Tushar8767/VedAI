const journalRepository = require('../repositories/journalRepository');

// GET /api/journal
const getEntries = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search, tag } = req.query;

    const entries = await journalRepository.findByUser(userId, { search, tag });
    return res.json({ success: true, count: entries.length, entries });
  } catch (error) {
    next(error);
  }
};

// POST /api/journal
const createEntry = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      rawUserInput,
      languageDetected = 'English',
      aiEstimatedSignal,
      aiConfidence,
      userValidationChoice,
      userCorrection,
      finalWorkingContext,
      linkedVerseId,
      linkedVerseRef,
      userReflectionNotes = '',
      tags = [],
      multimodalState = 'TEXT_ONLY',
      aiExplanation = null
    } = req.body;

    if (!rawUserInput || !rawUserInput.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Original thought text is required to create a journal entry.'
      });
    }

    const newEntry = await journalRepository.create({
      userId,
      rawUserInput,
      languageDetected,
      aiEstimatedSignal,
      aiConfidence,
      multimodalState,
      aiExplanation,
      userValidationChoice,
      userCorrection,
      finalWorkingContext: userCorrection || finalWorkingContext || aiEstimatedSignal,
      linkedVerseId,
      linkedVerseRef,
      userReflectionNotes,
      tags
    });

    return res.status(201).json({ success: true, entry: newEntry });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/journal/:id
const deleteEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await journalRepository.deleteByIdAndUser(id, userId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Journal entry not found.' });
    }

    return res.json({ success: true, message: 'Journal entry permanently deleted.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/journal/export
const exportEntries = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const entries = await journalRepository.findByUser(userId);

    res.json({
      success: true,
      exportDate: new Date().toISOString(),
      user: userId,
      totalEntries: entries.length,
      entries
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEntries,
  createEntry,
  deleteEntry,
  exportEntries
};
