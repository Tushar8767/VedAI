const express = require('express');
const router = express.Router();
const { listPractices, getSinglePractice, logCompletedPractice } = require('../controllers/practiceController');
const { optionalAuth, protect } = require('../middleware/auth');

router.get('/', listPractices);
router.get('/:id', getSinglePractice);
router.post('/complete', optionalAuth, (req, res, next) => {
  // Allow guests to finish a practice without forced login, but if user is logged in, log it to their account
  if (req.user.isGuest) {
    return res.json({
      success: true,
      guestNotice: 'Practice completed in guest mode. Create an account to preserve your journey history.',
      log: {
        practiceId: req.body.practiceId,
        durationMinutes: req.body.durationMinutes || 3,
        completedAt: new Date()
      }
    });
  }
  return logCompletedPractice(req, res, next);
});

module.exports = router;
