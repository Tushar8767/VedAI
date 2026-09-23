const { query } = require("../database/db");
const crypto = require("crypto");

async function findByEmail(email) {
  const res = await query(
    "SELECT id, name, email, role, password_salt, password_hash, preferences, created_at, updated_at FROM users WHERE email = $1 LIMIT 1;",
    [email.toLowerCase().trim()]
  );
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    passwordSalt: row.password_salt,
    passwordHash: row.password_hash,
    preferences: row.preferences,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function findById(id) {
  const res = await query(
    "SELECT id, name, email, role, password_salt, password_hash, preferences, created_at, updated_at FROM users WHERE id = $1 LIMIT 1;",
    [id]
  );
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    passwordSalt: row.password_salt,
    passwordHash: row.password_hash,
    preferences: row.preferences,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function createUser({ name, email, passwordSalt, passwordHash, preferences = { cameraAnalysis: false } }) {
  const id = `user_${crypto.randomUUID()}`;
  const res = await query(
    `INSERT INTO users (id, name, email, role, password_salt, password_hash, preferences)
     VALUES ($1, $2, $3, 'user', $4, $5, $6)
     RETURNING id, name, email, role, preferences, created_at, updated_at;`,
    [id, name.trim(), email.toLowerCase().trim(), passwordSalt, passwordHash, JSON.stringify(preferences)]
  );
  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    preferences: row.preferences,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function updatePassword(id, passwordSalt, passwordHash) {
  const res = await query(
    "UPDATE users SET password_salt = $1, password_hash = $2, updated_at = NOW() WHERE id = $3 RETURNING id;",
    [passwordSalt, passwordHash, id]
  );
  return res.rows[0] || null;
}

async function deleteUser(id) {
  const res = await query("DELETE FROM users WHERE id = $1 RETURNING id;", [id]);
  return res.rows[0] || null;
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  updatePassword,
  deleteUser
};
