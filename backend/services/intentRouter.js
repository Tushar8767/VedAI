/**
 * VedAI Intent Router
 * Classifies user messages into semantic intent buckets to prevent unnecessary
 * scripture retrieval and ensure relevant, empathetic responses.
 */

const { assessSafety } = require("./safetyService");

const INTENTS = {
  SAFETY_CRISIS: "SAFETY_CRISIS",
  CLINICAL_BOUNDARY: "CLINICAL_BOUNDARY",
  IDENTITY_CAPABILITY: "IDENTITY_CAPABILITY",
  PRIVACY_DATA: "PRIVACY_DATA",
  ADVERSARIAL_PROMPT_INJECTION: "ADVERSARIAL_PROMPT_INJECTION",
  GREETING: "GREETING",
  GENERAL_CONVERSATION: "GENERAL_CONVERSATION",
  PRACTICAL_GUIDANCE: "PRACTICAL_GUIDANCE",
  EMOTIONAL_DISTRESS: "EMOTIONAL_DISTRESS",
  GITA_QUERY: "GITA_QUERY",
  PRACTICE_REQUEST: "PRACTICE_REQUEST",
  JOURNAL_REQUEST: "JOURNAL_REQUEST",
  OUT_OF_SCOPE: "OUT_OF_SCOPE"
};

