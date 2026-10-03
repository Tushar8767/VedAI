const journalRepository = require('../repositories/journalRepository');
const practiceRepository = require('../repositories/practiceRepository');
const bookmarkRepository = require('../repositories/bookmarkRepository');
const noteRepository = require('../repositories/noteRepository');

// GET /api/journey/dashboard
const getJourneyDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const journalCount = await journalRepository.countByUser(userId);
    const practiceCount = await practiceRepository.countByUser(userId);
    const bookmarkCount = await bookmarkRepository.countByUser(userId);
    const noteCount = await noteRepository.countByUser(userId);

    const recentJournals = await journalRepository.findByUser(userId);
    const recentPractices = await practiceRepository.findByUser(userId, 3);

    const recentActivities = [
      ...recentJournals.slice(0, 3).map(j => ({
        type: 'Journal Entry',
        title: j.finalWorkingContext || 'Personal Reflection',
        snippet: (j.rawUserInput || '').substring(0, 60) + '...',
        timestamp: j.createdAt
      })),
      ...recentPractices.map(p => ({
        type: 'Practice Session',
        title: p.practiceTitle,
        snippet: `${p.durationMinutes} min ${p.category}`,
        timestamp: p.completedAt
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

    res.json({
      success: true,
      stats: {
        reflectionsAndJournals: journalCount,
        practicesCompleted: practiceCount,
        savedVerses: bookmarkCount,
        personalNotes: noteCount
      },
      recentActivities,
      philosophyReminder: 'VedAI records your mindful activities and effort. We never assign synthetic mental-health scores.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJourneyDashboard
};
