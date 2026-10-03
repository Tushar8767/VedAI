const test = require('node:test');
const assert = require('node:assert');
const axios = require('axios');
const config = require('../src/config');
const {
  executeMultimodalFusion,
  evaluateTextQuality,
  evaluateFaceQuality,
  standardizeDistribution,
  computeConflictMetric,
  FUSION_STATES,
  CANONICAL_EMOTIONS,
  SIGNAL_LABELS
} = require('../src/services/multimodalFusionService');

const {
  processEmotionIntelligence,
  estimateTextSignals,
  fuseSignals
} = require('../src/services/emotionService');

const { resolveValidatedContext } = require('../src/services/validationService');
const { assessSafety } = require('../src/services/safetyService');
const { findRelevantVerses } = require('../src/services/gitaService');
const { buildGroundedPrompt, generateGroundedReflection } = require('../src/services/llmService');

test('VedAI 2.0 — Phase 2F Real Multimodal Emotion Fusion & Signal Quality Test Suite', async (t) => {

  // 1. Text-Only Inference
  await t.test('1. Text-Only Inference: Camera not used, yields TEXT_ONLY state', () => {
    const textAnalysis = {
      modality: 'text',
      primarySignal: { signal: 'stress_overwhelm', label: SIGNAL_LABELS.stress_overwhelm, confidence: 0.88 },
      rawConfidence: 0.88,
      source: 'distilbert_multilingual_ml',
      modelVersion: 'distilbert-base-multilingual-cased-emotion-v1.0'
    };

    const fusion = executeMultimodalFusion({
      textAnalysis,
      faceAnalysis: null,
      context: { rawText: 'I am so stressed out from exams' }
    });

    assert.strictEqual(fusion.fusionState, FUSION_STATES.TEXT_ONLY);
    assert.deepStrictEqual(fusion.modalitiesUsed, ['text']);
    assert.strictEqual(fusion.fusedSignal, 'stress_overwhelm');
    assert.strictEqual(fusion.faceStatus, 'Camera not used');
    assert.strictEqual(fusion.requiresValidation, true);
    assert.ok(fusion.displaySummary.includes('signals in your text'));
  });

  // 2. Face-Only Inference
  await t.test('2. Face-Only Inference: Text empty, yields FACE_ONLY state', () => {
    const faceAnalysis = {
      faceDetected: true,
      dominantExpression: 'calm',
      confidence: 0.82,
      statusReason: 'Face analyzed with consent',
      modelVersion: 'client_mediapipe_v1'
    };

    const fusion = executeMultimodalFusion({
      textAnalysis: null,
      faceAnalysis,
      context: { rawText: '' }
    });

    assert.strictEqual(fusion.fusionState, FUSION_STATES.FACE_ONLY);
    assert.deepStrictEqual(fusion.modalitiesUsed, ['face']);
    assert.strictEqual(fusion.fusedSignal, 'calm_peace');
    assert.strictEqual(fusion.faceStatus, 'Face analyzed with consent');
    assert.strictEqual(fusion.requiresValidation, true);
  });

  // 3. Text + Face Agreement
  await t.test('3. Text + Face Agreement: Both indicate stress, yields MULTIMODAL_AGREE', () => {
    const textAnalysis = {
      primarySignal: { signal: 'stress_overwhelm', label: SIGNAL_LABELS.stress_overwhelm, confidence: 0.85 },
      rawConfidence: 0.85,
      allSignals: [
        { signal: 'stress_overwhelm', probability: 0.85 },
        { signal: 'anxiety_fear', probability: 0.10 },
        { signal: 'neutral_unclear', probability: 0.05 }
      ]
    };
    const faceAnalysis = {
      faceDetected: true,
      dominantExpression: 'stressed',
      confidence: 0.80
    };

    const fusion = executeMultimodalFusion({
      textAnalysis,
      faceAnalysis,
      context: { rawText: 'I am overwhelmed by these continuous deadlines and pressure' }
    });

    assert.strictEqual(fusion.fusionState, FUSION_STATES.MULTIMODAL_AGREE);
    assert.strictEqual(fusion.fusedSignal, 'stress_overwhelm');
    assert.deepStrictEqual(fusion.modalitiesUsed, ['text', 'face']);
    assert.ok(fusion.conflictMetric.conflictScore < 0.35);
    assert.strictEqual(fusion.confidenceLevel, 'Moderate to High');
    assert.ok(fusion.displaySummary.includes('may both be associated with'));
  });

  // 4. Text + Face Disagreement (Conflict: DO NOT force a winner)
  await t.test('4. Text + Face Disagreement: Words say stress, face shows calm -> MULTIMODAL_CONFLICT with NO forced winner', () => {
    const textAnalysis = {
      primarySignal: { signal: 'stress_overwhelm', label: SIGNAL_LABELS.stress_overwhelm, confidence: 0.90 },
      rawConfidence: 0.90,
      allSignals: [
        { signal: 'stress_overwhelm', probability: 0.90 },
        { signal: 'neutral_unclear', probability: 0.10 }
      ]
    };
    const faceAnalysis = {
      faceDetected: true,
      dominantExpression: 'calm',
      confidence: 0.85
    };

    const fusion = executeMultimodalFusion({
      textAnalysis,
      faceAnalysis,
      context: { rawText: 'I am overwhelmed and drowning in intense workload' }
    });

    assert.strictEqual(fusion.fusionState, FUSION_STATES.MULTIMODAL_CONFLICT);
    assert.strictEqual(fusion.fusedSignal, null, 'Conflict state must NEVER force a single winner');
    assert.strictEqual(fusion.confidenceLevel, 'Low / Mixed Signals');
    assert.ok(fusion.conflictMetric.conflictScore >= 0.65);
    assert.ok(fusion.displaySummary.includes('mixed signals'));
    assert.ok(fusion.userFacing.validationPrompt.options.some(o => o.id === 'YES_TEXT'));
    assert.ok(fusion.userFacing.validationPrompt.options.some(o => o.id === 'YES_FACE'));
  });

  // 5. Low-Quality Face
  await t.test('5. Low-Quality Face: High occlusion/poor lighting drops quality tier and discounts face', () => {
    const degradedFace = {
      faceDetected: true,
      dominantExpression: 'sad',
      confidence: 0.30,
      quality: { occlusion: 0.85, lighting: 0.20, clarity: 0.30 }
    };
    const quality = evaluateFaceQuality(degradedFace);
    assert.ok(quality.score < 0.35);
    assert.ok(quality.tier === 'LOW_QUALITY' || quality.tier === 'INSUFFICIENT');

    const textAnalysis = {
      primarySignal: { signal: 'hope_optimism', label: SIGNAL_LABELS.hope_optimism, confidence: 0.85 },
      rawConfidence: 0.85
    };

    const fusion = executeMultimodalFusion({
      textAnalysis,
      faceAnalysis: degradedFace,
      context: { rawText: 'I am feeling hopeful about the new beginning and progress' }
    });

    // Face quality is insufficient to force conflict
    assert.ok(fusion.fusionState === FUSION_STATES.TEXT_ONLY || fusion.fusionState === FUSION_STATES.LOW_QUALITY);
  });

  // 6. High-Uncertainty Text
  await t.test('6. High-Uncertainty Text: Marks confidence as tentative and reduces text influence', () => {
    const textAnalysis = {
      primarySignal: { signal: 'sadness_grief', label: SIGNAL_LABELS.sadness_grief, confidence: 0.30 },
      rawConfidence: 0.30,
      uncertainty: { isUncertain: true, entropy: 1.85, confidenceMargin: 0.02 }
    };
    const quality = evaluateTextQuality(textAnalysis, 'something');
    assert.ok(quality.score < 0.70);

    const fusion = executeMultimodalFusion({
      textAnalysis,
      faceAnalysis: null,
      context: { rawText: 'something' }
    });
    assert.strictEqual(fusion.confidenceLevel, 'Tentative');
    assert.ok(fusion.uncertaintyNote.includes('tentative'));
  });

  // 7. High-Uncertainty Face
  await t.test('7. High-Uncertainty Face: Penalizes face weight in fusion', () => {
    const uncertainFace = {
      faceDetected: true,
      dominantExpression: 'angry',
      confidence: 0.40,
      uncertainty: { isUncertain: true }
    };
    const quality = evaluateFaceQuality(uncertainFace);
    assert.ok(quality.score < 0.50);
  });

  // 8. Missing Face
  await t.test('8. Missing Face: Camera not used or camera denied is handled cleanly', () => {
    const textAnalysis = {
      primarySignal: { signal: 'calm_peace', label: SIGNAL_LABELS.calm_peace, confidence: 0.80 },
      rawConfidence: 0.80
    };
    const faceAnalysis = {
      faceDetected: false,
      statusReason: 'Camera permission denied'
    };

    const fusion = executeMultimodalFusion({
      textAnalysis,
      faceAnalysis,
      context: { rawText: 'I feel grounded and calm' }
    });

    assert.strictEqual(fusion.fusionState, FUSION_STATES.TEXT_ONLY);
    assert.strictEqual(fusion.faceStatus, 'Camera permission denied');
    assert.deepStrictEqual(fusion.modalitiesUsed, ['text']);
  });

  // 9. Missing Text
  await t.test('9. Missing Text: Empty text returns INSUFFICIENT quality tier', () => {
    const quality = evaluateTextQuality(null, '');
    assert.strictEqual(quality.tier, 'INSUFFICIENT');
    assert.strictEqual(quality.score, 0.0);
  });

  // 10. Both Modalities Insufficient
  await t.test('10. Both Modalities Insufficient: Yields INSUFFICIENT_EVIDENCE state without crashing', () => {
    const fusion = executeMultimodalFusion({
      textAnalysis: null,
      faceAnalysis: null,
      context: { rawText: '' }
    });

    assert.strictEqual(fusion.fusionState, FUSION_STATES.INSUFFICIENT_EVIDENCE);
    assert.deepStrictEqual(fusion.modalitiesUsed, []);
    assert.strictEqual(fusion.fusedSignal, 'neutral_unclear');
    assert.ok(fusion.displaySummary.includes('could not observe sufficient signal'));
    assert.strictEqual(fusion.requiresValidation, true);
  });

  // 11. User says Yes
  await t.test('11. User says Yes: Confirms AI observation into validated context', () => {
    const aiInterpretation = {
      fusedSignal: 'stress_overwhelm',
      confidenceLevel: 'Moderate to High',
      displaySummary: 'VedAI observed signals associated with stress.'
    };

    const resolved = resolveValidatedContext({
      rawInput: 'I have too much work',
      aiInterpretation,
      validationChoice: 'YES'
    });

    assert.strictEqual(resolved.finalValidatedContext, 'stress_overwhelm');
    assert.strictEqual(resolved.validationRecord.choice, 'YES');
    assert.ok(resolved.workingRationale.includes('confirmed the AI observation as accurate'));
  });

  // 12. User says Partly
  await t.test('12. User says Partly: Acknowledges partial resonance without forcing full certainty', () => {
    const aiInterpretation = {
      fusedSignal: 'anxiety_fear',
      confidenceLevel: 'Moderate',
      displaySummary: 'VedAI observed worry signals.'
    };

    const resolved = resolveValidatedContext({
      rawInput: 'I feel uneasy',
      aiInterpretation,
      validationChoice: 'PARTLY',
      userCorrection: 'More confused than scared'
    });

    assert.strictEqual(resolved.finalValidatedContext, 'More confused than scared');
    assert.strictEqual(resolved.validationRecord.choice, 'PARTLY');
  });

  // 13. User says Not really
  await t.test('13. User says Not really: Replaces AI estimate with open self-directed reflection', () => {
    const aiInterpretation = {
      fusedSignal: 'anger_frustration',
      confidenceLevel: 'Moderate'
    };

    const resolved = resolveValidatedContext({
      rawInput: 'I was thinking about my schedule',
      aiInterpretation,
      validationChoice: 'NOT_REALLY'
    });

    assert.strictEqual(resolved.finalValidatedContext, 'Self-Directed Reflection');
    assert.strictEqual(resolved.validationRecord.choice, 'NOT_REALLY');
    assert.ok(resolved.workingRationale.includes('proceeding with open reflection'));
  });

  // 14. User Correction (Highest Priority)
  await t.test('14. User Correction (Highest Priority): User typed correction overrides any AI estimation', () => {
    const aiInterpretation = {
      fusedSignal: 'anxiety_fear',
      confidenceLevel: 'High'
    };

    const resolved = resolveValidatedContext({
      rawInput: 'I could not sleep',
      aiInterpretation,
      validationChoice: 'USER_CORRECTED',
      userCorrection: 'I am not scared. I am grieving the loss of my mentor.'
    });

    assert.strictEqual(resolved.finalValidatedContext, 'I am not scared. I am grieving the loss of my mentor.');
    assert.strictEqual(resolved.validationRecord.choice, 'USER_CORRECTED');
    assert.ok(resolved.workingRationale.includes('highest priority'));
  });

  // 15. Safety-Sensitive Input
  await t.test('15. Safety-Sensitive Input: Immediate risk input is intercepted before reflection or LLM', () => {
    const crisisInput = 'I cannot bear this life anymore, I want to end it all';
    const safety = assessSafety(crisisInput);
    assert.strictEqual(safety.isSafe, false);
    assert.strictEqual(safety.tier, 'IMMEDIATE_RISK');
    assert.strictEqual(safety.action, 'ESCALATE_CRISIS_SUPPORT');
  });

  // 16. Gita Retrieval Interaction: Contextual inquiry, never proof of emotion
  await t.test('16. Gita Retrieval: Retrieved verses offer reflective wisdom, not proof of emotion', () => {
    const verses = findRelevantVerses('exam anxiety fear duty', 2);
    assert.ok(verses.length > 0);
    const v = verses[0].verse;
    assert.ok(v.id);
    assert.ok(v.verifiedTranslation.length > 0);
    // Verified scripture is ancient philosophical wisdom, not psychological diagnosis
    assert.ok(!v.verifiedTranslation.toLowerCase().includes('diagnosis'));
  });

  // 17. LLM Receives Structured Evidence Contract
  await t.test('17. LLM Prompt receives structured multimodal observational evidence', () => {
    const prompt = buildGroundedPrompt({
      userInput: 'I am feeling burdened by exams',
      validatedContext: 'stress_overwhelm',
      retrievedEvidence: [],
      userCorrection: null,
      multimodalEvidence: {
        fusionState: FUSION_STATES.MULTIMODAL_AGREE,
        confidenceLevel: 'Moderate to High',
        displaySummary: 'VedAI detected signals associated with stress in text and face.',
        textEvidence: { label: 'Signals associated with stress' },
        faceEvidence: { label: 'Facial cues associated with stress' }
      },
      safetyState: 'NORMAL'
    });

    assert.ok(prompt.includes('<multimodal_observational_evidence>'));
    assert.ok(prompt.includes('Fusion State: MULTIMODAL_AGREE'));
    assert.ok(prompt.includes('Confidence Level: Moderate to High'));
    assert.ok(prompt.includes('DO NOT invent emotions or contradict the structured multimodal evidence'));
  });

  // 18. LLM Cannot Override User Correction
  await t.test('18. LLM cannot override user correction', async () => {
    const reflection = await generateGroundedReflection({
      userInput: 'I am feeling uneasy',
      validatedContext: 'I am grieving my grandmother',
      retrievedEvidence: [],
      userCorrection: 'I am grieving my grandmother'
    });

    assert.ok(reflection.understandingSummary.includes('grieving my grandmother'));
    assert.ok(reflection.understandingSummary.includes('honors your self-awareness above all inferences'));
  });

  // 19. Invalid / Malformed Modality Payload
  await t.test('19. Invalid modality payload handled gracefully without uncaught exceptions', () => {
    assert.doesNotThrow(() => {
      const res = executeMultimodalFusion({
        textAnalysis: { corrupt: true },
        faceAnalysis: 'invalid-string',
        context: null
      });
      assert.ok(res.fusionState);
    });
  });

  // 20. Probability Distribution Validation
  await t.test('20. Probability distribution standardizes across 7 canonical classes and sums to ~1.0', () => {
    const rawData = {
      allSignals: [
        { signal: 'stress_overwhelm', probability: 0.60 },
        { signal: 'anxiety_fear', probability: 0.40 }
      ]
    };
    const dist = standardizeDistribution(rawData, 'text');
    assert.strictEqual(Object.keys(dist).length, 7);
    const sum = Object.values(dist).reduce((acc, v) => acc + v, 0);
    assert.ok(Math.abs(sum - 1.0) < 0.02, `Sum should be 1.0, got ${sum}`);
  });

  // 21. Privacy: No Raw Camera Frames Stored or Returned
  await t.test('21. Privacy: No raw image buffers, base64 strings, or camera frames persisted', () => {
    const faceAnalysis = {
      faceDetected: true,
      dominantExpression: 'calm',
      confidence: 0.85
    };
    const fusion = executeMultimodalFusion({
      textAnalysis: { primarySignal: { signal: 'calm_peace' }, rawConfidence: 0.8 },
      faceAnalysis
    });

    const serialized = JSON.stringify(fusion);
    assert.ok(!serialized.includes('base64'));
    assert.ok(!serialized.includes('data:image'));
    assert.ok(!serialized.includes('rawFrame'));
    assert.strictEqual(fusion.researchMetadata.rawFrame, undefined);
  });

  // 22. Fallback Behavior when ML service is offline
  await t.test('22. Fallback behavior clearly flags heuristic source and proceeds with quality penalty', async () => {
    const fallbackText = estimateTextSignals('i am having a stressful day', 'ML service offline');
    assert.strictEqual(fallbackText.source, 'heuristic_fallback');
    assert.strictEqual(fallbackText.isFallback, true);

    const quality = evaluateTextQuality(fallbackText, 'i am having a stressful day');
    assert.ok(quality.score <= 0.65, 'Heuristic fallback must receive quality penalty');

    const fusion = executeMultimodalFusion({
      textAnalysis: fallbackText,
      faceAnalysis: null
    });
    assert.strictEqual(fusion.isFallback, true);
    assert.strictEqual(fusion.fusionState, FUSION_STATES.TEXT_ONLY);
  });

  // 23. Real Multilingual ML Text Emotion (Phase 2D) Remains Fully Operational
  await t.test('23. Phase 2D Real Multilingual ML Text Emotion remains operational', async () => {
    const text = 'I am overwhelmed with continuous deadlines and exhaustion';
    const res = await processEmotionIntelligence(text);

    assert.strictEqual(res.textAnalysis.source, 'distilbert_multilingual_ml');
    assert.strictEqual(res.textAnalysis.isFallback, false);
    assert.strictEqual(res.textAnalysis.primarySignal.signal, 'stress_overwhelm');
    assert.ok(res.textAnalysis.primarySignal.probability > 0.4);
    assert.ok(res.fusion);
    assert.strictEqual(res.fusion.fusionState, FUSION_STATES.TEXT_ONLY);
  });

});
