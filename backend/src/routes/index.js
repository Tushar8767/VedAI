const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const reflectRoutes = require('./reflectRoutes');
const gitaRoutes = require('./gitaRoutes');
const journalRoutes = require('./journalRoutes');
const noteRoutes = require('./noteRoutes');
const practiceRoutes = require('./practiceRoutes');
const journeyRoutes = require('./journeyRoutes');
const resourceRoutes = require('./resourceRoutes');
const settingsRoutes = require('./settingsRoutes');
const telemetryRoutes = require('./telemetryRoutes');
const gameRoutes = require('./gameRoutes');
const { getDBStatus } = require('../config/db');

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'VedAI 2.0 API Orchestrator',
    timestamp: new Date().toISOString(),
    database: getDBStatus()
  });
});

// Mount modules
router.use('/auth', authRoutes);
router.use('/reflect', reflectRoutes);
router.use('/gita', gitaRoutes);
router.use('/journal', journalRoutes);
router.use('/notes', noteRoutes);
router.use('/practices', practiceRoutes);
router.use('/journey', journeyRoutes);
router.use('/resources', resourceRoutes);
router.use('/settings', settingsRoutes);
router.use('/telemetry', telemetryRoutes);
router.use('/games', gameRoutes);

module.exports = router;
