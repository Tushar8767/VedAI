/**
 * VedAI 2.0 - Deterministic 4-Tier Safety & Responsible AI Engine
 * 
 * Rules:
 * 1. Executes BEFORE any NLP, emotion estimation, or LLM generation.
 * 2. Intercepts immediate danger, self-harm, and crisis.
 * 3. Never attempts to cure, diagnose, or prescribe.
 * 4. Never responds to genuine crisis with poetic scripture alone.
 * 5. Provides accessible national and international crisis resources.
 */

const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'killing myself', 'end my life', 'ending my life', 'want to die', 'harm myself',
  'cutting myself', 'hang myself', 'overdose', 'end it all', 'no reason to live',
  'mar jau', 'aatmhatya', 'jeevan samapt', 'jeena nahi chahta', 'jeena nahi chahti',
  'आत्महत्या', 'अपनी जान देने', 'मर जाऊं', 'जीना नहीं चाहता', 'जीना नहीं चाहती',
  'जीवन समाप्त', 'जीव द्यायचा', 'जीव देणे'
];

const MEDICAL_DIAGNOSIS_KEYWORDS = [
  'diagnose me', 'diagnose my', 'do i have depression', 'do i have bipolar', 'am i schizophrenic',
  'prescribe me', 'prescribe medication', 'what medicine should i take', 'cure my depression', 'what pills'
];

const PROMPT_INJECTION_PATTERNS = [
  /ignore.*(?:previous|prior|all|system).*instructions/i,
  /ignore\s+(?:all\s+|previous\s+|prior\s+)*instructions/i,
  /system\s*prompt/i,
  /jailbreak/i,
  /pretend you are a (?:doctor|therapist|psychiatrist)/i,
  /act as an unrestricted ai/i
];

const assessSafety = (text = '') => {
  if (!text || typeof text !== 'string') {
    return {
      tier: 'NORMAL',
      isSafe: true,
      category: 'EMPTY_OR_NON_TEXT',
      action: 'PROCEED'
    };
  }

  const cleanText = text.toLowerCase().trim();

  // 1. Check for prompt injection attempt
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(cleanText)) {
      return {
        tier: 'POTENTIAL_RISK',
        isSafe: false,
        category: 'PROMPT_INJECTION',
        action: 'SANITIZE_AND_WARN',
        message: 'VedAI operates with strict safety and transparency boundaries. System instructions cannot be modified.'
      };
    }
  }

  // 2. Check for Immediate High Risk / Crisis
  for (const keyword of CRISIS_KEYWORDS) {
    if (cleanText.includes(keyword)) {
      return {
        tier: 'IMMEDIATE_RISK',
        isSafe: false,
        category: 'SELF_HARM_OR_CRISIS',
        action: 'ESCALATE_CRISIS_SUPPORT',
        message: 'If you are in immediate distress or feeling overwhelmed, please know that you are not alone and help is available right now.',
        disclaimer: 'VedAI is an AI reflection tool, not an emergency crisis service or medical professional.',
        resources: [
          {
            name: 'Tele-MANAS (India Government Mental Health Helpline)',
            contact: '14416 or 1800-891-4416',
            availability: '24/7 Toll-Free'
          },
          {
            name: 'KIRAN (India National Mental Health Helpline)',
            contact: '1800-599-0019',
            availability: '24/7 Toll-Free'
          },
          {
            name: 'Vandrevala Foundation Helpline',
            contact: '+91 9999 666 555',
            availability: '24/7 Support'
          },
          {
            name: 'International Suicide & Crisis Lifeline (US/Global)',
            contact: 'Dial 988 or text HOME to 741741',
            availability: '24/7 Free & Confidential'
          }
        ]
      };
    }
  }

  // 3. Check for Medical Diagnosis Requests
  for (const keyword of MEDICAL_DIAGNOSIS_KEYWORDS) {
    if (cleanText.includes(keyword)) {
      return {
        tier: 'SENSITIVE_DISTRESS',
        isSafe: true,
        category: 'MEDICAL_ADVICE_REQUEST',
        action: 'STATE_LIMITATION_AND_REFLECT',
        message: 'VedAI cannot provide clinical diagnoses, psychiatric assessments, or prescribe medications. If you are experiencing persistent mental health concerns, consulting a licensed mental health professional or physician is recommended.',
        reflectionAdvice: 'We can, however, explore what experiences and thoughts you are currently dealing with in a reflective, supportive way.'
      };
    }
  }

  // 4. Normal / Exploratory Input
  return {
    tier: 'NORMAL',
    isSafe: true,
    category: 'GENERAL_REFLECTION',
    action: 'PROCEED'
  };
};

module.exports = {
  assessSafety,
  CRISIS_KEYWORDS
};
