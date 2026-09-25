# VedAI — Complete Project Test Inventory

**Audit Timestamp**: 2026-09-25T21:55:00+05:30  
**Environment**: Windows 11 x64, Node.js v20+, Python 3.12+, PostgreSQL 17  
**Execution Context**: Local development / Live test harness

---

## 1. System Motive & Architectural Boundary
VedAI is an **explainable multimodal AI-based mental well-being and self-reflection companion**. It translates cognitive and emotional distress into grounded philosophical contemplation derived from canonical Bhagavad Gita verses.

### System Pipeline:
```
Text Contemplation
      ↓
NLP Emotion Prior Engine / DistilRoBERTa
      ↓
Optional Camera Frame (Base64 JPEG)
      ↓
Face Detection (Haar) + Facial Emotion CNN (PyTorch)
      ↓
Multimodal Late Fusion (0.6 Text + 0.4 Face)
      ↓
Layered Safety & Crisis Risk Assessment (5 Layers)
      ↓
Semantic Intent Routing (10 Intent Buckets)
      ↓
Canonical Gita RAG (TF-IDF + Cosine Similarity / Exact Index)
      ↓
Structured Response Generation + Living Guidance + Coping Remedies
      ↓
Personal Vault (AES-256-GCM Encrypted Journal, History, Dashboard)
```

### Explicit Non-Goals (Enforced by Safety & Boundary Gates):
- NOT a medical diagnostic system
- NOT a licensed therapist or physician
- NOT a replacement for emergency intervention (988 / 112 / Tele-MANAS provided)
- NOT a 100% infallible emotion detector

---

## 2. Subsystem Identification

| Subsystem | Location | Technologies | Status |
| :--- | :--- | :--- | :--- |
| **Frontend** | `/frontend` | Vanilla HTML5, CSS3, ES6+, Web Speech API, MediaDevices API | Operational (Port 3000 / 5000) |
| **Backend API Gateway** | `/backend` | Node.js, Express 5, `pg`, `express-rate-limit`, `crypto` | Operational (Port 5000) |
| **ML Microservice** | `/ml_model` | Python, FastAPI, PyTorch, OpenCV Haar Cascade, scikit-learn | Operational (Port 8001) |
| **Database** | PostgreSQL 17 | Relational schema, JSONB columns, Cascading Foreign Keys | Connected & Seeded |
| **Fallback Storage** | `/backend/data/vedai-db.json` | JSON file-system store with auto-healing initialization | Verified fallback |
| **RAG Engine** | `/backend/services/ragService.js` | TF-IDF Cosine Semantic Search + Exact `Chapter.Verse` Lookup | Verified (14 canonical verses) |
| **Safety Engine** | `/backend/services/safetyService.js` | 5-Layer Regex Scanner + Benign Figurative Whitelist | Verified (55/55 tests passing) |
| **Intent Router** | `/backend/services/intentRouter.js` | 10 Semantic Intent Discriminators with zero-RAG routing | Verified (110/110 test suite) |
| **Encryption Utility** | `/backend/utils/encryption.js` | AES-256-GCM with 12-byte random IV & 16-byte Auth Tag | Verified |

---

## 3. Database Schema Inventory

| Table Name | Primary Key | Foreign Keys | Key Columns | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `users` | `id VARCHAR(64)` | None | `email`, `password_hash`, `password_salt`, `preferences` | User identity & authentication |
| `emotion_history` | `id VARCHAR(64)` | `user_id -> users(id) ON DELETE CASCADE` | `user_text`, `emotion`, `confidence`, `probabilities`, `guidance` | Authenticated emotion log |
| `journal_entries` | `id VARCHAR(64)` | `user_id -> users(id) ON DELETE CASCADE` | `title`, `content` (AES-256-GCM encrypted), `emotion` | Private user journal reflections |
| `gita_verses` | `id SERIAL` | None (`UNIQUE(chapter, verse_number)`) | `chapter`, `verse_number`, `sanskrit`, `transliteration`, `meaning`, `practical_guidance` | Canonical wisdom corpus (14 verses) |
| `chat_conversations` | `id VARCHAR(64)` | `user_id -> users(id) ON DELETE CASCADE` | `title`, `created_at`, `updated_at` | Multi-turn chat session headers |
| `chat_messages` | `id VARCHAR(64)` | `conversation_id -> chat_conversations(id) ON DELETE CASCADE`| `sender`, `content`, `emotion_context`, `grounded_verses` | Chat conversation message history |

---

## 4. Complete API Endpoint Inventory

