# VedAI 2.0 - Architecture & API Reference

## 🏛️ System Overview

VedAI 2.0 is an explainable AI-powered personal self-reflection and wisdom workspace built on the core principle:

> **"AI suggests. Evidence explains. The user decides."**

```
[ BROWSER CLIENT (React + Vite + Tailwind) ]
      │
      │ HTTPS / JSON
      ▼
[ EXPRESS API ORCHESTRATOR (Port 5000) ]
      │
      ├── 1. Safety Gatekeeper (Deterministic 4-Tier Crisis Interception)
      ├── 2. Universal Input (Language Detection, Slang, Typo Resilience)
      ├── 3. Emotion Intelligence & Multimodal Fusion (Text + Ephemeral Face)
      ├── 4. Human-in-the-Loop Validation (User override precedence)
      ├── 5. Gita Knowledge Base & RAG Engine (18 Chapters, Verified Verses)
      ├── 6. Reflection Question Generator (Non-judgmental inquiry)
      ├── 7. Daily Practice Engine (Box Breathing, Dhyana, Gratitude)
      └── 8. Data Storage (MongoDB Atlas / Resilient In-Memory Fallback)
```

---

## 📡 Core API Contracts

### 1. Reflection Orchestration
* **Endpoint:** `POST /api/reflect/orchestrate`
* **Request:**
  ```json
  {
    "userInput": "I am worried about my exams tomorrow.",
    "faceData": null,
    "validation": null
  }
  ```
* **Response:**
  * `pipelineStep`: `COMPLETE_ORCHESTRATION` / `SAFETY_INTERCEPT` / `INPUT_CLARIFICATION_REQUIRED`
  * `trustModel`: Breakdown of what user said, what system observed, what AI inferred, what source supports, and what user decides.
  * `emotionIntelligence`: Probabilistic signals, confidence, uncertainty notice.
  * `humanValidation`: Validation prompt options.
  * `gitaWisdom`: Authentic scripture verses + "Why this verse?" rationale.
  * `suggestedPractice`: Calming companion exercise.

### 2. Gita Knowledge Base
* `GET /api/gita/chapters`: Lists all 18 chapters with summaries.
* `GET /api/gita/chapters/:num`: Chapter details and verses.
* `GET /api/gita/chapters/:c/verses/:v`: Individual verse with Sanskrit, transliteration, verified translation, and AI reflection.
* `GET /api/gita/search?q=query`: Keyword and thematic search.

### 3. Daily Practice
* `GET /api/practices`: Available practices (Box Breathing, Mindful Stillness, etc.).
* `POST /api/practices/complete`: Logs factual completion (duration in minutes) without fake wellness points.

### 4. Private Journal
* `GET /api/journal`: Retrieves authenticated user's private reflections.
* `POST /api/journal`: Persists raw user thought, AI signals, user validation, and personal notes.
* `GET /api/journal/export`: Exports complete journal as structured JSON.
* `DELETE /api/journal/:id`: Permanently deletes an entry.

### 5. My Journey
* `GET /api/journey/dashboard`: Returns factual counts (reflections, practices completed, saved verses, notes) and recent activity timeline.
