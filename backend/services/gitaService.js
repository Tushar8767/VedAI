const fs = require("fs");
const path = require("path");
const gitaRepository = require("../repositories/gitaRepository");
const { isConnected } = require("../database/db");

const canonicalDataPath = path.join(__dirname, "../data/canonicalGitaData.json");
const legacyDataPath = path.join(__dirname, "../../docs/gitaData.json");
let cachedGitaData = null;

const EMOTION_ALIASES = {
  stress: "anxiety",
  anxious: "anxiety",
  joy: "happiness",
  happy: "happiness",
  sad: "sadness",
  anger: "anger",
  fear: "fear",
  neutral: "neutral"
};

function loadLocalGitaData() {
  if (!cachedGitaData) {
    if (fs.existsSync(canonicalDataPath)) {
      cachedGitaData = JSON.parse(fs.readFileSync(canonicalDataPath, "utf8"));
    } else {
      cachedGitaData = JSON.parse(fs.readFileSync(legacyDataPath, "utf8"));
    }
  }
  return cachedGitaData;
}

async function getGitaGuidance(emotion = "neutral") {
  const normalizedEmotion = EMOTION_ALIASES[emotion] || emotion;

  if (isConnected()) {
    try {
      const dbVerses = await gitaRepository.findByEmotion(normalizedEmotion, 1);
      if (dbVerses && dbVerses.length > 0) {
        const verse = dbVerses[0];
        return {
          chapter: verse.chapter,
          verse_number: verse.verse_number,
          verse: verse.sanskrit,
          sanskrit: verse.sanskrit,
          transliteration: verse.transliteration,
          meaning: verse.meaning,
          explanation: verse.explanation,
          practical_guidance: verse.practical_guidance,
          emotion: verse.primary_emotion,
          source: verse.source || `Bhagavad Gita ${verse.chapter}.${verse.verse_number}`,
          citation_status: "verified_canonical_citation"
        };
      }
    } catch (err) {
      console.warn("PostgreSQL getGitaGuidance fallback to local data:", err.message);
    }
  }

  // Local file fallback
  const data = loadLocalGitaData();
  if (Array.isArray(data)) {
    const matches = data.filter(
      (v) => v.primary_emotion === normalizedEmotion || (v.emotion_tags && v.emotion_tags.includes(normalizedEmotion))
    );
    const pool = matches.length > 0 ? matches : data;
    const item = pool[Math.floor(Math.random() * pool.length)];
    return {
      chapter: item.chapter,
      verse_number: item.verse_number,
      verse: item.sanskrit,
      sanskrit: item.sanskrit,
      transliteration: item.transliteration,
      meaning: item.meaning,
      explanation: item.explanation,
      practical_guidance: item.practical_guidance,
      emotion: item.primary_emotion || normalizedEmotion,
      source: item.source || `Bhagavad Gita ${item.chapter}.${item.verse_number}`,
      citation_status: "verified_canonical_citation"
    };
  }

  // Legacy structure fallback
  const entries = data[normalizedEmotion] || data.neutral || [];
  if (entries.length === 0) {
    return {
      verse: "",
      meaning: "No guidance entry is available yet.",
      explanation: "Knowledge base needs more content.",
      source: "VedAI curated knowledge base"
    };
  }

  const selected = entries[Math.floor(Math.random() * entries.length)];
  return {
    ...selected,
    emotion: normalizedEmotion,
    source: selected.source || "VedAI curated Bhagavad Gita knowledge base",
    citation_status: selected.chapter && selected.verse_number ? "chapter_verse_available" : "excerpt_needs_citation_review"
  };
}

module.exports = { getGitaGuidance, loadLocalGitaData };
