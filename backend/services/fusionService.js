const { normalizeProbabilities, topEmotion } = require("./emotionService");

const DEFAULT_WEIGHTS = {
  text: 0.6,
  face: 0.4
};

function fuseEmotion({ textPrediction, facePrediction = null, weights = DEFAULT_WEIGHTS }) {
  const textProbabilities = normalizeProbabilities(textPrediction?.probabilities);

  if (!facePrediction?.probabilities) {
    const [emotion, confidence] = topEmotion(textProbabilities);
    const reportedConfidence = Number.isFinite(textPrediction?.confidence)
      ? textPrediction.confidence
      : confidence;

    return {
      final_emotion: emotion,
      confidence: reportedConfidence,
      probabilities: textProbabilities,
      text_prediction: textPrediction,
      face_prediction: null,
      fusion_method: "text_only"
    };
  }

  const faceProbabilities = normalizeProbabilities(facePrediction.probabilities);
  const fused = {};
  const totalWeight = weights.text + weights.face;
  const textWeight = weights.text / totalWeight;
  const faceWeight = weights.face / totalWeight;

  for (const label of Object.keys(textProbabilities)) {
    fused[label] = (textWeight * textProbabilities[label]) + (faceWeight * (faceProbabilities[label] || 0));
  }

  const probabilities = normalizeProbabilities(fused);
  const [emotion, confidence] = topEmotion(probabilities);

  return {
    final_emotion: emotion,
    confidence,
    probabilities,
    text_prediction: textPrediction,
    face_prediction: facePrediction,
    fusion_method: "weighted_late_fusion",
    weights: {
      text: textWeight,
      face: faceWeight
    }
  };
}

module.exports = { fuseEmotion, DEFAULT_WEIGHTS };
