# 01_VEDAI_INVIGILATOR_AUDIT: First-Time User Experience & Purpose Analysis

**Audit Entity**: External Academic Invigilator / Senior Technical Assessor  
**Verdict**: **FUNCTIONALLY SOUND WITH SPECIFIC UX & DISCLOSURE OMISSIONS**  
**Core Finding**: VedAI possesses genuine, working backend and ML pipelines (55/55 test pass rate, real late fusion, real AES-256-GCM encryption, real 14-verse RAG, real layered safety). However, several key user-facing interfaces mask individual analytical outputs (notably facial emotion breakdown) or provide jarring interaction patterns (such as Account Profile triggering an immediate logout prompt).

---

## 1. First-Time User Journey Audit

### Intended User Motivations & System Reality

| # | User Motivation | Actually Supported? | User-Visible Experience | Evaluation Rating |
| :--- | :--- | :---: | :--- | :---: |
| **A** | *“I want to understand my current emotional state.”* | **YES** | User types contemplation or selects quick chip (e.g. "Exam Dread"). System computes 7 emotional spectrum vectors and reveals dominant emotion. | **9/10** |
| **B** | *“I want to validate/reflect on what emotion I may be experiencing.”* | **YES** | Prominently supported on Home slide ("Begin Reflection" button) and Reflection Studio. Returns dominant state, confidence %, and empathetic summary. | **8.5/10** |
| **C** | *“I want to express what is troubling me.”* | **YES** | Freeform text area in Reflection Studio with character counter and Ctrl+Enter keyboard submission. | **9/10** |
| **D** | *“I want to understand WHY VedAI estimated this emotion.”* | **PARTIALLY** | The "Why VedAI estimated this" card gives a high-level semantic explanation, but does not highlight exact input keywords or show attention tokens. | **7/10** |
| **E** | *“I want to use facial expression as an additional signal.”* | **PARTIALLY** | Camera opens and captures frame. Backend and PyTorch CNN calculate facial emotion. Fused emotion is displayed. **GAP: Facial emotion is never displayed as its own metric.** | **5/10** |
| **F** | *“I want practical self-reflection guidance.”* | **YES** | Returns 3 concrete, interactive remedy checkboxes (e.g. *Cultivate Stillness*, *Dedicated Action*) and a 30-sec grounding breath practice. | **9.5/10** |
| **G** | *“I want relevant Bhagavad Gita wisdom.”* | **YES** | Displays authentic Devanagari verse, phonetic IAST transliteration, English translation, and practical application. Zero fabricated citations. | **9.5/10** |
| **H** | *“I want to continue a reflective conversation.”* | **YES** | "Talk with VedAI" opens conversational chat that remembers the preceding contemplation turn and offers verse simplification. | **9/10** |
| **I** | *“I want to record and review my emotional journey.”* | **YES (Auth only)** | Authenticated users can save AES-256-GCM encrypted journal entries and review history and distribution in Insights. | **8.5/10** |

---

## 2. Invigilator Diagnostic Questions & Empirical Answers

### 1. Is the purpose immediately understandable?
**YES.** Upon opening `http://localhost:3000` or `http://localhost:5000`, the top floating dock displays *"VedAI — Sacred Intelligence"*, and the hero banner introduces *"Private Sanctuary Mode Active... What is on your mind today? Pause, take a grounding breath, and choose how you would like to begin."* The interface conveys non-clinical contemplation immediately.

### 2. Does the Home screen clearly communicate the main purpose?
**YES.** Slide 0 (`#dashboardPane`) presents three clear non-linear gateways:
1. **Talk with VedAI** (Conversational Krishna AI counsel)
2. **Start Reflection** (Primary gateway: emotional balance reading + Gita shloka + 3 remedies)
3. **Quick Check-in** (30-second breath circle)

### 3. If a user comes specifically for EMOTION VALIDATION, is that journey obvious?
**YES.** The central featured card on Home is explicitly labeled **"Start Reflection"** with a glowing button **"Begin Reflection ➔"**, which immediately slides the carousel to Slide 1 (`#reflectPane`).

### 4. Can the user immediately start an emotion validation/reflection?
**YES.** Guest users can type into the contemplation text box immediately without mandatory login or paywall. Authentication is strictly optional for cross-device cloud synchronization.

### 5. Does the UI explain what VedAI is validating?
**YES.** The Reflection Studio header states: *"What is on your heart right now? Type freely about whatever is disturbing your peace, causing worry, or bringing joy. VedAI listens deeply and brings you timeless Gita wisdom with simple, actionable remedies."*

### 6. Does it distinguish user-reported emotion vs NLP-estimated vs facially estimated vs fused?
**CRITICAL DEFICIENCY IDENTIFIED: NO.**
- The UI displays:
  - *"What Resides in Your Consciousness"* (The user's raw input string)
  - *"Dominant Psychological State"* (The fused emotion label and confidence)
  - *"Modality Pill"* (e.g. `Multimodal (Text 60% + Face 40%)` or `Text Stream Only`)
- **What is MISSING**: The user cannot see:
  - Text-only predicted emotion (e.g. *Anxiety: 75%*)
  - Face-only predicted emotion (e.g. *Stress: 68%*)
  - The side-by-side comparison explaining how the fusion arrived at the final state.

### 7. Does the system explain that AI emotion estimation is probabilistic?
**YES.** Every reflection response includes:
- A percentage confidence dial (e.g. `65% Confidence`).
- 7-vector emotional spectrum progress bars showing the full probability distribution.
- A permanent footer disclaimer: *"VedAI Sanctuary · Reflective guidance only · Non-clinical mindfulness companion."*

### 8. Does the user see evidence supporting the estimated emotion?
**YES.** The card *"Why VedAI estimated this"* provides a structured explanation connecting the user's emotional tone and semantic balance to the state and corresponding Gita verse.

---

## 3. High-Priority Invigilator Findings (Executive Summary)

1. **Facial Emotion Visibility Gap**: The complete camera-to-CNN inference pipeline works in the backend, but the frontend only exposes the fused result, concealing the facial classifier's individual contribution.
2. **Account Profile UX Disconnect**: Clicking the account icon while logged in triggers a `confirm("Do you wish to sign out?")` prompt instead of opening an Account Profile modal displaying user information.
3. **Quick Check-in Storage Nuance**: The 30-second Quick Check-in modal updates local client-side memory, but does not persist the check-in to PostgreSQL.
4. **Documentation / Badge Nuance**: The UI badge *"100% Client-Side RAM"* is technically imprecise; while video is never written to disk, JPEG frames are transmitted over network HTTP POST to backend and FastAPI memory for inference.
