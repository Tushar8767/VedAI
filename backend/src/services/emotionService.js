/**
 * Emotion Intelligence & Multimodal Fusion Service
 * 
 * Rules:
 * 1. Outputs probabilistic signals, never clinical diagnoses.
 * 2. Explicitly communicates uncertainty and model limitations.
 * 3. Reconciles Text signals + Facial expression signals without forcing false certainty.
 * 4. Integrates with Python ML Microservice (MODEL_API_URL) with robust resilient fallback.
 */

const axios = require('axios');
const config = require('../config');

// Lexicon-based signal scoring for semantic fallback when ML service is unavailable
const SIGNAL_LEXICON = {
  stress_overwhelm: [
    'stress', 'stressful', 'strest', 'overwhelm', 'overwhelmed', 'pressure', 'exam', 'deadline',
    'burden', 'tension', 'cooked', 'too much', 'exhausted', 'hectic', 'rush'
  ],
  anxiety_fear: [
    'scared', 'afraid', 'fear', 'anxious', 'nervous', 'panic', 'worry', 'worried',
    'future', 'uncertain', 'dar', 'bhiti', 'failing', 'lost', 'dread'
  ],
  sadness_grief: [
    'sad', 'grief', 'crying', 'down', 'lonely', 'heartbroken', 'hopeless', 'loss',
    'depressed', 'empty', 'miss', 'alone', 'hurt', 'pain'
  ],
  anger_frustration: [
    'angry', 'mad', 'furious', 'annoyed', 'irritated', 'frustrated', 'rage',
    'unfair', 'hate', 'bitter', 'disgusted'
  ],
  calm_peace: [
    'calm', 'peace', 'quiet', 'relaxed', 'grateful', 'content', 'happy', 'clarity',
    'balanced', 'stable', 'composed', 'mindful'
  ],
  hope_optimism: [
    'hope', 'optimism', 'faith', 'vishwas', 'positive', 'confident', 'forward',
    'strength', 'better', 'resolve'
  ]
};

// Fallback analyzer if Python ML microservice is offline
const estimateTextSignals = (normalizedText = '', fallbackReason = 'Python ML microservice unavailable') => {
  const words = normalizedText.toLowerCase().split(/\s+/);
  const scores = {
    stress_overwhelm: 0,
    anxiety_fear: 0,
    sadness_grief: 0,
    anger_frustration: 0,
    calm_peace: 0,
    hope_optimism: 0
  };

  let totalHits = 0;
  for (const word of words) {
    for (const [category, keywords] of Object.entries(SIGNAL_LEXICON)) {
      if (keywords.includes(word)) {
        scores[category] += 1;
        totalHits += 1;
      }
    }
  }

  // Calculate normalized probabilities
  const signals = [];
  if (totalHits > 0) {
    for (const [key, count] of Object.entries(scores)) {
      if (count > 0) {
        signals.push({
          signal: key,
          label: formatSignalLabel(key),
          confidence: parseFloat((count / totalHits).toFixed(2)),
          probability: parseFloat((count / totalHits).toFixed(2))
        });
      }
    }
    signals.sort((a, b) => b.confidence - a.confidence);
  } else {
    signals.push({
      signal: 'neutral_unclear',
      label: formatSignalLabel('neutral_unclear'),
      confidence: 0.5,
      probability: 0.5
    });
  }

  return {
    modality: 'text',
    primarySignal: signals[0],
    allSignals: signals,
    uncertainty: {
      isUncertain: true,
      entropy: null,
      confidenceMargin: null,
      threshold: null,
      note: 'Fallback estimation used due to ML microservice offline.'
    },
    rawConfidence: signals[0].confidence,
    source: 'heuristic_fallback',
    isFallback: true,
    fallbackReason,
    disclaimer: 'AI-estimated emotional signal based on keyword fallback heuristics. Not a clinical psychological diagnosis.'
  };
};

// Format signal labels respectfully (never clinical)
const formatSignalLabel = (signalKey) => {
  switch (signalKey) {
    case 'stress_overwhelm':
      return 'Signals associated with stress or feeling overwhelmed';
    case 'anxiety_fear':
      return 'Signals associated with worry, uncertainty, or fear';
    case 'sadness_grief':
      return 'Signals associated with sadness or emotional fatigue';
    case 'anger_frustration':
      return 'Signals associated with frustration or agitation';
    case 'calm_peace':
      return 'Signals associated with calm, peace, or clarity';
    case 'hope_optimism':
      return 'Signals associated with hope, optimism, or faith';
    case 'neutral_unclear':
    default:
      return 'General reflective thought or unclear emotional signal';
  }
};

const {
  executeMultimodalFusion,
  FUSION_STATES,
  CANONICAL_EMOTIONS,
  SIGNAL_LABELS
} = require('./multimodalFusionService');

// Multimodal Fusion Engine - Delegates to Evidence-Aware Fusion Service
const fuseSignals = (textAnalysis, faceAnalysis = null, context = {}) => {
  return executeMultimodalFusion({
    textAnalysis,
    faceAnalysis,
    context
  });
};

// Process complete emotion estimation
const processEmotionIntelligence = async (normalizedText, faceData = null, context = {}) => {
  let textAnalysis;

  // Try genuine Python ML microservice first
  try {
    const response = await axios.post(
      config.mlService.url,
      { text: normalizedText },
      { timeout: config.mlService.timeoutMs }
    );
    if (response.data && response.data.primarySignal && response.data.allSignals) {
      textAnalysis = {
        ...response.data,
        isFallback: false
      };
    } else {
      textAnalysis = estimateTextSignals(normalizedText, 'Microservice returned incomplete schema');
    }
  } catch (error) {
    // Graceful fallback to internal semantic analyzer
    const reason = error.code === 'ECONNREFUSED'
      ? 'Python ML microservice offline (connection refused at ' + config.mlService.url + ')'
      : (error.message || 'Python ML microservice request failed');
    textAnalysis = estimateTextSignals(normalizedText, reason);
  }

  // Fuse text and optional face signals
  const fusionResult = fuseSignals(textAnalysis, faceData, {
    rawText: normalizedText,
    ...context
  });

  return {
    textAnalysis,
    faceAnalysis: faceData,
    fusion: fusionResult,
    disclaimer: 'Emotion estimates are probabilistic approximations of observable patterns, never clinical diagnoses.'
  };
};

module.exports = {
  processEmotionIntelligence,
  estimateTextSignals,
  fuseSignals,
  formatSignalLabel,
  FUSION_STATES,
  CANONICAL_EMOTIONS
};
