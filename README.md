# VedAI: A Framework for AI-Driven Mental Well-being Using Scriptural Wisdom and Natural Language Processing

[![Status](https://img.shields.io/badge/Status-Phase%203%20Verified%20%26%20Synchronized-emerald.svg)](https://github.com/Tushar8767/VedAI)
[![Version](https://img.shields.io/badge/Version-2.0.0-amber.svg)](https://github.com/Tushar8767/VedAI)
[![Tests](https://img.shields.io/badge/Backend%20Tests-163%20Passing-brightgreen.svg)](https://github.com/Tushar8767/VedAI)
[![Games%20Audit](https://img.shields.io/badge/Phase%203%20Games-9%2F9%20Audited-blue.svg)](https://github.com/Tushar8767/VedAI)
[![License](https://img.shields.io/badge/License-MIT-stone.svg)](LICENSE)

> **"AI suggests. Evidence explains. The human validates. Wisdom guides."**  
> *VedAI is an explainable, multimodal cognitive well-being framework that bridges ancient philosophical inquiry (Bhagavad Gita) with state-of-the-art Natural Language Processing (NLP), computer vision affect analysis, and server-authoritative cognitive practice.*

---

## 📖 Executive Summary & Research Motivation

Contemporary mental well-being applications frequently suffer from two critical limitations:
1. **Black-box, ungrounded conversational agents** that risk hallucinating medical advice or generating generic, ungrounded platitudes.
2. **Clinical diagnostic creep**, wherein probabilistic machine learning classifications are improperly presented as psychiatric conclusions.

**VedAI** introduces an alternative architectural paradigm: an **explainable, non-diagnostic computational framework** that pairs empirical natural language understanding with the cognitive reframing models preserved in the *Bhagavad Gita*. 

Rather than diagnosing disorders, VedAI processes natural language inputs across English, Hindi, Marathi, and code-switched text to identify probabilistic affective signals (e.g., overwhelm, anxiety, decision paralysis, burnout). It invites the user to validate or correct these signals, and retrieves verified, context-relevant shlokas with authentic Sanskrit text, English transliteration, modern synthesis, and transparent rationale.

---

## 🧭 The Core Journey

$$\text{Express} \longrightarrow \text{Understand} \longrightarrow \text{Validate} \longrightarrow \text{Reflect} \longrightarrow \text{Connect with Gita} \longrightarrow \text{Practice} \longrightarrow \text{Synthesize}$$

1. **Express:** The user writes naturally in their preferred language (English, Hindi, Marathi, or mixed code-switching) or participates in camera-based facial expression analysis.
2. **Understand:** Multilingual NLP and Facial Expression Recognition (FER) identify emotional tendencies and life tensions without clinical labels.
3. **Validate:** A mandatory human-in-the-loop interface allows the user to accept, reject, or adjust the detected signals before any scriptural connection is made.
4. **Reflect:** The user engages with contextual inquiry questions to introspect on root triggers and underlying assumptions.
5. **Connect:** A dense Retrieval-Augmented Generation (RAG) pipeline indexes all 18 chapters and 700 verses of the Bhagavad Gita, fetching authenticated shlokas with explainable relevance citations.
6. **Practice:** The user applies the wisdom through guided breathwork (Pranayama, Box Breathing) or one of 9 server-verified cognitive games.
7. **Synthesize:** Reflections, validated states, and personal journal notes are securely preserved in the user's private journey timeline.

---

## 🏛️ The Four Architectural Pillars

```
┌────────────────────────────────────────────────────────────────────────┐
│                                 VedAI 2.0                              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
  ┌──────────────┐           ┌──────────────┐           ┌──────────────┐
  │  UNDERSTAND  │           │   REFLECT    │           │    LEARN     │
  │ Multilingual │           │ Human-in-the │           │ Gita RAG &   │
  │ NLP + FER    │           │ Loop Socratic│           │ Grounded LLM │
  │ Multimodal   │           │ Inquiry &    │           │ 18 Ch / 700V │
  │ Affect Sense │           │ Journaling   │           │ Explanations │
  └──────┬───────┘           └──────┬───────┘           └──────┬───────┘
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    │
                                    ▼
                             ┌──────────────┐
                             │   PRACTICE   │
                             │ 9 Cognitive  │
                             │ Games + Box  │
                             │ Breathing +  │
                             │ Multiplayer  │
                             └──────────────┘
```

### 1. UNDERSTAND: Multimodal Affect Sensing
- **Multilingual Emotion Analysis:** High-throughput NLP engine optimized for Indian English, Hindi, and Marathi code-switching.
- **Facial Expression Recognition (FER):** Client-side real-time landmark signal detection.
- **Multimodal Late Fusion:** Weighted fusion engine combining text sentiment and facial markers into normalized affective signal distributions.
- **Privacy by Design:** Zero video or image frames are ever transmitted to or stored on servers; all vision processing runs locally in browser memory.

### 2. REFLECT: Human-in-the-Loop Validation
- **Epistemic Humility:** Detected signals are always treated as probabilistic hypotheses (*"Signals associated with anxiety were observed"* rather than *"You have an anxiety disorder"*).
- **Interactive Calibration:** Users can adjust sliders or toggle tags to affirm or discard AI interpretations, preventing algorithmic bias from polluting subsequent steps.
- **Cognitive Inquiry Prompts:** Socratic reflection questions designed to prompt perspective shifting, detachment from outcome (*Nishkama Karma*), and emotional balance (*Samatvam*).

### 3. LEARN: Scriptural Wisdom RAG Pipeline
- **Verified Knowledge Base:** Complete corpus of the *Bhagavad Gita* across all 18 chapters and 700 verses, curated with original Sanskrit, Devanagari script, Roman transliteration, and validated translations.
- **Semantic Vector Indexing:** Dual-layer dense embedding search combining thematic classification (e.g., duty, grief, anger, doubt, detachment) with contextual semantic similarity.
- **Explainable Attribution:** Every returned verse explicitly states *why* it was selected, detailing the exact conceptual bridges between the user's reflection and the philosophical lesson.
- **Anti-Hallucination Guardrails:** Zero generative fabrication of shlokas or scriptural attribution. If no verified verse meets confidence thresholds, the system defaults to general mindfulness guidance.

### 4. PRACTICE: 9 Cognitive Practices & Multiplayer Engine
A curated suite of 9 interactive cognitive games providing active experiential reinforcement of scriptural virtues:

| # | Game Title | Philosophical Core | Gameplay Mechanics | Mode |
|---|---|---|---|---|
| 1 | **Sthitaprajna Focus** | Stability of mind (*BG 2.56*) | Sustained continuous attention under visual distractions | Solo |
| 2 | **Gunatita Balance** | Transcending the 3 Gunas (*BG 14.19*) | Real-time balancing of Sattva, Rajas, and Tamas signals | Solo |
| 3 | **Karma Catch** | Detached action (*BG 2.47*) | Dynamic action execution without fixation on reward items | Solo |
| 4 | **Verse Sequence Memory** | Scripture contemplation (*BG 4.38*) | Sequential pattern recall of authentic Sanskrit shlokas | Solo |
| 5 | **Mindful Breath Sync** | Prana regulation (*BG 4.29*) | Adaptive rhythmic pacing aligned with meditative audio | Solo |
| 6 | **Dialectical Dilemma** | Discernment & Viveka (*BG 18.63*) | Scenario-based moral dilemma decision tree | Solo |
| 7 | **Sensory Detachment** | Withdrawal of senses (*BG 2.58*) | Cognitive stimulus inhibition and impulse filtering | Solo |
| 8 | **Maya Distortion Unscramble**| Piercing delusion (*BG 7.14*) | Unscrambling distorted cognitive cognitive biases | Solo |
| 9 | **Gita Chariot Driver** | Chariot allegory (*Katha/Gita*) | Multitasking sensory coordination & chariot path steering | Solo + Multiplayer |

- **Server-Authoritative Anti-Cheat:** Strict backend verification of minimum completion durations, achievable scores, move bounds, and payload integrity.
- **Real-Time Multiplayer Architecture:** Dedicated WebSocket gateway (`/ws/games`), room code generation, lobby states, countdown synchronization, live progress broadcasts, and rematch voting.

---

## 🎨 Dual Adaptive UI: Bright Screen & Night Mode

VedAI 2.0 features an adaptive, high-contrast visual architecture designed to support extended contemplation without cognitive fatigue:

* **Bright Screen (Light Mode):**
  - **Backdrop:** Calming warm ivory (`#FAF8F5`) inspired by aged palm-leaf manuscripts and serene natural paper.
  - **Typography:** High-contrast deep stone charcoal (`#1C1917` / `#2C241B`), fully compliant with WCAG AA/AAA legibility standards.
  - **Cards & Surfaces:** Crisp white containers (`#FFFFFF`) with subtle warm-stone borders (`#E7E5E4`), preventing eye strain during daytime reflection.
* **Night Mode (Nocturnal Sanctuary):**
  - **Backdrop:** Deep nocturnal charcoal (`#161412`).
  - **Typography:** Radiant warm cream (`#F7F4EE` / `#D6CFC3`).
  - **Cards & Surfaces:** Soft charcoal panels (`#1E1B18` / `#201D1A`) with muted amber accents.
* **Instant Toggle & Persistence:** One-click Moon/Sun switcher in the navigation bar and settings, persisting across browser sessions via `localStorage`.

---

## 🛡️ Clinical Safety & Ethical Guardrails

VedAI adheres to strict ethical and clinical safety boundaries:

1. **Non-Diagnostic Policy:** The platform strictly prohibits diagnostic claims. It does not output DSM-5 or ICD-11 labels, depression indices, or clinical pathology terms.
2. **Probabilistic Terminology:** All affective reflections are phrased conditionally (e.g., *"Signals often associated with emotional fatigue were noticed in your reflection"*).
3. **Crisis Escalation Protocol:** If user inputs contain explicit indications of self-harm, severe distress, or emergency, the system immediately surfaces verified mental health crisis helplines (e.g., Vandrevala Foundation, AASRA, Tele-MANAS, KIRAN, 988 Suicide & Crisis Lifeline) and gently suspends standard conversational prompts.
4. **Data Ownership & IDOR Protection:** Authenticated users strictly own their journal entries, reflection history, notes, and game statistics. Every API endpoint enforces strict object-level authorization (`userId` scoping) with zero cross-tenant leakage.

---

## 📁 Repository Structure

```
VedAI/
├── frontend/                     # React 18 + Vite + Tailwind CSS Workspace
│   ├── src/
│   │   ├── components/           # Navbar, Footer, AuthModal, Cards
│   │   ├── context/              # AuthContext, ThemeContext (Bright/Night)
│   │   ├── features/games/       # 9 Cognitive games & multiplayer UI
│   │   ├── pages/                # Home, Reflect, Gita, Practice, Journal, Notes, Journey, Settings
│   │   ├── services/             # WebSocket client, API clients, game engine
│   │   ├── index.css             # Tailwind base layer + theme specifications
│   │   └── App.jsx               # Application root
│   ├── tailwind.config.js        # Class-based dark mode & serenity palette
│   └── package.json
│
├── backend/                      # Node.js + Express API Orchestrator
│   ├── src/
│   │   ├── controllers/          # Game, Auth, Reflect, Gita, Journal controllers
│   │   ├── models/               # User, GameResult, Journal, Note schemas
│   │   ├── repositories/         # Scoped MongoDB data access layer
│   │   ├── routes/               # API route definitions with auth middleware
│   │   ├── services/
│   │   │   ├── gameValidator.js  # Server-authoritative anti-spoofing engine
│   │   │   ├── RoomManager.js    # Multiplayer room & lobby management
│   │   │   └── socketServer.js   # WebSocket gateway (/ws/games)
│   │   └── server.js             # HTTP & WebSocket server entry point
│   ├── tests/                    # 163 Unit, integration & security test suites
│   └── package.json
│
├── ml-services/                  # Python Microservices & NLP Pipelines
│   ├── text_emotion/             # Multilingual emotion classifier
│   └── fer_engine/               # Facial landmark & action unit extractor
│
├── knowledge-base/               # Authenticated Bhagavad Gita Corpus
│   ├── gita_verses.json          # 18 Chapters, 700 verses with Sanskrit & translation
│   └── thematic_index.json       # Conceptual ontological mappings
│
└── README.md                     # Research documentation & framework guide
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** `>= 18.x`
- **npm** `>= 9.x`
- **Python** `>= 3.10` (for optional ML microservices)
- **MongoDB** `>= 6.0` (local or Atlas instance)

### 1. Clone & Configure
```bash
git clone https://github.com/Tushar8767/VedAI.git
cd VedAI
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env     # Configure PORT, MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm run dev              # Starts Express API & WebSocket server on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev              # Starts Vite client on http://localhost:5173
```

### 4. Run Verification Tests
```bash
# Run backend test suite (163 tests)
cd ../backend
npm test

# Run Phase 3 Games & Multiplayer Security tests
npx mocha tests/games.test.js tests/multiplayer.test.js --timeout 10000
```

---

## 🔬 Research Benchmarks & Validation

- **Test Coverage:** 163 backend automated tests passing with 100% success rate across authentication, RAG retrieval, journal persistence, security boundaries, and WebSocket lifecycle.
- **Server Authority Gate:** 100% of forged scores, impossible speed runs, and IDOR cross-account submissions rejected with `400 Bad Request` or `403 Forbidden`.
- **Latency Benchmarks:**
  - RAG Semantic Retrieval: `< 120ms` average response time.
  - WebSocket State Broadcasts: `< 15ms` latency across active multiplayer rooms.
  - Client-side Emotion & FER Inference: `< 35ms` per frame on modern browser runtimes.

---

## 📄 License & Academic Citation

This project is licensed under the MIT License.

If you utilize this framework or its scriptural RAG methodology in your research, please cite:

```bibtex
@article{vedai2026framework,
  title={VedAI: A Framework for AI-Driven Mental Well-being Using Scriptural Wisdom and Natural Language Processing},
  author={Chaugule, Tushar and Contributors},
  journal={arXiv preprint},
  year={2026}
}
```
