const { query } = require("../database/db");
const crypto = require("crypto");
const { encrypt, decrypt } = require("../utils/encryption");

function mapChatMessage(row) {
  if (!row) return null;
  return {
    ...row,
    content: decrypt(row.content)
  };
}

async function createConversation(userId = null, title = "Reflection Session") {
  const id = `conv_${crypto.randomUUID()}`;
  const res = await query(
    `INSERT INTO chat_conversations (id, user_id, title)
     VALUES ($1, $2, $3)
     RETURNING id, user_id as "userId", title, created_at as "createdAt", updated_at as "updatedAt";`,
    [id, userId, title]
  );
  return res.rows[0];
}

async function getConversation(id) {
  const res = await query("SELECT id, user_id as \"userId\", title, created_at as \"createdAt\", updated_at as \"updatedAt\" FROM chat_conversations WHERE id = $1;", [id]);
  return res.rows[0] || null;
}

async function ensureConversation(conversationId, userId = null) {
  if (!conversationId) return;
  await query(
    `INSERT INTO chat_conversations (id, user_id, title)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO NOTHING;`,
    [conversationId, userId, "Reflection Session"]
  );
}

async function saveMessage(conversationId, sender, content, { emotionContext = null, groundedVerses = null } = {}) {
  await ensureConversation(conversationId);
  const id = `msg_${crypto.randomUUID()}`;
  const encryptedContent = encrypt(content);
  const res = await query(
    `INSERT INTO chat_messages (id, conversation_id, sender, content, emotion_context, grounded_verses)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, conversation_id as "conversationId", sender, content,
               emotion_context as "emotionContext", grounded_verses as "groundedVerses", created_at as "createdAt";`,
    [
      id,
      conversationId,
      sender,
      encryptedContent,
      emotionContext ? JSON.stringify(emotionContext) : null,
      groundedVerses ? JSON.stringify(groundedVerses) : null
    ]
  );
  // Update conversation updated_at
  await query("UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1;", [conversationId]);
  return mapChatMessage(res.rows[0]);
}

async function getMessages(conversationId, limit = 50) {
  const res = await query(
    `SELECT id, conversation_id as "conversationId", sender, content,
            emotion_context as "emotionContext", grounded_verses as "groundedVerses", created_at as "createdAt"
     FROM chat_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC
     LIMIT $2;`,
    [conversationId, limit]
  );
  return res.rows.map(mapChatMessage);
}

module.exports = {
  createConversation,
  getConversation,
  saveMessage,
  getMessages
};

