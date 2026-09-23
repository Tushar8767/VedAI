const express = require("express");
const { processUserInput } = require("../controllers/processController");
const { sendMessage, getMessages } = require("../controllers/chatController");
const { searchGitaRag } = require("../services/ragService");
const { analyzeFaceEmotion } = require("../services/emotionService");
const { fuseEmotion } = require("../services/fusionService");

const router = express.Router();

// Primary reflection endpoint (supports text + optional face)
router.post("/process", processUserInput);
router.post("/api/v1/process", processUserInput);

// Dedicated facial emotion endpoint
router.post("/api/v1/emotion/facial", async (req, res) => {
  const { image } = req.body || {};
  if (!image) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Image base64 is required." } });
  }
  const result = await analyzeFaceEmotion(image);
  if (!result) {
    return res.status(422).json({ error: { code: "ANALYSIS_FAILED", message: "Could not process facial image." } });
  }
  res.json(result);
});

// Dedicated multimodal fusion endpoint
router.post("/api/v1/emotion/multimodal", async (req, res) => {
  const { text_prediction, face_prediction, weights } = req.body || {};
  const fused = fuseEmotion({
    textPrediction: text_prediction,
    facePrediction: face_prediction,
    weights
  });
  res.json(fused);
});

// RAG semantic search endpoint
router.post("/api/v1/rag/search", async (req, res) => {
  const { query, emotion, top_k } = req.body || {};
  if (!query) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Query string is required." } });
  }
  const results = await searchGitaRag({ query, emotion, topK: top_k || 3 });
  res.json({ query, results });
});

// Interactive AI chat endpoints
router.post("/api/v1/chat", sendMessage);
router.post("/api/v1/chat/message", sendMessage);
router.get("/api/v1/chat/conversations/:conversationId/messages", getMessages);

module.exports = router;
