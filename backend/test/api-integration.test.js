const test = require("node:test");
const assert = require("node:assert/strict");
const { assessSafety } = require("../services/safetyService");
const { searchGitaRag } = require("../services/ragService");
const { handleChatMessage } = require("../services/chatService");
const { fuseEmotion } = require("../services/fusionService");

test("RAG semantic search returns relevant Bhagavad Gita shlokas", async () => {
  const results = await searchGitaRag({
    query: "feeling anxious about the results and fruits of my work",
    emotion: "anxiety",
    topK: 2
  });

  assert.equal(Array.isArray(results), true);
  assert.equal(results.length >= 1, true);
  assert.equal(typeof results[0].meaning, "string");
  assert.equal(typeof results[0].sanskrit, "string");
});

test("Multimodal fusion combines text and face probabilities", () => {
  const textPred = {
    emotion: "anxiety",
    confidence: 0.8,
    probabilities: { anxiety: 0.8, neutral: 0.2 }
  };
  const facePred = {
    face_detected: true,
    emotion: "fear",
    confidence: 0.6,
    probabilities: { fear: 0.6, anxiety: 0.4 }
  };

  const fused = fuseEmotion({
    textPrediction: textPred,
    facePrediction: facePred,
    weights: { text: 0.6, face: 0.4 }
  });

  assert.equal(fused.fusion_method, "weighted_late_fusion");
  assert.equal(Boolean(fused.probabilities.anxiety), true);
  assert.equal(Boolean(fused.probabilities.fear), true);
  assert.equal(fused.confidence > 0, true);
});

test("Chat service produces grounded empathetic counsel with citations", async () => {
  const result = await handleChatMessage({
    message: "I am feeling so stressed and tired with my obligations."
  });

  assert.equal(typeof result.reply, "string");
  assert.equal(result.reply.length > 20, true);
  assert.equal(result.safety.isHighRisk, false);
});

test("Safety service detects crisis phrases and routes to immediate support", async () => {
  const result = await handleChatMessage({
    message: "I cannot go on, I want to end my life."
  });

  assert.equal(result.safety.isHighRisk, true);
  assert.equal(result.reply.includes("988") || result.reply.includes("help"), true);
});

test("Chat service handles multi-turn follow-up requesting explanation in simple way", async () => {
  // First turn: User shares dilemma
  const turn1 = await handleChatMessage({
    message: "I am feeling overwhelmed by anxiety about my exam results."
  });

  assert.equal(typeof turn1.conversationId, "string");
  assert.equal(turn1.grounded_verses.length > 0, true);

  // Second turn: User asks to explain in a simple way
  const turn2 = await handleChatMessage({
    conversationId: turn1.conversationId,
    message: "can you explain this in a simple way?"
  });

  assert.equal(typeof turn2.reply, "string");
  assert.equal(turn2.reply.includes("Core Meaning") || turn2.reply.includes("everyday terms"), true);
  // Grounded verses should be retained from previous turn
  assert.equal(turn2.grounded_verses.length > 0, true);
});

