const {
  readDatabase,
  writeDatabase,
  createId,
  nowIso
} = require("./databaseService");
const journalRepository = require("../repositories/journalRepository");
const { isConnected } = require("../database/db");

async function listJournalEntries(userId, { limit = 50, offset = 0 } = {}) {
  if (isConnected()) {
    try {
      return await journalRepository.listJournalEntries(userId, { limit, offset });
    } catch (err) {
      console.warn("PostgreSQL listJournalEntries fallback to file:", err.message);
    }
  }

  const db = readDatabase();
  return db.journalEntries
    .filter((entry) => entry.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(offset, offset + limit);
}

function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

async function createJournalEntry(userId, payload) {
  const content = String(payload.content || "").trim();

  if (!content) {
    const error = new Error("Journal content is required.");
    error.statusCode = 400;
    throw error;
  }

  const title = String(payload.title || "Untitled reflection").trim();
  const emotion = payload.emotion || null;

  const sanitizedTitle = escapeHtml(title);
  const sanitizedContent = escapeHtml(content);

  if (isConnected()) {
    try {
      return await journalRepository.createJournalEntry(userId, {
        title: sanitizedTitle,
        content: sanitizedContent,
        emotion
      });
    } catch (err) {
      console.warn("PostgreSQL createJournalEntry fallback to file:", err.message);
    }
  }

  const db = readDatabase();
  const entry = {
    id: createId("journal"),
    userId,
    title: sanitizedTitle,
    content: sanitizedContent,
    emotion,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  db.journalEntries.push(entry);
  writeDatabase(db);
  return entry;
}

async function updateJournalEntry(userId, entryId, payload) {
  if (payload.content !== undefined && !String(payload.content).trim()) {
    const error = new Error("Journal content is required.");
    error.statusCode = 400;
    throw error;
  }

  const sanitizedPayload = { ...payload };
  if (payload.title !== undefined) {
    sanitizedPayload.title = escapeHtml(String(payload.title || "Untitled reflection").trim());
  }
  if (payload.content !== undefined) {
    sanitizedPayload.content = escapeHtml(String(payload.content).trim());
  }

  if (isConnected()) {
    try {
      const updated = await journalRepository.updateJournalEntry(userId, entryId, sanitizedPayload);
      if (!updated) {
        const error = new Error("Journal entry was not found.");
        error.statusCode = 404;
        throw error;
      }
      return updated;
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn("PostgreSQL updateJournalEntry fallback to file:", err.message);
    }
  }

  const db = readDatabase();
  const entry = db.journalEntries.find((item) => item.id === entryId && item.userId === userId);

  if (!entry) {
    const error = new Error("Journal entry was not found.");
    error.statusCode = 404;
    throw error;
  }

  if (sanitizedPayload.title !== undefined) {
    entry.title = sanitizedPayload.title;
  }

  if (sanitizedPayload.content !== undefined) {
    entry.content = sanitizedPayload.content;
  }

  if (sanitizedPayload.emotion !== undefined) {
    entry.emotion = sanitizedPayload.emotion || null;
  }

  entry.updatedAt = nowIso();
  writeDatabase(db);
  return entry;
}

async function deleteJournalEntry(userId, entryId) {
  if (isConnected()) {
    try {
      const ok = await journalRepository.deleteJournalEntry(userId, entryId);
      if (!ok) {
        const error = new Error("Journal entry was not found.");
        error.statusCode = 404;
        throw error;
      }
      return;
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn("PostgreSQL deleteJournalEntry fallback to file:", err.message);
    }
  }

  const db = readDatabase();
  const beforeCount = db.journalEntries.length;
  db.journalEntries = db.journalEntries.filter((item) => !(item.id === entryId && item.userId === userId));

  if (db.journalEntries.length === beforeCount) {
    const error = new Error("Journal entry was not found.");
    error.statusCode = 404;
    throw error;
  }

  writeDatabase(db);
}

module.exports = {
  listJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry
};
