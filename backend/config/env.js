const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 5000),
  MODEL_API_URL: process.env.MODEL_API_URL || "http://localhost:8001/predict",
  MODEL_TIMEOUT_MS: Number(process.env.MODEL_TIMEOUT_MS || 10000),
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || process.env.YOU_TUBE_API || ""
};
