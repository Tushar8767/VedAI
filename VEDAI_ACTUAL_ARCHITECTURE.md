# VedAI — Actual System Architecture & Technical Audit

**Evaluator**: External Technical Invigilator  
**Audit Standard**: Empirical Code Inspection & Runtime Verification (No Assumptions)  
**Revision Target**: `a5c6666` (Main branch)  
**Environment**: Windows 11 x64, Node.js v20+, Python 3.12+, PostgreSQL 17  

---

## 1. Top-Level Architectural Blueprint

```
+----------------------------------------------------------------------------------------------------+
|                                         CLIENT BROWSER (PORT 3000 / 5000)                          |
|  - HTML5 / CSS3 Dark Theme / Vanilla ES6 (`frontend/app.js`, `frontend/index.html`)                |
|  - MediaDevices API (Camera canvas frame capture to RAM base64)                                    |
|  - Web Speech API (Local Sanskrit Shloka audio chant synthesis)                                    |
|  - Navigation carousel (Home, Reflect, Chat, Journal, Insights)                                    |
+----------------------------------------------------------------------------------------------------+
                                      |                      ^
                 POST /api/v1/process |                      | JSON Revelation Payload
                 POST /api/v1/chat    |                      | (Fused Emotion, Verses,
                 POST /api/v1/auth/*  |                      |  Remedies, Video URLs)
                                      v                      |
+----------------------------------------------------------------------------------------------------+
|                                 EXPRESS 5 GATEWAY (PORT 5000)                                      |
|  - Server: `backend/server.js`                                                                     |
|  - Middleware: Hardened headers (HSTS, CSP-friendly, X-Frame-Options: DENY), CORS, Rate Limiting   |
|  - Rate Limits: 500 req/15m on `/api/v1/auth`, 2000 req/1m on `/api/v1/*`                          |
|  - Encryption: AES-256-GCM (`backend/utils/encryption.js`) for private journal vault               |
|  - Intent Routing: 10 Semantic Intent buckets (`backend/services/intentRouter.js`)                 |
|  - Layered Safety: 5-layer crisis regex engine (`backend/services/safetyService.js`)               |
|  - Fusion Orchestrator: Combines text + facial probabilities (`backend/services/fusionService.js`) |
+----------------------------------------------------------------------------------------------------+
              |                                            |
              | POST /predict                              | Parameterized SQL Queries
              | POST /predict/face                         | ($1, $2, ...)
              | POST /rag/search                           |
              v                                            v
+------------------------------------------+  +------------------------------------------------------+
|       FASTAPI ML SERVICE (PORT 8001)     |  |                 POSTGRESQL 17 DATABASE               |
|  - Server: `ml_model/app.py`             |  |  - `users`: PBKDF2 salted hashes, UUID PK            |
|  - NLP: Lexicon prior / RoBERTa (7 cls)  |  |  - `emotion_history`: JSONB probabilities, cascade   |
|  - Vision: Haar Cascade + PyTorch CNN    |  |  - `journal_entries`: AES-256-GCM ciphertexts        |
|  - RAG Index: TF-IDF + Cosine Similarity |  |  - `gita_verses`: 14 canonical verses seeded         |
|  - Volatile RAM: Zero image disk storage |  |  - `chat_conversations` & `chat_messages`            |
+------------------------------------------+  +------------------------------------------------------+
```

---

## 2. Component-by-Component Reality Matrix

| Subsystem | Stated in Concept | Actual Implementation in Code | Verification Evidence | Reality Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Runtime** | Single Page Web App | Vanilla JS (`app.js`, 1396 lines), HTML5, CSS3. Zero frontend build step (No React/Webpack). | `frontend/package.json` only contains `live-server`. | **VERIFIED** |
| **API Gateway** | Node.js Express Server | Express 5.2.1 running on port 5000. Serves `/api/v1/*` routes and static `frontend/` files. | `backend/server.js:87-90` | **VERIFIED** |
| **ML Microservice** | Python AI Engine | FastAPI on port 8001 (`ml_model/app.py`). Single-worker Uvicorn process. | `ml_model/app.py:20` | **VERIFIED** |
| **Database** | Relational Persistence | PostgreSQL 17 relational database via `pg` connection pool. Fallback: `backend/data/vedai-db.json`. | `backend/database/db.js` | **VERIFIED** |
| **RAG Knowledge Base** | Vector RAG | TF-IDF Vectorizer (`max_features=1000`) + Cosine Similarity over `canonicalGitaData.json` (14 verses) + exact chapter/verse regex index. | `ml_model/app.py:120-128`, `ragService.js:8-16` | **TF-IDF + Exact Index** (Not an external vector DB) |
| **Facial Emotion** | Biometric Facial Sensing | OpenCV Haar Cascade (`haarcascade_frontalface_default.xml`) + PyTorch 7-class CNN (`FaceEmotionCNN`). Runs in RAM. | `ml_model/app.py:71-106` | **VERIFIED (RAM only)** |
| **Multimodal Fusion** | Multimodal AI | Decision-level weighted late fusion: $P = 0.6 \times P_{text} + 0.4 \times P_{face}$, re-normalized. | `fusionService.js:15-32` | **VERIFIED** |
| **Safety Net** | Emergency Interception | 5-layer regex detector (English, Leetspeak, Hinglish, Marathi, Burdensomeness) + Benign Idiom Filter. | `safetyService.js:14-60` | **VERIFIED** |
| **Journal Vault** | Encrypted Storage | AES-256-GCM authenticated encryption (`enc:v1:<iv>:<tag>:<ciphertext>`) with 12-byte random IV. | `backend/utils/encryption.js` | **VERIFIED** |
| **Authentication** | Secure Account System | Salted PBKDF2 (120,000 iterations, SHA-512) + HS256 signed bearer token. | `backend/services/authService.js:16` | **VERIFIED** |

---

## 3. Data Flow Traces

### Trace 1: Multimodal Reflection Journey
1. **User** types reflection in `userInput` and toggles camera.
2. `captureCameraFrame()` in `app.js:373` captures current frame from `<video>` element into hidden `<canvas>` and converts to JPEG Data URL (`image/jpeg`, 0.8).
3. Payload `{ user_text: text, face_image: faceImage }` posted to Express `/api/v1/process`.
4. Express triggers:
   - `assessSafety(trimmedText)` (Safety layer check)
   - `analyzeEmotion(trimmedText)` (NLP emotion analysis via FastAPI or local prior)
   - `analyzeFaceEmotion(face_image)` (POSTs base64 to FastAPI `/predict/face`)
5. FastAPI decodes base64 into numpy array, detects face ROI via Haar, passes to PyTorch `FaceEmotionCNN`, and returns 7-class probabilities.
6. Express computes late fusion ($0.6 \times \text{text} + 0.4 \times \text{face}$).
7. Express executes RAG retrieval (`searchGitaRag`), pulls practical recommendations, matches YouTube media, builds explainability string, and returns composite response payload.
8. Frontend renders dominant fused emotion, confidence gauge, Gita shloka card, remedies, and video cards.
   - **CRITICAL AUDIT GAP IDENTIFIED**: Frontend `renderRevelation()` only displays the **final fused emotion**. It does NOT show a separate panel breaking down the text emotion score vs facial emotion score.

### Trace 2: Multi-Turn Philosophical Chat Journey
1. User submits chat query in `chatPane`.
2. POST `/api/v1/chat` passes message, conversation ID, and optional user token.
3. Express calls `routeIntent(message)`:
   - If crisis -> returns `SAFETY_CRISIS` with 988/112 helplines immediately (zero RAG).
   - If clinical inquiry -> returns `CLINICAL_BOUNDARY` refusal and psychiatric referral.
   - If adversarial injection -> returns `ADVERSARIAL_PROMPT_INJECTION` refusal.
   - If "simplify" -> retrieves previous verse from conversation history and generates 3-step actionable breakdown.
   - If Gita/distress -> queries RAG for grounded canonical verse and constructs response.
4. Message appended to conversation memory (stored in `chat_messages` table if authenticated, or memory map if guest).
