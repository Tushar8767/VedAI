const test = require("node:test");
const assert = require("node:assert/strict");
const { encrypt, decrypt, isEncrypted, ALGORITHM } = require("../utils/encryption");

test("ENC-001: Encrypts plaintext into authenticated AES-256-GCM format", () => {
  const plain = "I feel anxious about tomorrow's presentation.";
  const cipher = encrypt(plain);

  assert.equal(isEncrypted(cipher), true);
  assert.equal(cipher.startsWith("enc:v1:"), true);

  const parts = cipher.slice("enc:v1:".length).split(":");
  assert.equal(parts.length, 3, "Expected iv:authTag:ciphertext structure");
  assert.equal(parts[0].length, 24, "12-byte IV should be 24 hex characters");
  assert.equal(parts[1].length, 32, "16-byte Auth Tag should be 32 hex characters");
  assert.notEqual(parts[2], plain, "Plaintext must not be exposed");
});

test("ENC-002: Authenticated decryption recovers original plaintext", () => {
  const secretThoughts = "Reflecting on duty: my devotion should be steadfast, Bhagavad Gita 2.47.";
  const cipher = encrypt(secretThoughts);
  const decrypted = decrypt(cipher);

  assert.equal(decrypted, secretThoughts);
});

test("ENC-003: Randomized IV produces distinct ciphertexts for identical plaintext", () => {
  const message = "Repeated user reflection";
  const cipher1 = encrypt(message);
  const cipher2 = encrypt(message);

  assert.notEqual(cipher1, cipher2, "Ciphertexts must differ due to unique IV");
  assert.equal(decrypt(cipher1), message);
  assert.equal(decrypt(cipher2), message);
});

test("ENC-004: Tampered ciphertext or auth tag fails authenticated integrity check", () => {
  const original = "Sensitive personal disclosure";
  const cipher = encrypt(original);

  const parts = cipher.split(":");
  // Tamper with the encrypted payload (last part)
  const tamperedPayload = parts[parts.length - 1].slice(0, -2) + (parts[parts.length - 1].endsWith("aa") ? "bb" : "aa");
  parts[parts.length - 1] = tamperedPayload;
  const tamperedCipher = parts.join(":");

  // Decryption should detect tampering and fail gracefully
  const result = decrypt(tamperedCipher);
  assert.notEqual(result, original, "Tampered ciphertext must not decrypt to original plaintext");
});

test("ENC-005: Backward compatibility transparently preserves legacy unencrypted records", () => {
  const legacyPlaintext = "Legacy entry recorded before encryption migration.";
  assert.equal(isEncrypted(legacyPlaintext), false);
  assert.equal(decrypt(legacyPlaintext), legacyPlaintext);
  assert.equal(decrypt(null), null);
  assert.equal(decrypt(""), "");
});

test("ENC-006: Re-encrypting already encrypted payload does not double-encrypt", () => {
  const initial = "Single pass message";
  const cipher = encrypt(initial);
  const secondPass = encrypt(cipher);

  assert.equal(cipher, secondPass, "Should be idempotent on already encrypted strings");
  assert.equal(decrypt(secondPass), initial);
});
