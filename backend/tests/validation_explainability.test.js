const { test, describe } = require('node:test');
const assert = require('node:assert');

const { resolveValidatedContext } = require('../src/services/validationService');
const { executeMultimodalFusion, FUSION_STATES } = require('../src/services/multimodalFusionService');
const { 
  recordResearchTelemetry, 
  getResearchMetricsSummary,
  createTelemetryPayload 
} = require('../src/services/telemetryService');
const { generateGroundedReflection } = require('../src/services/llmService');
const journalRepository = require('../src/repositories/journalRepository');

describe('VedAI 2.0 — Phase 2G Human Validation, Explainability & Research Telemetry Test Suite', () => {

  // ==========================================
  // 1. HUMAN VALIDATION STATE MACHINE & CHOICES
  // ==========================================
  describe('1. Human Validation State Machine', () => {
    
    const mockAiInterpretation = {
      fusedSignal: 'anxiety_fear',
      confidenceLevel: 'High',
      displaySummary: 'VedAI noticed patterns of uncertainty and tension in your written words.',
      textEvidence: {
        primarySignal: 'anxiety_fear',
        confidence: 0.85
      },
      faceEvidence: {
        canonicalSignal: 'calm_peace',
        dominantExpression: 'calm',
        confidence: 0.78,
        available: true
      }
    };

    test('1.1. Option YES/ACCURATE confirms AI observation', () => {
      const result = resolveValidatedContext({
        rawInput: 'I feel nervous about tomorrow.',
        aiInterpretation: mockAiInterpretation,
        validationChoice: 'YES'
      });

      assert.strictEqual(result.finalValidatedContext, 'anxiety_fear');
      assert.strictEqual(result.validationRecord.choice, 'YES');
      assert.match(result.workingRationale, /User confirmed/i);
    });

    test('1.2. Option PARTLY acknowledges partial resonance without forcing full certainty', () => {
      const result = resolveValidatedContext({
        rawInput: 'I feel nervous about tomorrow.',
        aiInterpretation: mockAiInterpretation,
        validationChoice: 'PARTLY',
        userCorrection: 'More nervous than afraid'
      });

      assert.strictEqual(result.finalValidatedContext, 'More nervous than afraid');
      assert.strictEqual(result.validationRecord.choice, 'PARTLY');
      assert.match(result.workingRationale, /partially accurate/i);
    });

    test('1.3. Option NOT_REALLY resets context to Self-Directed Reflection', () => {
      const result = resolveValidatedContext({
        rawInput: 'I feel nervous about tomorrow.',
        aiInterpretation: mockAiInterpretation,
        validationChoice: 'NOT_REALLY'
      });

      assert.strictEqual(result.finalValidatedContext, 'Self-Directed Reflection');
      assert.strictEqual(result.validationRecord.choice, 'NOT_REALLY');
      assert.match(result.workingRationale, /proceeding with open reflection without assumptions/i);
    });

    test('1.4. Option TELL_VEDAI / USER_CORRECTED has absolute epistemological priority', () => {
      const result = resolveValidatedContext({
        rawInput: 'I feel nervous about tomorrow.',
        aiInterpretation: mockAiInterpretation,
        validationChoice: 'USER_CORRECTED',
        userCorrection: 'I am actually feeling excited and eager, not anxious'
      });

      assert.strictEqual(result.finalValidatedContext, 'I am actually feeling excited and eager, not anxious');
      assert.strictEqual(result.validationRecord.userCorrection, 'I am actually feeling excited and eager, not anxious');
      assert.match(result.workingRationale, /User stated context has highest priority/i);
    });

    test('1.5. Option SKIPPED / CONTINUED_WITHOUT_VALIDATION allows non-coercive progression', () => {
      const result = resolveValidatedContext({
        rawInput: 'I feel nervous about tomorrow.',
        aiInterpretation: mockAiInterpretation,
        validationChoice: 'SKIPPED'
      });

      assert.strictEqual(result.finalValidatedContext, 'anxiety_fear');
      assert.strictEqual(result.validationRecord.choice, 'SKIPPED');
      assert.match(result.workingRationale, /continue directly without validating/i);
    });

  });

  // ==========================================
  // 2. MULTIMODAL CONFLICT RESOLUTION
  // ==========================================
  describe('2. Multimodal Conflict UI & Dual-Modality Choices', () => {

    const textAnalysis = {
      primarySignal: { signal: 'anxiety_fear', confidence: 0.85 },
      rawConfidence: 0.85,
      allSignals: [{ signal: 'anxiety_fear', probability: 0.85 }]
    };

    const faceAnalysis = {
      dominantExpression: 'calm',
      confidence: 0.85,
      faceDetected: true,
      allSignals: [{ signal: 'calm', probability: 0.85 }]
    };

    test('2.1. Divergent text and face signals correctly flag MULTIMODAL_CONFLICT', () => {
      const fusion = executeMultimodalFusion({
        textAnalysis,
        faceAnalysis,
        context: { rawText: 'I am feeling quite anxious and worried about everything' }
      });

      assert.strictEqual(fusion.fusionState, FUSION_STATES.MULTIMODAL_CONFLICT);
      assert.ok(fusion.researchMetadata.conflictScore > 0.4);
      assert.match(fusion.displaySummary, /mixed signals/i);
    });

    test('2.2. User selecting YES_TEXT gives full authority to verbal words', () => {
      const fusion = executeMultimodalFusion({
        textAnalysis,
        faceAnalysis,
        context: { rawText: 'I am feeling quite anxious and worried about everything' }
      });

      const resolved = resolveValidatedContext({
        rawInput: 'I am anxious',
        aiInterpretation: fusion,
        validationChoice: 'YES_TEXT'
      });

      assert.strictEqual(resolved.finalValidatedContext, 'anxiety_fear');
      assert.match(resolved.workingRationale, /written words reflect their true inner state/i);
    });

    test('2.3. User selecting YES_FACE gives full authority to facial cues', () => {
      const fusion = executeMultimodalFusion({
        textAnalysis,
        faceAnalysis,
        context: { rawText: 'I am feeling quite anxious and worried about everything' }
      });

      const resolved = resolveValidatedContext({
        rawInput: 'I am anxious',
        aiInterpretation: fusion,
        validationChoice: 'YES_FACE'
      });

      assert.strictEqual(resolved.finalValidatedContext, 'calm_peace');
      assert.match(resolved.workingRationale, /facial cues reflect their true inner state/i);
    });

  });

  // ==========================================
  // 3. LLM RESPECTS USER CORRECTION (NO OVERRIDE)
  // ==========================================
  describe('3. Grounded LLM Respects User Override', () => {

    test('3.1. User correction is passed to LLM and takes precedence over initial model estimation', async () => {
      const llmResult = await generateGroundedReflection({
        userInput: 'I had a terrible quarrel with my team and I feel crushed.',
        validatedContext: 'Determined to rebuild communication respectfully',
        retrievedEvidence: [],
        userCorrection: 'Determined to rebuild communication respectfully',
        multimodalEvidence: {
          fusionState: 'MULTIMODAL_CONFLICT',
          fusedSignal: 'sadness_grief'
        }
      });

      assert.ok(llmResult.understandingSummary.includes('Determined to rebuild communication respectfully'));
      assert.ok(llmResult.reflectionQuestions.length >= 2);
      assert.ok(!llmResult.understandingSummary.includes('We have determined you are suffering from'));
    });

  });

  // ==========================================
  // 4. RESEARCH TELEMETRY SCHEMA & PRIVACY
  // ==========================================
  describe('4. Research Telemetry & Consent Gate', () => {

    const mockFusion = {
      fusionState: 'MULTIMODAL_CONFLICT',
      modalitiesUsed: ['text', 'face'],
      fusedSignal: 'anxiety_fear',
      confidenceLevel: 'Moderate',
      researchMetadata: {
        wText: 0.5,
        wFace: 0.5,
        textQuality: 0.85,
        faceQuality: 0.80,
        conflictScore: 0.65
      },
      textEvidence: {
        source: 'distilbert_multilingual_ml',
        modelVersion: '1.0.0',
        primarySignal: 'anxiety_fear'
      },
      faceEvidence: {
        modelVersion: 'client_mediapipe_v1',
        dominantExpression: 'calm'
      }
    };

    test('4.1. Telemetry is strictly gated on user consent (userConsent: false blocks recording)', async () => {
      const recorded = await recordResearchTelemetry({
        anonymousSessionId: 'anon-test-123',
        fusionResult: mockFusion,
        userValidation: { choice: 'YES' },
        userConsent: false // Consent NOT given
      });

      assert.strictEqual(recorded.recorded, false);
      assert.strictEqual(recorded.reason, 'RESEARCH_CONSENT_NOT_GRANTED');
    });

    test('4.2. Telemetry is recorded when userConsent: true', async () => {
      const recorded = await recordResearchTelemetry({
        anonymousSessionId: 'anon-consent-456',
        fusionResult: mockFusion,
        userValidation: { choice: 'YES_TEXT' },
        userCorrectionPresent: false,
        gitaRetrieved: true,
        userConsent: true // Consent given
      });

      assert.ok(recorded.recorded);
      assert.ok(recorded.eventId);
      assert.strictEqual(recorded.log.fusionState, 'MULTIMODAL_CONFLICT');
      assert.strictEqual(recorded.log.userValidationChoice, 'YES_TEXT');
      assert.strictEqual(recorded.log.userCorrectionPresent, false);
      assert.strictEqual(recorded.log.consentGiven, true);
    });

    test('4.3. Zero raw user text, zero video frames, and boolean-only correction flag', async () => {
      const recorded = await recordResearchTelemetry({
        anonymousSessionId: 'anon-privacy-789',
        fusionResult: mockFusion,
        userValidation: { choice: 'USER_CORRECTED' },
        userCorrectionPresent: true,
        userConsent: true
      });

      assert.ok(recorded.recorded);
      const log = recorded.log;
      // Strictly verify no raw text fields exist on the telemetry object
      assert.strictEqual(log.rawUserInput, undefined);
      assert.strictEqual(log.userCorrection, undefined);
      assert.strictEqual(log.imageBuffer, undefined);
      assert.strictEqual(log.frameData, undefined);
      assert.strictEqual(typeof log.userCorrectionPresent, 'boolean');
      assert.strictEqual(log.userCorrectionPresent, true);
    });

    test('4.4. Telemetry metrics summary computes accurately', async () => {
      const summary = await getResearchMetricsSummary();
      assert.ok(typeof summary.totalEvents === 'number');
      assert.ok(typeof summary.conflictRate === 'number');
      assert.ok(typeof summary.correctionRate === 'number');
      assert.ok(summary.fusionStates);
      assert.ok(summary.validationBreakdown);
    });

  });

  // ==========================================
  // 5. JOURNAL DATA SEGREGATION
  // ==========================================
  describe('5. Journal Content Segregation', () => {

    test('5.1. Journal persists raw user words, AI observation, user validation, and private notes separately', async () => {
      const testUserId = 'test_user_segregation_' + Date.now();
      
      const entry = await journalRepository.create({
        userId: testUserId,
        rawUserInput: 'My authentic thoughts about my team project today.',
        languageDetected: 'English',
        aiEstimatedSignal: 'stress_overwhelm',
        aiConfidence: 'High',
        multimodalState: 'MULTIMODAL_AGREE',
        aiExplanation: 'Verse 2.47 encourages focusing on steady action without fixating on results.',
        userValidationChoice: 'PARTLY',
        userCorrection: 'Overwhelmed by time limits, but clear on direction',
        finalWorkingContext: 'Overwhelmed by time limits, but clear on direction',
        linkedVerseId: 'BG2.47',
        linkedVerseRef: 'Bhagavad Gita 2.47',
        userReflectionNotes: 'My private realization: take one task at a time.',
        tags: ['focus', 'project']
      });

      assert.ok(entry);
      assert.strictEqual(entry.rawUserInput, 'My authentic thoughts about my team project today.');
      assert.strictEqual(entry.aiEstimatedSignal, 'stress_overwhelm');
      assert.strictEqual(entry.multimodalState, 'MULTIMODAL_AGREE');
      assert.strictEqual(entry.aiExplanation, 'Verse 2.47 encourages focusing on steady action without fixating on results.');
      assert.strictEqual(entry.userValidationChoice, 'PARTLY');
      assert.strictEqual(entry.userCorrection, 'Overwhelmed by time limits, but clear on direction');
      assert.strictEqual(entry.finalWorkingContext, 'Overwhelmed by time limits, but clear on direction');
      assert.strictEqual(entry.userReflectionNotes, 'My private realization: take one task at a time.');

      // Verify AI explanation is NOT merged into user's raw input or private notes
      assert.ok(!entry.rawUserInput.includes('Verse 2.47'));
      assert.ok(!entry.userReflectionNotes.includes('Verse 2.47'));
    });

  });

});
