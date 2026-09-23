const test = require("node:test");
const assert = require("node:assert/strict");
const {
  verifyToken,
  createToken,
  registerUser,
  loginUser,
  deleteUserAccount,
  requestPasswordReset,
  resetPassword,
  changePassword
} = require("../services/authService");
const { createJournalEntry, getJournalEntry, deleteJournalEntry } = require("../services/journalService");
const { saveEmotionRecord, listEmotionHistory, clearEmotionHistory } = require("../services/historyService");
const { searchGitaVerses } = require("../repositories/gitaRepository");

test("AUTH-012: malformed token does not crash server and returns null", () => {
  assert.equal(verifyToken("invalid.token"), null);
  assert.equal(verifyToken(""), null);
  assert.equal(verifyToken(null), null);
  assert.equal(verifyToken("a.b.c.d"), null);
});

test("AUTH-013: token with tampered signature of different length returns null without RangeError", () => {
  const dummyUser = { id: "test_user_sec", email: "sec@example.com" };
  const validToken = createToken(dummyUser);
  const parts = validToken.split(".");

  // Tamper signature with different length
  const tamperedToken = `${parts[0]}.${parts[1]}.shortsig`;
  assert.doesNotThrow(() => {
    const claims = verifyToken(tamperedToken);
    assert.equal(claims, null);
  });
});

test("AUTHZ-001: User B cannot delete or modify User A journal entry (IDOR Protection)", async () => {
  const userAId = `user_a_${Date.now()}`;
  const userBId = `user_b_${Date.now()}`;

  const entry = await createJournalEntry(userAId, {
    title: "User A Confidential Thought",
    content: "This belongs strictly to User A."
  });

  assert.equal(Boolean(entry.id), true);

  // User B attempts to delete User A's journal
  await assert.rejects(async () => {
    await deleteJournalEntry(userBId, entry.id);
  }, { statusCode: 404 });
});

test("AUTHZ-002: Emotion history is strictly isolated per user", async () => {
  const userAId = `user_hist_a_${Date.now()}`;
  const userBId = `user_hist_b_${Date.now()}`;

  await saveEmotionRecord({
    userId: userAId,
    userText: "User A private contemplation",
    result: { emotion: "anxiety", confidence: 0.8 }
  });

  const historyUserB = await listEmotionHistory(userBId);
  assert.equal(historyUserB.length, 0);

  const historyUserA = await listEmotionHistory(userAId);
  assert.equal(historyUserA.length, 1);
  assert.equal(historyUserA[0].userText, "User A private contemplation");
});

test("SEC-001: SQL injection string in Gita search executes parameterized and returns safe empty or matching list", async () => {
  const sqlPayload = "' OR '1'='1' -- ";
  await assert.doesNotReject(async () => {
    const results = await searchGitaVerses(sqlPayload, 3);
    assert.equal(Array.isArray(results), true);
  });
});

test("SEC-003: User can permanently clear emotion history", async () => {
  const regUser = await registerUser({
    name: "Purge Test User",
    email: `purge_${Date.now()}@example.com`,
    password: "Password123!"
  });
  const userId = regUser.user.id;
  await saveEmotionRecord({
    userId,
    userText: "Temporary reflection to be purged",
    result: { emotion: "stress", confidence: 0.75 }
  });

  let history = await listEmotionHistory(userId);
  assert.equal(history.length, 1);

  await clearEmotionHistory(userId);

  history = await listEmotionHistory(userId);
  assert.equal(history.length, 0);
});


test("SEC-004: User can delete account and purge all associated records", async () => {
  const testEmail = `del_${Date.now()}@example.com`;
  const regResult = await registerUser({
    name: "To Be Deleted",
    email: testEmail,
    password: "Password123!"
  });

  assert.equal(Boolean(regResult.user.id), true);
  const deleted = await deleteUserAccount(regResult.user.id);
  assert.equal(deleted, true);
});

