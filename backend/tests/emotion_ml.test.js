const test = require('node:test');
const assert = require('node:assert');
const axios = require('axios');
const config = require('../src/config');
const { processEmotionIntelligence, estimateTextSignals, fuseSignals, formatSignalLabel } = require('../src/services/emotionService');

test('VedAI 2.0 — Phase 2D Real Text Emotion ML Verification Suite', async (t) => {

  await t.test('1. Python ML Microservice is online and reports healthy status', async () => {
    const healthUrl = config.mlService.url.replace('/predict', '/health');
    const res = await axios.get(healthUrl, { timeout: 3000 });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'healthy');
    assert.strictEqual(res.data.baseTransformer, 'distilbert-base-multilingual-cased');
    assert.ok(res.data.modelVersion.includes('distilbert-base-multilingual-cased-emotion'));
    assert.strictEqual(res.data.classes.length, 7);
    assert.ok(res.data.classes.includes('stress_overwhelm'));
    assert.ok(res.data.classes.includes('anxiety_fear'));
    assert.ok(res.data.classes.includes('neutral_unclear'));
  });

  await t.test('2. Real ML inference on English input (burnout & deadline pressure)', async () => {
    const text = 'I am overwhelmed by endless deadlines and feel completely stressed out';
    const res = await processEmotionIntelligence(text);
    
    assert.strictEqual(res.textAnalysis.source, 'distilbert_multilingual_ml');
    assert.strictEqual(res.textAnalysis.isFallback, false);
    assert.strictEqual(res.textAnalysis.primarySignal.signal, 'stress_overwhelm');
    assert.ok(res.textAnalysis.primarySignal.probability > 0.4);
    assert.strictEqual(res.textAnalysis.modality, 'text');
    assert.ok(res.disclaimer.includes('probabilistic approximations'));
  });

  await t.test('3. Real ML inference on Hindi Devanagari input (fear of future & panic)', async () => {
    const text = 'मुझे अपने भविष्य को लेकर बहुत गहरा डर और घबराहट महसूस हो रही है';
    const res = await processEmotionIntelligence(text);

    assert.strictEqual(res.textAnalysis.source, 'distilbert_multilingual_ml');
    assert.strictEqual(res.textAnalysis.isFallback, false);
    assert.strictEqual(res.textAnalysis.primarySignal.signal, 'anxiety_fear');
    assert.ok(res.textAnalysis.primarySignal.probability > 0.4);
    assert.strictEqual(typeof res.textAnalysis.uncertainty.entropy, 'number');
  });

  await t.test('4. Real ML inference on Marathi Devanagari input', async () => {
    const text = 'मला या वागण्याचा प्रचंड संताप आणि राग आला आहे';
    const res = await processEmotionIntelligence(text);

    assert.strictEqual(res.textAnalysis.source, 'distilbert_multilingual_ml');
    assert.strictEqual(res.textAnalysis.isFallback, false);
    assert.strictEqual(res.textAnalysis.primarySignal.signal, 'anger_frustration');
    assert.ok(res.textAnalysis.primarySignal.probability > 0.4);
  });

  await t.test('5. Real ML inference on Hinglish code-switching input', async () => {
    const text = 'yaar mujhe exam ka bohot tension ho raha hai kuch samajh nahi aa raha';
    const res = await processEmotionIntelligence(text);

    assert.strictEqual(res.textAnalysis.source, 'distilbert_multilingual_ml');
    assert.strictEqual(res.textAnalysis.isFallback, false);
    assert.strictEqual(res.textAnalysis.primarySignal.signal, 'stress_overwhelm');
    assert.ok(res.textAnalysis.primarySignal.probability > 0.5);
  });

  await t.test('6. Complete probability distribution across all 7 classes', async () => {
    const text = 'I am trying to stay calm and find peace amid the storm';
    const res = await processEmotionIntelligence(text);

    assert.strictEqual(res.textAnalysis.allSignals.length, 7);
    const sumProb = res.textAnalysis.allSignals.reduce((acc, s) => acc + s.probability, 0);
    assert.ok(Math.abs(sumProb - 1.0) < 0.05, `Probabilities must sum to ~1.0, got ${sumProb}`);

    const uniqueSignals = new Set(res.textAnalysis.allSignals.map(s => s.signal));
    assert.strictEqual(uniqueSignals.size, 7);
  });

  await t.test('7. Explicit mathematical uncertainty representation', async () => {
    const text = 'something somewhere might or might not happen';
    const res = await processEmotionIntelligence(text);

    const uncertainty = res.textAnalysis.uncertainty;
    assert.ok(uncertainty !== undefined);
    assert.strictEqual(typeof uncertainty.isUncertain, 'boolean');
    assert.strictEqual(typeof uncertainty.entropy, 'number');
    assert.strictEqual(typeof uncertainty.confidenceMargin, 'number');
    assert.strictEqual(typeof uncertainty.threshold, 'number');
  });

  await t.test('8. Empty / whitespace text returns neutral signal with uncertainty flag', async () => {
    const res = await processEmotionIntelligence('   ');

    assert.strictEqual(res.textAnalysis.primarySignal.signal, 'neutral_unclear');
    assert.strictEqual(res.textAnalysis.uncertainty.isUncertain, true);
  });

  await t.test('9. Multimodal fusion incorporates ML probabilities and uncertainty', async () => {
    const text = 'I am completely stressed out with work';
    const faceData = {
      faceDetected: true,
      dominantExpression: 'stressed',
      confidence: 0.85
    };

    const res = await processEmotionIntelligence(text, faceData);
    assert.strictEqual(res.fusion.fusedSignal, 'stress_overwhelm');
    assert.ok(res.fusion.confidenceLevel.includes('Moderate'));
    assert.strictEqual(res.fusion.requiresValidation, true);
    assert.deepStrictEqual(res.fusion.modalitiesUsed, ['text', 'face']);
  });

  await t.test('10. Graceful fallback when ML microservice is unreachable', async () => {
    const originalUrl = config.mlService.url;
    config.mlService.url = 'http://127.0.0.1:9999/predict'; // dummy unreachable port

    try {
      const res = await processEmotionIntelligence('i am feeling so nervous and scared of tomorrow');
      assert.strictEqual(res.textAnalysis.source, 'heuristic_fallback');
      assert.strictEqual(res.textAnalysis.isFallback, true);
      assert.ok(res.textAnalysis.fallbackReason.includes('Python ML microservice offline'));
      assert.strictEqual(res.textAnalysis.primarySignal.signal, 'anxiety_fear');
      assert.strictEqual(res.fusion.isFallback, true);
    } finally {
      config.mlService.url = originalUrl;
    }
  });

  await t.test('11. Non-diagnostic phrasing verified in all output labels', async () => {
    const classes = [
      'stress_overwhelm', 'anxiety_fear', 'anger_frustration',
      'sadness_grief', 'calm_peace', 'hope_optimism', 'neutral_unclear'
    ];

    for (const c of classes) {
      const label = formatSignalLabel(c);
      assert.ok(!label.toLowerCase().includes('disorder'));
      assert.ok(!label.toLowerCase().includes('diagnos'));
      assert.ok(!label.toLowerCase().includes('patient'));
      assert.ok(!label.toLowerCase().includes('illness'));
    }
  });

});
