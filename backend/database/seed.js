const fs = require("fs");
const path = require("path");
const { query, checkConnection } = require("./db");

async function seedGitaVerses() {
  const dataPath = path.join(__dirname, "../data/canonicalGitaData.json");
  const verses = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  console.log(`Seeding ${verses.length} canonical Bhagavad Gita verses into PostgreSQL...`);

  for (const v of verses) {
    const sql = `
      INSERT INTO gita_verses (
        chapter, verse_number, sanskrit, transliteration,
        meaning, explanation, practical_guidance,
        primary_emotion, emotion_tags, topic_tags, source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (chapter, verse_number) DO UPDATE SET
        sanskrit = EXCLUDED.sanskrit,
        transliteration = EXCLUDED.transliteration,
        meaning = EXCLUDED.meaning,
        explanation = EXCLUDED.explanation,
        practical_guidance = EXCLUDED.practical_guidance,
        primary_emotion = EXCLUDED.primary_emotion,
        emotion_tags = EXCLUDED.emotion_tags,
        topic_tags = EXCLUDED.topic_tags,
        source = EXCLUDED.source;
    `;

    await query(sql, [
      v.chapter,
      v.verse_number,
      v.sanskrit,
      v.transliteration,
      v.meaning,
      v.explanation,
      v.practical_guidance,
      v.primary_emotion,
      v.emotion_tags,
      v.topic_tags,
      v.source
    ]);
  }

  const countResult = await query("SELECT COUNT(*) as count FROM gita_verses;");
  console.log(`Gita verses successfully seeded. Total in DB: ${countResult.rows[0].count}`);
}

if (require.main === module) {
  checkConnection()
    .then((status) => {
      if (!status.ok) throw new Error("Database connection failed: " + status.error);
      return seedGitaVerses();
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seeding error:", err);
      process.exit(1);
    });
}

module.exports = { seedGitaVerses };
