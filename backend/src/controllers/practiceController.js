const { getPractices, getPracticeById } = require('../services/practiceService');
const practiceRepository = require('../repositories/practiceRepository');

// GET /api/practices
const listPractices = (req, res) => {
  const practices = getPractices();
  res.json({
    success: true,
    count: practices.length,
    practices
  });
};

// GET /api/practices/:id
const getSinglePractice = (req, res) => {
  const { id } = req.params;
  const practice = getPracticeById(id);
  if (!practice) {
    return res.status(404).json({ success: false, message: 'Practice not found.' });
  }
  res.json({ success: true, practice });
};

// POST /api/practices/complete
const logCompletedPractice = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { practiceId, durationMinutes, userNote = '' } = req.body;

    const practice = getPracticeById(practiceId);
    if (!practice) {
      return res.status(400).json({ success: false, message: 'Invalid practice ID.' });
    }

    const log = await practiceRepository.create({
      userId,
      practiceId: practice.id,
      practiceTitle: practice.title,
      category: practice.category,
      durationMinutes: durationMinutes || practice.durationMinutes,
      userNote,
      completedAt: new Date()
    });

    return res.status(201).json({ success: true, log });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listPractices,
  getSinglePractice,
  logCompletedPractice
};
