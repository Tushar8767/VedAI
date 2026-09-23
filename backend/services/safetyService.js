/**
 * VedAI Layered Safety & Crisis Detection Engine
 * 
 * Provides calibrated, multi-layered risk assessment for suicide and self-harm:
 * - Layer 1: Explicit English suicidal & self-harm patterns
 * - Layer 2: Common misspellings, phonetic variants, & leetspeak (e.g. "suecide", "kll myslf", "kms")
 * - Layer 3: Hinglish suicide & self-harm expressions (e.g. "mujhe ab jeena nahi hai", "jaan de dunga")
 * - Layer 4: Marathi suicide & self-harm expressions (e.g. "mala jagaycha nahiye", "mala marun jaavas vatta")
 * - Layer 5: Indirect existential despair & perceived burdensomeness ("everyone would be happier without me")
 * - Contextual Whitelist / Benign Figurative Filter: Prevents false alarms on idioms ("killing it", "dead tired", "dying of laughter", "end this project")
 */

// Benign figurative expressions that must NOT trigger crisis alerts on their own
const BENIGN_FIGURATIVE_PATTERNS = [
  /\b(killing it|crushing it)\b/i,
  /\b(dead tired|dead exhausted|dead asleep)\b/i,
  /\b(dying of laughter|dying to see|dying to know|dying of curiosity)\b/i,
  /\b(end this (project|task|meeting|call|session|assignment|code|run|game|work|job|contract))\b/i
];

