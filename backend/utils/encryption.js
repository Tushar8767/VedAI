const crypto = require("crypto");

// 32-byte master key derived from ENCRYPTION_KEY or JWT_SECRET
const MASTER_SECRET = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || "vedai-default-encryption-secret-2026";
const KEY = crypto.createHash("sha256").update(MASTER_SECRET).digest();
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits standard for AES-GCM
const PREFIX = "enc:v1:";

/**
 * Encrypt plaintext string using AES-256-GCM.
 * @param {string} text - Plaintext to encrypt
 * @returns {string} Encrypted string format: enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>
 */
function encrypt(text) {
  if (text === null || text === undefined) return text;
  if (typeof text !== "string") {
    text = JSON.stringify(text);
  }
  if (text.startsWith(PREFIX)) {
    // Already encrypted
    return text;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${PREFIX}${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt ciphertext string formatted with enc:v1:
 * Transparently returns plaintext if input is not encrypted.
 * @param {string} cipherText - Formatted ciphertext or legacy plaintext
 * @returns {string} Decrypted plaintext
 */
function decrypt(cipherText) {
  if (!cipherText || typeof cipherText !== "string") {
    return cipherText;
  }

  if (!cipherText.startsWith(PREFIX)) {
    // Backward compatibility for existing plaintext records
    return cipherText;
  }

  try {
    const parts = cipherText.slice(PREFIX.length).split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid ciphertext structure");
    }

    const [ivHex, tagHex, dataHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(dataHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    console.error("Decryption failed:", err.message);
    return cipherText; // Return original on tampering or key mismatch
  }
}

/**
 * Check if a string is encrypted with enc:v1:
 */
function isEncrypted(value) {
  return typeof value === "string" && value.startsWith(PREFIX);
}

module.exports = {
  encrypt,
  decrypt,
  isEncrypted,
  ALGORITHM
};
