const axios = require("axios");
const gitaRepository = require("../repositories/gitaRepository");
const { isConnected } = require("../database/db");
const config = require("../config/env");

async function searchGitaRag({ query, emotion = null, topK = 3 }) {
  // Check exact verse reference first (e.g. "2.47" -> Chapter 2, Verse 47)
  const verseRefMatch = String(query || "").match(/\b(\d{1,2})[\.:](\d{1,2})\b/);
  if (verseRefMatch) {
    const ch = parseInt(verseRefMatch[1], 10);
    const vn = parseInt(verseRefMatch[2], 10);
    if (isConnected()) {
      try {
        const exact = await gitaRepository.getVerse(ch, vn);
        if (exact) {
          return [exact];
        }
      } catch (e) {
        // fallback to local/ML search
      }
    }
    const { loadLocalGitaData } = require("./gitaService");
    const data = loadLocalGitaData();
    if (Array.isArray(data)) {
      const match = data.find((v) => v.chapter === ch && v.verse_number === vn);
      if (match) {
        return [{
          chapter: match.chapter,
          verse_number: match.verse_number,
          verse: match.sanskrit,
          sanskrit: match.sanskrit,
          transliteration: match.transliteration,
          meaning: match.meaning,
          explanation: match.explanation,
          practical_guidance: match.practical_guidance,
          emotion: match.primary_emotion || emotion || "neutral",
          source: match.source || `Bhagavad Gita ${match.chapter}.${match.verse_number}`,
          citation_status: "verified_canonical_citation"
        }];
      }
    }
  }

  // First attempt: Call ML RAG service for dense vector / TF-IDF semantic similarity
  try {
    const ragApiUrl = config.MODEL_API_URL.replace("/predict", "/rag/search");
    const response = await axios.post(
      ragApiUrl,
      { query, emotion, top_k: topK },
      { timeout: 5000 }
    );
    if (response.data && response.data.results && response.data.results.length > 0) {
      return response.data.results;
    }
  } catch (err) {
    console.warn("ML RAG search unavailable, using database repository:", err.message);
  }

  // Second attempt: Search PostgreSQL database directly
  if (isConnected()) {
    try {
      const dbResults = await gitaRepository.searchGitaVerses(query, topK);
      if (dbResults && dbResults.length > 0) {
        return dbResults;
      }
      if (emotion) {
        return await gitaRepository.findByEmotion(emotion, topK);
      }
    } catch (err) {
      console.warn("PostgreSQL RAG search error:", err.message);
    }
  }

  // Third attempt: Local canonical dataset search with semantic keyword weighting
  const localResults = localSemanticSearch(query, emotion, topK);
  if (localResults && localResults.length > 0) {
    return localResults;
  }

  // Fallback: Default canonical guidance
  const defaultGuidance = require("./gitaService").getGitaGuidance;
  const single = await defaultGuidance(emotion || "neutral");
  return [single];
}

function localSemanticSearch(query, emotion, topK = 3) {
  const { loadLocalGitaData } = require("./gitaService");
  const data = loadLocalGitaData();
  if (!Array.isArray(data) || data.length === 0) return null;

  const rawQuery = String(query || "").toLowerCase();
  const tokens = rawQuery
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const scored = data.map((v) => {
    let score = 0;
    const meaning = String(v.meaning || "").toLowerCase();
    const explanation = String(v.explanation || "").toLowerCase();
    const guidance = String(v.practical_guidance || "").toLowerCase();
    const translit = String(v.transliteration || "").toLowerCase();
    const tags = Array.isArray(v.topic_tags) ? v.topic_tags.map(t => String(t).toLowerCase()) : [];
    const emotionTags = Array.isArray(v.emotion_tags) ? v.emotion_tags.map(t => String(t).toLowerCase()) : [];

    for (const token of tokens) {
      if (meaning.includes(token)) score += 3.0;
      if (guidance.includes(token)) score += 2.5;
      if (explanation.includes(token)) score += 2.0;
      if (translit.includes(token)) score += 1.5;
      if (tags.some(t => t.includes(token))) score += 4.0;
      if (emotionTags.some(t => t.includes(token))) score += 2.0;
    }

    if (emotion) {
      const normEmotion = String(emotion).toLowerCase();
      if (String(v.primary_emotion || "").toLowerCase() === normEmotion) {
        score += 2.5;
      }
      if (emotionTags.includes(normEmotion)) {
        score += 1.5;
      }
    }

    return { verse: v, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const filtered = scored.filter(s => s.score > 0);
  const candidates = (filtered.length > 0 ? filtered : scored).slice(0, topK);

  return candidates.map(c => ({
    chapter: c.verse.chapter,
    verse_number: c.verse.verse_number,
    verse: c.verse.sanskrit,
    sanskrit: c.verse.sanskrit,
    transliteration: c.verse.transliteration,
    meaning: c.verse.meaning,
    explanation: c.verse.explanation,
    practical_guidance: c.verse.practical_guidance,
    emotion: c.verse.primary_emotion || emotion || "neutral",
    source: c.verse.source || `Bhagavad Gita ${c.verse.chapter}.${c.verse.verse_number}`,
    citation_status: "verified_canonical_citation",
    similarity_score: c.score
  }));
}

module.exports = { searchGitaRag, localSemanticSearch };
