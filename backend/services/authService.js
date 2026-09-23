const crypto = require("crypto");
const {
  readDatabase,
  writeDatabase,
  createId,
  nowIso,
  withoutSensitiveUserFields
} = require("./databaseService");
const userRepository = require("../repositories/userRepository");
const { isConnected } = require("../database/db");

const TOKEN_SECRET = process.env.JWT_SECRET || "vedai-development-secret-change-me";
const TOKEN_TTL_SECONDS = Number(process.env.JWT_TTL_SECONDS || 60 * 60 * 24 * 7);

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return { salt, hash };
}

function verifyPassword(password, user) {
  const salt = user.passwordSalt || user.password_salt;
  const expectedHash = user.passwordHash || user.password_hash;
  if (!salt || !expectedHash) return false;
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
}

function base64Url(input) {
  return Buffer.from(JSON.stringify(input)).toString("base64url");
}

function sign(value) {
  return crypto.createHmac("sha256", TOKEN_SECRET).update(value).digest("base64url");
}

function createToken(user) {
  const header = base64Url({ alg: "HS256", typ: "JWT" });
  const payload = base64Url({
    sub: user.id,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
  });
  const signature = sign(`${header}.${payload}`);

  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  const parts = String(token || "").split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [header, payload, signature] = parts;
  const expected = sign(`${header}.${payload}`);

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

    if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return claims;
  } catch (err) {
    return null;
  }
}

