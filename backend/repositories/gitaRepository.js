const { query } = require("../database/db");

async function findByEmotion(emotion, limit = 5) {
  const normalized = String(emotion || "neutral").toLowerCase();
  const res = await query(
    `SELECT id, chapter, verse_number, sanskrit, transliteration,
            meaning, explanation, practical_guidance, primary_emotion,
            emotion_tags, topic_tags, source
     FROM gita_verses
     WHERE primary_emotion = $1 OR $1 = ANY(emotion_tags)
     ORDER BY RANDOM()
     LIMIT $2;`,
    [normalized, limit]
  );

  if (res.rows.length === 0) {
    // Fallback to neutral or general verses
    const fallbackRes = await query(
      `SELECT id, chapter, verse_number, sanskrit, transliteration,
              meaning, explanation, practical_guidance, primary_emotion,
              emotion_tags, topic_tags, source
       FROM gita_verses
       ORDER BY RANDOM()
       LIMIT $1;`,
      [limit]
    );
    return fallbackRes.rows;
  }

  return res.rows;
}

async function searchGitaVerses(searchTerm, limit = 5) {
  const term = `%${searchTerm.toLowerCase()}%`;
  const res = await query(
    `SELECT id, chapter, verse_number, sanskrit, transliteration,
            meaning, explanation, practical_guidance, primary_emotion,
            emotion_tags, topic_tags, source
     FROM gita_verses
     WHERE LOWER(meaning) LIKE $1 
        OR LOWER(explanation) LIKE $1 
        OR LOWER(practical_guidance) LIKE $1
        OR $2 = ANY(topic_tags)
     LIMIT $3;`,
    [term, searchTerm.toLowerCase(), limit]
  );
  return res.rows;
}

async function getVerse(chapter, verseNumber) {
  const res = await query(
    `SELECT id, chapter, verse_number, sanskrit, transliteration,
            meaning, explanation, practical_guidance, primary_emotion,
            emotion_tags, topic_tags, source
     FROM gita_verses
     WHERE chapter = $1 AND verse_number = $2
     LIMIT 1;`,
    [chapter, verseNumber]
  );
  return res.rows[0] || null;
}

module.exports = {
  findByEmotion,
  searchGitaVerses,
  getVerse
};
