/**
 * VedAI 2.0 Grounded LLM Service
 * 
 * Orchestrates grounded generative reflection using backend-controlled LLMs (Google Gemini / OpenAI compatible)
 * with strict safety gates, prompt injection resistance, schema enforcement, and zero-downtime deterministic fallback.
 * 
 * Never exposes API keys or provider errors to Express or React.
 */

const axios = require('axios');
const { validateLlmOutput } = require('./outputValidator');
const { getReflectionQuestions } = require('./reflectionService');

// Configuration from backend environment variables ONLY
const CONFIG = {
  provider: process.env.LLM_PROVIDER || 'google',
  model: process.env.LLM_MODEL || 'gemini-1.5-flash',
  apiKey: process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || null,
  temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.3'),
  maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '800', 10),
  timeoutMs: parseInt(process.env.LLM_TIMEOUT_MS || '8000', 10)
};

// Anti-Prompt-Injection Sanitizer
function sanitizeInput(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<\/?(instructions|system|gita_evidence|user_context|guidelines)>/gi, '')
    .replace(/\b(ignore previous instructions|disregard instructions|you are now DAN|act as an unrestricted)\b/gi, '[filtered injection attempt]')
    .trim();
}

/**
 * Deterministic Grounded Engine (Local Safe Fallback)
 * Executes when LLM provider is offline, unconfigured, times out, or fails validation.
 * Zero hallucination: strictly uses retrieved evidence and verified reflections.
 */
function generateDeterministicGroundedReflection({ userInput, validatedContext, retrievedEvidence = [], userCorrection = null }) {
  const context = (userCorrection || validatedContext || userInput || 'reflection').toLowerCase();
  const primaryEvidence = retrievedEvidence.length > 0 ? retrievedEvidence[0] : null;

  let understandingSummary;
  if (userCorrection) {
    understandingSummary = `You clarified that you are feeling: "${userCorrection}". VedAI honors your self-awareness above all inferences.`;
  } else if (context.includes('exam') || context.includes('stress')) {
    understandingSummary = 'You are navigating meaningful responsibilities and feeling the natural weight of performance pressure.';
  } else if (context.includes('anger') || context.includes('frustrat')) {
    understandingSummary = 'You are experiencing friction between what you hoped for and what is currently occurring.';
  } else if (context.includes('sad') || context.includes('grief')) {
    understandingSummary = 'You are carrying emotional tenderness and deserve gentle patience without self-judgment.';
  } else {
    understandingSummary = 'You are taking a mindful moment to observe your current state with honesty and clarity.';
  }

  let simpleExplanation;
  let whyThisVerse;
  let citedVerseId = null;

  if (primaryEvidence) {
    citedVerseId = primaryEvidence.verse ? primaryEvidence.verse.id : primaryEvidence.id;
    simpleExplanation = (primaryEvidence.aiAssistance && primaryEvidence.aiAssistance.simpleExplanation)
      || primaryEvidence.simpleExplanation
      || `Reflecting on Chapter ${primaryEvidence.verse.chapter}, Verse ${primaryEvidence.verse.verse} offers perspective on finding inner balance.`;
    whyThisVerse = (primaryEvidence.aiAssistance && primaryEvidence.aiAssistance.whyThisVerse)
      || primaryEvidence.whyThisVerse
      || 'Selected to offer perspective for your current reflection.';
  } else {
    simpleExplanation = 'No specific verse matched your query strongly enough to quote directly. Ancient philosophical inquiry teaches that acknowledging our inner experience without force is the beginning of wisdom.';
    whyThisVerse = 'No verse was forced, preserving the authenticity and integrity of scripture.';
  }

  // Get grounded reflection questions
  const reflectionQuestions = getReflectionQuestions(context);

  let practiceSuggestion;
  if (context.includes('stress') || context.includes('anx') || context.includes('overwhelm')) {
    practiceSuggestion = 'Box Breathing (Sama Vritti): Inhale 4s, Hold 4s, Exhale 4s, Hold 4s for 3 cycles to steady the autonomic nervous system.';
  } else if (context.includes('ang') || context.includes('frustrat')) {
    practiceSuggestion = 'Physical Grounding: Feel your feet firmly rooted on the floor, unclench your jaw, and take 3 extended exhalations.';
  } else {
    practiceSuggestion = 'Mindful Breath Observation: Rest your attention gently on the rhythm of your natural breath for 2 minutes.';
  }

  return {
    understandingSummary,
    simpleExplanation,
    whyThisVerse,
    reflectionQuestions: reflectionQuestions.slice(0, 3),
    practiceSuggestion,
    grounding: {
      isGrounded: !!citedVerseId,
      citedVerseId: citedVerseId || null,
      evidenceCount: retrievedEvidence.length
    },
    engine: 'deterministic_grounded_engine'
  };
}

