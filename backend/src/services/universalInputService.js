/**
 * Universal Input Preprocessor
 * 
 * Responsibilities:
 * 1. Preserves raw original user input unaltered.
 * 2. Detects primary language and code-switching (English, Hindi, Marathi, Hinglish, Marathinglish).
 * 3. Handles slang, typos, abbreviations, repeated letters without altering user journal text.
 * 4. Filters out empty, random, or meaningless inputs ("...", "asdf", "hmm") without inventing fake emotions.
 */

// Common Hinglish / Marathi / Casual Slang normalization map
const SLANG_MAP = {
  'cooked': 'overwhelmed exhausted',
  'im cooked': 'i am feeling overwhelmed',
  'i am cooked': 'i am feeling overwhelmed',
  'realy': 'really',
  'strest': 'stressed',
  'stressd': 'stressed',
  'anxios': 'anxious',
  'mala tension aahe': 'i am feeling tense and anxious',
  'mala khup tension aahe': 'i am experiencing a lot of anxiety and pressure',
  'kya karu': 'what should i do',
  'kya karu samajh nahi aa raha': 'i am feeling confused and unsure of what to do',
  'samajh nahi aa raha': 'i feel confused and lost',
  'samjat nahiye': 'i do not understand and feel lost',
  'khup bhiti vat-te': 'feeling very afraid and anxious',
  'bhiti vatate': 'feeling scared and worried',
  'dar lag raha hai': 'feeling afraid and uncertain',
  'thak gaya hu': 'feeling deeply exhausted',
  'thak gaya hoon': 'feeling deeply exhausted',
  'thak gayi hu': 'feeling deeply exhausted',
  'thaklo aahe': 'i am tired and exhausted',
  'bore ho raha hu': 'feeling restless and unoccupied',
  'kahi suchat nahi': 'mind feels blank and overwhelmed',
  'bohot tension': 'a lot of stress and anxiety',
  'tension ho raha hai': 'feeling anxiety and stress',
  'bohot tension ho raha hai': 'feeling a lot of anxiety and stress'
};

// Check for gibberish or insufficient input
const isInsufficientInput = (text) => {
  if (!text || text.trim().length < 2) return true;
  
  const trimmed = text.trim();
  
  // Only punctuation, dots, or repeated symbols
  if (/^[.\-–—_~!?*^$#@%&()+=<>/{}\[\]|\\:;'",\s]+$/.test(trimmed)) {
    return true;
  }
  
  // Single filler words without context
  const fillers = ['hmm', 'hmmm', 'ok', 'okay', 'k', 'nothing', 'asdf', 'test', 'idk', 'hi', 'hello', 'hey'];
  if (fillers.includes(trimmed.toLowerCase())) {
    return true;
  }
  
  // Keyboard mashing detection (e.g. "asdfghjk", "zzzzzzzzz")
  if (/^(.)\1{4,}$/.test(trimmed)) {
    return true;
  }

  return false;
};

// Detect primary language / code-switching
const detectLanguage = (text) => {
  // Devanagari Unicode Range: 0900-097F
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  
  const lower = text.toLowerCase();
  
  // Distinct Marathi keywords (Latin & Devanagari)
  const marathiKeywords = ['mala', 'aahe', 'khup', 'vatate', 'vat-te', 'suchat', 'thaklo', 'kiti', 'kasla', 'samjat'];
  const hasMarathiKeywords = marathiKeywords.some(word => lower.includes(word));
  const marathiDevanagari = ['आहे', 'मला', 'वाटते', 'भीती', 'नाही', 'दिसत', 'कळत', 'होतं', 'खूप'];
  const hasMarathiDevanagari = marathiDevanagari.some(w => text.includes(w));
  
  // Distinct Hindi keywords
  const hindiKeywords = ['kya', 'karu', 'raha', 'rahi', 'hai', 'hoon', 'mujhe', 'bohot', 'samajh'];
  const hasHindiKeywords = hindiKeywords.some(word => lower.includes(word));
  
  if (hasDevanagari) {
    if (hasMarathiDevanagari || hasMarathiKeywords) return { primary: 'Marathi', codeSwitch: 'Devanagari-Marathi' };
    return { primary: 'Hindi', codeSwitch: 'Devanagari-Hindi' };
  }
  
  if (hasMarathiKeywords && hasHindiKeywords) {
    return { primary: 'Hinglish-Marathi', codeSwitch: 'Multilingual Romanized' };
  }
  
  if (hasMarathiKeywords) {
    return { primary: 'Marathi-English', codeSwitch: 'Romanized Marathi (Marathinglish)' };
  }
  
  if (hasHindiKeywords) {
    return { primary: 'Hindi-English', codeSwitch: 'Romanized Hindi (Hinglish)' };
  }
  
  return { primary: 'English', codeSwitch: 'Monolingual / Standard' };
};

// Normalize text for semantic matching while preserving original
const processUniversalInput = (rawText = '') => {
  const original = String(rawText || '');
  const insufficient = isInsufficientInput(original);
  
  if (insufficient) {
    return {
      rawText: original,
      isInsufficient: true,
      clarificationPrompt: 'I could not understand enough from that. If you feel comfortable, please share a little more about what is on your mind.',
      normalizedText: '',
      language: { primary: 'Undetermined', codeSwitch: 'Insufficient Data' }
    };
  }

  const language = detectLanguage(original);
  
  // Normalize repeated characters (e.g. "sooooo strest" -> "so strest")
  let normalized = original
    .replace(/(.)\1{2,}/g, '$1$1')
    .toLowerCase();

  // Replace recognized slang/idiomatic phrases
  for (const [slang, replacement] of Object.entries(SLANG_MAP)) {
    const regex = new RegExp(`\\b${slang}\\b`, 'gi');
    normalized = normalized.replace(regex, replacement);
  }

  return {
    rawText: original,
    isInsufficient: false,
    normalizedText: normalized.trim(),
    language
  };
};

module.exports = {
  processUniversalInput,
  detectLanguage,
  isInsufficientInput
};
