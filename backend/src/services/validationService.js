/**
 * Human-in-the-Loop Validation Service
 * 
 * Rules:
 * 1. The user's input/correction ALWAYS overrides the AI's estimation.
 * 2. Never argue with the user's emotional reality.
 * 3. Keeps separate audit logs for:
 *    - original user input
 *    - AI model interpretation
 *    - user validation choice (YES, PARTLY, NOT_REALLY, CUSTOM)
 *    - user correction text
 *    - final working context
 */

const VALIDATION_CHOICES = {
  YES: 'ACCURATE',
  PARTLY: 'PARTIALLY_ACCURATE',
  NOT_REALLY: 'NOT_ACCURATE',
  TELL_VEDAI: 'USER_CORRECTED',
  SKIPPED: 'CONTINUED_WITHOUT_VALIDATION'
};

const resolveValidatedContext = ({
  rawInput,
  aiInterpretation,
  validationChoice,
  userCorrection = ''
}) => {
  let finalContext = '';
  let rationale = '';

  switch (validationChoice) {
    case 'YES':
    case 'ACCURATE':
      finalContext = aiInterpretation.fusedSignal || aiInterpretation.primarySignal?.signal || 'General Reflection';
      rationale = 'User confirmed the AI observation as accurate.';
      break;

    case 'PARTLY':
    case 'PARTIALLY_ACCURATE':
      finalContext = userCorrection.trim()
        ? userCorrection.trim()
        : `${aiInterpretation.fusedSignal} (partially resonated)`;
      rationale = 'User marked signal as partially accurate; guided context adjusted.';
      break;

    case 'NOT_REALLY':
    case 'NOT_ACCURATE':
    case 'TELL_VEDAI':
    case 'USER_CORRECTED':
      if (userCorrection && userCorrection.trim()) {
        finalContext = userCorrection.trim();
        rationale = 'User explicitly corrected the signal. User stated context has highest priority.';
      } else {
        finalContext = 'Self-Directed Reflection';
        rationale = 'User indicated AI signal was inaccurate; proceeding with open reflection without assumptions.';
      }
      break;

    case 'YES_TEXT':
      finalContext = aiInterpretation.textEvidence?.primarySignal || aiInterpretation.fusedSignal || 'Reflective Thought';
      rationale = 'User validated that their written words reflect their true inner state.';
      break;

    case 'YES_FACE':
      finalContext = aiInterpretation.faceEvidence?.canonicalSignal || aiInterpretation.fusedSignal || 'Emotional Presence';
      rationale = 'User validated that their facial cues reflect their true inner state.';
      break;

    case 'SKIPPED':
    case 'CONTINUED_WITHOUT_VALIDATION':
    default:
      finalContext = aiInterpretation.fusedSignal || 'Open Reflection';
      rationale = 'User chose to continue directly without validating.';
      break;
  }

  return {
    rawInput,
    aiInterpretation: {
      signal: aiInterpretation.fusedSignal || aiInterpretation.primarySignal?.signal,
      confidence: aiInterpretation.confidenceLevel || 'Tentative',
      summary: aiInterpretation.displaySummary
    },
    validationRecord: {
      choice: validationChoice,
      userCorrection: userCorrection.trim() || null,
      timestamp: new Date().toISOString()
    },
    finalValidatedContext: finalContext,
    workingRationale: rationale
  };
};

module.exports = {
  resolveValidatedContext,
  VALIDATION_CHOICES
};
