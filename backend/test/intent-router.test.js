const test = require("node:test");
const assert = require("node:assert/strict");
const { routeIntent, INTENTS } = require("../services/intentRouter");
const { handleChatMessage } = require("../services/chatService");

test("TC-001: should route greeting 'hey' to GREETING without RAG", () => {
  const result = routeIntent("hey");
  assert.equal(result.intent, INTENTS.GREETING);
  assert.equal(result.requiresRag, false);
});

test("TC-002: should route 'hello VedAI' to GREETING", () => {
  const result = routeIntent("hello");
  assert.equal(result.intent, INTENTS.GREETING);
  assert.equal(result.requiresRag, false);
});

test("TC-004: should route 'good morning' to GREETING", () => {
  const result = routeIntent("good morning");
  assert.equal(result.intent, INTENTS.GREETING);
  assert.equal(result.requiresRag, false);
});

test("TC-010: should route 'I feel overwhelmed' to EMOTIONAL_DISTRESS with RAG", () => {
  const result = routeIntent("I feel overwhelmed with everything right now");
  assert.equal(result.intent, INTENTS.EMOTIONAL_DISTRESS);
  assert.equal(result.requiresRag, true);
});

test("TC-016: should route 'what should I do?' to PRACTICAL_GUIDANCE without premature RAG", () => {
  const result = routeIntent("what should I do?");
  assert.equal(result.intent, INTENTS.PRACTICAL_GUIDANCE);
  assert.equal(result.requiresRag, false);
});

test("TC-038: should route 'what does chapter 2 mean?' to GITA_QUERY with RAG", () => {
  const result = routeIntent("What does chapter 2 of Bhagavad Gita teach about duty?");
  assert.equal(result.intent, INTENTS.GITA_QUERY);
  assert.equal(result.requiresRag, true);
});

test("TC-057: should route 'give me a breathing exercise' to PRACTICE_REQUEST without RAG", () => {
  const result = routeIntent("give me a breathing exercise to calm down");
  assert.equal(result.intent, INTENTS.PRACTICE_REQUEST);
  assert.equal(result.requiresRag, false);
});

test("TC-073: should intercept crisis phrases as SAFETY_CRISIS", () => {
  const result = routeIntent("I don't want to live anymore, I feel suicidal");
  assert.equal(result.intent, INTENTS.SAFETY_CRISIS);
  assert.equal(result.safety.isHighRisk, true);
  assert.equal(result.requiresRag, false);
});

test("TC-078: should route 'what is python?' to OUT_OF_SCOPE", () => {
  const result = routeIntent("what is python coding language?");
  assert.equal(result.intent, INTENTS.OUT_OF_SCOPE);
  assert.equal(result.requiresRag, false);
});

test("should produce direct practical advice for 'what should I do?' with suggested actions", async () => {
  const response = await handleChatMessage({ message: "what should I do right now?" });
  assert.equal(typeof response.reply, "string");
  assert.equal(response.reply.includes("3-step") || response.reply.includes("action"), true);
  assert.equal(Array.isArray(response.suggestedActions), true);
  assert.equal(response.suggestedActions.length > 0, true);
});

test("should retain context when user follows up on exam stress with 'what should I do?'", async () => {
  const convId = `test_conv_${Date.now()}`;
  const turn1 = await handleChatMessage({
    conversationId: convId,
    message: "I am feeling so anxious and nervous about my exam tomorrow."
  });
  assert.equal(typeof turn1.reply, "string");

  const turn2 = await handleChatMessage({
    conversationId: convId,
    message: "what should I do?"
  });
  assert.equal(typeof turn2.reply, "string");
  assert.equal(turn2.reply.includes("academic") || turn2.reply.includes("career") || turn2.reply.includes("step"), true);
});
