# 08_VEDAI_CORRECTION_PLAN: Prioritized Engineering & UX Remediation Plan

**Auditor**: External Technical Invigilator  
**Purpose**: Prescriptive technical roadmap detailing exact corrections required before final presentation and viva defense.  
**Rule**: Documented for student execution post-audit. Zero automatic alterations applied during this evaluation.  

---

## Priority Classification Summary

| Priority | Definition | Item Count | Blocker Status |
| :--- | :--- | :---: | :--- |
| **P0** | Critical safety, data-loss, or system crash blocker | **0** | None. System is stable. |
| **P1** | Major functional or UX disclosure gap | **2** | Must address before viva / external review. |
| **P2** | Moderate environment or persistence improvement | **2** | Recommended before final project archiving. |
| **P3** | Minor documentation & copy polish | **2** | Polish for final report. |

---

## Detailed Remediation Tasks

### 🔴 P1-01: Expose Facial Emotion Breakdown in Reflection Studio
- **Problem**: When biometrics are active, backend calculates text emotion, facial emotion, and fused emotion, but `renderRevelation()` only renders the final fused state. The user cannot see what their face specifically expressed.
- **Affected File**: `frontend/app.js` (around line 597) & `frontend/index.html` (inside `#resultsContent`).
- **Exact Correction**:
  1. Add a dedicated decomposition card to `#resultsContent` in `index.html`:
     ```html
     <div class="multimodal-breakdown-card glass-panel hidden" id="multimodalBreakdownCard">
         <div class="breakdown-header">
             <span>🔬 Multimodal Fusion Telemetry</span>
             <span class="formula-pill">0.6 Text + 0.4 Face</span>
         </div>
         <div class="breakdown-grid">
             <div class="breakdown-col">
                 <span class="breakdown-label">Text NLP</span>
                 <strong id="breakdownTextEmotion">NEUTRAL</strong>
                 <span id="breakdownTextConf">65% Conf</span>
             </div>
             <div class="breakdown-col">
                 <span class="breakdown-label">Facial CNN</span>
                 <strong id="breakdownFaceEmotion">STRESS</strong>
                 <span id="breakdownFaceConf">70% Conf</span>
             </div>
             <div class="breakdown-col fused-col">
                 <span class="breakdown-label">Fused State</span>
                 <strong id="breakdownFusedEmotion">STRESS</strong>
                 <span id="breakdownFusedConf">68% Conf</span>
             </div>
         </div>
     </div>
     ```
  2. In `renderRevelation(res)` in `app.js`, populate these fields if `res.face_prediction?.face_detected` is true.

---

### 🔴 P1-02: Implement Dedicated Account Profile Modal
- **Problem**: Clicking the account icon (`#authBtn`) while logged in directly fires `confirm("... Do you wish to sign out?")` without showing profile details.
- **Affected File**: `frontend/app.js:1053` & `frontend/index.html`.
- **Exact Correction**:
  1. Add an Account Profile Modal in `frontend/index.html` displaying user Name, Email, Session Status, and an explicit Sign Out button.
  2. Update `app.js:1053` so that when `getStoredUser()` is present, it reveals `#userProfileModal` instead of popping the native `confirm()` alert.

---

### 🟡 P2-01: Persist Quick Check-ins to Database
- **Problem**: The 30-second Quick Check-in modal currently updates only client-side Home preview memory; it does not persist the check-in to PostgreSQL.
- **Affected File**: `frontend/app.js:1235` (`initQuickCheckin`).
- **Exact Correction**:
  Inside `saveQuickCheckinBtn.addEventListener('click', ...)`, if `getToken()` is present, dispatch an asynchronous POST to `/api/v1/process` or `/api/v1/history` so the quick check-in is logged into `emotion_history` and reflected in Insights charts.

---

### 🟡 P2-02: Add Sequential Test Runner Flag in Backend Configuration
- **Problem**: Running `npm test` runs all test files concurrently in Node's test runner, which can cause a race collision on `backend/data/vedai-db.json` when multiple workers write simultaneously to the fallback file.
- **Affected File**: `backend/package.json:6`.
- **Exact Correction**:
  Update line 6 of `backend/package.json` to:
  ```json
  "test": "node --test --test-concurrency=1 test/*.test.js"
  ```

---

### 🟢 P3-01: Refine Biometric HUD Copy in Frontend
- **Problem**: Badge copy reads *"🔒 100% Client-Side RAM · Zero Video Stored"*. While video is never written to disk, JPEG frames are transmitted over network HTTP POST to backend and FastAPI memory for inference.
- **Affected File**: `frontend/index.html:273`.
- **Exact Correction**:
  Change text to *"🔒 Ephemeral In-Memory Analysis · Zero Video Saved"*.

---

### 🟢 P3-02: Clarify 14-Verse Curated Scope in Project Documentation
- **Problem**: External evaluators might assume the system indexes all 700 verses of the Bhagavad Gita.
- **Affected File**: `README.md` & Project Viva Slides.
- **Exact Correction**:
  Clearly describe the corpus as: *"Curated 14 Foundational Canonical Verses for Cognitive Equilibrium (Chapters 2, 5, 6, 12, 18)"*.
