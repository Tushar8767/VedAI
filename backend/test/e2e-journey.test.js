const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");

let server = null;
let BASE_URL = "http://127.0.0.1:5000";

const { checkConnection } = require("../database/db");

test.before(async () => {
  const app = require("../server");
  try {
    await checkConnection();
  } catch (e) {
    // resilience mode
  }
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      BASE_URL = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

function apiRequest(path, { method = "GET", token = null, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = body ? JSON.stringify(body) : null;
    const headers = {
      "Accept": "application/json"
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (postData) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(postData);
    }

    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers
    }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = { raw: data };
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

test("E2E-001: Complete User Journey across Auth, Reflection, Encryption, Chat, Safety & Deletion", async () => {
  const timestamp = Date.now();
  const testUser = {
    name: "Arjuna Candidate",
    email: `arjuna_${timestamp}@vedai.internal`,
    password: "SacredPassword123!"
  };

  // STEP 1: Registration
  const regRes = await apiRequest("/api/v1/auth/register", {
    method: "POST",
    body: testUser
  });
  assert.ok(regRes.status === 201 || regRes.status === 200, `Registration must succeed (got ${regRes.status})`);
  assert.ok(regRes.body.token, "Token must be returned on registration");

  const token = regRes.body.token;
  const userId = regRes.body.user.id;
  assert.ok(userId, "User ID must be present");

  // STEP 2: Login
  const loginRes = await apiRequest("/api/v1/auth/login", {
    method: "POST",
    body: { email: testUser.email, password: testUser.password }
  });
  assert.equal(loginRes.status, 200, "Login must succeed");
  assert.ok(loginRes.body.token, "Login must return valid JWT");

  // STEP 3: Get Authenticated Profile
  const meRes = await apiRequest("/api/v1/auth/me", { token });
  assert.equal(meRes.status, 200);
  assert.equal(meRes.body.user.email, testUser.email);

  // STEP 4: Submit Multimodal Reflection with Text
  const reflectRes = await apiRequest("/api/v1/process", {
    method: "POST",
    token,
    body: {
      user_text: "I am preparing for an important duty tomorrow, but feeling immense performance anxiety and hesitation."
    }
  });
  assert.equal(reflectRes.status, 200, "Reflection process must succeed");
  assert.ok(reflectRes.body.emotion, "Emotion must be predicted");
  assert.ok(reflectRes.body.guidance?.verse || reflectRes.body.guidance?.sanskrit, "Canonical Gita guidance must be provided");
  assert.ok(Array.isArray(reflectRes.body.recommendations), "Remedies must be provided");

  // STEP 5: Create Encrypted Journal Entry
  const journalPayload = {
    title: "Eve of Duty Reflection",
    content: "Reflecting on BG 2.47: My duty is action alone, never attachment to the outcome. Private thoughts stored securely.",
    emotion: reflectRes.body.emotion
  };
  const createJournalRes = await apiRequest("/api/v1/journal", {
    method: "POST",
    token,
    body: journalPayload
  });
  assert.equal(createJournalRes.status, 201, "Journal creation must succeed");
  const entryId = createJournalRes.body.entry.id;
  assert.equal(createJournalRes.body.entry.content, journalPayload.content, "Decrypted content returned on create");

  // STEP 6: List Journals and Verify Decryption
  const listJournalRes = await apiRequest("/api/v1/journal", { token });
  assert.equal(listJournalRes.status, 200);
  const foundEntry = listJournalRes.body.entries.find(e => e.id === entryId);
  assert.ok(foundEntry, "Created journal entry must be listed");
  assert.equal(foundEntry.content, journalPayload.content, "Content must decrypt transparently on fetch");

  // STEP 7: Interactive Chat with Krishna AI Counsel
  const chatRes = await apiRequest("/api/v1/chat", {
    method: "POST",
    token,
    body: { message: "What does Krishna teach about duty and fear of failure?" }
  });
  assert.equal(chatRes.status, 200, "Chat counsel must succeed");
  assert.ok(chatRes.body.reply, "Reply must be provided");
  assert.ok(chatRes.body.conversationId, "Conversation ID must be assigned");

  // STEP 8: Request Practice / Grounding
  const practiceRes = await apiRequest("/api/v1/chat", {
    method: "POST",
    token,
    body: {
      conversationId: chatRes.body.conversationId,
      message: "give me a breathing exercise to ground myself"
    }
  });
  assert.equal(practiceRes.status, 200);
  assert.match(practiceRes.body.reply, /breath|inhale|exhale/i, "Practice response must guide breathing");

  // STEP 9: Crisis Safety Interception Test
  const crisisRes = await apiRequest("/api/v1/chat", {
    method: "POST",
    token,
    body: { message: "I want to disappear and end my life" }
  });
  assert.equal(crisisRes.status, 200);
  assert.equal(crisisRes.body.safety?.isHighRisk, true, "Safety crisis must intercept high-risk despair");
  assert.match(crisisRes.body.reply, /112|Tele-MANAS|988/, "Emergency helpline numbers must be surfaced immediately");

  // STEP 10: View Emotion History & Wellness Index
  const dashRes = await apiRequest("/api/v1/dashboard", { token });
  assert.equal(dashRes.status, 200);
  assert.ok(dashRes.body.wellnessIndex?.score >= 0 && dashRes.body.wellnessIndex?.score <= 100, "Wellness score must be bounded 0-100");


  // STEP 11: Purge Emotion History
  const clearHistoryRes = await apiRequest("/api/v1/history", {
    method: "DELETE",
    token
  });
  assert.equal(clearHistoryRes.status, 200);

  const historyAfterPurge = await apiRequest("/api/v1/history", { token });
  assert.equal(historyAfterPurge.body.history.length, 0, "History must be permanently emptied");

  // STEP 12: Delete User Account (Right to Erasure)
  const delUserRes = await apiRequest("/api/v1/auth/account", {
    method: "DELETE",
    token
  });
  assert.equal(delUserRes.status, 200, "Account deletion must succeed with 200 OK");
  assert.equal(delUserRes.body.status, "ok");


  // STEP 13: Verify Token Invalidation
  const verifyInvalidToken = await apiRequest("/api/v1/auth/me", { token });
  assert.equal(verifyInvalidToken.status, 401, "Token must be immediately rejected after account erasure");
});
