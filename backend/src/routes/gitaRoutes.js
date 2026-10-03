const express = require('express');
const router = express.Router();
const {
  getChapters,
  getChapter,
  getSpecificVerse,
  search,
  ragSearch,
  saveBookmark,
  getBookmarks,
  deleteBookmark
} = require('../controllers/gitaController');
const { protect } = require('../middleware/auth');

router.get('/chapters', getChapters);
router.get('/chapters/:chapterNumber', getChapter);
router.get('/chapters/:chapterNumber/verses/:verseNumber', getSpecificVerse);
router.get('/search', search);
router.post('/rag-search', ragSearch);

// Bookmarks (protected by user identity)
router.post('/bookmarks', protect, saveBookmark);
router.get('/bookmarks', protect, getBookmarks);
router.delete('/bookmarks/:id', protect, deleteBookmark);

module.exports = router;
