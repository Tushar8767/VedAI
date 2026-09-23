const { query } = require("../database/db");
const crypto = require("crypto");

async function saveEmotionRecord({ userId, userText, result, modality = "text" }) {
  const id = `emotion_${crypto.randomUUID()}`;
  const res = await query(
    `INSERT INTO emotion_history (
      id, user_id, user_text, emotion, confidence, probabilities,
      guidance, recommendations, safety, modality
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, user_id as "userId", user_text as "userText", emotion, confidence,
              probabilities, guidance, recommendations, safety, modality, created_at as "createdAt";`,
    [
      id,
      userId,
      userText,
      result.emotion,
      result.confidence,
      JSON.stringify(result.probabilities || {}),
      JSON.stringify(result.guidance || {}),
      JSON.stringify(result.recommendations || []),
      JSON.stringify(result.safety || {}),
      modality
    ]
  );
  return res.rows[0];
}

async function listEmotionHistory(userId, { limit = 25, offset = 0 } = {}) {
  const res = await query(
    `SELECT id, user_id as "userId", user_text as "userText", emotion, confidence,
            probabilities, guidance, recommendations, safety, modality, created_at as "createdAt"
     FROM emotion_history
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3;`,
    [userId, limit, offset]
  );
  return res.rows;
}

async function countByUser(userId) {
  const res = await query("SELECT COUNT(*) as count FROM emotion_history WHERE user_id = $1;", [userId]);
  return Number(res.rows[0]?.count || 0);
}

async function deleteByUser(userId) {
  const res = await query("DELETE FROM emotion_history WHERE user_id = $1;", [userId]);
  return res.rowCount;
}

module.exports = {
  saveEmotionRecord,
  listEmotionHistory,
  countByUser,
  deleteByUser
};