// Layer 1: Explicit English patterns
const LAYER_1_EXPLICIT_ENGLISH = [
  /\b(kill myself|end my life|suicide|suicidal)\b/i,
  /\b(self[-\s]?harm|hurt myself|harm myself)\b/i,
  /\b(i do not want to live|i don't want to live|want to die|better off dead)\b/i,
  /\b(don't want to be here anymore|do not want to be here anymore|can't keep going|cannot keep going)\b/i,
  /\b(cannot continue|can't continue|can not continue|no reason to live|there is no reason to live|why live|why should i live)\b/i,
  /\b(easiest way to die|how to die|end it all|ready to end it|slit my|jump off|overdose)\b/i,
  /\b(might kill myself|thinking of killing myself|feel like dying)\b/i
];

// Layer 2: Common misspellings and leetspeak
const LAYER_2_MISSPELLINGS = [
  /\b(suecide|suicid\w*|seppuku)\b/i,
  /\b(kll myslf|kill myslf|kll myself|killin myslf)\b/i,
  /\b(unalive (myself|me)|want to unalive)\b/i,
  /\b(kms|end it all now)\b/i
];

// Layer 3: Hinglish crisis expressions
const LAYER_3_HINGLISH = [
  /\b(mujhe (ab )?jeena nahi|ab jeena nahi hai|jeene ka mann nahi|jeena nahi chahta|jeena nahi chahti)\b/i,
  /\b(jaan de dunga|jaan de dungi|apni jaan le lunga|apni jaan le lungi)\b/i,
  /\b(mar jana chahta|mar jana chahti|marne ka mann hai|marne ja raha|marne ja rahi)\b/i,
  /\b(apne aap ko khatam|khatam kar lunga|khatam kar lungi)\b/i,
  /\b(khudkushi|aatmhatya kar lunga|aatmhatya kar lungi)\b/i
];

// Layer 4: Marathi crisis expressions
const LAYER_4_MARATHI = [
  /\b(mala jagaycha nahiye|jagaychi iccha nahi|jagaycha nahi)\b/i,
  /\b(mala marun jaavas vatta|marun jaavasa vatatay|marava vatata)\b/i,
  /\b(jeevan sampvaycha|aayushya sampvun takaycha)\b/i,
  /\b(aatmhatya karaychi|jiv dyaavasa vatto)\b/i
];

// Layer 5: Indirect existential despair and burdensomeness
const LAYER_5_INDIRECT_BURDEN = [
  /\b(everyone would be (happier|better off) without me|people would be happier without me|world would be better without me)\b/i,
  /\b(better off without me|nobody would miss me if i were gone|nobody cares if i live or die)\b/i,
  /\b(want to disappear forever|just want to disappear|wish i could disappear forever)\b/i,
  /\b(no light at the end of the tunnel and want to disappear|packing my things to leave this world)\b/i,
  /\b(tired of living this life|no point in living anymore|what is the point of being alive)\b/i
];

const CRISIS_MESSAGE = "VedAI noticed language indicating severe emotional distress. Your life and safety matter deeply. Immediate help and free crisis support are available 24/7. In India, call 112 (National Emergency), 14416 (Tele-MANAS Helpline), or 1800-599-0019 (KIRAN Mental Health). In the U.S. or Canada, call or text 988. In the UK, call 111. Please reach out to these trained crisis professionals or a trusted person near you right now. You are not alone.";

function assessSafety(text = "") {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    return {
      riskLevel: "low",
      isHighRisk: false,
      matchedLayer: null,
      matchedPattern: null,
      message: null
    };
  }

  // 1. Check if the text matches high-risk layers
  const checkLayers = [
    { name: "LAYER_1_EXPLICIT_ENGLISH", patterns: LAYER_1_EXPLICIT_ENGLISH },
    { name: "LAYER_2_MISSPELLINGS", patterns: LAYER_2_MISSPELLINGS },
    { name: "LAYER_3_HINGLISH", patterns: LAYER_3_HINGLISH },
    { name: "LAYER_4_MARATHI", patterns: LAYER_4_MARATHI },
    { name: "LAYER_5_INDIRECT_BURDEN", patterns: LAYER_5_INDIRECT_BURDEN }
  ];

  let matchedResult = null;

  for (const layer of checkLayers) {
    const matched = layer.patterns.find((p) => p.test(trimmed));
    if (matched) {
      matchedResult = {
        riskLevel: "high",
        isHighRisk: true,
        matchedLayer: layer.name,
        matchedPattern: matched.toString(),
        message: CRISIS_MESSAGE
      };
      break;
    }
  }

  if (!matchedResult) {
    return {
      riskLevel: "low",
      isHighRisk: false,
      matchedLayer: null,
      matchedPattern: null,
      message: null
    };
  }

  // 2. Figurative idiom filter: If the phrase is purely benign figurative speech, safe-guard against false alarms
  // BUT: If it ALSO contains an unambiguous Layer 1, 2, 3, or 4 pattern outside the idiom, keep high-risk!
  const matchesBenign = BENIGN_FIGURATIVE_PATTERNS.some((p) => p.test(trimmed));
  if (matchesBenign) {
    // Check if the matched pattern is purely part of the benign idiom
    // e.g. "I am killing it at work" matched benign pattern. Does it have an independent suicide expression?
    const hasUnambiguousCrisis = [
      ...LAYER_1_EXPLICIT_ENGLISH,
      ...LAYER_2_MISSPELLINGS,
      ...LAYER_3_HINGLISH,
      ...LAYER_4_MARATHI
    ].some((p) => {
      // Exclude generic word matches that overlap with the benign pattern
      if (/kill/i.test(p.toString()) && /\bkilling it\b/i.test(trimmed) && !/kill myself/i.test(trimmed)) {
        return false;
      }
      if (/die/i.test(p.toString()) && /\bdying of laughter\b/i.test(trimmed) && !/want to die/i.test(trimmed)) {
        return false;
      }
      return p.test(trimmed);
    });

    if (!hasUnambiguousCrisis) {
      return {
        riskLevel: "low",
        isHighRisk: false,
        matchedLayer: null,
        matchedPattern: null,
        message: null,
        benignFiltered: true
      };
    }
  }

  return matchedResult;
}

module.exports = {
  assessSafety,
  CRISIS_MESSAGE,
  BENIGN_FIGURATIVE_PATTERNS,
  LAYER_1_EXPLICIT_ENGLISH,
  LAYER_2_MISSPELLINGS,
  LAYER_3_HINGLISH,
  LAYER_4_MARATHI,
  LAYER_5_INDIRECT_BURDEN
};
