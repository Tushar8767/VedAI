/**
 * VedAI 2.0 — Evidence-Aware Multimodal Emotion Fusion Engine
 * 
 * Core Principles:
 * 1. AI suggests. Evidence explains. The user decides.
 * 2. Text and facial cues are NOT ground truth and NEVER clinical diagnoses.
 * 3. Does NOT force a winner when modalities strongly conflict.
 * 4. Preserves full modality-specific evidence, signal quality, uncertainty, and conflict metrics.
 * 5. Strict Human-in-the-Loop priority:
 *    USER CORRECTION > USER VALIDATION > FUSED AI SIGNAL > INDIVIDUAL MODEL SIGNAL
 */

const CANONICAL_EMOTIONS = [
  'stress_overwhelm',
  'anxiety_fear',
  'anger_frustration',
  'sadness_grief',
  'calm_peace',
  'hope_optimism',
  'neutral_unclear'
];

const FUSION_STATES = {
  TEXT_ONLY: 'TEXT_ONLY',
  FACE_ONLY: 'FACE_ONLY',
  MULTIMODAL_AGREE: 'MULTIMODAL_AGREE',
  MULTIMODAL_PARTIAL_AGREE: 'MULTIMODAL_PARTIAL_AGREE',
  MULTIMODAL_CONFLICT: 'MULTIMODAL_CONFLICT',
  LOW_QUALITY: 'LOW_QUALITY',
  INSUFFICIENT_EVIDENCE: 'INSUFFICIENT_EVIDENCE',
  USER_CORRECTED: 'USER_CORRECTED'
};

// Semantic clusters for evaluating partial agreement vs direct conflict
const EMOTION_CLUSTERS = {
  HIGH_AROUSAL_TENSION: ['stress_overwhelm', 'anxiety_fear', 'anger_frustration'],
  LOW_AROUSAL_FATIGUE: ['sadness_grief', 'neutral_unclear'],
  POSITIVE_STATE: ['calm_peace', 'hope_optimism']
};

// Mapping common expression keywords/labels to canonical emotions
const EXPRESSION_MAP = {
  stress: 'stress_overwhelm',
  stressed: 'stress_overwhelm',
  overwhelmed: 'stress_overwhelm',
  anxiety: 'anxiety_fear',
  worried: 'anxiety_fear',
  fear: 'anxiety_fear',
  nervous: 'anxiety_fear',
  angry: 'anger_frustration',
  mad: 'anger_frustration',
  frustrated: 'anger_frustration',
  sad: 'sadness_grief',
  sadness: 'sadness_grief',
  grief: 'sadness_grief',
  calm: 'calm_peace',
  peaceful: 'calm_peace',
  relaxed: 'calm_peace',
  happy: 'hope_optimism',
  optimistic: 'hope_optimism',
  hopeful: 'hope_optimism',
  neutral: 'neutral_unclear',
  unclear: 'neutral_unclear'
};

// Human-respectful labels (never clinical)
const SIGNAL_LABELS = {
  stress_overwhelm: 'Signals associated with stress or feeling overwhelmed',
  anxiety_fear: 'Signals associated with worry, uncertainty, or fear',
  anger_frustration: 'Signals associated with frustration or agitation',
  sadness_grief: 'Signals associated with sadness or emotional fatigue',
  calm_peace: 'Signals associated with calm, peace, or clarity',
  hope_optimism: 'Signals associated with hope, optimism, or faith',
  neutral_unclear: 'General reflective thought or unclear emotional signal'
};

/**
 * Evaluates Signal Quality for Text Analysis
 */
function evaluateTextQuality(textAnalysis, rawText = '') {
  if (!textAnalysis || (!textAnalysis.primarySignal && !textAnalysis.signals)) {
    return { score: 0.0, tier: 'INSUFFICIENT', reason: 'Missing or empty text analysis payload' };
  }

  const textLength = (rawText || '').trim().length;
  let score = 0.85;

  if (textLength === 0 && !textAnalysis.rawConfidence) {
    return { score: 0.0, tier: 'INSUFFICIENT', reason: 'Zero-length input' };
  } else if (textLength > 0 && textLength < 5) {
    score -= 0.35;
  } else if (textLength >= 25) {
    score += 0.10;
  }

  // Penalty if heuristic fallback had to be used
  if (textAnalysis.isFallback) {
    score -= 0.20;
  }

  // Uncertainty penalty
  if (textAnalysis.uncertainty && textAnalysis.uncertainty.isUncertain) {
    score -= 0.25;
  }

  score = Math.max(0.1, Math.min(1.0, score));

  let tier = 'HIGH_QUALITY';
  if (score < 0.35) tier = 'INSUFFICIENT';
  else if (score < 0.55) tier = 'LOW_QUALITY';
  else if (score < 0.75) tier = 'MODERATE_QUALITY';

  return {
    score: parseFloat(score.toFixed(3)),
    tier,
    reason: textAnalysis.isFallback ? 'Heuristic fallback in effect' : 'Transformer text analysis complete'
  };
}

