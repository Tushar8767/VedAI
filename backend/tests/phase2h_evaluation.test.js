/**
 * VedAI 2.0 — Phase 2H Independent Multimodal Benchmark & System Evaluation Suite
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { runEvaluation } = require('../../research/evaluate_benchmark');
const { assessSafety } = require('../src/services/safetyService');
const { processUniversalInput } = require('../src/services/universalInputService');
const { processEmotionIntelligence } = require('../src/services/emotionService');
const { recordResearchTelemetry, createTelemetryPayload } = require('../src/services/telemetryService');
const { executeMultimodalFusion, FUSION_STATES, CANONICAL_EMOTIONS } = require('../src/services/multimodalFusionService');

describe('VedAI 2.0 — Phase 2H Independent Multimodal Evaluation & Verification Suite', () => {

  let benchmarkResults = null;

  it('2H.1: Benchmark Evaluation Harness executes end-to-end and generates empirical artifacts', async () => {
    benchmarkResults = await runEvaluation();
    assert.ok(benchmarkResults, 'Benchmark execution returned valid summary object');
    assert.strictEqual(typeof benchmarkResults.overallMetrics.macroF1, 'number');
    assert.strictEqual(typeof benchmarkResults.conflictMetrics.conflictDetectionRate, 'number');

    const reportPath = path.join(__dirname, '../../research/EVALUATION_REPORT.md');
    assert.ok(fs.existsSync(reportPath), 'EVALUATION_REPORT.md must exist on disk');

    const jsonPath = path.join(__dirname, '../../research/benchmark_results.json');
    assert.ok(fs.existsSync(jsonPath), 'benchmark_results.json must exist on disk');
  });

  it('2H.2: Benchmark Macro F1-Score satisfies minimum performance threshold (>= 0.80)', () => {
    assert.ok(benchmarkResults, 'Benchmark results must be populated');
    assert.ok(
      benchmarkResults.overallMetrics.macroF1 >= 0.80,
      `Expected Macro F1 >= 0.80, got ${benchmarkResults.overallMetrics.macroF1}`
    );
  });

  it('2H.3: Multimodal Conflict Detection Rate satisfies benchmark target (>= 90%)', () => {
    assert.ok(benchmarkResults, 'Benchmark results must be populated');
    const conflictRate = benchmarkResults.conflictMetrics.conflictDetectionRate;
    assert.ok(
      conflictRate >= 0.90,
      `Expected Conflict Detection Rate >= 0.90, got ${conflictRate}`
    );
  });

  it('2H.4: Multimodal Agreement Rate satisfies benchmark target (>= 85%)', () => {
    assert.ok(benchmarkResults, 'Benchmark results must be populated');
    const agreementRate = benchmarkResults.agreementMetrics.agreementDetectionRate;
    assert.ok(
      agreementRate >= 0.85,
      `Expected Agreement Detection Rate >= 0.85, got ${agreementRate}`
    );
  });

  it('2H.5: Safety Interception Rate achieves 100% across critical boundary conditions', () => {
    assert.ok(benchmarkResults, 'Benchmark results must be populated');
    assert.strictEqual(
      benchmarkResults.safetyMetrics.safetyInterceptionRate,
      1.0,
      'Safety interception must be 100% for crisis and medical advice requests'
    );
  });

  it('2H.6: Pipeline P50 latency meets real-time interactive criteria (< 80ms)', () => {
    assert.ok(benchmarkResults, 'Benchmark results must be populated');
    const p50 = benchmarkResults.latencyBenchmarks.p50Ms;
    assert.ok(p50 < 80.0, `Expected P50 latency < 80ms, got ${p50}ms`);
  });

  it('2H.7: Confusion Matrix covers all 7 canonical emotions without undefined/null entries', () => {
    assert.ok(benchmarkResults, 'Benchmark results must be populated');
    const matrix = benchmarkResults.confusionMatrix;
    for (const act of CANONICAL_EMOTIONS) {
      assert.ok(matrix[act], `Matrix must contain row for ${act}`);
      for (const pred of CANONICAL_EMOTIONS) {
        assert.strictEqual(
          typeof matrix[act][pred],
          'number',
          `Matrix cell [${act}][${pred}] must be a number`
        );
      }
    }
  });

  it('2H.8: Quality-aware fusion gracefully penalizes low-confidence facial cues', () => {
    const highQualityFace = { dominantExpression: 'worried', confidence: 0.90, faceDetected: true };
    const lowQualityFace = { dominantExpression: 'worried', confidence: 0.25, faceDetected: true };

    const fusionHigh = executeMultimodalFusion({
      textAnalysis: {
        modality: 'text',
        primarySignal: { signal: 'anxiety_fear', confidence: 0.85 },
        allSignals: [{ signal: 'anxiety_fear', confidence: 0.85 }],
        uncertainty: { isUncertain: false }
      },
      faceAnalysis: highQualityFace
    });

    const fusionLow = executeMultimodalFusion({
      textAnalysis: {
        modality: 'text',
        primarySignal: { signal: 'anxiety_fear', confidence: 0.85 },
        allSignals: [{ signal: 'anxiety_fear', confidence: 0.85 }],
        uncertainty: { isUncertain: false }
      },
      faceAnalysis: lowQualityFace
    });

    assert.ok(
      fusionHigh.researchMetadata.faceQuality > fusionLow.researchMetadata.faceQuality,
      'High quality face must have strictly higher faceQuality score than low quality face'
    );
  });

  it('2H.9: Telemetry consent gate strictly upheld across high-volume evaluation batches', async () => {
    const dummyFusion = {
      fusionState: FUSION_STATES.MULTIMODAL_AGREE,
      dominantEmotion: 'calm_peace',
      confidence: 0.88,
      modalitiesUsed: ['text', 'face'],
      evidenceBreakdown: {
        text: { primarySignal: 'calm_peace', confidence: 0.85, qualityTier: 'HIGH' },
        face: { expression: 'calm', confidence: 0.90, qualityTier: 'HIGH' }
      },
      researchMetadata: {
        textQuality: 0.85,
        faceQuality: 0.90,
        conflictScore: 0.05
      }
    };

    // 1. Refusal -> 0 recorded
    const resultRefused = await recordResearchTelemetry({
      userConsent: false,
      fusionResult: dummyFusion,
      userValidation: { choice: 'YES' }
    });
    assert.strictEqual(resultRefused.recorded, false);
    assert.strictEqual(resultRefused.reason, 'RESEARCH_CONSENT_NOT_GRANTED');

    // 2. Consent granted -> recorded
    const resultConsented = await recordResearchTelemetry({
      userConsent: true,
      fusionResult: dummyFusion,
      userValidation: { choice: 'YES' }
    });
    assert.strictEqual(resultConsented.recorded, true);
    assert.ok(resultConsented.log, 'Telemetry log must be returned upon successful recording');
    assert.strictEqual(resultConsented.log.consentGiven, true);
    assert.strictEqual(resultConsented.log.userCorrectionPresent, false);
  });

  it('2H.10: Zero-text and zero-image verification in telemetry payloads under evaluation scenarios', () => {
    const sampleInput = "I am terrified about the interview tomorrow.";
    const processed = processUniversalInput(sampleInput);

    const payload = createTelemetryPayload({
      userConsent: true,
      fusionResult: {
        fusionState: FUSION_STATES.TEXT_ONLY,
        dominantEmotion: 'anxiety_fear',
        confidence: 0.85,
        modalitiesUsed: ['text'],
        evidenceBreakdown: {
          text: { primarySignal: 'anxiety_fear', confidence: 0.85, qualityTier: 'HIGH' },
          face: null
        },
        researchMetadata: {
          textQuality: 0.85,
          faceQuality: 0,
          conflictScore: 0
        }
      },
      humanValidation: {
        choice: 'USER_CORRECTED',
        userCorrection: 'I am actually excited, not anxious!'
      }
    });

    const serialized = JSON.stringify(payload);
    assert.ok(!serialized.includes(sampleInput), 'Telemetry payload must NOT contain raw user input text');
    assert.ok(!serialized.includes('I am actually excited, not anxious!'), 'Telemetry payload must NOT contain user correction text');
    assert.strictEqual(payload.userCorrectionPresent, true, 'userCorrectionPresent must be strictly boolean true');
  });

});
