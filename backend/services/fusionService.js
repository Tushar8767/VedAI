const { normalizeProbabilities, topEmotion } = require("./emotionService");

const DEFAULT_WEIGHTS = {
  text: 0.65,
  face: 0.35
};

function fuseEmotion({ textPrediction, facePrediction = null, weights = DEFAULT_WEIGHTS }) {
  const textProbabilities = normalizeProbabilities(textPrediction?.probabilities);
  const [textEmotion, textConfidence] = topEmotion(textProbabilities);
  const reportedTextConf = Number.isFinite(textPrediction?.confidence)
    ? textPrediction.confidence
    : textConfidence;

  const hasFace = Boolean(
    facePrediction &&
    facePrediction.face_detected !== false &&
    facePrediction.probabilities &&
    Object.keys(facePrediction.probabilities).length > 0 &&
    facePrediction.emotion !== null
  );

  if (!hasFace) {
    const fallbackReason = facePrediction
      ? (facePrediction.reason || "No face detected in video frame.")
      : "Camera not enabled (text stream only).";

    return {
      final_emotion: textEmotion,
      confidence: reportedTextConf,
      probabilities: textProbabilities,
      text_prediction: textPrediction,
      face_prediction: facePrediction ? {
        face_detected: false,
        number_of_faces: facePrediction.number_of_faces || 0,
        detection_status: facePrediction.detection_status || "no_face_detected",
        reason: fallbackReason,
        emotion: null,
        confidence: 0.0,
        probabilities: {}
      } : null,
      fusion_method: "text_only",
      weights: { text: 1.0, face: 0.0 },
      text_contribution: textProbabilities,
      face_contribution: {},
      agreement: null,
      modality_comparison: {
        text_emotion: textEmotion,
        text_confidence: reportedTextConf,
        face_emotion: null,
        face_confidence: 0,
        agreement: null,
        reason: fallbackReason,
        status: "TEXT-ONLY FALLBACK ACTIVE"
      }
    };
  }

  const faceProbabilities = normalizeProbabilities(facePrediction.probabilities);
  const [faceEmotion, faceConfidence] = topEmotion(faceProbabilities);
  const reportedFaceConf = Number.isFinite(facePrediction.confidence)
    ? facePrediction.confidence
    : faceConfidence;

  const totalWeight = weights.text + weights.face;
  const textWeight = weights.text / totalWeight;
  const faceWeight = weights.face / totalWeight;

  const fused = {};
  const textContribution = {};
  const faceContribution = {};

  for (const label of Object.keys(textProbabilities)) {
    const tVal = textProbabilities[label] || 0;
    const fVal = faceProbabilities[label] || 0;
    textContribution[label] = Number((textWeight * tVal).toFixed(4));
    faceContribution[label] = Number((faceWeight * fVal).toFixed(4));
    fused[label] = textContribution[label] + faceContribution[label];
  }

  const probabilities = normalizeProbabilities(fused);
  const [finalEmotion, finalConfidence] = topEmotion(probabilities);
  const isAgreement = (textEmotion === faceEmotion);

  return {
    final_emotion: finalEmotion,
    confidence: Number(finalConfidence.toFixed(4)),
    probabilities,
    text_prediction: textPrediction,
    face_prediction: {
      ...facePrediction,
      face_detected: true,
      emotion: faceEmotion,
      confidence: reportedFaceConf,
      probabilities: faceProbabilities
    },
    fusion_method: "weighted_late_fusion",
    weights: {
      text: Number(textWeight.toFixed(2)),
      face: Number(faceWeight.toFixed(2))
    },
    text_contribution: textContribution,
    face_contribution: faceContribution,
    agreement: isAgreement,
    modality_comparison: {
      text_emotion: textEmotion,
      text_confidence: reportedTextConf,
      face_emotion: faceEmotion,
      face_confidence: reportedFaceConf,
      agreement: isAgreement,
      comparison_summary: isAgreement
        ? `Concordant alignment: both textual semantics and facial expressions indicate ${textEmotion.toUpperCase()}.`
        : `Divergence detected: textual cues indicate ${textEmotion.toUpperCase()} (${Math.round(reportedTextConf * 100)}%), while facial features reflect ${faceEmotion.toUpperCase()} (${Math.round(reportedFaceConf * 100)}%). Late fusion (65% text, 35% face) synthesized ${finalEmotion.toUpperCase()} (${Math.round(finalConfidence * 100)}%).`,
      status: "MULTIMODAL FUSION ACTIVE"
    }
  };
}

module.exports = { fuseEmotion, DEFAULT_WEIGHTS };
