const express = require('express');
const router = express.Router();
const {
  getPrivacySummary,
  exportUserData,
  updatePreferences,
  deleteUserContentOnly,
  purgeUserData
} = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/privacy-summary', getPrivacySummary);
router.get('/export', exportUserData);
router.put('/preferences', updatePreferences);
router.post('/delete-content-only', deleteUserContentOnly);
router.delete('/account', purgeUserData);
router.delete('/purge-my-data', purgeUserData); // Backwards compatibility

module.exports = router;
