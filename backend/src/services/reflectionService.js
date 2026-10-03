/**
 * Reflection & Guidance Service
 * 
 * Generates gentle, non-judgmental reflection inquiries tailored to the user's validated context.
 * Never diagnoses, lectures, or forces advice.
 */

const REFLECTION_PROMPTS = {
  stress_overwhelm: [
    'What is one small aspect of this situation that you can directly influence today?',
    'If you paused for 10 minutes right now, what is the most restorative thing you could do for yourself?',
    'What burden are you carrying right now that does not belong entirely to you?'
  ],
  anxiety_fear: [
    'When you look at this fear, what is the specific story your mind is telling you about the future?',
    'Have you faced a time in the past when you felt similarly uncertain and made it through?',
    'What is one undeniable truth about this moment, right here and now, where you are safe?'
  ],
  anger_frustration: [
    "What expectation did you hold about this situation or person that wasn't met?",
    'If this anger is trying to protect something important to you, what value is it defending?',
    'What would responding with calm dignity look like instead of immediate reaction?'
  ],
  sadness_grief: [
    'Can you give yourself permission to feel this without judging yourself for having these feelings?',
    'What kind, compassionate words would you offer to a dear friend in your exact shoes?',
    'What gentle comfort does your mind or body need most right now?'
  ],
  general: [
    'What is the most meaningful insight or feeling you notice within yourself today?',
    'If you could step back and observe yourself with complete warmth and no judgment, what would you see?',
    'What is one thing, however small, that brought you a moment of stillness today?'
  ]
};

const getReflectionQuestions = (validatedContext = '') => {
  const query = validatedContext.toLowerCase();
  
  if (query.includes('stress') || query.includes('overwhelm') || query.includes('exam')) {
    return REFLECTION_PROMPTS.stress_overwhelm;
  }
  if (query.includes('anx') || query.includes('fear') || query.includes('scared') || query.includes('worry')) {
    return REFLECTION_PROMPTS.anxiety_fear;
  }
  if (query.includes('ang') || query.includes('frustrat') || query.includes('annoy')) {
    return REFLECTION_PROMPTS.anger_frustration;
  }
  if (query.includes('sad') || query.includes('grief') || query.includes('lonely') || query.includes('hurt')) {
    return REFLECTION_PROMPTS.sadness_grief;
  }

  return REFLECTION_PROMPTS.general;
};

module.exports = {
  getReflectionQuestions,
  REFLECTION_PROMPTS
};
