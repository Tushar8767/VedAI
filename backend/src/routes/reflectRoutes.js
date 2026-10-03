const express = require('express');
const router = express.Router();
const { orchestrateReflection } = require('../controllers/reflectController');
const { optionalAuth } = require('../middleware/auth');
const { reflectLimiter } = require('../middleware/rateLimiter');

// POST /api/reflect/orchestrate
// Main entry point for Universal Input -> Safety -> Emotion -> Validation -> Gita -> Practice
router.post('/orchestrate', reflectLimiter, optionalAuth, orchestrateReflection);

module.exports = router;