/**
 * Evaluates Signal Quality for Face Analysis
 */
function evaluateFaceQuality(faceAnalysis) {
  if (!faceAnalysis || !faceAnalysis.faceDetected) {
    return {
      score: 0.0,
      tier: 'INSUFFICIENT',
      reason: faceAnalysis?.statusReason || 'Face not detected / camera not active'
    };
  }

  let score = typeof faceAnalysis.confidence === 'number' ? faceAnalysis.confidence : 0.70;

  // Penalize occlusion or poor lighting if provided by frontend
  if (faceAnalysis.quality) {
    const q = faceAnalysis.quality;
    if (typeof q.occlusion === 'number') score *= (1 - q.occlusion);
    if (typeof q.lighting === 'number') score *= Math.min(1.0, q.lighting);
    if (typeof q.clarity === 'number') score *= Math.min(1.0, q.clarity);
  }

  // Uncertainty penalty
  if (faceAnalysis.uncertainty && (faceAnalysis.uncertainty.isUncertain || faceAnalysis.uncertainty > 0.6)) {
    score *= 0.7;
  }

  score = Math.max(0.0, Math.min(1.0, score));

  let tier = 'HIGH_QUALITY';
  if (score < 0.30) tier = 'INSUFFICIENT';
  else if (score < 0.50) tier = 'LOW_QUALITY';
  else if (score < 0.75) tier = 'MODERATE_QUALITY';

  return {
    score: parseFloat(score.toFixed(3)),
    tier,
    reason: faceAnalysis.statusReason || 'Facial cues analyzed with user consent'
  };
}

/**
 * Standardizes a modality's probability vector across the 7 canonical classes
 */
function standardizeDistribution(modalityData, modalityType = 'text') {
  const dist = {};
  for (const c of CANONICAL_EMOTIONS) dist[c] = 0.001; // Epsilon baseline

  if (!modalityData) return dist;

  // Case A: Full allSignals array with probabilities
  if (Array.isArray(modalityData.allSignals) && modalityData.allSignals.length > 0) {
    for (const item of modalityData.allSignals) {
      const canonicalKey = EXPRESSION_MAP[item.signal] || item.signal;
      if (dist[canonicalKey] !== undefined) {
        dist[canonicalKey] = Math.max(dist[canonicalKey], item.probability || item.confidence || 0);
      }
    }
  }
  // Case B: Single primarySignal / dominantExpression
  else {
    const rawSignal = modalityData.primarySignal?.signal || modalityData.dominantExpression || 'neutral_unclear';
    const canonical = EXPRESSION_MAP[rawSignal] || rawSignal;
    const conf = modalityData.rawConfidence || modalityData.confidence || 0.6;
    if (dist[canonical] !== undefined) {
      dist[canonical] = conf;
    } else {
      dist['neutral_unclear'] = conf;
    }
  }

  // Normalize to unit sum
  const sum = Object.values(dist).reduce((acc, v) => acc + v, 0);
  for (const k of Object.keys(dist)) {
    dist[k] = parseFloat((dist[k] / sum).toFixed(4));
  }

  return dist;
}

/**
 * Mathematical Conflict Detection between Modalities
 * Combines:
 * 1. Top-Label Concordance (exact match, cluster match, or direct mismatch)
 * 2. Cosine Distance on Probability Vectors
 */
