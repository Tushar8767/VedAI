# VedAI 2.0 — Multimodal Cognitive Guidance & Practice Architecture

> **"AI suggests. Evidence explains. The user decides."**

VedAI 2.0 is an emotion-aware cognitive guidance, philosophical reflection, and mental engagement platform. It bridges contemporary transformer-based natural language processing and computer vision with the philosophical framework of the complete **700-verse Bhagavad Gita**.

🔗 **[GitHub Repository](https://github.com/Tushar8767/VedAI)** · **[Live Demo](https://vedai-7v9t.onrender.com/)**

---

## 🏛️ Core Pillars

* **UNDERSTAND:** Multimodal perception of emotional signals across text (multilingual DistilBERT) and voluntary facial cues (client-side geometric landmarks), qualified with mathematical uncertainty.
* **REFLECT:** Epistemologically grounded dialogue where the user holds absolute authority to confirm, adjust, or override AI observations, supported by verse-grounded retrieval from all 700 canonical verses of the Gita.
* **LEARN & PRACTICE:** Cognitive agility, focus, working memory, and logical practice through a suite of 9 offline-first and real-time multiplayer cognitive practice games.

---

## 🧠 Core AI & Safety Architecture

### 1. Multilingual Text Emotion Intelligence
* **Model:** DistilBERT Multilingual (`distilbert-base-multilingual-cased`), trained across English, Hindi (Devanagari), Marathi (Devanagari), and Hinglish/code-switched queries.
* **Outputs:** Calibrated probability distributions over 7 canonical emotional signal categories (`stress_overwhelm`, `anxiety_fear`, `anger_frustration`, `sadness_grief`, `calm_peace`, `hope_optimism`, `neutral_unclear`).
* **Uncertainty Quantification:** Computes Shannon entropy and prediction margin to flag ambiguous, multi-label, or blended states.

### 2. Client-Side Facial Landmark Signals
* **Privacy-First:** Processed 100% locally in the browser using MediaPipe FaceMesh (468 landmarks). **Zero raw video frames or camera images are ever transmitted or saved.**
* **Signal Quality Gate:** Computes bounding box stability, head pose deviation, and ambient luminance before interpreting facial cues.

### 3. Evidence-Aware Multimodal Fusion
* Dynamically combines text and facial modalities with signal quality weighting and conflict detection (`MULTIMODAL_CONFLICT`).
* Strictly treats signals as hypotheses, never asserting ground truth (e.g., *"Signals suggest potential anxiety"* rather than *"You are anxious"*).

### 4. Human Validation Layer
* Users are presented with intuitive validation options (*Yes*, *Partly*, *Not Really*, or *Custom Override*).
* User corrections possess absolute priority in prompting the LLM and updating session reflection records.

### 5. Canonical 700-Verse Gita RAG
* Complete corpus of all 18 chapters and 700 Sanskrit verses with transliteration, word meanings, and contextual commentary.
* **Retrieval Implementation:** Sparse TF-IDF vector space model with cosine similarity matching and metadata tag filtering (*Dense semantic vector embeddings are roadmapped for future expansion*).

### 6. Four-Tier Ethical Safety Gate
* Pre-orchestration heuristic and regex safety pipeline.
* Instant high-risk crisis interception (Tier 4: self-harm, medical emergencies) with immediate helpline resources (Tele-MANAS, Vandrevala Foundation) and zero philosophical lecturing.

---

## 🎮 Phase 3: Games & Cognitive Practice

VedAI 2.0 includes a dedicated, decoupled cognitive engagement suite designed for focus training, working memory, and recreational logical practice.

### Strictly Non-Diagnostic Boundary
> **Mandatory Policy:** Game metrics represent purely factual gameplay performance (elapsed time, score, moves, accuracy). They do **NOT** measure IQ, cognitive impairment, psychiatric status, or medical health.

### 9 Cognitive Practice Games
1. **Sudoku Focus Practice:** 9×9 grid constraint satisfaction with easy, medium, and hard algorithmic masking.
2. **Memory Match Practice:** 16-card paired symbol matrix for spatial recall.
3. **Number Sequence Practice:** Arithmetic, geometric, Fibonacci, and alternating sequence deductions.
4. **Pattern Recognition Practice:** 3×3 visual rotational shape matrix puzzles.
5. **Reaction & Focus Practice:** Randomized green stimulus alert measuring millisecond reaction time.
6. **Delayed Word Recall:** Exposure memorization phase followed by candidate distractor identification.
7. **Stroop Inhibitory Focus:** Classic neuro-cognitive selective attention task (naming ink color over conflicting word reading).
8. **Deductive Logic Practice:** Premise-constrained scenario riddles with verified deductive proofs.
9. **Spatial Maze Practice:** 2D backtracked labyrinth navigation with keyboard and mobile D-pad controls.

### Reusable Game Engine & Offline-First Design
* **Engine Lifecycle:** Unified state machine (`IDLE`, `PLAYING`, `PAUSED`, `FINISHED`) with timer, pause overlay, move tracking, and result modals.
* **Storage:** Browser IndexedDB (`VedAIGamesDB`) with seamless localStorage fallback. Full solo gameplay operates without internet connection.
* **Server Authority:** Backend validator (`gameValidator.js`) enforces minimum feasible completion times and move bounds to prevent client speedrun spoofing.

### Real-Time Multiplayer Arena
* Native WebSocket server on `/ws/games`.
* In-memory `RoomManager.js` supporting 2–8 player rooms with 6-character room codes (`VED###`), invite links, synchronized 3-second countdown, real-time live progress broadcasting, server-authoritative podium rankings, and rematch voting.
* **Ephemeral Architecture:** Zero database spam — real-time websocket packets remain strictly in memory.

---

## 📁 Repository Structure

```
VedAI/
├── backend/
│   ├── src/
│   │   ├── config/            # Environment, DB, and SMTP configuration
│   │   ├── controllers/       # Auth, Reflect, Gita, Journal, Notes, Journey, Games
│   │   ├── features/games/    # Anti-cheat validator (minimum feasible duration checks)
│   │   ├── middleware/        # JWT auth, rate limiters, security headers
│   │   ├── models/            # Mongoose schemas (User, Reflection, Journal, GameResult)
│   │   ├── multiplayer/       # RoomManager.js & socketServer.js (/ws/games)
│   │   ├── repositories/      # Dual-mode data access (MongoDB + FileCollection fallback)
│   │   ├── routes/            # REST endpoint routers
│   │   ├── services/          # Emotion ML, Gita RAG, Safety, Grounded LLM, Validation
│   │   └── server.js          # HTTP + WebSocket server bootstrap
│   └── tests/                 # 15 test suites (163 tests) covering Phase 1, 2, 3 & Security
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, Footer, AuthModal, ProtectedRoute
│   │   ├── context/           # AuthContext, ThemeContext
│   │   ├── features/games/    # Games module: 9 games, components, hooks, services, utils
│   │   ├── pages/             # Home, Reflect, Gita, Journal, Notes, Journey, Practice, Settings
│   │   ├── services/          # REST & WebSocket client services
│   │   ├── App.jsx            # Main tab routing & modal controllers
│   │   └── main.jsx           # React DOM root
│   ├── index.html             # HTML entry point
│   ├── tailwind.config.js     # Tailwind styling configuration
│   └── vite.config.js         # Vite bundler configuration
├── ml-services/
│   ├── app.py                 # FastAPI microservice on port 8001 (DistilBERT multilingual)
│   ├── train_model.py         # Classifier training script
│   └── requirements.txt       # PyTorch, Transformers, FastAPI dependencies
├── knowledge-base/
│   ├── canonical_gita_700.json# Canonical 700-verse corpus
│   └── gita_schema.json       # Structural validation schema
├── research/
│   ├── benchmark_dataset.json # VMES-Bench validation set (120 multilingual test cases)
│   └── evaluate_benchmark.js  # Macro F1, precision, recall evaluation script
├── deployment/
│   ├── docker-compose.yml     # Multi-container orchestration (backend, frontend, ml, mongo)
│   ├── Dockerfile.backend     # Backend production container
│   ├── Dockerfile.frontend    # Frontend production container
│   └── Dockerfile.ml          # ML inference container
└── docs/                      # Comprehensive technical dossiers and audit reports
```

---

## 🧪 Verification & Test Results

The repository features comprehensive test coverage executed via native `node:test`:

* **Total Backend Tests:** **163 / 163 passing (15 test suites, 0 failures)**
* **Phase 3 Tests:** **22 / 22 passing** (12 games & anti-cheat tests + 10 multiplayer tests)
* **Phase 2I Security Audit:** **16 / 16 passing** (IDOR prevention, prompt injection defense, rate limiting, token rotation)
* **Master Verification Matrix:** **7 / 7 live scenarios passing** (crisis interception, Hinglish slang, typo resilience, diagnosis refusal)
* **Frontend Production Build:** Vite build clean with **0 errors**.

### Running Tests

```bash
# 1. Run Phase 3 Games & Multiplayer Test Suites
cd backend
node --test tests/games.test.js tests/multiplayer.test.js

# 2. Run All 15 Test Suites (Full Regression)
cd backend
npm test

# 3. Build Frontend
cd frontend
npm run build
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js:** v18+ (Node 20+ recommended)
* **Python:** v3.10+ (for ML microservice)
* **MongoDB:** Local instance or MongoDB Atlas connection URI

### Quick Start

1. **Install Dependencies:**
   ```bash
   npm install
   cd backend && npm install && cd ..
   cd frontend && npm install && cd ..
   ```

2. **Configure Environment:**
   Copy `.env.example` to `.env` in `backend/` and configure your credentials.

3. **Start Development Services:**
   * Backend API: `cd backend && npm run dev` (starts on port 5000)
   * Frontend: `cd frontend && npm run dev` (starts on port 5173)
   * ML Microservice: `cd ml-services && python -m uvicorn app:app --port 8001`

---

## 🔒 Security & Privacy Commitments

1. **Zero Raw Biometric Storage:** Camera frames never leave the user's browser.
2. **Explicit Consent Gate:** Telemetry and multimodal observations require explicit user consent.
3. **Data Ownership & IDOR Protection:** Users can view, export, or permanently erase their own reflection and gameplay records.
4. **Epistemic Modesty:** AI recommendations are presented as hypotheses; clinical or medical claims are strictly forbidden.

---

## 📄 License & Attribution

VedAI 2.0 is an academic and open-source project dedicated to ethical AI, cognitive practice, and contemplative wisdom.
Bhagavad Gita Sanskrit verses and translations are derived from traditional public domain sources.
