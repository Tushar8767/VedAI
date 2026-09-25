const KEYWORD_EVIDENCE = {
  anxiety: ["worried", "anxious", "nervous", "exam", "pressure", "future"],
  stress: ["stressed", "overwhelmed", "deadline", "pressure", "tired"],
  fear: ["afraid", "scared", "fear", "panic"],
  sadness: ["sad", "lonely", "empty", "loss", "cry"],
  anger: ["angry", "furious", "annoyed", "hate"],
  happiness: ["happy", "grateful", "excited", "joy"]
};

const EMOTION_INSIGHTS = {
  anxiety: "Your words reflect feeling hurried, uncertain, or burdened by upcoming outcomes. The Gita offers practical clarity to anchor your mind into the present step.",
  stress: "Your thoughts carry weight, urgency, and mental pressure. The guidance below helps you unclench, drop unnecessary burdens, and focus on what is within your hands.",
  fear: "You expressed unease, self-doubt, or dread about loss or setback. Ancient philosophy gently reminds you of your indestructible inner center.",
  sadness: "Your reflection holds sorrow, fatigue, or the pain of loss. The verse below offers quiet companionship and reassures you of your wholeness.",
  anger: "Your words show frustration or feeling wronged. The wisdom below teaches how to pause and cool the mind before hasty reactions cause regret.",
  happiness: "You feel light, grateful, and centered. The verse invites you to channel this positive energy into joyful duty and generosity toward others.",
  neutral: "Your reflection is calm, balanced, and observant. In the Gita, this steady state (Samatvam) is celebrated as the highest foundation for lasting wisdom."
};

function buildExplanation({ text, emotionResult, fusionResult, safety }) {
  const emotion = fusionResult?.final_emotion || emotionResult?.emotion || "neutral";
  const insight = EMOTION_INSIGHTS[emotion] || EMOTION_INSIGHTS.neutral;
  const isMultimodal = Boolean(fusionResult?.face_prediction?.face_detected);

  const textWeightPct = Math.round((fusionResult?.weights?.text || 0.65) * 100);
  const faceWeightPct = Math.round((fusionResult?.weights?.face || 0.35) * 100);

  const modalityNote = isMultimodal
    ? `Fusing your written words (${textWeightPct}%) with facial expression cues (${faceWeightPct}%). ${fusionResult?.modality_comparison?.comparison_summary || ''}`
    : "Estimated from the emotional tone and semantic balance of your reflection (single-modality text inference).";

  return {
    summary: `${insight} (${modalityNote})`,
    evidence: [`Reflective tone mapped to ${emotion}.`],
    uncertainty: fusionResult?.confidence >= 0.7 ? "High calibration" : "Balanced estimation",
    safety_note: safety?.isHighRisk
      ? "Compassionate safety resources were displayed for immediate support."
      : "VedAI is a mindful companion for philosophical contemplation."
  };
}

module.exports = { buildExplanation };
