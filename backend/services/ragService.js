const axios = require("axios");
const gitaRepository = require("../repositories/gitaRepository");
const { isConnected } = require("../database/db");
const config = require("../config/env");

async function searchGitaRag({ query, emotion = null, topK = 3 }) {
  // Check exact verse reference first (e.g. "2.47" -> Chapter 2, Verse 47)
  const verseRefMatch = String(query || "").match(/\b(\d{1,2})[\.:](\d{1,2})\b/);
  if (verseRefMatch && isConnected()) {
    try {
      const ch = parseInt(verseRefMatch[1], 10);
      const vn = parseInt(verseRefMatch[2], 10);
      const exact = await gitaRepository.getVerse(ch, vn);
      if (exact) {
        return [exact];
      }
    } catch (e) {
      // fallback to RAG search
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

  // Fallback: Default canonical guidance
  const defaultGuidance = require("./gitaService").getGitaGuidance;
  const single = await defaultGuidance(emotion || "neutral");
  return [single];
}

module.exports = { searchGitaRag };