function computeConflictMetric(textDist, faceDist, textPrimary, facePrimary) {
  // 1. Vector dot product & norms for Cosine Distance
  let dot = 0.0;
  let normText = 0.0;
  let normFace = 0.0;

  for (const c of CANONICAL_EMOTIONS) {
    const pT = textDist[c] || 0.0;
    const pF = faceDist[c] || 0.0;
    dot += pT * pF;
    normText += pT * pT;
    normFace += pF * pF;
  }

  normText = Math.sqrt(normText);
  normFace = Math.sqrt(normFace);

  const cosineSimilarity = (normText > 0 && normFace > 0) ? (dot / (normText * normFace)) : 0.0;
  const cosineDistance = Math.max(0.0, Math.min(1.0, 1.0 - cosineSimilarity));

  // 2. Top-label check
  const isExactMatch = textPrimary === facePrimary;

  let isClusterMatch = false;
  for (const cluster of Object.values(EMOTION_CLUSTERS)) {
    if (cluster.includes(textPrimary) && cluster.includes(facePrimary)) {
      isClusterMatch = true;
      break;
    }
  }

  // 3. Deterministic Conflict Metric C in [0, 1]
  let conflictMetric;
  if (isExactMatch) {
    conflictMetric = cosineDistance * 0.4;
  } else if (isClusterMatch) {
    conflictMetric = 0.35 + (cosineDistance * 0.3);
  } else {
    // True divergent categories (e.g. calm_peace vs anger_frustration)
    conflictMetric = Math.min(1.0, 0.55 + (cosineDistance * 0.45));
  }

  return {
    conflictScore: parseFloat(conflictMetric.toFixed(4)),
    cosineDistance: parseFloat(cosineDistance.toFixed(4)),
    isExactMatch,
    isClusterMatch
  };
}

/**
 * Quality-Weighted Evidence Fusion
 */