async function registerUser({ name, email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const displayName = String(name || "").trim();

  if (!displayName || !normalizedEmail || !password) {
    const error = new Error("Name, email, and password are required.");
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 8) {
    const error = new Error("Password must be at least 8 characters.");
    error.statusCode = 400;
    throw error;
  }

  const { salt, hash } = hashPassword(password);

  if (isConnected()) {
    try {
      const existing = await userRepository.findByEmail(normalizedEmail);
      if (existing) {
        const error = new Error("An account with this email already exists.");
        error.statusCode = 409;
        throw error;
      }

      const user = await userRepository.createUser({
        name: displayName,
        email: normalizedEmail,
        passwordSalt: salt,
        passwordHash: hash
      });

      return {
        user: withoutSensitiveUserFields(user),
        token: createToken(user)
      };
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn("PostgreSQL user creation fallback to local file:", err.message);
    }
  }

  // Local file fallback
  const db = readDatabase();
  const existingUser = db.users.find((user) => user.email === normalizedEmail);

  if (existingUser) {
    const error = new Error("An account with this email already exists.");
    error.statusCode = 409;
    throw error;
  }

  const user = {
    id: createId("user"),
    name: displayName,
    email: normalizedEmail,
    role: "user",
    preferences: {
      cameraAnalysis: false
    },
    passwordSalt: salt,
    passwordHash: hash,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  db.users.push(user);
  writeDatabase(db);

  return {
    user: withoutSensitiveUserFields(user),
    token: createToken(user)
  };
}

async function loginUser({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (isConnected()) {
    try {
      const user = await userRepository.findByEmail(normalizedEmail);
      if (user && verifyPassword(String(password || ""), user)) {
        return {
          user: withoutSensitiveUserFields(user),
          token: createToken(user)
        };
      }
    } catch (err) {
      console.warn("PostgreSQL login fallback to local file:", err.message);
    }
  }

  const db = readDatabase();
  const user = db.users.find((item) => item.email === normalizedEmail);

  if (!user || !verifyPassword(String(password || ""), user)) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  return {
    user: withoutSensitiveUserFields(user),
    token: createToken(user)
  };
}

async function getUserById(userId) {
  if (!userId) return null;

  if (isConnected()) {
    try {
      const user = await userRepository.findById(userId);
      if (user) return withoutSensitiveUserFields(user);
    } catch (err) {
      // Fallback
    }
  }

  const db = readDatabase();
  const user = db.users.find((item) => item.id === userId);
  return withoutSensitiveUserFields(user);
}

async function deleteUserAccount(userId) {
  if (!userId) return false;

  if (isConnected()) {
    try {
      await userRepository.deleteUser(userId);
      return true;
    } catch (err) {
      console.warn("PostgreSQL user deletion fallback to local file:", err.message);
    }
  }

  const db = readDatabase();
  db.users = (db.users || []).filter((u) => u.id !== userId);
  db.emotionHistory = (db.emotionHistory || []).filter((h) => h.userId !== userId);
  db.journalEntries = (db.journalEntries || []).filter((j) => j.userId !== userId);
  writeDatabase(db);
  return true;
}

const resetTokens = new Map();

async function requestPasswordReset(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    const error = new Error("Email is required.");
    error.statusCode = 400;
    throw error;
  }

  let user = null;
  if (isConnected()) {
    try {
      user = await userRepository.findByEmail(normalizedEmail);
    } catch (err) {
      console.warn("PostgreSQL user lookup fallback to local file:", err.message);
    }
  }

  if (!user) {
    const db = readDatabase();
    user = (db.users || []).find((u) => u.email === normalizedEmail);
  }

  if (!user) {
    return {
      message: "If an account with that email exists, reset instructions have been generated."
    };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 15 * 60 * 1000;

  resetTokens.set(token, {
    userId: user.id,
    email: user.email,
    expiresAt,
    used: false
  });

  return {
    message: "If an account with that email exists, reset instructions have been generated.",
    resetToken: token
  };
}

async function resetPassword({ token, newPassword }) {
  if (!token || typeof token !== "string") {
    const error = new Error("Reset token is required.");
    error.statusCode = 400;
    throw error;
  }

  const tokenData = resetTokens.get(token);
  if (!tokenData || tokenData.used || tokenData.expiresAt < Date.now()) {
    const error = new Error("Invalid or expired reset token.");
    error.statusCode = 400;
    throw error;
  }

  if (!newPassword || String(newPassword).length < 8) {
    const error = new Error("Password must be at least 8 characters.");
    error.statusCode = 400;
    throw error;
  }

  const { salt, hash } = hashPassword(newPassword);

  if (isConnected()) {
    try {
      await userRepository.updatePassword(tokenData.userId, salt, hash);
    } catch (err) {
      console.warn("PostgreSQL updatePassword fallback to local file:", err.message);
    }
  }

  const db = readDatabase();
  const fileUser = (db.users || []).find((u) => u.id === tokenData.userId);
  if (fileUser) {
    fileUser.passwordSalt = salt;
    fileUser.passwordHash = hash;
    fileUser.updatedAt = nowIso();
    writeDatabase(db);
  }

  tokenData.used = true;
  resetTokens.delete(token);

  return {
    status: "ok",
    message: "Password has been successfully reset."
  };
}

async function changePassword({ userId, currentPassword, newPassword }) {
  if (!userId || !currentPassword || !newPassword) {
    const error = new Error("User ID, current password, and new password are required.");
    error.statusCode = 400;
    throw error;
  }

  if (String(newPassword).length < 8) {
    const error = new Error("New password must be at least 8 characters.");
    error.statusCode = 400;
    throw error;
  }

  let user = null;
  if (isConnected()) {
    try {
      user = await userRepository.findById(userId);
    } catch (err) {
      console.warn("PostgreSQL findById fallback to local file:", err.message);
    }
  }

  if (!user) {
    const db = readDatabase();
    user = (db.users || []).find((u) => u.id === userId);
  }

  if (!user || !verifyPassword(currentPassword, user)) {
    const error = new Error("Current password is incorrect.");
    error.statusCode = 401;
    throw error;
  }

  const { salt, hash } = hashPassword(newPassword);

  if (isConnected()) {
    try {
      await userRepository.updatePassword(userId, salt, hash);
    } catch (err) {
      console.warn("PostgreSQL updatePassword fallback to local file:", err.message);
    }
  }

  const db = readDatabase();
  const fileUser = (db.users || []).find((u) => u.id === userId);
  if (fileUser) {
    fileUser.passwordSalt = salt;
    fileUser.passwordHash = hash;
    fileUser.updatedAt = nowIso();
    writeDatabase(db);
  }

  return {
    status: "ok",
    message: "Password updated successfully."
  };
}

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  deleteUserAccount,
  requestPasswordReset,
  resetPassword,
  changePassword,
  verifyToken,
  createToken,
  hashPassword,
  verifyPassword
};

