# VedAI 2.0 — Implementation Evidence Index

> **Document Purpose:** Rapid directory and evidence lookup index for the academic paper author.  
> **Companion Document:** `docs/VEDAI_2.0_MASTER_IMPLEMENTATION_REFERENCE.md`  

---

## 1. Primary Source Implementation Files

| Subsystem | Key Files | What It Implements |
|:---|:---|:---|
| **API Entry & Pipeline** | `backend/src/server.js`<br>`backend/src/app.js`<br>`backend/src/controllers/reflectController.js` | HTTP server, WebSocket mount, SPA static server, 8-stage AI orchestration pipeline |
| **Authentication & Security** | `backend/src/controllers/authController.js`<br>`backend/src/middleware/auth.js`<br>`backend/src/middleware/rateLimiter.js` | Gmail regex validation, bcrypt salt 10, JWT issuance/verification, rate limiting |
| **Data Models (Mongoose)** | `backend/src/models/User.js`<br>`backend/src/models/JournalEntry.js`<br>`backend/src/models/Note.js`<br>`backend/src/models/GameResult.js`<br>`backend/src/models/ResearchLog.js` | Database schemas, indexing, user data isolation, content segregation |
| **Text Emotion NLP** | `ml-services/app.py`<br>`backend/src/services/emotionService.js` | FastAPI microservice, DistilBERT multilingual inference, dual pooling, uncertainty entropy |
| **Multimodal Fusion** | `backend/src/services/multimodalFusionService.js` | Quality-weighted late fusion, 8 discrete states, non-forced conflict handling |
| **Scriptural RAG Engine** | `backend/src/services/vectorSearchService.js`<br>`knowledge-base/gita_verses.json` | 700 verses, 5573-dim TF-IDF Vector Space Model, L2 cosine similarity thresholding |
| **Grounded LLM & Fallback**| `backend/src/services/llmService.js`<br>`backend/src/services/outputValidator.js` | Gemini 1.5 Flash grounded prompt construction, schema validation, deterministic fallback |
| **Safety & Crisis Guard** | `backend/src/services/safetyService.js` | Deterministic 4-tier safety screen, crisis keyword interception, prompt injection defense |
| **9 Cognitive Games** | `frontend/src/features/games/games/` | Sudoku, Memory Match, Number Sequence, Pattern, Reaction, Word Recall, Stroop, Logic, Maze |
| **Anti-Cheat Validator** | `backend/src/features/games/gameValidator.js` | Server-authoritative physical duration thresholds, score bounds, move sanity checks |
| **Multiplayer Arena** | `backend/src/multiplayer/RoomManager.js`<br>`backend/src/multiplayer/socketServer.js` | 2–8 player rooms, `VED###` codes, lobby lifecycle, live broadcast, rematch voting |
| **Offline Game Storage** | `frontend/src/features/games/services/gameStorageService.js` | IndexedDB object store (`VedAIGamesDB`) with localStorage fallback |
| **Adaptive Dual UI** | `frontend/src/context/ThemeContext.jsx`<br>`frontend/src/index.css`<br>`frontend/index.html` | Bright Screen (`#FAF8F5`) and Night Mode (`#161412`), zero-flicker early boot script |

---

## 2. Test Suites & Verification Evidence

All test suites execute via Node.js native test runner (`node:test`) inside `backend/tests/`:

| Test File | Total Tests | What Was Verified |
|:---|:---:|:---|
| `backend/tests/auth.test.js` | 18 | Gmail validation, bcrypt password hashing, JWT expiration, single-use reset token |
| `backend/tests/security_audit.test.js` | 16 | IDOR isolation, rate limiting, prompt injection defense, error trace redaction |
| `backend/tests/games.test.js` | 12 | 9 games anti-cheat bounds, sub-human duration rejection, score persistence, IDOR isolation |
| `backend/tests/multiplayer.test.js` | 10 | WebSocket room creation, 2–8 player capacity, lobby countdown, in-memory live progress |
| `backend/tests/gita_corpus.test.js` | 7 | 18 chapters, 700 verses, zero duplicates, Sanskrit transliteration and theme integrity |
| `backend/tests/llm_pipeline.test.js` | 16 | Grounded prompt compilation, XML tag sanitization, deterministic local engine fallback |
| `backend/tests/multimodal_fusion.test.js` | 24 | All 8 fusion states, conflict preservation, dynamic quality weights, human override |
| `backend/tests/validation_explainability.test.js` | 14 | 6 validation choices, user correction priority, research telemetry consent gating |
| `backend/tests/phase1_core.test.js` | 12 | Core workspace modules, journal CRUD, personal notes, box breathing practice logs |
| `backend/tests/pipeline.test.js` | 12 | End-to-end orchestration pipeline integration and error recovery |
| `backend/tests/phase2h_evaluation.test.js` | 10 | Benchmark harness execution, macro metrics, confusion matrix compilation |
| `backend/tests/emotion_ml.test.js` | 12 | FastAPI microservice communication, JSON schema validation, heuristic fallback |

---

## 3. Benchmark & Research Evidence Files

| Evidence Document / Dataset | File Location | Key Contents |
|:---|:---|:---|
| **VMES-Bench Dataset** | `research/benchmark_dataset.json` | 35 balanced multilingual test cases (English, Hindi, Marathi, code-mixed) |
| **Benchmark Evaluation Report** | `research/EVALUATION_REPORT.md` | Empirical Macro F1 = 56.5%, Conflict Detection = 100%, Safety Interception = 100%, P50 = 4.12 ms |
| **Raw Benchmark Run Results** | `research/benchmark_results.json` | Detailed per-sample predictions, confusion matrix, and latency breakdown |
| **Model Evaluation Metrics** | `ml-services/model/evaluation_metrics.json` | 140 train / 42 eval samples, Macro F1 = 61.41%, language breakdown |
| **Trained ML Classifier** | `ml-services/model/emotion_classifier.joblib` | Serialized 3.17 MB calibrated classification head |

---

## 4. Configuration & Deployment Evidence

| Target | Configuration File | Verified Capabilities |
|:---|:---|:---|
| **Render Cloud Deployment** | `render.yaml` | Infrastructure-as-Code Blueprint for unified fullstack web service with WebSockets |
| **Docker Multi-Container** | `deployment/docker-compose.yml` | Container definitions for backend, frontend Nginx, Python ML, and MongoDB |
| **Frontend Production Bundler**| `frontend/vite.config.js` | Vite 6.1.0 production build verified in 8.43 seconds with 0 errors |
| **Tailwind Design System** | `frontend/tailwind.config.js` | Class-based dark mode (`darkMode: 'class'`) with Serenity and Vedic palettes |
| **Backend Environment Template**| `backend/.env.example` | Sanitized template defining PORT, MONGODB_URI, JWT_SECRET, GEMINI_API_KEY |
