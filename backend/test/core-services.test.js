const test = require("node:test");
const assert = require("node:assert/strict");

const { normalizeProbabilities } = require("../services/emotionService");
const { fuseEmotion } = require("../services/fusionService");
const { assessSafety } = require("../services/safetyService");
const { getGitaGuidance } = require("../services/gitaService");
const { resetDatabase } = require("../services/databaseService");
const { registerUser, loginUser } = require("../services/authService");
const { saveEmotionRecord, listEmotionHistory, calculateWellnessIndex } = require("../services/historyService");
const { createJournalEntry, listJournalEntries } = require("../services/journalService");

test("normalizes probabilities to approximately 1", () => {
  const probabilities = normalizeProbabilities({ anxiety: 2, neutral: 1 });
  const total = Object.values(probabilities).reduce((sum, value) => sum + value, 0);

  assert.equal(Math.round(total * 1000) / 1000, 1);
  assert.equal(probabilities.anxiety > probabilities.neutral, true);
});

test("uses text-only fusion when no facial prediction is supplied", () => {
  const result = fuseEmotion({
    textPrediction: {
      confidence: 0.7,
      probabilities: {
        anxiety: 0.7,
        neutral: 0.3
      }
    }
  });

  assert.equal(result.final_emotion, "anxiety");
  assert.equal(result.fusion_method, "text_only");
});

test("preserves low confidence for fallback text-only fusion", () => {
  const result = fuseEmotion({
    textPrediction: {
      emotion: "neutral",
      confidence: 0,
      probabilities: {
        neutral: 1
      },
      warning: "fallback"
    }
  });

  assert.equal(result.final_emotion, "neutral");
  assert.equal(result.confidence, 0);
});

test("detects high-risk self-harm language", () => {
  const result = assessSafety("I feel like I might hurt myself tonight");

  assert.equal(result.isHighRisk, true);
  assert.equal(result.riskLevel, "high");
});

test("returns neutral Gita guidance for unknown emotion", async () => {
  const guidance = await getGitaGuidance("unknown-emotion");

  assert.equal(typeof guidance.meaning, "string");
  assert.equal(Boolean(guidance.meaning), true);
});

test("registers and logs in a user without exposing password fields", async () => {
  resetDatabase();

  const registration = await registerUser({
    name: "Test User",
    email: "test@example.com",
    password: "password123"
  });
  const login = await loginUser({
    email: "test@example.com",
    password: "password123"
  });

  assert.equal(registration.user.email, "test@example.com");
  assert.equal(Boolean(registration.token), true);
  assert.equal(Boolean(login.token), true);
  assert.equal(Object.hasOwn(registration.user, "passwordHash"), false);
});

test("persists emotion history and journal entries for dashboard data", async () => {
  resetDatabase();
  const { user } = await registerUser({
    name: "Dashboard User",
    email: "dashboard@example.com",
    password: "password123"
  });

  await saveEmotionRecord({
    userId: user.id,
    userText: "I feel steady today",
    result: {
      emotion: "neutral",
      confidence: 0.8,
      probabilities: { neutral: 0.8, anxiety: 0.2 },
      guidance: { meaning: "Remain steady." },
      recommendations: [{ title: "Reflect", description: "Pause briefly." }],
      safety: { isHighRisk: false }
    }
  });
  await createJournalEntry(user.id, { title: "Morning", content: "A short reflection." });

  const history = await listEmotionHistory(user.id);
  const journalEntries = await listJournalEntries(user.id);
  const wellness = calculateWellnessIndex({ history, journalEntries });

  assert.equal(history.length >= 1, true);
  assert.equal(journalEntries.length >= 1, true);
  assert.equal(wellness.score > 50, true);
});
