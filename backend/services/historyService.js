const {
  readDatabase,
  writeDatabase,
  createId,
  nowIso
} = require("./databaseService");
const emotionRepository = require("../repositories/emotionRepository");
const { isConnected } = require("../database/db");

async function saveEmotionRecord({ userId, userText, result, modality = "text" }) {
  if (isConnected()) {
    try {
      const record = await emotionRepository.saveEmotionRecord({
        userId,
        userText,
        result,
        modality
      });
      return record;
    } catch (err) {
      console.warn("PostgreSQL saveEmotionRecord fallback to file:", err.message);
    }
  }

  const db = readDatabase();
  const record = {
    id: createId("emotion"),
    userId,
    userText,
    emotion: result.emotion,
    confidence: result.confidence,
    probabilities: result.probabilities,
    guidance: result.guidance,
    recommendations: result.recommendations,
    safety: result.safety,
    modality,
    createdAt: nowIso()
  };

  db.emotionHistory.push(record);
  writeDatabase(db);
  return record;
}

async function listEmotionHistory(userId, { limit = 25, offset = 0 } = {}) {
  if (isConnected()) {
    try {
      const records = await emotionRepository.listEmotionHistory(userId, { limit, offset });
      return records;
    } catch (err) {
      console.warn("PostgreSQL listEmotionHistory fallback to file:", err.message);
    }
  }

  const db = readDatabase();
  return db.emotionHistory
    .filter((record) => record.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(offset, offset + limit);
}

function getEmotionDistribution(records) {
  return records.reduce((distribution, record) => {
    distribution[record.emotion] = (distribution[record.emotion] || 0) + 1;
    return distribution;
  }, {});
}

function calculateWellnessIndex({ history = [], journalEntries = [] }) {
  if (history.length === 0 && journalEntries.length === 0) {
    return {
      score: 50,
      formula: "Baseline 50 until VedAI has enough user history.",
      factors: {
        recentEmotionBalance: 0,
        reflectionConsistency: 0,
        journalingActivity: 0
      }
    };
  }

  const recent = history.slice(0, 10);
  const positiveCount = recent.filter((item) => item.emotion === "happiness" || item.emotion === "neutral").length;
  const recentEmotionBalance = recent.length ? positiveCount / recent.length : 0.5;
  const reflectionConsistency = Math.min(history.length / 7, 1);
  const journalingActivity = Math.min(journalEntries.length / 5, 1);
  const score = Math.round(
    35 + (recentEmotionBalance * 35) + (reflectionConsistency * 15) + (journalingActivity * 15)
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    formula: "35 baseline + 35 recent emotion balance + 15 reflection consistency + 15 journaling activity. Transparent wellness heuristic.",
    factors: {
      recentEmotionBalance: Math.round(recentEmotionBalance * 100) / 100,
      reflectionConsistency: Math.round(reflectionConsistency * 100) / 100,
      journalingActivity: Math.round(journalingActivity * 100) / 100
    }
  };
}

async function clearEmotionHistory(userId) {
  if (!userId) return false;

  if (isConnected()) {
    try {
      await emotionRepository.deleteByUser(userId);
      return true;
    } catch (err) {
      console.warn("PostgreSQL clearEmotionHistory fallback to file:", err.message);
    }
  }

  const db = readDatabase();
  db.emotionHistory = (db.emotionHistory || []).filter((record) => record.userId !== userId);
  writeDatabase(db);
  return true;
}

module.exports = {
  saveEmotionRecord,
  listEmotionHistory,
  clearEmotionHistory,
  getEmotionDistribution,
  calculateWellnessIndex
};

