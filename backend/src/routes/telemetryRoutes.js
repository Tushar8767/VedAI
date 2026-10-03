const express = require('express');
const router = express.Router();
const { recordResearchTelemetry, getResearchMetricsSummary } = require('../services/telemetryService');
const { getUserIdFromRequest } = require('../middleware/auth');
const { telemetryLimiter } = require('../middleware/rateLimiter');
const userRepository = require('../repositories/userRepository');

// POST /api/telemetry/event
// Records de-identified telemetry if user consented to research
router.post('/event', telemetryLimiter, async (req, res, next) => {
  try {
    const {
      anonymousSessionId,
      fusionResult,
      languageDetected,
      userValidation,
      userCorrectionPresent,
      gitaRetrieved,
      gitaVerseId,
      safetyTier,
      latencyMs,
      explicitConsent = false
    } = req.body;

    let userConsent = !!explicitConsent;

    // Check authenticated user preferences if logged in
    const userId = getUserIdFromRequest(req);
    if (userId) {
      const user = await userRepository.findById(userId);
      if (user && user.preferences) {
        userConsent = user.preferences.enableResearchParticipation === true;
      }
    }

    const result = await recordResearchTelemetry({
      anonymousSessionId,
      fusionResult,
      languageDetected,
      userValidation,
      userCorrectionPresent,
      gitaRetrieved,
      gitaVerseId,
      safetyTier,
      latencyMs,
      userConsent
    });

    return res.status(200).json({
      success: true,
      telemetry: result
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/telemetry/summary
// Returns de-identified aggregation summary for researchers/debug
router.get('/summary', async (req, res, next) => {
  try {
    const summary = await getResearchMetricsSummary();
    return res.status(200).json({
      success: true,
      summary
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
