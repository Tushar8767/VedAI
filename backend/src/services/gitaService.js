/**
 * Gita Knowledge Base & RAG Engine
 * 
 * Rules:
 * 1. The AI NEVER fabricates scripture.
 * 2. Original scripture (Sanskrit, transliteration, verified translation) is immutable.
 * 3. Clearly separates ORIGINAL SOURCE from AI-GENERATED REFLECTION.
 * 4. Transparently explains WHY a verse was chosen.
 * 5. Returns null / no match rather than forcing an irrelevant verse.
 */

const fs = require('fs');
const path = require('path');

// Load knowledge base files
const chaptersPath = path.join(__dirname, '../../../knowledge-base/gita_chapters.json');
const versesPath = path.join(__dirname, '../../../knowledge-base/gita_verses.json');

let chaptersData = [];
let versesData = [];

try {
  chaptersData = JSON.parse(fs.readFileSync(chaptersPath, 'utf8'));
  versesData = JSON.parse(fs.readFileSync(versesPath, 'utf8'));
} catch (err) {
  console.warn('[Gita Service] Warning loading local JSON knowledge base:', err.message);
}

// 1. Get all 18 Chapters
const getAllChapters = () => {
  return chaptersData;
};

// 2. Get Chapter by number
const getChapterByNumber = (chapterNumber) => {
  const num = parseInt(chapterNumber, 10);
  return chaptersData.find(c => c.chapterNumber === num) || null;
};

// 3. Get all verses for a chapter
const getVersesByChapter = (chapterNumber) => {
  const num = parseInt(chapterNumber, 10);
  return versesData.filter(v => v.chapter === num);
};

// 4. Get specific verse
const getVerse = (chapterNumber, verseNumber) => {
  const cNum = parseInt(chapterNumber, 10);
  const vNum = parseInt(verseNumber, 10);
  return versesData.find(v => v.chapter === cNum && v.verse === vNum) || null;
};

// 5. Search verses by keyword or theme
const searchVerses = (query = '') => {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();

  return versesData.filter(v => {
    const matchTrans = v.translation.toLowerCase().includes(q);
    const matchExplanation = v.simpleExplanation.toLowerCase().includes(q);
    const matchThemes = v.themes.some(t => t.toLowerCase().includes(q));
    const matchTranslit = v.transliteration.toLowerCase().includes(q);
    return matchTrans || matchExplanation || matchThemes || matchTranslit;
  });
};

const vectorSearchService = require('./vectorSearchService');

// 6. Connect User Reflection with Gita (Grounded Vector RAG Engine)
const findRelevantVerses = (validatedContext = '', limit = 2) => {
  if (!validatedContext || !validatedContext.trim()) {
    return [];
  }

  // Vector search across all 700 verses with cosine similarity
  let vectorResults = vectorSearchService.search(validatedContext, { topK: limit * 5, minScore: 0.04 });

  const query = validatedContext.toLowerCase();

  // Ensure key thematic anchor verses are evaluated when emotional/situational triggers are present
  const priorityVerseIds = [];
  if (query.includes('exam') || query.includes('test') || query.includes('result') || query.includes('outcome') || query.includes('stress') || query.includes('worr')) {
    priorityVerseIds.push('BG_2_47');
  }
  if (query.includes('overthink') || query.includes('restless') || query.includes('mind')) {
    priorityVerseIds.push('BG_6_35');
  }
  if (query.includes('burnout') || query.includes('exhaust') || query.includes('tired')) {
    priorityVerseIds.push('BG_6_16');
  }
  if (query.includes('anger') || query.includes('mad') || query.includes('frustrat')) {
    priorityVerseIds.push('BG_2_62');
  }

  for (const pid of priorityVerseIds) {
    if (!vectorResults.some(r => r.verse.id === pid)) {
      const v = versesData.find(x => x.id === pid);
      if (v) {
        vectorResults.push({ verse: v, cosineScore: 0.20, relevanceScore: 0.20 });
      }
    }
  }

  if (vectorResults.length === 0) {
    return [];
  }

  const scored = [];

  for (const { verse, cosineScore, relevanceScore } of vectorResults) {
    let finalScore = relevanceScore;
    const reasons = [`semantic similarity: ${cosineScore}`];

    // Priority mappings for core human emotional states
    if ((query.includes('stress') || query.includes('overwhelm') || query.includes('exam')) && verse.id === 'BG_2_47') {
      finalScore += 0.5;
      reasons.push('classic wisdom on focusing on action rather than outcome');
    }
    if ((query.includes('burnout') || query.includes('tired') || query.includes('exhaust')) && verse.id === 'BG_6_16') {
      finalScore += 0.5;
      reasons.push('speaks directly to balanced living, rest, and avoiding physical burnout');
    }
    if ((query.includes('overthink') || query.includes('restless') || query.includes('lost')) && (verse.id === 'BG_6_35' || verse.id === 'BG_6_5')) {
      finalScore += 0.4;
      reasons.push('reassures on calming a restless mind through gentle practice');
    }
    if ((query.includes('frustrat') || query.includes('ang')) && (verse.id === 'BG_2_62' || verse.id === 'BG_2_63')) {
      finalScore += 0.5;
      reasons.push('clarifies how unmet expectations cause agitation');
    }

    scored.push({
      verse: {
        id: verse.id,
        chapter: verse.chapter,
        verse: verse.verse,
        sanskrit: verse.sanskrit,
        transliteration: verse.transliteration,
        verifiedTranslation: verse.translation,
        source: verse.source,
        themes: verse.themes,
        provenance: verse.provenance
      },
      aiAssistance: {
        simpleExplanation: verse.simpleExplanation,
        whyThisVerse: verse.whyThisVerse,
        retrievalRationale: reasons.length ? `Selected because your reflection ${reasons.join(', ')}.` : verse.whyThisVerse,
        disclaimer: 'The explanation above is modern AI-assisted guidance to illuminate the verified verse.'
      },
      relevanceScore: parseFloat(finalScore.toFixed(4)),
      cosineScore
    });
  }

  // Sort by score descending
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return scored.slice(0, limit);
};

module.exports = {
  getAllChapters,
  getChapterByNumber,
  getVersesByChapter,
  getVerse,
  searchVerses,
  findRelevantVerses
};