function executeMultimodalFusion({
  textAnalysis = null,
  faceAnalysis = null,
  context = {},
  safety = { isSafe: true }
}) {
  const safeContext = (context && typeof context === 'object') ? context : {};
  const safeFace = (faceAnalysis && typeof faceAnalysis === 'object') ? faceAnalysis : null;
  const safeText = (textAnalysis && typeof textAnalysis === 'object') ? textAnalysis : null;

  const rawText = safeContext.rawText || safeText?.rawText || '';
  
  // Step 1: Quality Assessments
  const textQuality = evaluateTextQuality(safeText, rawText);
  const faceQuality = evaluateFaceQuality(safeFace);

  const hasUsableText = textQuality.tier !== 'INSUFFICIENT';
  const hasUsableFace = faceQuality.tier !== 'INSUFFICIENT';

  // Format Modality-Specific Evidence
  const textEvidence = {
    available: !!safeText,
    usable: hasUsableText,
    quality: textQuality,
    primarySignal: safeText?.primarySignal?.signal || null,
    label: safeText?.primarySignal?.label || null,
    confidence: safeText?.rawConfidence || safeText?.primarySignal?.confidence || 0,
    uncertainty: safeText?.uncertainty || null,
    isFallback: !!safeText?.isFallback,
    source: safeText?.source || 'none',
    modelVersion: safeText?.modelVersion || 'unknown'
  };

  const facePrimaryNormalized = safeFace?.dominantExpression
    ? (EXPRESSION_MAP[safeFace.dominantExpression] || safeFace.dominantExpression)
    : null;

  const faceEvidence = {
    available: !!safeFace && !!safeFace.faceDetected,
    usable: hasUsableFace,
    quality: faceQuality,
    dominantExpression: safeFace?.dominantExpression || null,
    canonicalSignal: facePrimaryNormalized,
    label: facePrimaryNormalized ? SIGNAL_LABELS[facePrimaryNormalized] : null,
    confidence: safeFace?.confidence || 0,
    uncertainty: safeFace?.uncertainty || null,
    statusReason: safeFace?.statusReason || (safeFace?.faceDetected ? 'Face analyzed with consent' : 'Camera not used'),
    modelVersion: safeFace?.modelVersion || 'client_mediapipe_v1'
  };

  // Case 1: Both modalities Insufficient
  if (!hasUsableText && !hasUsableFace) {
    return {
      fusionState: FUSION_STATES.INSUFFICIENT_EVIDENCE,
      fusedSignal: 'neutral_unclear',
      fusedProbabilities: null,
      confidenceLevel: 'Very Low / Insufficient',
      displaySummary: 'VedAI could not observe sufficient signal details to suggest an interpretation.',
      uncertaintyNote: 'Please feel free to share your thoughts in your own words.',
      evidenceStrength: 'Insufficient',
      modalitiesUsed: [],
      conflictMetric: null,
      faceStatus: faceEvidence.statusReason || 'Camera not used',
      isFallback: !!textEvidence.isFallback,
      textEvidence,
      faceEvidence,
      userFacing: {
        whatVedAiNoticed: {
          textNotice: 'Text was insufficient or empty.',
          faceNotice: faceEvidence.statusReason,
          combinedNotice: 'Insufficient observational evidence.',
          confidence: 'Uncertain'
        },
        validationPrompt: {
          question: 'What are you experiencing right now?',
          options: [
            { id: 'TELL_VEDAI', label: 'Tell VedAI what you feel' },
            { id: 'SKIPPED', label: 'Continue without validation' }
          ]
        }
      },
      researchMetadata: {
        fusionState: FUSION_STATES.INSUFFICIENT_EVIDENCE,
        conflictScore: null,
        textQuality: textQuality.score,
        faceQuality: faceQuality.score,
        timestamp: new Date().toISOString(),
        pipelineVersion: '2.0.0-fusion-phase2f'
      },
      requiresValidation: true
    };
  }

  // Case 2: Text Only (Face missing, denied, or poor quality)
  if (hasUsableText && !hasUsableFace) {
    const isUncertain = textAnalysis?.uncertainty?.isUncertain || textQuality.tier === 'LOW_QUALITY';
    const primarySig = textEvidence.primarySignal || 'neutral_unclear';
    const primaryLabel = SIGNAL_LABELS[primarySig] || 'General reflective thought';

    return {
      fusionState: faceQuality.tier === 'LOW_QUALITY' ? FUSION_STATES.LOW_QUALITY : FUSION_STATES.TEXT_ONLY,
      fusedSignal: primarySig,
      fusedProbabilities: standardizeDistribution(textAnalysis, 'text'),
      confidenceLevel: isUncertain ? 'Tentative' : (textEvidence.confidence >= 0.75 ? 'Moderate to High' : 'Moderate'),
      displaySummary: `VedAI detected signals in your text that may be associated with ${primaryLabel.toLowerCase()}.`,
      uncertaintyNote: isUncertain
        ? 'The model detected ambiguous or tentative patterns. Please confirm what you are experiencing.'
        : 'This is an algorithmic observation of textual signals, not a clinical statement of fact.',
      evidenceStrength: textQuality.tier,
      modalitiesUsed: ['text'],
      conflictMetric: null,
      faceStatus: faceEvidence.statusReason || 'Camera not used',
      isFallback: !!textEvidence.isFallback,
      textEvidence,
      faceEvidence,
      userFacing: {
        whatVedAiNoticed: {
          textNotice: primaryLabel,
          faceNotice: faceEvidence.statusReason,
          combinedNotice: `VedAI observed signals in your text associated with ${primaryLabel.toLowerCase()}.`,
          confidence: isUncertain ? 'Tentative' : 'Moderate'
        },
        validationPrompt: {
          question: 'Does this interpretation feel accurate to you?',
          options: [
            { id: 'YES', label: 'Yes, accurate' },
            { id: 'PARTLY', label: 'Partially accurate' },
            { id: 'NOT_REALLY', label: 'Not really' },
            { id: 'TELL_VEDAI', label: 'Tell VedAI what you feel' },
            { id: 'SKIPPED', label: 'Continue without validation' }
          ]
        }
      },
      researchMetadata: {
        fusionState: FUSION_STATES.TEXT_ONLY,
        conflictScore: null,
        textQuality: textQuality.score,
        faceQuality: faceQuality.score,
        timestamp: new Date().toISOString(),
        pipelineVersion: '2.0.0-fusion-phase2f'
      },
      requiresValidation: true
    };
  }

  // Case 3: Face Only (Text missing or empty)
  if (!hasUsableText && hasUsableFace) {
    const isUncertain = faceEvidence.confidence < 0.6 || faceQuality.tier === 'LOW_QUALITY';
    const primarySig = facePrimaryNormalized || 'neutral_unclear';
    const primaryLabel = SIGNAL_LABELS[primarySig] || 'General emotional cues';

    return {
      fusionState: FUSION_STATES.FACE_ONLY,
      fusedSignal: primarySig,
      fusedProbabilities: standardizeDistribution(faceAnalysis, 'face'),
      confidenceLevel: isUncertain ? 'Tentative' : 'Moderate',
      displaySummary: `VedAI observed facial cues that may be associated with ${primaryLabel.toLowerCase()}.`,
      uncertaintyNote: 'Facial cues can vary widely across individuals. You remain the only true authority on your inner state.',
      evidenceStrength: faceQuality.tier,
      modalitiesUsed: ['face'],
      conflictMetric: null,
      faceStatus: faceEvidence.statusReason || 'Face analyzed with consent',
      isFallback: false,
      textEvidence,
      faceEvidence,
      userFacing: {
        whatVedAiNoticed: {
          textNotice: 'No text provided.',
          faceNotice: primaryLabel,
          combinedNotice: `Facial expression signals associated with ${primaryLabel.toLowerCase()}.`,
          confidence: isUncertain ? 'Tentative' : 'Moderate'
        },
        validationPrompt: {
          question: 'Does this feel accurate to you?',
          options: [
            { id: 'YES', label: 'Yes, accurate' },
            { id: 'PARTLY', label: 'Partially accurate' },
            { id: 'NOT_REALLY', label: 'Not really' },
            { id: 'TELL_VEDAI', label: 'Tell VedAI what you feel' },
            { id: 'SKIPPED', label: 'Continue without validation' }
          ]
        }
      },
      researchMetadata: {
        fusionState: FUSION_STATES.FACE_ONLY,
        conflictScore: null,
        textQuality: textQuality.score,
        faceQuality: faceQuality.score,
        timestamp: new Date().toISOString(),
        pipelineVersion: '2.0.0-fusion-phase2f'
      },
      requiresValidation: true
    };
  }

  // Case 4: Multimodal (Both Text & Face are usable)
  const textDist = standardizeDistribution(textAnalysis, 'text');
  const faceDist = standardizeDistribution(faceAnalysis, 'face');

  const textPrimary = textEvidence.primarySignal || 'neutral_unclear';
  const facePrimary = facePrimaryNormalized || 'neutral_unclear';

  const conflict = computeConflictMetric(textDist, faceDist, textPrimary, facePrimary);

  // Determine Fusion State
  let fusionState;
  if (conflict.conflictScore >= 0.65) {
    fusionState = FUSION_STATES.MULTIMODAL_CONFLICT;
  } else if (conflict.conflictScore >= 0.35) {
    fusionState = FUSION_STATES.MULTIMODAL_PARTIAL_AGREE;
  } else {
    fusionState = FUSION_STATES.MULTIMODAL_AGREE;
  }

  // Quality-Aware Weighting:
  // Weight = Quality * (1 - Uncertainty)
  const uText = textAnalysis?.uncertainty?.isUncertain ? 0.4 : 0.1;
  const uFace = (faceAnalysis?.confidence < 0.65) ? 0.4 : 0.15;

  const wTextRaw = textQuality.score * (1.0 - uText);
  const wFaceRaw = faceQuality.score * (1.0 - uFace);
  const wTotal = wTextRaw + wFaceRaw;

  const wText = wTotal > 0 ? (wTextRaw / wTotal) : 0.5;
  const wFace = wTotal > 0 ? (wFaceRaw / wTotal) : 0.5;

  // Fused probability distribution (convex combination)
  const fusedDist = {};
  for (const c of CANONICAL_EMOTIONS) {
    fusedDist[c] = parseFloat(((wText * textDist[c]) + (wFace * faceDist[c])).toFixed(4));
  }

  // Handle Strong Conflict: NEVER force a winner
  if (fusionState === FUSION_STATES.MULTIMODAL_CONFLICT) {
    const textLabel = SIGNAL_LABELS[textPrimary] || 'Reflective signals';
    const faceLabel = SIGNAL_LABELS[facePrimary] || 'Facial signals';

    return {
      fusionState,
      fusedSignal: null, // Zero forced winner
      fusedProbabilities: fusedDist,
      confidenceLevel: 'Low / Mixed Signals',
      displaySummary: 'VedAI received mixed signals. Your written words and facial cues suggest different emotional patterns.',
      uncertaintyNote: 'Because facial expressions and written words can convey different aspects of experience, please tell VedAI what you are actually feeling.',
      evidenceStrength: 'Mixed / Divergent',
      modalitiesUsed: ['text', 'face'],
      conflictMetric: conflict,
      faceStatus: 'Face analyzed (conflicting signals)',
      isFallback: !!textEvidence.isFallback,
      textEvidence,
      faceEvidence,
      userFacing: {
        whatVedAiNoticed: {
          textNotice: `Text suggested: ${textLabel}`,
          faceNotice: `Facial expression suggested: ${faceLabel}`,
          combinedNotice: 'VedAI received mixed signals.',
          confidence: 'Uncertain'
        },
        validationPrompt: {
          question: 'What feels accurate to you?',
          options: [
            { id: 'YES_TEXT', label: `My words are accurate (${textLabel})` },
            { id: 'YES_FACE', label: `My facial cues are accurate (${faceLabel})` },
            { id: 'PARTLY', label: 'A mixture of both' },
            { id: 'NOT_REALLY', label: 'Neither is accurate' },
            { id: 'TELL_VEDAI', label: 'Tell VedAI what you actually feel' },
            { id: 'SKIPPED', label: 'Continue without validation' }
          ]
        }
      },
      researchMetadata: {
        fusionState,
        conflictScore: conflict.conflictScore,
        cosineDistance: conflict.cosineDistance,
        wText: parseFloat(wText.toFixed(3)),
        wFace: parseFloat(wFace.toFixed(3)),
        textQuality: textQuality.score,
        faceQuality: faceQuality.score,
        timestamp: new Date().toISOString(),
        pipelineVersion: '2.0.0-fusion-phase2f'
      },
      requiresValidation: true
    };
  }

  // Agreement or Partial Agreement
  // Pick highest probability class from fused distribution
  let topFused = CANONICAL_EMOTIONS[0];
  let topProb = fusedDist[topFused];
  for (const c of CANONICAL_EMOTIONS) {
    if (fusedDist[c] > topProb) {
      topProb = fusedDist[c];
      topFused = c;
    }
  }

  const topLabel = SIGNAL_LABELS[topFused] || 'General emotional signal';
  const isAgree = fusionState === FUSION_STATES.MULTIMODAL_AGREE;

  const displaySummary = isAgree
    ? `VedAI detected signals in your text and facial expression that may both be associated with ${topLabel.toLowerCase()}.`
    : `VedAI noticed complementary signals across your words and facial cues pointing toward ${topLabel.toLowerCase()}.`;

  return {
    fusionState,
    fusedSignal: topFused,
    fusedProbabilities: fusedDist,
    confidenceLevel: isAgree ? 'Moderate to High' : 'Moderate',
    displaySummary,
    uncertaintyNote: 'Even when cues align, emotions are personal and complex. You remain the only true authority.',
    evidenceStrength: isAgree ? 'High' : 'Moderate',
    modalitiesUsed: ['text', 'face'],
    conflictMetric: conflict,
    faceStatus: 'Face analyzed with consent',
    isFallback: !!textEvidence.isFallback,
    textEvidence,
    faceEvidence,
    userFacing: {
      whatVedAiNoticed: {
        textNotice: SIGNAL_LABELS[textPrimary],
        faceNotice: SIGNAL_LABELS[facePrimary],
        combinedNotice: displaySummary,
        confidence: isAgree ? 'Moderate to High' : 'Moderate'
      },
      validationPrompt: {
        question: 'Does this interpretation feel accurate to you?',
        options: [
          { id: 'YES', label: 'Yes, accurate' },
          { id: 'PARTLY', label: 'Partially accurate' },
          { id: 'NOT_REALLY', label: 'Not really' },
          { id: 'TELL_VEDAI', label: 'Tell VedAI what you feel' },
          { id: 'SKIPPED', label: 'Continue without validation' }
        ]
      }
    },
    researchMetadata: {
      fusionState,
      conflictScore: conflict.conflictScore,
      cosineDistance: conflict.cosineDistance,
      wText: parseFloat(wText.toFixed(3)),
      wFace: parseFloat(wFace.toFixed(3)),
      textQuality: textQuality.score,
      faceQuality: faceQuality.score,
      timestamp: new Date().toISOString(),
      pipelineVersion: '2.0.0-fusion-phase2f'
    },
    requiresValidation: true
  };
}

module.exports = {
  FUSION_STATES,
  CANONICAL_EMOTIONS,
  SIGNAL_LABELS,
  evaluateTextQuality,
  evaluateFaceQuality,
  standardizeDistribution,
  computeConflictMetric,
  executeMultimodalFusion
};
