const { query } = require("../database/db");
const crypto = require("crypto");
const { encrypt, decrypt } = require("../utils/encryption");

function mapJournalEntry(row) {
  if (!row) return null;
  return {
    ...row,
    content: decrypt(row.content)
  };
}

async function listJournalEntries(userId, { limit = 50, offset = 0 } = {}) {
  const res = await query(
    `SELECT id, user_id as "userId", title, content, emotion,
            created_at as "createdAt", updated_at as "updatedAt"
     FROM journal_entries
     WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT $2 OFFSET $3;`,
    [userId, limit, offset]
  );
  return res.rows.map(mapJournalEntry);
}

async function createJournalEntry(userId, { title, content, emotion = null }) {
  const id = `journal_${crypto.randomUUID()}`;
  const encryptedContent = encrypt(content);
  const res = await query(
    `INSERT INTO journal_entries (id, user_id, title, content, emotion)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id as "userId", title, content, emotion,
               created_at as "createdAt", updated_at as "updatedAt";`,
    [id, userId, title || "Untitled reflection", encryptedContent, emotion]
  );
  return mapJournalEntry(res.rows[0]);
}

async function updateJournalEntry(userId, entryId, { title, content, emotion }) {
  const existing = await query("SELECT * FROM journal_entries WHERE id = $1 AND user_id = $2;", [entryId, userId]);
  if (existing.rows.length === 0) return null;

  const current = existing.rows[0];
  const newTitle = title !== undefined ? title : current.title;
  const newContent = content !== undefined ? encrypt(content) : current.content;
  const newEmotion = emotion !== undefined ? emotion : current.emotion;

  const res = await query(
    `UPDATE journal_entries
     SET title = $1, content = $2, emotion = $3, updated_at = CURRENT_TIMESTAMP
     WHERE id = $4 AND user_id = $5
     RETURNING id, user_id as "userId", title, content, emotion,
               created_at as "createdAt", updated_at as "updatedAt";`,
    [newTitle, newContent, newEmotion, entryId, userId]
  );
  return mapJournalEntry(res.rows[0]);
}

async function deleteJournalEntry(userId, entryId) {
  const res = await query(
    "DELETE FROM journal_entries WHERE id = $1 AND user_id = $2 RETURNING id;",
    [entryId, userId]
  );
  return res.rowCount > 0;
}

module.exports = {
  listJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry
};

