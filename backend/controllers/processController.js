const { analyzeEmotion, analyzeFaceEmotion } = require("../services/emotionService");
const { getGitaGuidance } = require("../services/gitaService");
const { getYouTubeVideos } = require("../services/youtubeService");
const { assessSafety } = require("../services/safetyService");
const { fuseEmotion } = require("../services/fusionService");
const { buildExplanation } = require("../services/explainabilityService");
const { getRecommendations } = require("../services/recommendationService");
const { saveEmotionRecord } = require("../services/historyService");
const { verifyToken, getUserById } = require("../services/authService");

async function getOptionalUser(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const claims = verifyToken(token);

  return claims ? await getUserById(claims.sub) : null;
}

async function processUserInput(req, res) {
  const user_text = req.body?.user_text || req.body?.text;
  const face_image = req.body?.face_image;

  if (!user_text || typeof user_text !== "string" || user_text.trim().length === 0) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "user_text is required."
      }
    });
  }


  try {
    const trimmedText = user_text.trim();
    const safety = assessSafety(trimmedText);

    // Run text analysis and optional face analysis in parallel
    const textPromise = analyzeEmotion(trimmedText);
    const facePromise = face_image ? analyzeFaceEmotion(face_image) : Promise.resolve(null);

    const [emotionResult, faceResult] = await Promise.all([textPromise, facePromise]);

    const fusion = fuseEmotion({
      textPrediction: emotionResult,
      facePrediction: faceResult
    });

    const guidance = await getGitaGuidance(fusion.final_emotion);
    const recommendations = getRecommendations({ emotion: fusion.final_emotion, guidance });
    const videos = await getYouTubeVideos(fusion.final_emotion);
    const explanation = buildExplanation({
      text: trimmedText,
      emotionResult,
      fusionResult: fusion,
      safety
    });

    const responsePayload = {
      emotion: fusion.final_emotion,
      confidence: fusion.confidence,
      probabilities: fusion.probabilities,
      model: emotionResult.model,
      model_version: emotionResult.model_version,
      text_prediction: emotionResult,
      face_prediction: faceResult,
      fusion,
      safety,
      verse: guidance.verse,
      meaning: guidance.meaning,
      guidance,
      explanation,
      recommendations,
      videos,
      disclaimer: "VedAI provides reflective well-being support only. It is not a diagnosis, therapist, or emergency service."
    };

    const user = await getOptionalUser(req);
    if (user) {
      responsePayload.saved_record = await saveEmotionRecord({
        userId: user.id,
        userText: trimmedText,
        result: responsePayload,
        modality: faceResult ? "multimodal" : "text"
      });
    }

    res.json(responsePayload);
  } catch (error) {
    console.error("PROCESS ERROR:", error);
    res.status(500).json({
      error: {
        code: "PROCESSING_ERROR",
        message: "VedAI could not process this reflection right now."
      }
    });
  }
}

module.exports = { processUserInput };
