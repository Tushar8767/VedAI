const express = require('express');
const router = express.Router();
const { getJourneyDashboard } = require('../controllers/journeyController');
const { protect } = require('../middleware/auth');

router.get('/dashboard', protect, getJourneyDashboard);

module.exports = router;
