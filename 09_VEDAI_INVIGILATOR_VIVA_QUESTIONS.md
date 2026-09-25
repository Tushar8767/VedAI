# 09_VEDAI_INVIGILATOR_VIVA_QUESTIONS: Complete Viva Voce Defense Guide

**Auditor**: External Technical Invigilator  
**Purpose**: Model answers and technical defenses for all 31 critical questions an external examiner or project committee is guaranteed to ask.  

---

### Q1. Why does VedAI need facial emotion?
**Answer**: Text reflections reflect conscious verbalization, whereas micro-facial expressions capture subconscious somatic reactions. Combining both allows VedAI to detect emotional dissonance (e.g. user writing *"I'm fine"* while displaying facial distress or muscle tension), providing a more holistic foundation for philosophical reflection.

### Q2. How does facial emotion actually work?
**Answer**: The frontend captures a 320x240 video frame via HTML5 Canvas into a base64 JPEG in RAM. It sends it to the backend, which forwards it to a FastAPI service. The service uses an OpenCV Haar Cascade (`haarcascade_frontalface_default.xml`) to detect the face bounding box, crops and normalizes the region of interest to 48x48 pixels, and passes it through a 7-class PyTorch Convolutional Neural Network (`FaceEmotionCNN`) with temperature softmax to generate class probabilities.

### Q3. Where is the facial emotion result shown?
**Answer**: In the current version, facial emotion is incorporated into the late fusion calculation and indicated by the *"Multimodal (Text 60% + Face 40%)"* modality pill. To improve explainability, our roadmap includes a dedicated visual card showing the isolated facial CNN probabilities alongside the text NLP probabilities.

### Q4. How does facial emotion influence the final emotion?
**Answer**: Through decision-level late fusion:
$$P_{fused}(c) = \frac{0.6 \cdot P_{text}(c) + 0.4 \cdot P_{face}(c)}{\sum_{k} (0.6 \cdot P_{text}(k) + 0.4 \cdot P_{face}(k))}$$
The final dominant state is $\text{argmax}(P_{fused})$.

### Q5. What happens if text and face disagree?
**Answer**: The probability distributions blend mathematically. For example, if text indicates `neutral` (0.50) and face indicates `anger` (0.70), the weighted mixture shifts probability toward anger ($0.4 \times 0.70 = 0.28$) while tempering neutral ($0.6 \times 0.50 = 0.30$), producing a split emotional spectrum that alerts the user to emotional ambivalence.

### Q6. How do you calculate fusion?
**Answer**: We utilize confidence-weighted late fusion where modalities are normalized before a convex combination ($w_{text}=0.6, w_{face}=0.4$). If no face is detected or camera is disabled, the system dynamically sets $w_{face}=0.0$ and falls back to 100% text-only processing without degrading throughput.

### Q7. What is your NLP model?
**Answer**: VedAI operates a dual-engine NLP architecture: in cloud deployment, it leverages a fine-tuned `DistilRoBERTa` transformer pipeline (`j-hartmann/emotion-english-distilroberta-base`); in offline/local environments, it utilizes an optimized semantic prior lexicon engine with token n-gram matching and fuzzy string distance (`difflib`) to output normalized 7-class distributions in sub-5ms latency.

### Q8. What dataset was used?
**Answer**: The underlying DistilRoBERTa model was trained on unified emotion benchmarks (including GoEmotions and ISEAR). Our local semantic distribution engine was benchmarked against a 110-sample multi-domain validation dataset covering English, Hinglish, Marathi, and colloquial expressions.

### Q9. What accuracy did you achieve?
**Answer**: On our 110-sample curated behavioral validation benchmark, the intent routing and safety classification achieved 100.0% accuracy across 7 canonical emotional categories, 7 crisis scenarios, and 5 clinical boundary tests.

### Q10. Is your confidence calibrated?
**Answer**: The confidence score represents the normalized maximum softmax probability output from the active model $\in [0.14, 0.95]$. We honestly acknowledge that post-hoc statistical calibration (such as Platt scaling or temperature tuning against an external Expected Calibration Error benchmark) was not performed; hence it is described as model confidence rather than psychometric probability.

### Q11. How does your RAG work?
**Answer**: Our RAG pipeline first runs a regex extractor to catch explicit chapter/verse citations (e.g. "2.47"). If absent, it queries a TF-IDF vector index fitted over the canonical verse meanings, Sanskrit transliterations, and emotional tags, computing cosine similarity against the query vector to retrieve the top-K grounded verses.

### Q12. How many Gita verses are actually stored?
**Answer**: Exactly **14 foundational canonical verses** (Chapters 2, 5, 6, 12, and 18) focusing specifically on mental balance (*Samatvam*), duty (*Karmanya*), detachment from fruits, and overcoming anger and grief. We deliberately avoided scraping all 700 unvetted verses to guarantee 100% philosophical and textual accuracy.

### Q13. How do you prevent hallucinated verses?
**Answer**: The system enforces strict deterministic grounding: RAG queries only select verses from the immutable canonical repository. If a user asks for a non-existent citation (e.g. BG 99.99), the intent router and RAG engine refuse to invent Sanskrit text and instead fall back to foundational living advice without fabricating citations.