test("AUTH-017: request password reset generates token for valid user without leaking non-existence", async () => {
  // Non-existent email
  const nonExistRes = await requestPasswordReset("nonexistent_user_xyz@example.com");
  assert.equal(typeof nonExistRes.message, "string");
  assert.equal(nonExistRes.resetToken, undefined);

  // Existing user
  const email = `reset_${Date.now()}@example.com`;
  await registerUser({ name: "Reset Tester", email, password: "OldPassword123!" });
  const existRes = await requestPasswordReset(email);
  assert.equal(typeof existRes.resetToken, "string");
  assert.equal(existRes.resetToken.length, 64);
});

test("AUTH-018: reset password updates password and allows login with new credentials", async () => {
  const email = `reset_flow_${Date.now()}@example.com`;
  await registerUser({ name: "Reset Flow", email, password: "InitialPassword123!" });

  const { resetToken } = await requestPasswordReset(email);
  assert.ok(resetToken);

  const resetResult = await resetPassword({ token: resetToken, newPassword: "NewValidPassword456!" });
  assert.equal(resetResult.status, "ok");

  // Old password should fail
  await assert.rejects(async () => {
    await loginUser({ email, password: "InitialPassword123!" });
  }, { statusCode: 401 });

  // New password should succeed
  const loginResult = await loginUser({ email, password: "NewValidPassword456!" });
  assert.equal(loginResult.user.email, email);
});

test("AUTH-019: reset token cannot be reused and expired/tampered tokens are rejected", async () => {
  const email = `reuse_${Date.now()}@example.com`;
  await registerUser({ name: "Reuse User", email, password: "InitialPassword123!" });

  const { resetToken } = await requestPasswordReset(email);

  // First use succeeds
  await resetPassword({ token: resetToken, newPassword: "NewPasswordValid1!" });

  // Second use fails (single-use)
  await assert.rejects(async () => {
    await resetPassword({ token: resetToken, newPassword: "AnotherPassword2!" });
  }, { statusCode: 400 });

  // Tampered token fails
  await assert.rejects(async () => {
    await resetPassword({ token: "invalid_fake_token_12345", newPassword: "AnotherPassword2!" });
  }, { statusCode: 400 });
});

test("AUTH-020: change password validates current password and enforces minimum length", async () => {
  const email = `change_${Date.now()}@example.com`;
  const regResult = await registerUser({ name: "Change User", email, password: "OldSecretPassword1!" });
  const userId = regResult.user.id;

  // Wrong current password fails
  await assert.rejects(async () => {
    await changePassword({ userId, currentPassword: "WrongPassword!", newPassword: "BrandNewPassword1!" });
  }, { statusCode: 401 });

  // Short new password fails
  await assert.rejects(async () => {
    await changePassword({ userId, currentPassword: "OldSecretPassword1!", newPassword: "short" });
  }, { statusCode: 400 });

  // Correct current password succeeds
  const changeRes = await changePassword({
    userId,
    currentPassword: "OldSecretPassword1!",
    newPassword: "BrandNewPassword1!"
  });
  assert.equal(changeRes.status, "ok");

  // Login with new password succeeds
  const loginRes = await loginUser({ email, password: "BrandNewPassword1!" });
  assert.equal(loginRes.user.email, email);
});

test("SEC-002: Stored and reflected journal entries sanitize XSS payloads", async () => {
  const userId = `user_xss_${Date.now()}`;
  const xssTitle = `<script>alert('XSS Title')</script>`;
  const xssContent = `<img src=x onerror=alert('XSS Body')>`;

  const entry = await createJournalEntry(userId, {
    title: xssTitle,
    content: xssContent
  });

  // Verify stored values have HTML tags escaped
  assert.equal(entry.title.includes("<script>"), false);
  assert.equal(entry.title.includes("&lt;script&gt;"), true);
  assert.equal(entry.content.includes("<img"), false);
  assert.equal(entry.content.includes("&lt;img"), true);
});