| Method | Path | Auth Required | Request Schema | Response Schema | Rate Limit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | No | None | `{ status: "ok", database: "connected" \| "fallback_mode" }` | None |
| `GET` | `/api` | No | None | `{ name: "VedAI API", status: "running", version: "2.0.0" }` | None |
| `POST` | `/api/v1/auth/register` | No | `{ name, email, password }` | `{ token, user: { id, name, email, role } }` | 500 / 15 min |
| `POST` | `/api/v1/auth/login` | No | `{ email, password }` | `{ token, user: { id, name, email, role } }` | 500 / 15 min |
| `GET` | `/api/v1/auth/me` | Bearer Token | None | `{ user: { id, name, email, role, preferences } }` | 500 / 15 min |
| `POST` | `/api/v1/auth/logout` | Bearer Token | None | `{ success: true, message: "Logged out successfully" }` | 500 / 15 min |
| `DELETE` | `/api/v1/auth/account` | Bearer Token | None | `{ success: true, message: "Account deleted" }` | 500 / 15 min |
| `POST` | `/api/v1/auth/forgot-password` | No | `{ email }` | `{ success: true, message, resetToken? }` | 500 / 15 min |
| `POST` | `/api/v1/auth/reset-password` | No | `{ token, newPassword }` | `{ success: true, message: "Password reset successfully" }` | 500 / 15 min |
| `POST` | `/api/v1/auth/change-password` | Bearer Token | `{ currentPassword, newPassword }` | `{ success: true, message: "Password updated successfully" }` | 500 / 15 min |
| `POST` | `/api/v1/process` | Optional | `{ user_text: string, face_image?: string }` | Full revelation payload (emotion, shloka, remedies, media) | 2000 / 1 min |
| `POST` | `/api/v1/emotion/facial` | No | `{ image: string (base64) }` | `{ face_detected, bounding_box, emotion, confidence, probabilities }` | 2000 / 1 min |
| `POST` | `/api/v1/emotion/multimodal`| No | `{ text_prediction, face_prediction, weights? }` | `{ final_emotion, confidence, probabilities, weights }` | 2000 / 1 min |
| `POST` | `/api/v1/rag/search` | No | `{ query: string, emotion?: string, top_k?: number }` | `{ query, results: [ { chapter, verse_number, sanskrit, ... } ] }` | 2000 / 1 min |
| `POST` | `/api/v1/chat` | Optional | `{ message: string, conversationId?: string }` | `{ reply, conversationId, intent, emotion, grounded_verses }` | 2000 / 1 min |
| `GET` | `/api/v1/chat/conversations/:id/messages` | Optional | None | `{ conversationId, messages: [...] }` | 2000 / 1 min |
| `GET` | `/api/v1/dashboard` | Bearer Token | None | `{ user, currentEmotion, history, distribution, wellnessIndex }` | 2000 / 1 min |
| `GET` | `/api/v1/history` | Bearer Token | `?limit=50&offset=0` | `[ { id, user_text, emotion, confidence, created_at } ]` | 2000 / 1 min |
| `DELETE` | `/api/v1/history` | Bearer Token | None | `{ success: true, count: number }` | 2000 / 1 min |
| `GET` | `/api/v1/journal` | Bearer Token | `?limit=50&offset=0` | `[ { id, title, content (decrypted), emotion, createdAt } ]` | 2000 / 1 min |
| `POST` | `/api/v1/journal` | Bearer Token | `{ title, content, emotion? }` | `{ id, title, content, emotion, createdAt }` | 2000 / 1 min |
| `PUT` | `/api/v1/journal/:id` | Bearer Token | `{ title?, content?, emotion? }` | Updated journal entry object | 2000 / 1 min |
| `DELETE` | `/api/v1/journal/:id` | Bearer Token | None | `{ success: true, id }` | 2000 / 1 min |

---

## 5. Frontend Views / Panes Inventory

1. **Home / Hero (`dashboardPane`)**: Overview of current mindset, quick contemplation shortcuts, daily wisdom quote, feature showcase.
2. **Reflect (`reflectPane`)**: Mindful Reflection Studio, text input, Biometric Facial Emotion Sensing toggle, Shloka card with audio chant synthesis, daily tailored remedies, curated contemplation videos.
3. **Chat (`chatPane`)**: Multi-turn philosophical dialogue interface with conversation memory, simplify explainers, and canonical verse citations.
4. **Journal (`journalPane`)**: Personal vault with AES-256-GCM encrypted persistence, entry composer, and historical entry management.
5. **Insights (`insightsPane`)**: Emotion distribution charts, historical timeline, and VedAI Wellness Equilibrium index.
6. **Privacy Center & Settings Drawer (`settingsModal`, `drawer`)**: Data export, emotion history clearing, account deletion with cascading purge, biometric disclosure.
