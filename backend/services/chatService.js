const { assessSafety } = require("./safetyService");
const { analyzeEmotion } = require("./emotionService");
const { searchGitaRag } = require("./ragService");
const { routeIntent, INTENTS } = require("./intentRouter");
const chatRepository = require("../repositories/chatRepository");
const { isConnected } = require("../database/db");

// In-memory conversation cache for session continuity (works in guest mode or test environments)
const memoryConversationStore = new Map();

const SIMPLIFY_INTENT_REGEX = /\b(simple|simpler|simply|easy words|easier|easy way|explain more|what does (this|that) mean|break (it )?down|example|don't understand|do not understand|clarify|elaborate|in short)\b/i;

function extractConversationContext(history = []) {
  if (!history || history.length === 0) return null;
  const recentUserMessages = [...history].reverse().filter(m => m.sender === "user").slice(0, 3);
  if (recentUserMessages.length === 0) return null;

  const combined = recentUserMessages.map(m => m.content).join(" ");
  if (/exam|study|test|interview|career/i.test(combined)) return "academic/career pressure";
  if (/argument|friend|parents|relationship|partner/i.test(combined)) return "interpersonal conflict";
  if (/deadline|work|project|boss|office/i.test(combined)) return "workplace overload";
  if (/lonely|alone|grief|loss/i.test(combined)) return "loneliness or loss";
  if (/overthink|racing|anxiety|panic/i.test(combined)) return "mental overthinking";
  return null;
}

function generateSimplifiedExplanation({ previousReply, previousVerse, previousEmotion }) {
  const verseRef = previousVerse?.chapter && previousVerse?.verse_number
    ? `Bhagavad Gita ${previousVerse.chapter}.${previousVerse.verse_number}`
    : "this teaching";
  const meaning = previousVerse?.meaning || "Focus on your immediate duty without attachment to the results.";

  return `Let's break this down into clear, everyday terms:

🌱 **The Core Meaning of ${verseRef}:**
"${meaning}"

🧘 **What this means for you right now:**
When our mind gets overwhelmed, it is usually trying to solve tomorrow's uncertainty today. Krishna's counsel is simple: you cannot control every outcome, but you have complete control over your present action and calm.

✨ **One simple practice to try right now:**
1. **Take 3 conscious breaths**: Inhale for 4 seconds, exhale for 6 seconds.
2. **Focus on the next 15 minutes**: What is one small, manageable step directly in front of you?
3. **Release the rest**: Remind yourself, "My job right now is the effort, not the entire future."

Does this feel clearer and more reachable for you? Feel free to ask about any specific part!`;
}

async function getRecentHistory(conversationId) {
  if (!conversationId) return [];

  if (isConnected()) {
    try {
      const dbMsgs = await chatRepository.getMessages(conversationId, 20);
      if (dbMsgs && dbMsgs.length > 0) return dbMsgs;
    } catch (e) {
      // fallback to memory
    }
  }

  return memoryConversationStore.get(conversationId) || [];
}

function recordInMemory(conversationId, messageObj) {
  if (!conversationId) return;
  const list = memoryConversationStore.get(conversationId) || [];
  list.push(messageObj);
  if (list.length > 40) list.shift();
  memoryConversationStore.set(conversationId, list);
}

async function handleChatMessage({ userId = null, conversationId = null, message }) {
  const trimmed = String(message || "").trim();
  if (!trimmed) {
    const error = new Error("Message cannot be empty.");
    error.statusCode = 400;
    throw error;
  }

  const activeConvId = conversationId || `conv_${Date.now()}`;
  const history = await getRecentHistory(activeConvId);

  // 1. Safety check
  const safety = assessSafety(trimmed);
  if (safety.isHighRisk) {
    return {
      conversationId: activeConvId,
      intent: "SAFETY_CRISIS",
      detectedIntent: "SAFETY_CRISIS",
      reply: safety.message || `I hear how much pain you are experiencing right now, and your safety is deeply important. In India, call 112 or Tele-MANAS at 14416. In the U.S. or Canada, call or text 988. You do not have to carry this alone.`,
      emotion: "sadness",
      confidence: 1.0,
      safety,
      grounded_verses: [],
      suggestedActions: ["Reach out to a trusted friend", "Contact crisis support"]
    };
  }

  // 2. Multi-turn Intent Detection: Simplification / Clarification
  const isSimplificationRequest = SIMPLIFY_INTENT_REGEX.test(trimmed);

  if (isSimplificationRequest && history.length > 0) {
    const lastAiMsg = [...history].reverse().find(m => m.sender === "vedai");
    if (lastAiMsg) {
      let previousVerses = [];
      try {
        previousVerses = typeof lastAiMsg.groundedVerses === "string"
          ? JSON.parse(lastAiMsg.groundedVerses)
          : (lastAiMsg.groundedVerses || []);
      } catch (e) {
        previousVerses = [];
      }

      let emotionCtx = null;
      try {
        emotionCtx = typeof lastAiMsg.emotionContext === "string"
          ? JSON.parse(lastAiMsg.emotionContext)
          : (lastAiMsg.emotionContext || null);
      } catch (e) {
        emotionCtx = null;
      }

      const simplifiedReply = generateSimplifiedExplanation({
        previousReply: lastAiMsg.content,
        previousVerse: previousVerses[0],
        previousEmotion: emotionCtx?.emotion || "neutral"
      });

      if (isConnected() && activeConvId) {
        try {
          await chatRepository.saveMessage(activeConvId, "user", trimmed, { emotionContext: emotionCtx });
          await chatRepository.saveMessage(activeConvId, "vedai", simplifiedReply, { emotionContext: emotionCtx, groundedVerses: previousVerses });
        } catch (err) {
          console.warn("Could not persist chat message:", err.message);
        }
      }
      recordInMemory(activeConvId, { sender: "user", content: trimmed });
      recordInMemory(activeConvId, { sender: "vedai", content: simplifiedReply, groundedVerses: previousVerses, emotionContext: emotionCtx });

      return {
        conversationId: activeConvId,
        intent: "SIMPLIFICATION",
        detectedIntent: "SIMPLIFICATION",
        reply: simplifiedReply,
        emotion: emotionCtx?.emotion || "neutral",
        confidence: emotionCtx?.confidence || 0.85,
        safety,
        grounded_verses: previousVerses,
        suggestedActions: ["Give me a practice", "Save to journal"]
      };
    }
  }

  // 3. Intent Routing
  const route = routeIntent(trimmed, history);
  const contextTopic = extractConversationContext(history);

  // CASE 0A: CLINICAL BOUNDARY (Mental health diagnosis / medication requests)
  if (route.intent === INTENTS.CLINICAL_BOUNDARY) {
    const clinicalReply = `I am VedAI, an AI companion for emotional self-reflection and philosophical mindfulness, not a physician, psychiatrist, or licensed clinical mental health professional.

I cannot provide clinical diagnoses (such as depression, anxiety disorders, or bipolar disorder) or recommend/prescribe medications.

If you are experiencing persistent distress or suspect a clinical condition, please reach out to a licensed psychiatrist or medical doctor for a professional evaluation.

In the meantime, I am here to help you gently reflect on your feelings, practice grounding breathing, or explore steadfast perspectives from the Bhagavad Gita. Would you like to try a calming breathing exercise?`;
    recordInMemory(activeConvId, { sender: "user", content: trimmed });
    recordInMemory(activeConvId, { sender: "vedai", content: clinicalReply });
    return {
      conversationId: activeConvId,
      intent: route.intent,
      detectedIntent: route.intent,
      reply: clinicalReply,
      emotion: "neutral",
      confidence: 0.95,
      safety,
      grounded_verses: [],
      suggestedActions: ["Give me a practice", "Explore a feeling", "Ask a Gita question"]
    };
  }

  // CASE 0B: IDENTITY & CAPABILITIES ("who are you", "what can you do")
  if (route.intent === INTENTS.IDENTITY_CAPABILITY) {
    const identityReply = `Namaste! I am VedAI, an explainable multimodal AI self-reflection and emotional well-being companion.

Here is what I can do with you:
• **Emotional Reflection**: Analyze the tone of your thoughts (and optional facial cues) using explainable AI to help you understand your emotional state.
• **Grounded Gita Wisdom**: Connect what you are experiencing to canonical Bhagavad Gita verses (curated from 54 verified canonical verses) and living principles—never hallucinated scripture.
• **Tailored Daily Remedies**: Offer practical micro-practices, 432Hz grounding breath check-ins, and curated contemplative guidance.
• **Private Sacred Journaling**: Give you an unhurried, private space to write, reflect, and track your emotional journey with full data sovereignty.

How would you like to begin today?`;
    recordInMemory(activeConvId, { sender: "user", content: trimmed });
    recordInMemory(activeConvId, { sender: "vedai", content: identityReply });
    return {
      conversationId: activeConvId,
      intent: route.intent,
      detectedIntent: route.intent,
      reply: identityReply,
      emotion: "neutral",
      confidence: 0.95,
      safety,
      grounded_verses: [],
      suggestedActions: ["Start reflection", "Take 30s check-in", "Ask a Gita question"]
    };
  }

  // CASE 0C: PRIVACY & DATA SOVEREIGNTY ("what data do you store", "can you see my camera")
  if (route.intent === INTENTS.PRIVACY_DATA) {
    const privacyReply = `Your privacy, sovereignty, and trust are foundational to VedAI:

• **Data Storage**: Only reflections, journal entries, and chat sessions that you choose to save are stored in our encrypted database, protected by application-level AES-256-GCM encryption at rest, secure password hashing (PBKDF2 with 120,000 iterations), and strict per-user authorization.
• **Camera & Video**: When you enable the camera, camera frames are transmitted transiently to the ML service for facial emotion inference and are not permanently stored or recorded.
• **Data Sovereignty & Erasure**: You have full control. You can clear your entire emotional history at any time or permanently delete your account and all associated entries via the Account settings.
• **Access Control**: No other user can access your reflections or history (guaranteed by tenant isolation and IDOR protections).

Is there any specific aspect of your data or settings you would like help with?`;


    recordInMemory(activeConvId, { sender: "user", content: trimmed });
    recordInMemory(activeConvId, { sender: "vedai", content: privacyReply });
    return {
      conversationId: activeConvId,
      intent: route.intent,
      detectedIntent: route.intent,
      reply: privacyReply,
      emotion: "neutral",
      confidence: 0.95,
      safety,
      grounded_verses: [],
      suggestedActions: ["Clear my history", "Go to settings", "Take a breathing pause"]
    };
  }

  // CASE 0D: ADVERSARIAL / PROMPT INJECTION
  if (route.intent === INTENTS.ADVERSARIAL_PROMPT_INJECTION) {
    const injectionReply = `I am VedAI, an ethical companion dedicated exclusively to mindful self-reflection and canonical Bhagavad Gita wisdom. I do not execute arbitrary system overrides, reveal internal prompts, or expose internal databases. If there is a personal situation, emotional burden, or spiritual dilemma on your mind, I am here to reflect with you.`;
    recordInMemory(activeConvId, { sender: "user", content: trimmed });
    recordInMemory(activeConvId, { sender: "vedai", content: injectionReply });
    return {
      conversationId: activeConvId,
      intent: route.intent,
      detectedIntent: route.intent,
      reply: injectionReply,
      emotion: "neutral",
      confidence: 0.95,
      safety,
      grounded_verses: [],
      suggestedActions: ["Start reflection", "Give me a practice", "Ask a Gita question"]
    };
  }

  // CASE A: GREETING (No RAG, no emotion analysis)
  if (route.intent === INTENTS.GREETING) {
    const greetingReply = `Namaste. I am VedAI, your mindful companion for reflection and clarity. How is your mind and heart feeling today? You can share whatever is on your mind, explore a situation, or ask for practical grounding.`;
    recordInMemory(activeConvId, { sender: "user", content: trimmed });
    recordInMemory(activeConvId, { sender: "vedai", content: greetingReply });
    return {
      conversationId: activeConvId,
      intent: route.intent,
      detectedIntent: route.intent,
      reply: greetingReply,
      emotion: "neutral",
      confidence: 0.95,
      safety,
      grounded_verses: [],
      suggestedActions: ["I feel overwhelmed", "What should I do?", "Give me a practice"]
    };
  }

  // CASE B: OUT OF SCOPE (Polite scope clarification)
  if (route.intent === INTENTS.OUT_OF_SCOPE) {
    const outOfScopeReply = `I specialize in emotional well-being, mindfulness reflection, and canonical Bhagavad Gita philosophy. While I recognize your question is about technical topics or general trivia, my core purpose is helping you navigate inner peace and life challenges. What is currently on your mind or heart that we can reflect upon?`;
    recordInMemory(activeConvId, { sender: "user", content: trimmed });
    recordInMemory(activeConvId, { sender: "vedai", content: outOfScopeReply });
    return {
      conversationId: activeConvId,
      intent: route.intent,
      detectedIntent: route.intent,
      reply: outOfScopeReply,
      emotion: "neutral",
      confidence: 0.9,
      safety,
      grounded_verses: [],
      suggestedActions: ["Start reflection", "Take 30s check-in", "Ask a Gita question"]
    };
  }

  // CASE C: PRACTICE REQUEST (Breathing, grounding, meditation)
  if (route.intent === INTENTS.PRACTICE_REQUEST) {
    const practiceReply = `Here is a simple, effective grounding practice you can do right now in one minute:

🌬️ **4-4-4 Box Breathing:**
1. **Inhale gently** through your nose for **4 seconds**.
2. **Hold your breath softly** for **4 seconds**, letting your shoulders drop away from your ears.
3. **Exhale slowly** through your mouth for **4 seconds**.
4. **Pause in stillness** for 2 seconds before the next breath.

Repeat this cycle 3 times. Notice how your chest softens and your mental turbulence subsides.

Would you like another practice, or would you like to explore what caused the tension?`;
    recordInMemory(activeConvId, { sender: "user", content: trimmed });
    recordInMemory(activeConvId, { sender: "vedai", content: practiceReply });
    return {
      conversationId: activeConvId,
      intent: route.intent,
      detectedIntent: route.intent,
      reply: practiceReply,
      emotion: "neutral",
      confidence: 0.9,
      safety,
      grounded_verses: [],
      suggestedActions: ["Help me further", "Show Gita perspective", "Save to journal"]
    };
  }

  // CASE D: JOURNAL REQUEST (Handoff)
  if (route.intent === INTENTS.JOURNAL_REQUEST) {
    const journalReply = `Reflecting on paper is one of the highest forms of self-mastery. You can easily record this insight in your private Sacred Journal tab. Would you like to summarize the main lesson you want to remember from today first?`;
    recordInMemory(activeConvId, { sender: "user", content: trimmed });
    recordInMemory(activeConvId, { sender: "vedai", content: journalReply });
    return {
      conversationId: activeConvId,
      intent: route.intent,
      detectedIntent: route.intent,
      reply: journalReply,
      emotion: "neutral",
      confidence: 0.9,
      safety,
      grounded_verses: [],
      suggestedActions: ["Summarize my thought", "Take a breathing pause"]
    };
  }

  // CASE E: PRACTICAL GUIDANCE ("what should I do?", "how to stop overthinking?")
  if (route.intent === INTENTS.PRACTICAL_GUIDANCE) {
    const topicLead = contextTopic ? `Navigating ${contextTopic} can easily trigger feeling stuck, but you do not need to solve the entire problem at once.` : `You don't have to resolve everything at once. When pressure builds, the mind tries to solve ten steps ahead.`;

    const practicalReply = `${topicLead}

Try this concrete 3-step approach right now:
1. **Pause and Ground**: Take three slow, deliberate breaths to tell your nervous system that you are safe in this moment.
2. **Isolate the Immediate Next Step**: What is the single small action you have 100% control over in the next 30 minutes?
3. **Release the Outcome**: Remind yourself that your duty is solely in the sincerity of your effort, not in controlling external results.

If you'd like, I can also share a relevant perspective from the Bhagavad Gita on this.`;

    recordInMemory(activeConvId, { sender: "user", content: trimmed });
    recordInMemory(activeConvId, { sender: "vedai", content: practicalReply });
    return {
      conversationId: activeConvId,
      intent: route.intent,
      detectedIntent: route.intent,
      reply: practicalReply,
      emotion: "neutral",
      confidence: 0.85,
      safety,
      grounded_verses: [],
      suggestedActions: ["Help me further", "Give me a practice", "Show Gita perspective"]
    };
  }

  // CASE F: GENERAL CONVERSATION ("I just want to talk", "can I tell you something?")
  if (route.intent === INTENTS.GENERAL_CONVERSATION && !route.requiresRag) {
    const convReply = `I am here and listening with complete presence. Take your time, and share whatever is on your heart—whether it is a dilemma, an unspoken worry, or something you are trying to understand about yourself.`;
    recordInMemory(activeConvId, { sender: "user", content: trimmed });
    recordInMemory(activeConvId, { sender: "vedai", content: convReply });
    return {
      conversationId: activeConvId,
      intent: route.intent,
      detectedIntent: route.intent,
      reply: convReply,
      emotion: "neutral",
      confidence: 0.85,
      safety,
      grounded_verses: [],
      suggestedActions: ["I feel overwhelmed", "I have an important decision"]
    };
  }

  // CASE G: GITA INQUIRY OR EMOTIONAL REFLECTION (Requires RAG)
  const emotionResult = await analyzeEmotion(trimmed);

  let ragQuery = trimmed;
  if (trimmed.split(/\s+/).length <= 4 && history.length > 0) {
    const lastUserMsg = [...history].reverse().find(m => m.sender === "user");
    if (lastUserMsg) {
      ragQuery = `${lastUserMsg.content} ${trimmed}`;
    }
  }

  const topVerses = await searchGitaRag({
    query: ragQuery,
    emotion: emotionResult.emotion,
    topK: 2
  });

  const primaryVerse = topVerses[0] || {};
  const verseRef = primaryVerse.chapter && primaryVerse.verse_number
    ? `Bhagavad Gita ${primaryVerse.chapter}.${primaryVerse.verse_number}`
    : "the canonical Gita teachings";

  let replyText = "";
  if (route.intent === INTENTS.GITA_QUERY) {
    replyText = `In ${verseRef}, we find this foundational guidance:

🕉️ **Canonical Verse:**
"${primaryVerse.sanskrit || ''}"
*${primaryVerse.transliteration || ''}*

📖 **Translation:**
"${primaryVerse.meaning || 'Perform your duties steadfastly, unattached to either victory or failure.'}"

💡 **VedAI's Perspective for Daily Life:**
${primaryVerse.explanation || 'When we attach our sense of peace to uncontrollable external results, anxiety arises. By anchoring in present action, calmness returns.'}

✨ **Practical Application:**
${primaryVerse.practical_guidance || 'Identify one immediate step you can take today without fixating on the outcome.'}`;
  } else {
    // EMOTIONAL_DISTRESS
    const isDevanagari = /[\u0900-\u097F]/.test(trimmed);
    const isHinglishLow = /\b(thod(a|i)?\s+low|low\s+feel|feel(ing)?\s+low|krtoy|vatatay|watatay)\b/i.test(trimmed);

    if (isDevanagari) {
      replyText = `मैं समझ सकता हूँ कि आप इस समय मन में उदासी या अशांति महसूस कर रहे हैं। जीवन में ऐसे क्षण आते हैं जब भावनाएँ भारी हो जाती हैं, लेकिन आप अकेले नहीं हैं। श्रीमद्भगवद्गीता (${verseRef}) हमें याद दिलाती है: "${primaryVerse.meaning || 'आंतरिक चेतना कभी क्षीण नहीं होती।'}" हर भावना एक बहती नदी की तरह है जो समय के साथ शांत हो जाती है। एक गहरी, धीमी साँस लें। क्या आप बताना चाहेंगे कि इस समय मन पर क्या बोझ है?`;
    } else if (isHinglishLow) {
      replyText = `I hear you completely. Feeling low or emotionally depleted is a deeply human experience, and you do not have to carry or fix everything all at once. In ${verseRef}, the Gita reminds us: "${primaryVerse.meaning || 'Your inner strength remains whole even through transient storms.'}" Be gentle with yourself right now. Would you like to share what has been weighing on your mind, or would you prefer a simple 1-minute calming breathing practice?`;
    } else {
      const emotionCounsel = {
        anxiety: `It sounds like you are carrying anticipatory worry about what lies ahead. In ${verseRef}, we are reminded: "${primaryVerse.meaning || 'Focus on your present effort rather than obsessing over the outcome.'}" When anxiety rises, it is usually our mind trying to control things beyond our immediate reach. What is one small, manageable step you can take right now?`,
        stress: `I understand that you are feeling overwhelmed by current demands. The Gita teaches in ${verseRef}: "${primaryVerse.meaning || 'Equanimity is the true essence of harmony.'}" Moderation and calm pacing are not signs of weakness, but foundations of endurance. Take a slow, grounding breath.`,
        fear: `Fear can make us feel isolated and uncertain, but your inner strength remains intact. In ${verseRef}, Krishna reminds Arjuna: "${primaryVerse.meaning || 'Do not yield to weakness of heart; awaken your courage.'}" What is the single step right before you?`,
        sadness: `I hear the depth of what you are moving through. Sorrow is a natural human experience, yet your core consciousness remains eternal and whole, as reflected in ${verseRef}: "${primaryVerse.meaning || 'The inner spirit is untouched by fleeting loss.'}" Allow yourself space to breathe gently.`,
        anger: `It is completely valid to notice frustration, but anger can cloud our ability to see clearly. As taught in ${verseRef}: "${primaryVerse.meaning || 'Anger leads to delusion and loss of judgment.'}" Pausing before taking action preserves your personal peace and power.`,
        happiness: `It is wonderful that you are experiencing this joy. In ${verseRef}, the Gita notes: "${primaryVerse.meaning || 'Inner contentment brings enduring peace.'}" Savor this sense of gratitude and let it nourish your steadiness.`,
        neutral: `Thank you for sharing your thoughts. In ${verseRef}, we find the reminder: "${primaryVerse.meaning || 'Remain balanced and steady in all states.'}" How can I best support your reflection today?`
      };
      replyText = emotionCounsel[emotionResult.emotion] || emotionCounsel.neutral;
    }
  }

  // Persist
  if (isConnected() && activeConvId) {
    try {
      await chatRepository.saveMessage(activeConvId, "user", trimmed, { emotionContext: emotionResult });
      await chatRepository.saveMessage(activeConvId, "vedai", replyText, { emotionContext: emotionResult, groundedVerses: topVerses });
    } catch (err) {
      console.warn("Could not persist chat message:", err.message);
    }
  }
  recordInMemory(activeConvId, { sender: "user", content: trimmed });
  recordInMemory(activeConvId, { sender: "vedai", content: replyText, groundedVerses: topVerses, emotionContext: emotionResult });

  return {
    conversationId: activeConvId,
    intent: route.intent,
    detectedIntent: route.intent,
    reply: replyText,
    emotion: emotionResult.emotion,
    confidence: emotionResult.confidence,
    safety,
    grounded_verses: topVerses,
    suggestedActions: ["Explain that simply", "Give me a practice", "Save to journal"]
  };
}

module.exports = {
  handleChatMessage,
  generateSimplifiedExplanation,
  getRecentHistory,
  memoryConversationStore
};