### Q14. Why TF-IDF instead of heavy vector embeddings?
**Answer**: For a curated foundational corpus of 14 high-precision verses, a TF-IDF vectorizer with cosine similarity operates with zero cold-start latency (<1ms search time), zero GPU dependency, and zero recurring cloud vector database costs, while completely avoiding semantic drift.

### Q15. How is explainability generated?
**Answer**: The `explainabilityService` analyzes the winning emotional vector, identifies the primary semantic keyword contributors from the user's reflection, and articulates the philosophical rationale linking the emotional imbalance to Krishna's counsel in the matched verse.

### Q16. How does the safety layer work?
**Answer**: Safety is the first-priority gate in `intentRouter` and `processController`. It executes a 5-layer regex inspection (Explicit English, Leetspeak/Misspellings, Hinglish, Marathi, and Indirect Despair) followed by a benign figurative idiom filter to eliminate false alarms.

### Q17. What happens with a crisis statement?
**Answer**: If high risk is detected, standard reflection, RAG retrieval, and AI chatting are immediately halted. The system raises `isHighRisk: true`, displays an emergency red banner, and surfaces 24/7 crisis numbers: Tele-MANAS (14416), 112 (India), and 988 (US/Canada).

### Q18. Is VedAI a medical system?
**Answer**: **Absolutely not.** VedAI is strictly an educational and self-reflective mindfulness companion. It explicitly refuses diagnostic inquiries (*"Do I have depression?"*) and pharmaceutical inquiries (*"What pills should I take?"*), directing users to licensed professionals.

### Q19. How is user data protected?
**Answer**: All user journal reflections are encrypted at rest using **AES-256-GCM** authenticated encryption with random 12-byte IVs and 16-byte authentication tags. Passwords are salted and hashed using PBKDF2 (120,000 iterations of SHA-512). API endpoints enforce rate limiting and security headers.

### Q20. Can User A access User B's data?
**Answer**: No. All database queries enforce strict user ownership checks (`WHERE id = $1 AND user_id = $2`). Comprehensive IDOR tests (`security-auth.test.js:AUTHZ-001`) confirmed that cross-tenant access attempts return 404/403.

### Q21. Are camera images stored?
**Answer**: **Never.** Camera frames are captured directly to browser RAM as base64 strings, processed in volatile memory by OpenCV and PyTorch, and immediately released for garbage collection. Zero image bytes are ever written to disk, database, or server logs.

### Q22. What exactly does the dashboard measure?
**Answer**: It measures real user reflection trends from the PostgreSQL `emotion_history` table: dominant emotional states over time, frequency distribution across the 7 emotions, recent chronological reflections, and a transparent composite Wellness Index.

### Q23. How is the wellness score calculated?
**Answer**: It uses a transparent heuristic:
$$\text{Score} = 35 (\text{baseline}) + 35 \times (\text{Positive/Neutral Ratio}) + 15 \times (\text{Reflection Consistency}) + 15 \times (\text{Journaling Activity})$$
It is disclosed as a self-monitoring heuristic, not a medical index.

### Q24. Is the dashboard showing actual historical data?
**Answer**: Yes. For authenticated users, it aggregates real rows from PostgreSQL. If user history is cleared, the dashboard resets to zero and renders an empty state.

### Q25. What happens if the ML service goes down?
**Answer**: The Express gateway catches the timeout and gracefully falls back to local high-speed semantic prior analysis and database repository lookup, ensuring 100% uptime for the user.

### Q26. What happens if camera permission is denied?
**Answer**: The frontend catches the browser permission rejection, displays a gentle alert, automatically unchecks the camera toggle, and proceeds smoothly with text-only reflection.

### Q27. What makes VedAI different from a normal chatbot?
**Answer**: Unlike generic LLM chatbots that hallucinate citations, act as ungrounded medical pseudo-experts, or leak prompts, VedAI is an **architectured multimodal system** with strict safety boundaries, authentic Sanskrit RAG grounding, encrypted journaling, and multimodal emotion fusion.

### Q28. Which features are actually implemented?
**Answer**: 27 of 30 features are 100% complete: Text NLP, Facial CNN in RAM, Late Fusion math, 14-verse RAG, Layered Safety, Clinical Boundaries, AES-256-GCM Journal, Rate Limiting, SQL injection prevention, Multi-turn Chat, and Insights charts.

### Q29. Which features are partially implemented?
**Answer**:
1. Facial emotion display (backend calculates it, but frontend displays only fused output).
2. Account profile UI (backend `/me` route exists, but clicking profile icon currently prompts sign out directly).
3. Quick check-in persistence (updates client preview, does not write to DB).

### Q30. What are the current limitations?
**Answer**:
1. Curated corpus is limited to 14 foundational verses.
2. Facial emotion model requires adequate lighting and frontal face angles.
3. Wellness Index is an empirical heuristic rather than a clinically validated diagnostic scale.

### Q31. What would you improve in Version 2?
**Answer**:
1. Add client-side WebAssembly / TensorFlow.js face tracking to perform 100% in-browser inference without sending frames to the backend.
2. Expand the canonical corpus to all 700 verses with Sanskrit scholar verification.
3. Implement a dedicated Profile Management dashboard allowing password updates and aesthetic preferences.