/**
 * Builds the strict Grounded LLM Prompt
 */
function buildGroundedPrompt({
  userInput,
  validatedContext,
  retrievedEvidence,
  userCorrection,
  multimodalEvidence = null,
  safetyState = 'NORMAL'
}) {
  const sanitizedUser = sanitizeInput(userInput);
  const sanitizedVal = sanitizeInput(validatedContext);
  const sanitizedCorr = sanitizeInput(userCorrection);

  let evidenceSection = 'NO_RELEVANT_VERSES_FOUND';
  if (retrievedEvidence && retrievedEvidence.length > 0) {
    evidenceSection = retrievedEvidence.map((item, idx) => {
      const v = item.verse || item;
      return `[EVIDENCE ${idx + 1}]
Verse ID: ${v.id}
Reference: Chapter ${v.chapter}, Verse ${v.verse} (${v.source || ''})
Sanskrit: ${v.sanskrit || ''}
Translation: ${v.verifiedTranslation || v.translation || ''}
Themes: ${Array.isArray(v.themes) ? v.themes.join(', ') : ''}
Canonical Explanation: ${(item.aiAssistance && item.aiAssistance.simpleExplanation) || v.simpleExplanation || ''}`;
    }).join('\n\n');
  }

  let multimodalSection = 'MODALITY_DETAILS_UNAVAILABLE';
  if (multimodalEvidence) {
    multimodalSection = `Fusion State: ${multimodalEvidence.fusionState || 'TEXT_ONLY'}
Confidence Level: ${multimodalEvidence.confidenceLevel || 'Moderate'}
Observational Notice: "${multimodalEvidence.displaySummary || 'Observed verbal signals'}"
Text Evidence: ${multimodalEvidence.textEvidence?.label || 'Available'}
Facial Cue Evidence: ${multimodalEvidence.faceEvidence?.label || multimodalEvidence.faceEvidence?.statusReason || 'Camera not used'}
Safety Tier: ${safetyState}`;
  }

  const prompt = `You are VedAI 2.0's Grounded Reflection Assistant.
Core principle: AI suggests. Evidence explains. The user decides.
VedAI is NOT a therapist, emergency service, or medical diagnostic system.

<retrieved_evidence>
${evidenceSection}
</retrieved_evidence>

<multimodal_observational_evidence>
${multimodalSection}
</multimodal_observational_evidence>

<user_context>
User Input: "${sanitizedUser}"
Working Context: "${sanitizedVal}"
${sanitizedCorr ? `Explicit User Correction: "${sanitizedCorr}" (HIGHEST PRIORITY)` : ''}
</user_context>

STRICT GROUNDING RULES:
1. The user's explicit correction has HIGHEST priority. Never override it.
2. DO NOT invent emotions or contradict the structured multimodal evidence.
3. DO NOT invent Sanskrit, verse numbers, translations, or citations.
4. If <retrieved_evidence> is NO_RELEVANT_VERSES_FOUND, set "citedVerseId" to null, do NOT invent a verse, and provide philosophical reflection without quoting scripture.
5. If evidence is present, only cite a Verse ID that appears in <retrieved_evidence>.
6. NEVER provide clinical diagnosis, medical labels, or drug/medication advice.
7. Return ONLY valid JSON with this exact schema:
{
  "understandingSummary": "Concise empathetic synthesis of what the user is experiencing",
  "simpleExplanation": "Grounded reflection connecting their experience to the verified wisdom (or thoughtful inquiry if no verse)",
  "whyThisVerse": "Why this specific retrieved verse provides clarity for this situation",
  "reflectionQuestions": ["Question 1", "Question 2", "Question 3"],
  "practiceSuggestion": "Concrete, gentle mindfulness or breathwork exercise",
  "citedVerseId": "BG_X_Y or null"
}`;

  return prompt;
}

