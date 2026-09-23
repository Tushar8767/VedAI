const test = require("node:test");
const assert = require("node:assert/strict");
const { searchGitaRag } = require("../services/ragService");
const { handleChatMessage } = require("../services/chatService");
const { routeIntent, INTENTS } = require("../services/intentRouter");
const canonicalVerses = require("../data/canonicalGitaData.json");

test("RAG-001: Retrieved verses adhere to canonical schema and exist in canonical corpus", async () => {
  const results = await searchGitaRag({ query: "I feel anxious about future results and outcomes", emotion: "anxiety", topK: 3 });
  assert.ok(Array.isArray(results), "RAG search must return an array");
  assert.ok(results.length > 0, "Must return at least one verse");

  for (const verse of results) {
    assert.ok(verse.chapter > 0, "Must have valid chapter number");
    assert.ok(verse.verse_number > 0, "Must have valid verse number");
    assert.ok(typeof verse.sanskrit === "string" && verse.sanskrit.length > 5, "Must have valid Sanskrit text");
    assert.ok(typeof verse.meaning === "string" && verse.meaning.length > 10, "Must have valid English translation");

    // Grounding verification: verse must match a canonical verse in data
    const matched = canonicalVerses.some(
      (cv) => cv.chapter === verse.chapter && cv.verse_number === verse.verse_number
    );
    assert.ok(matched, `Verse ${verse.chapter}.${verse.verse_number} must exist in canonical dataset`);
  }
});

test("RAG-002: Query about duty and anxiety specifically grounds in Bhagavad Gita 2.47", async () => {
  const results = await searchGitaRag({ query: "duty results fruits of action worry", emotion: "anxiety", topK: 3 });
  const found247 = results.some((v) => v.chapter === 2 && v.verse_number === 47);
  assert.ok(found247, "Must ground to Bhagavad Gita 2.47 for duty and outcomes queries");
});

test("RAG-003: Query about anger and expectation grounds in Bhagavad Gita 2.62 or 2.63", async () => {
  const results = await searchGitaRag({ query: "anger rage desire frustration expectation", emotion: "anger", topK: 3 });
  const foundAngerVerse = results.some((v) => v.chapter === 2 && (v.verse_number === 62 || v.verse_number === 63));
  assert.ok(foundAngerVerse, "Must ground to Bhagavad Gita 2.62 or 2.63 for anger queries");
});

test("RAG-004: Chat service returns canonical verse citation and does not fabricate text", async () => {
  const response = await handleChatMessage({
    message: "I am feeling deep grief and sadness after losing my pet.",
    conversationId: `rag_chat_${Date.now()}`
  });

  assert.ok(typeof response.reply === "string");
  assert.ok(Array.isArray(response.grounded_verses));
  assert.ok(response.grounded_verses.length > 0);

  const cited = response.grounded_verses[0];
  const existsInCorpus = canonicalVerses.some(
    (cv) => cv.chapter === cited.chapter && cv.verse_number === cited.verse_number
  );
  assert.ok(existsInCorpus, `Cited verse ${cited.chapter}.${cited.verse_number} must be a real canonical shloka`);
});

test("RAG-005: Out-of-scope technical queries are refused without hallucinating Gita shlokas", async () => {
  const route = routeIntent("how to write a binary search algorithm in python?");
  assert.equal(route.intent, INTENTS.OUT_OF_SCOPE);

  const response = await handleChatMessage({
    message: "how to write a binary search algorithm in python?",
    conversationId: `oos_chat_${Date.now()}`
  });

  // Out of scope must not attach Gita shlokas or claim the Gita wrote python
  assert.equal(response.grounded_verses.length, 0);
  assert.ok(response.reply.includes("specialize in emotional well-being"));
});

test("RAG-006: Intent router intercepts greetings without querying RAG", async () => {
  const route = routeIntent("namaste VedAI!");
  assert.equal(route.intent, INTENTS.GREETING);

  const response = await handleChatMessage({
    message: "namaste VedAI!",
    conversationId: `greeting_${Date.now()}`
  });

  assert.equal(response.grounded_verses.length, 0);
  assert.ok(response.reply.includes("Namaste"));
});
