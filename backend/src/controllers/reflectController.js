const { assessSafety } = require('../services/safetyService');
const { processUniversalInput } = require('../services/universalInputService');
const { processEmotionIntelligence } = require('../services/emotionService');
const { resolveValidatedContext } = require('../services/validationService');
const { findRelevantVerses } = require('../services/gitaService');
const { getReflectionQuestions } = require('../services/reflectionService');
const { getPractices } = require('../services/practiceService');

const { generateGroundedReflection } = require('../services/llmService');

// POST /api/reflect/orchestrate
// Main AI Orchestration Pipeline: Express -> Safety -> Universal Input -> Validate -> Gita RAG -> Grounded LLM -> React
const orchestrateReflection = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const {
      userInput,
      faceData = null,
      validation = null // { choice, userCorrection }
    } = req.body;

    // STEP 1: SAFETY GATEKEEPER (Pre-LLM)
    const safetyCheck = assessSafety(userInput);
    if (!safetyCheck.isSafe) {
      return res.status(200).json({
        success: true,
        pipelineStep: 'SAFETY_INTERCEPT',
        safety: safetyCheck,
        disclaimer: 'Safety takes immediate precedence over normal AI reflection.',
        latencyMs: Date.now() - startTime
      });
    }

    // STEP 2: UNIVERSAL INPUT PREPROCESSING
    const processedInput = processUniversalInput(userInput);
    if (processedInput.isInsufficient) {
      return res.status(200).json({
        success: true,
        pipelineStep: 'INPUT_CLARIFICATION_REQUIRED',
        inputDetails: processedInput,
        message: processedInput.clarificationPrompt,
        latencyMs: Date.now() - startTime
      });
    }

    // STEP 3: EMOTION INTELLIGENCE & MULTIMODAL FUSION
    const emotionResults = await processEmotionIntelligence(
      processedInput.normalizedText,
      faceData,
      { rawText: processedInput.rawText, language: processedInput.language }
    );

    // STEP 4: HUMAN-IN-THE-LOOP VALIDATION (User Correction Priority)
    let validatedContext;
    if (validation && validation.choice) {
      validatedContext = resolveValidatedContext({
        rawInput: processedInput.rawText,
        aiInterpretation: emotionResults.fusion,
        validationChoice: validation.choice,
        userCorrection: validation.userCorrection || ''
      });
    } else {
      // Prompt user to validate using evidence-aware options
      const dynamicPrompt = emotionResults.fusion.userFacing?.validationPrompt || {
        question: 'Does this interpretation feel accurate to you?',
        options: [
          { id: 'YES', label: 'Accurate' },
          { id: 'PARTLY', label: 'Partially accurate' },
          { id: 'NOT_REALLY', label: 'Not accurate' },
          { id: 'TELL_VEDAI', label: 'Tell VedAI what you actually feel' }
        ]
      };

      validatedContext = {
        rawInput: processedInput.rawText,
        aiInterpretation: emotionResults.fusion,
        pendingValidation: true,
        validationPrompt: dynamicPrompt,
        finalValidatedContext: emotionResults.fusion.fusedSignal || 'Reflective Thought'
      };
    }

    // STEP 5: GITA WISDOM RETRIEVAL (Vector RAG)
    // Never force scripture as proof of an emotional state
    const userCorrectionText = (validation && (validation.choice === 'USER_CORRECTED' || validation.choice === 'TELL_VEDAI'))
      ? validation.userCorrection
      : null;

    const contextForGita = userCorrectionText || processedInput.rawText || validatedContext.finalValidatedContext;
    const relevantVerses = findRelevantVerses(contextForGita, 2);

    // STEP 6: GROUNDED LLM GENERATION & POST-VALIDATION
    const llmReflection = await generateGroundedReflection({
      userInput: processedInput.rawText,
      validatedContext: contextForGita,
      retrievedEvidence: relevantVerses,
      userCorrection: userCorrectionText,
      multimodalEvidence: emotionResults.fusion,
      safetyState: safetyCheck.tier
    });

    // STEP 7: SUGGESTED PRACTICES
    const allPractices = getPractices();
    const suggestedPractice = allPractices[0];

    // Return complete, transparent, grounded payload
    return res.status(200).json({
      success: true,
      pipelineStep: 'COMPLETE_ORCHESTRATION',
      originalInput: processedInput.rawText,
      language: processedInput.language,
      safety: { tier: safetyCheck.tier, category: safetyCheck.category, status: 'Passed' },
      emotionIntelligence: emotionResults,
      multimodalFusion: emotionResults.fusion,
      humanValidation: validatedContext,
      gitaWisdom: relevantVerses,
      reflectionQuestions: llmReflection.reflectionQuestions,
      llmReflection,
      suggestedPractice,
      trustModel: {
        whatUserSaid: processedInput.rawText,
        whatSystemObserved: emotionResults.fusion.displaySummary,
        whatAiInferred: contextForGita,
        whatSourceSupports: relevantVerses.length ? relevantVerses[0].verse.source : 'Ancient Philosophical Principles (No specific verse forced)',
        whatUserDecides: 'You have full autonomy to save, reflect, or discard.'
      },
      researchMetadata: emotionResults.fusion.researchMetadata,
      latencyMs: Date.now() - startTime
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  orchestrateReflection
};
