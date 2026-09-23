const {
  listJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry
} = require("../services/journalService");

function handleJournalError(res, error) {
  res.status(error.statusCode || 500).json({
    error: {
      code: error.statusCode === 404 ? "NOT_FOUND" : "JOURNAL_ERROR",
      message: error.message || "Journal operation failed."
    }
  });
}

async function list(req, res) {
  try {
    const entries = await listJournalEntries(req.user.id);
    res.json({ entries });
  } catch (error) {
    handleJournalError(res, error);
  }
}

async function create(req, res) {
  try {
    const entry = await createJournalEntry(req.user.id, req.body || {});
    res.status(201).json({ entry });
  } catch (error) {
    handleJournalError(res, error);
  }
}

async function update(req, res) {
  try {
    const entry = await updateJournalEntry(req.user.id, req.params.id, req.body || {});
    res.json({ entry });
  } catch (error) {
    handleJournalError(res, error);
  }
}

async function remove(req, res) {
  try {
    await deleteJournalEntry(req.user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    handleJournalError(res, error);
  }
}

module.exports = { list, create, update, remove };
