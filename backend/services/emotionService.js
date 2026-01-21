const axios = require("axios");

const MODEL_API = process.env.MODEL_API_URL || "http://localhost:8001/predict";

async function analyzeEmotion(text) {
  try {
    const response = await axios.post(MODEL_API, { text });
    console.log("MODEL RESPONSE:", response.data);
    return response.data;
  } catch (error) {
    console.error("MODEL ERROR:", error.message);
    return { emotion: "neutral", confidence: 0 };
  }
}

module.exports = { analyzeEmotion };