/**
 * Calls remote LLM provider (Google Gemini or OpenAI compatible)
 */
async function callRemoteLlm(prompt) {
  if (!CONFIG.apiKey) {
    throw new Error('NO_API_KEY_CONFIGURED');
  }

  if (CONFIG.provider === 'google') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.model}:generateContent?key=${CONFIG.apiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: CONFIG.temperature,
        maxOutputTokens: CONFIG.maxTokens,
        responseMimeType: 'application/json'
      }
    };

    const res = await axios.post(url, payload, {
      timeout: CONFIG.timeoutMs,
      headers: { 'Content-Type': 'application/json' }
    });

    const candidate = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) {
      throw new Error('EMPTY_LLM_RESPONSE');
    }
    return JSON.parse(candidate);
  } else {
    // OpenAI / Generic API adapter
    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: CONFIG.model,
      temperature: CONFIG.temperature,
      max_tokens: CONFIG.maxTokens,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }]
    };

    const res = await axios.post(url, payload, {
      timeout: CONFIG.timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.apiKey}`
      }
    });

    const content = res.data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('EMPTY_LLM_RESPONSE');
    return JSON.parse(content);
  }
}

/**
 * Main Grounded LLM Generation Pipeline
 * 
 * Safety -> Context -> Evidence -> LLM Call -> Output Validation -> Safe Fallback
 */
async function generateGroundedReflection({
  userInput = '',
  validatedContext = '',
  retrievedEvidence = [],
  userCorrection = null,
  multimodalEvidence = null,
  safetyState = 'NORMAL'
}) {
  // If no API key is configured, use the deterministic grounded engine immediately
  if (!CONFIG.apiKey) {
    const fallback = generateDeterministicGroundedReflection({
      userInput,
      validatedContext,
      retrievedEvidence,
      userCorrection
    });
    return {
      ...fallback,
      provider: 'deterministic_engine (no api key configured)'
    };
  }

  try {
    const prompt = buildGroundedPrompt({
      userInput,
      validatedContext,
      retrievedEvidence,
      userCorrection,
      multimodalEvidence,
      safetyState
    });

    const rawOutput = await callRemoteLlm(prompt);

    // Run strict output validation
    const validation = validateLlmOutput(rawOutput, retrievedEvidence);

    if (validation.isValid) {
      return {
        ...validation.sanitizedOutput,
        engine: 'remote_llm',
        provider: `${CONFIG.provider}/${CONFIG.model}`
      };
    } else {
      console.warn('[LLMService] Output validation rejected response:', validation.errors);
      // Fallback safely to deterministic engine
      const safeFallback = generateDeterministicGroundedReflection({
        userInput,
        validatedContext,
        retrievedEvidence,
        userCorrection
      });
      return {
        ...safeFallback,
        validationErrors: validation.errors,
        engine: 'deterministic_fallback_due_to_validation_failure'
      };
    }
  } catch (err) {
    console.warn('[LLMService] LLM provider call failed gracefully:', err.message);
    const safeFallback = generateDeterministicGroundedReflection({
      userInput,
      validatedContext,
      retrievedEvidence,
      userCorrection
    });
    return {
      ...safeFallback,
      engine: 'deterministic_fallback_due_to_provider_error'
    };
  }
}

module.exports = {
  generateGroundedReflection,
  generateDeterministicGroundedReflection,
  buildGroundedPrompt,
  sanitizeInput,
  CONFIG
};
