const axios = require("axios");

async function analyzeEmotion(text) {
  try {
    const response = await axios.post(
      "http://localhost:8001/predict",
      { text }
    );

    return response.data; // { emotion, confidence }
  } catch (error) {
    console.error("Emotion API error:", error.message);
    return {
      emotion: "neutral",
      confidence: 0.0
    };
  }
}

module.exports = { analyzeEmotion };