const GREETING_REGEX = /^(hi|hey|hello|namaste|good\s+(morning|afternoon|evening|day|night)|howdy|greetings|how\s+are\s+you|what's\s+up|sup|thanks|thank\s+you|thx|goodbye|bye|see\s+you)(\s+(ved\s*ai|vedai|there|everyone|all|friend))?[\s!.]*$/i;

const CLINICAL_BOUNDARY_REGEX = /\b(do i have (depression|anxiety|bipolar|adhd|ptsd|schizophrenia)|am i (bipolar|depressed|schizophrenic)|diagnose (my|me)|what medication|which medication|what pills|prescribe|do i need a psychiatrist|need a psychiatrist|should i see a psychiatrist|should i see a doctor|clinical diagnosis|medical diagnosis)\b/i;

const IDENTITY_REGEX = /\b(who are you|what are you|what can you do|tell me about yourself|what is vedai|how do you work|introduce yourself)\b/i;

const PRIVACY_REGEX = /\b(what data (do you|is) store|can i delete (my )?data|can you see my camera|do you store my (emotions?|images?|photos?|voice)|who can access my history|how is my data stored|is my data private|camera privacy|store my emotions|access my (data|history))\b/i;

const PROMPT_INJECTION_REGEX = /\b(ignore (all )?previous instructions|reveal your (system )?prompt|show (internal )?database|system override|jailbreak|disregard previous|developer mode)\b/i;

const GITA_QUERY_REGEX = /\b(gita|bhagavad|shloka|sloka|krishna|arjuna|chapter\s+\d+|verse|\d+\.\d+|scripture|karma\s+yoga|dharma|sanskrit|what\s+does\s+the\s+gita\s+say|teachings?\s+of\s+the\s+gita)\b/i;

const PRACTICE_REQUEST_REGEX = /\b(breath|breathing|meditat|pranayama|mindful|exercise|grounding|calm\s+down|relax|routine|habit|yoga|sleep\s+routine)\b/i;

const JOURNAL_REQUEST_REGEX = /\b(journal|save\s+(this|my|note)|write\s+(down|about|today's\s+reflection)|record\s+this|log\s+this|summarize\s+my\s+day)\b/i;

const PRACTICAL_GUIDANCE_REGEX = /\b(what\s+(should|can)\s+i\s+do|what\s+to\s+do|how\s+(can|do)\s+i|how\s+to\s+(stop|handle|solve|become|stay|manage|deal|prioritize|focus|study|sleep|stop\s+procrastinating|build\s+a\s+habit)|should\s+i|help\s+me\s+(focus|decide|choose|study|organize|restart)|too\s+many\s+things|samajh\s+nahi\s+aa\s+raha|kya\s+karu|kaise\s+karu|decision\s+to\s+make|important\s+decision|don't\s+know\s+what\s+to\s+(choose|do)|confused\s+between|which\s+path\s+to\s+take|dilemma|how\s+should\s+i\s+choose)\b/i;

const EMOTIONAL_DISTRESS_REGEX = /\b(overwhelm(ed|ing)?|overthink(ing)?|lonel(y|iness)|anxious|anxiety|anxity|nervous|nourves|scared|afraid|fear(ful)?|panic|ang(ry|er)|mad|frustrat(ed|ion|ing)?|sad(ness)?|depress(ed|ion|ing)?|grief|heartbreak|fail(ing|ure|ed)|hate\s+myself|hopeless|stress(ed|ful)?|streesed|pressure|im\s+tired|i'm\s+tired|sad\s+af|lost\s+motivation|feel\s+useless|mera\s+mood\s+kharab|stress\s+ho\s+raha|akela|pareshaan|tension|low\s+feel|feel(ing)?\s+low|thod(a|i)?\s+low|feel\s+krtoy|vatatay|watatay|bechain(i)?|ghabrahat|udaas(i)?|mood\s+off)\b|[\u0900-\u097F]*(उदासी|उदास|दुःख|दुखी|कष्ट|दर्द|तनाव|दबाव|थकान|परेशान|चिंता|घबराहट|डर|भय|क्रोध|गुस्सा|अकेलापन)[\u0900-\u097F]*/i;

const GENERAL_CONV_REGEX = /\b(just\s+want\s+to\s+talk|can\s+i\s+tell\s+you|don't\s+know\s+what\s+i'm\s+feeling|feel\s+strange|listen\s+to\s+me|someone\s+to\s+talk)\b/i;

const OUT_OF_SCOPE_REGEX = /\b(python|javascript|java\s+program|c\+\+|coding|write\s+a\s+program|html|css|sql\s+query|capital\s+of|weather\s+in|recipe\s+for|stock\s+price|cybersecurity|election|politics|who\s+won\s+the\s+match|solve\s+this\s+equation|calculus|mathematics|binary\s+search)\b/i;

function routeIntent(message = "", conversationHistory = []) {
  let trimmed = String(message || "").trim();
  // Normalize run-together words (e.g. "overwhelmedI have" -> "overwhelmed I have")
  trimmed = trimmed.replace(/([a-z])([A-Z])/g, '$1 $2');

  // 1. Safety check
  const safety = assessSafety(trimmed);
  if (safety.isHighRisk) {
    return {
      intent: INTENTS.SAFETY_CRISIS,
      confidence: 1.0,
      safety,
      requiresRag: false
    };
  }

  // 2. Clinical / Medical Boundaries
  if (CLINICAL_BOUNDARY_REGEX.test(trimmed)) {
    return {
      intent: INTENTS.CLINICAL_BOUNDARY,
      confidence: 0.98,
      safety,
      requiresRag: false
    };
  }

  // 3. Adversarial / Prompt Injection
  if (PROMPT_INJECTION_REGEX.test(trimmed)) {
    return {
      intent: INTENTS.ADVERSARIAL_PROMPT_INJECTION,
      confidence: 0.98,
      safety,
      requiresRag: false
    };
  }

  // 4. Privacy & Data Sovereignty
  if (PRIVACY_REGEX.test(trimmed)) {
    return {
      intent: INTENTS.PRIVACY_DATA,
      confidence: 0.95,
      safety,
      requiresRag: false
    };
  }

  // 5. Identity & Capabilities
  if (IDENTITY_REGEX.test(trimmed)) {
    return {
      intent: INTENTS.IDENTITY_CAPABILITY,
      confidence: 0.95,
      safety,
      requiresRag: false
    };
  }

  // 6. Out of scope (technical code / general trivia)
  if (OUT_OF_SCOPE_REGEX.test(trimmed)) {
    return {
      intent: INTENTS.OUT_OF_SCOPE,
      confidence: 0.95,
      safety,
      requiresRag: false
    };
  }

  // 7. Greeting / Casual acknowledgement
  if (GREETING_REGEX.test(trimmed)) {
    return {
      intent: INTENTS.GREETING,
      confidence: 0.95,
      safety,
      requiresRag: false
    };
  }

  // 4. Journal action request
  if (JOURNAL_REQUEST_REGEX.test(trimmed)) {
    return {
      intent: INTENTS.JOURNAL_REQUEST,
      confidence: 0.92,
      safety,
      requiresRag: false
    };
  }

  // 5. Practice / Breathing / Grounding request
  if (PRACTICE_REQUEST_REGEX.test(trimmed) && !GITA_QUERY_REGEX.test(trimmed)) {
    return {
      intent: INTENTS.PRACTICE_REQUEST,
      confidence: 0.90,
      safety,
      requiresRag: false
    };
  }

  // 6. Direct Gita inquiry
  if (GITA_QUERY_REGEX.test(trimmed)) {
    return {
      intent: INTENTS.GITA_QUERY,
      confidence: 0.95,
      safety,
      requiresRag: true
    };
  }

  // 7. General conversation openness
  if (GENERAL_CONV_REGEX.test(trimmed)) {
    return {
      intent: INTENTS.GENERAL_CONVERSATION,
      confidence: 0.88,
      safety,
      requiresRag: false
    };
  }

  // 8. Practical guidance questions ("what should I do?")
  if (PRACTICAL_GUIDANCE_REGEX.test(trimmed)) {
    return {
      intent: INTENTS.PRACTICAL_GUIDANCE,
      confidence: 0.88,
      safety,
      requiresRag: false // direct guidance first, Gita offered optionally
    };
  }

  // 9. Emotional reflection / distress
  if (EMOTIONAL_DISTRESS_REGEX.test(trimmed)) {
    return {
      intent: INTENTS.EMOTIONAL_DISTRESS,
      confidence: 0.85,
      safety,
      requiresRag: true // provide supportive reflection + optional wisdom
    };
  }

  // 10. Default / Fallback reflection
  return {
    intent: INTENTS.GENERAL_CONVERSATION,
    confidence: 0.70,
    safety,
    requiresRag: false
  };
}

module.exports = {
  INTENTS,
  routeIntent
};
