const express = require('express');
const router = express.Router();
const {
  getEntries,
  createEntry,
  deleteEntry,
  exportEntries
} = require('../controllers/journalController');
const { protect } = require('../middleware/auth');

// All journal operations require authentication to preserve privacy
router.use(protect);

router.get('/', getEntries);
router.post('/', createEntry);
router.get('/export', exportEntries);
router.delete('/:id', deleteEntry);

module.exports = router;
