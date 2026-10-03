const userRepository = require('../repositories/userRepository');
const journalRepository = require('../repositories/journalRepository');
const practiceRepository = require('../repositories/practiceRepository');
const bookmarkRepository = require('../repositories/bookmarkRepository');
const noteRepository = require('../repositories/noteRepository');

// GET /api/settings/privacy-summary
const getPrivacySummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const journalCount = await journalRepository.countByUser(userId);
    const noteCount = await noteRepository.countByUser(userId);
    const practiceCount = await practiceRepository.countByUser(userId);
    const bookmarkCount = await bookmarkRepository.countByUser(userId);

    return res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      },
      consentStatus: {
        aiEmotionIntelligence: user.preferences?.enableEmotionIntelligence ?? true,
        facialAnalysis: user.preferences?.enableFacialAnalysisConsent ?? false,
        researchParticipation: user.preferences?.enableResearchParticipation ?? false,
        language: user.preferences?.language || 'en',
        notifications: user.preferences?.notifications || { dailyReminder: false, weeklyDigest: false }
      },
      storedDataSummary: {
        journalEntries: journalCount,
        personalNotes: noteCount,
        practicesCompleted: practiceCount,
        savedVerses: bookmarkCount
      },
      guarantees: [
        'Zero video recording: camera analysis happens ephemerally on the client device.',
        'Zero public training: private journal entries and thoughts are never used to train public LLMs.',
        'Immediate deletion: when data is deleted, records are removed directly from persistent storage.',
        'Full data portability: download complete JSON archive of all personal records anytime.'
      ]
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/settings/export
const exportUserData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const journals = await journalRepository.findByUser(userId);
    const notes = await noteRepository.findByUser(userId);
    const practices = await practiceRepository.findByUser(userId, 1000);
    const bookmarks = await bookmarkRepository.findByUser(userId);

    return res.json({
      success: true,
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        version: 'VedAI 2.0 GDPR/Data-Portability Export',
        userEmail: user.email,
        userName: user.name
      },
      data: {
        preferences: user.preferences,
        journals,
        notes,
        practices,
        bookmarks
      }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings/preferences
const updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      language,
      enableEmotionIntelligence,
      enableFacialAnalysisConsent,
      enableResearchParticipation,
      notifications
    } = req.body;

    const updates = {};
    if (language !== undefined) updates.language = language;
    if (enableEmotionIntelligence !== undefined) updates.enableEmotionIntelligence = Boolean(enableEmotionIntelligence);
    if (enableFacialAnalysisConsent !== undefined) updates.enableFacialAnalysisConsent = Boolean(enableFacialAnalysisConsent);
    if (enableResearchParticipation !== undefined) updates.enableResearchParticipation = Boolean(enableResearchParticipation);
    if (notifications !== undefined) updates.notifications = notifications;

    const updatedUser = await userRepository.updatePreferences(userId, updates);
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      message: 'Preferences updated successfully.',
      preferences: updatedUser.preferences
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/settings/delete-content-only
const deleteUserContentOnly = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await journalRepository.deleteByUser(userId);
    await practiceRepository.deleteByUser(userId);
    await bookmarkRepository.deleteByUser(userId);
    await noteRepository.deleteByUser(userId);

    return res.json({
      success: true,
      message: 'All your journal entries, notes, practices, and bookmarks have been permanently deleted. Your account remains active.'
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/settings/account (Purge all data & account)
const purgeUserData = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await journalRepository.deleteByUser(userId);
    await practiceRepository.deleteByUser(userId);
    await bookmarkRepository.deleteByUser(userId);
    await noteRepository.deleteByUser(userId);
    await userRepository.deleteById(userId);

    return res.json({
      success: true,
      message: 'All personal data, journal entries, notes, practices, bookmarks, and your user account have been permanently erased.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPrivacySummary,
  exportUserData,
  updatePreferences,
  deleteUserContentOnly,
  purgeUserData
};
