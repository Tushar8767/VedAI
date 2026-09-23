const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const dataDir = path.join(__dirname, "../data");
const dbPath = path.join(dataDir, "vedai-db.json");

const initialState = {
  users: [],
  emotionHistory: [],
  journalEntries: []
};

function ensureDatabase() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(initialState, null, 2));
  }
}

function readDatabase() {
  ensureDatabase();
  const raw = fs.readFileSync(dbPath, "utf8");
  return {
    ...initialState,
    ...JSON.parse(raw)
  };
}

function writeDatabase(data) {
  ensureDatabase();
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function resetDatabase() {
  writeDatabase(initialState);
}

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function nowIso() {
  return new Date().toISOString();
}

function withoutSensitiveUserFields(user) {
  if (!user) {
    return null;
  }

  const { passwordHash, passwordSalt, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  readDatabase,
  writeDatabase,
  resetDatabase,
  createId,
  nowIso,
  withoutSensitiveUserFields,
  dbPath
};
