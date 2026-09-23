const {
  listEmotionHistory,
  clearEmotionHistory,
  getEmotionDistribution,
  calculateWellnessIndex
} = require("../services/historyService");
const { listJournalEntries } = require("../services/journalService");

async function getDashboard(req, res) {
  try {
    const history = await listEmotionHistory(req.user.id, { limit: 50 });
    const journalEntries = await listJournalEntries(req.user.id);
    const latest = history[0] || null;

    res.json({
      currentEmotion: latest
        ? {
            emotion: latest.emotion,
            confidence: latest.confidence,
            createdAt: latest.createdAt
          }
        : null,
      wellnessIndex: calculateWellnessIndex({ history, journalEntries }),
      emotionDistribution: getEmotionDistribution(history),
      recentEmotions: history.slice(0, 10),
      recentJournalEntries: journalEntries.slice(0, 5),
      recentRecommendations: latest?.recommendations || [],
      gitaRecommendation: latest?.guidance || null
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to load dashboard." } });
  }
}

async function getHistory(req, res) {
  try {
    const history = await listEmotionHistory(req.user.id, { limit: Number(req.query.limit || 50) });
    res.json({ history });
  } catch (error) {
    console.error("History error:", error);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to load history." } });
  }
}

async function deleteHistory(req, res) {
  try {
    await clearEmotionHistory(req.user.id);
    res.json({ status: "ok", message: "Emotion reflection history successfully cleared." });
  } catch (error) {
    console.error("Delete history error:", error);
    res.status(500).json({ error: { code: "SERVER_ERROR", message: "Failed to clear history." } });
  }
}

module.exports = { getDashboard, getHistory, deleteHistory };
