const { analyzeEmotion } = require("../services/emotionService");
const { getGitaGuidance } = require("../services/gitaService");
const { getYouTubeVideos } = require("../services/youtubeService");

async function processUserInput(req, res) {
  const { user_text } = req.body;

  if (!user_text) {
    return res.status(400).json({ error: "user_text is required" });
  }

  const emotionResult = await analyzeEmotion(user_text);
  const guidance = getGitaGuidance(emotionResult.emotion);
  const videos = await getYouTubeVideos(emotionResult.emotion);

  res.json({
    emotion: emotionResult.emotion,
    confidence: emotionResult.confidence,
    verse: guidance.verse,
    meaning: guidance.meaning,
    explanation: guidance.explanation,
    videos
  });
}

module.exports = { processUserInput };
