const {
  getAllChapters,
  getChapterByNumber,
  getVersesByChapter,
  getVerse,
  searchVerses,
  findRelevantVerses
} = require('../services/gitaService');

// GET /api/gita/chapters
const getChapters = (req, res) => {
  const chapters = getAllChapters();
  res.json({
    success: true,
    totalChapters: chapters.length,
    chapters
  });
};

// GET /api/gita/chapters/:chapterNumber
const getChapter = (req, res) => {
  const { chapterNumber } = req.params;
  const chapter = getChapterByNumber(chapterNumber);

  if (!chapter) {
    return res.status(404).json({
      success: false,
      message: `Chapter ${chapterNumber} not found.`
    });
  }

  const verses = getVersesByChapter(chapterNumber);

  res.json({
    success: true,
    chapter,
    totalVerses: verses.length,
    verses
  });
};

// GET /api/gita/chapters/:chapterNumber/verses/:verseNumber
const getSpecificVerse = (req, res) => {
  const { chapterNumber, verseNumber } = req.params;
  const verse = getVerse(chapterNumber, verseNumber);

  if (!verse) {
    return res.status(404).json({
      success: false,
      message: `Verse ${chapterNumber}.${verseNumber} not found.`
    });
  }

  res.json({
    success: true,
    verse: {
      id: verse.id,
      chapter: verse.chapter,
      verse: verse.verse,
      sanskrit: verse.sanskrit,
      transliteration: verse.transliteration,
      translation: verse.translation,
      source: verse.source,
      themes: verse.themes
    },
    aiAssistance: {
      simpleExplanation: verse.simpleExplanation,
      whyThisVerse: verse.whyThisVerse,
      disclaimer: 'The explanation above is modern AI-assisted guidance to illuminate the verified verse.'
    }
  });
};

// GET /api/gita/search?q=keyword
const search = (req, res) => {
  const { q } = req.query;
  const results = searchVerses(q);

  res.json({
    success: true,
    query: q || '',
    count: results.length,
    results
  });
};

// POST /api/gita/rag-search
const ragSearch = (req, res) => {
  const { query, limit = 3 } = req.body;
  const results = findRelevantVerses(query, limit);

  res.json({
    success: true,
    query,
    count: results.length,
    results
  });
};

const bookmarkRepository = require('../repositories/bookmarkRepository');

// POST /api/gita/bookmarks
const saveBookmark = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { verseId, chapter, verse, sanskrit, translation, personalNote = '' } = req.body;

    if (!verseId || !chapter || !verse) {
      return res.status(400).json({ success: false, message: 'verseId, chapter, and verse are required.' });
    }

    const bookmark = await bookmarkRepository.create({
      userId,
      verseId,
      chapter: parseInt(chapter, 10),
      verse: parseInt(verse, 10),
      sanskrit,
      translation,
      personalNote,
      savedAt: new Date()
    });

    return res.status(201).json({ success: true, bookmark });
  } catch (error) {
    next(error);
  }
};

// GET /api/gita/bookmarks
const getBookmarks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const bookmarks = await bookmarkRepository.findByUser(userId);
    return res.json({ success: true, count: bookmarks.length, bookmarks });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/gita/bookmarks/:id
const deleteBookmark = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const deleted = await bookmarkRepository.deleteByIdAndUser(id, userId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Bookmark not found.' });
    }
    return res.json({ success: true, message: 'Bookmark removed.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChapters,
  getChapter,
  getSpecificVerse,
  search,
  ragSearch,
  saveBookmark,
  getBookmarks,
  deleteBookmark
};
