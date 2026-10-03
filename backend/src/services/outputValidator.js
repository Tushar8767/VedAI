/**
 * VedAI 2.0 LLM Output Validator & Guardrails
 * 
 * Strict post-generation validation verifying:
 * 1. Output structure and schema conformance
 * 2. Absolute scriptural grounding (zero hallucinated verses or citations)
 * 3. Proscription of medical diagnoses and medication advice
 * 4. Prevention of system instruction / prompt leakage
 */

const MEDICAL_DIAGNOSIS_PATTERNS = [
  /\b(you (?:have|are suffering from)|diagnosed with)\s+(?:(?:severe|mild|moderate|acute|chronic)\s+)?(?:clinical\s+)?(depression|bipolar|schizophrenia|ptsd|ocd|adhd|anxiety disorder|panic disorder)\b/i,
  /\b(i diagnose you|my diagnosis is|prescribe|prescription|take medication|take antidepressants|antidepressant dosage)\b/i,
  /\b(clinical therapy|pharmacotherapy|medical treatment plan)\b/i
];

const PROMPT_LEAKAGE_PATTERNS = [
  /\b(system prompt|my system instructions|as an ai language model instructed by|internal prompt)\b/i,
  /<\/?(instructions|gita_evidence|user_context|guidelines)>/i,
  /\b(ignore previous instructions|you are now in DAN mode)\b/i
];

/**
 * Validates generated reflection output from LLM
 * @param {object} output - Parsed LLM JSON output
 * @param {Array} retrievedEvidence - Verses provided to the LLM as evidence
 * @returns {object} { isValid: boolean, errors: string[], sanitizedOutput: object }
 */
function validateLlmOutput(output, retrievedEvidence = []) {
  const errors = [];

  if (!output || typeof output !== 'object') {
    return {
      isValid: false,
      errors: ['Output must be a valid JSON object'],
      sanitizedOutput: null
    };
  }

  // 1. Structure Verification
  if (!output.understandingSummary || typeof output.understandingSummary !== 'string' || !output.understandingSummary.trim()) {
    errors.push('Missing or empty understandingSummary');
  }

  if (!output.simpleExplanation || typeof output.simpleExplanation !== 'string' || !output.simpleExplanation.trim()) {
    errors.push('Missing or empty simpleExplanation');
  }

  if (!Array.isArray(output.reflectionQuestions) || output.reflectionQuestions.length === 0) {
    errors.push('reflectionQuestions must be a non-empty array of strings');
  }

  // 2. Grounding & Verse Citation Verification
  const validVerseIds = new Set(retrievedEvidence.map(item => item.verse ? item.verse.id : item.id));

  // Check if LLM cited a verse
  const citedVerseId = output.citedVerseId || (output.grounding && output.grounding.citedVerseId);

  if (citedVerseId && citedVerseId !== 'NONE' && citedVerseId !== 'null') {
    if (!validVerseIds.has(citedVerseId)) {
      errors.push(`Grounding violation: LLM cited verse '${citedVerseId}' which was NOT in retrieved evidence (${Array.from(validVerseIds).join(', ') || 'none'})`);
    }
  }

  // Check if retrievedEvidence was empty, LLM must not hallucinate a verse citation
  if (validVerseIds.size === 0 && citedVerseId && citedVerseId !== 'NONE' && citedVerseId !== 'null') {
    errors.push(`Grounding violation: No verses were retrieved, but LLM claimed verse '${citedVerseId}'`);
  }

  // Check for hallucinated scripture citations in text
  const rawText = JSON.stringify(output);
  const chapterVersePattern = /\b(?:BG|Bhagavad Gita|Gita|Chapter)\s*(\d{1,2})[:.](\d{1,2})\b/gi;
  let match;
  while ((match = chapterVersePattern.exec(rawText)) !== null) {
    const ch = parseInt(match[1], 10);
    const v = parseInt(match[2], 10);
    const candidateId = `BG_${ch}_${v}`;
    if (!validVerseIds.has(candidateId) && validVerseIds.size > 0) {
      errors.push(`Grounding violation: LLM output mentioned unretrieved verse ${candidateId}`);
    }
  }

  // 3. Medical Diagnosis & Clinical Claims Prohibition
  for (const pattern of MEDICAL_DIAGNOSIS_PATTERNS) {
    if (pattern.test(rawText)) {
      errors.push('Safety violation: LLM generated clinical medical diagnosis or prescriptive medication advice');
      break;
    }
  }

  // 4. Prompt & System Instruction Leakage
  for (const pattern of PROMPT_LEAKAGE_PATTERNS) {
    if (pattern.test(rawText)) {
      errors.push('Security violation: LLM response leaked system instructions or delimiter tags');
      break;
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      sanitizedOutput: null
    };
  }

  // Sanitize and normalize clean output
  const sanitizedOutput = {
    understandingSummary: output.understandingSummary.trim(),
    simpleExplanation: output.simpleExplanation.trim(),
    whyThisVerse: (output.whyThisVerse || '').trim(),
    reflectionQuestions: output.reflectionQuestions.map(q => String(q).trim()).slice(0, 4),
    practiceSuggestion: typeof output.practiceSuggestion === 'string'
      ? output.practiceSuggestion.trim()
      : (output.practiceSuggestion ? JSON.stringify(output.practiceSuggestion) : 'Gentle mindful breathing (4-4-4) for 2 minutes.'),
    grounding: {
      isGrounded: validVerseIds.size > 0 && !!citedVerseId && citedVerseId !== 'NONE',
      citedVerseId: citedVerseId || (retrievedEvidence.length > 0 ? (retrievedEvidence[0].verse ? retrievedEvidence[0].verse.id : retrievedEvidence[0].id) : null),
      evidenceCount: retrievedEvidence.length
    }
  };

  return {
    isValid: true,
    errors: [],
    sanitizedOutput
  };
}

module.exports = {
  validateLlmOutput,
  MEDICAL_DIAGNOSIS_PATTERNS,
  PROMPT_LEAKAGE_PATTERNS
};
