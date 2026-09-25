# 05_VEDAI_DASHBOARD_AUDIT: Data Reality & Metrics Verification

**Auditor**: External Technical Invigilator  
**Audit Target**: Insights Pane (`insightsPane`), Home Shelf (`dashboardPane`), and `/api/v1/dashboard` endpoint  
**Verdict**: **AUTHENTIC DATABASE AGGREGATIONS FOR LOGGED-IN USERS — GUEST SESSIONS DISPLAY EMPTY/BASELINE STATES**  

---

## 1. Field-by-Field Reality Classification

| Dashboard Field | Stated Concept | Actual Source in Code | Classification | Reality Commentary |
| :--- | :--- | :--- | :---: | :--- |
| **Current Dominant State** | Real-time emotional state | `history[0].emotion` from PostgreSQL table `emotion_history` | **REAL DATA** | Updates dynamically when an authenticated user completes a new reflection. |
| **Confidence Gauge** | Model certainty metric | `history[0].confidence` | **CALCULATED DATA** | Mathematical max probability of dominant class $\in [0.14, 0.95]$. |
| **Emotion Distribution** | Historical frequency breakdown | `getEmotionDistribution(history)` in `historyService.js:62` | **REAL DATA** | Aggregated directly from user's PostgreSQL rows. |
| **Canvas Bar Chart** | Graphic visualizer | `renderDonutChart(dist)` in `app.js:857` | **CALCULATED DATA** | Draws dynamic vertical bars on `<canvas>` scaled to max count. (Note: function is misnamed "Donut", but draws bars). |
| **VedAI Wellness Index** | Holistic mental balance score | `calculateWellnessIndex()` in `historyService.js:69` | **CALCULATED DATA** | Heuristic formula: $35 + 35 \times \text{Balance} + 15 \times \text{Consistency} + 15 \times \text{Journaling}$. Transparently disclosed in formula factor breakdown. |
| **Reflection Timeline** | Chronological reflection history | `history.slice(0, 10)` | **REAL DATA** | Shows real historical texts, timestamps, and emotion badges from PostgreSQL. |
| **Recent Journal Feed** | Private journal list | `listJournalEntries(userId)` | **REAL DATA** | AES-256-GCM decrypted journal records stored in PostgreSQL. |
| **Daily Shloka on Home** | Fixed daily contemplation | Hardcoded BG 2.47 in `frontend/index.html:160-174` | **STATIC DATA** | Static pedagogical showcase card. |
| **Quick Check-in Preview** | Instant mood logger | `updateHomeRecentPreview()` in `app.js:1240` | **CALCULATED DATA** | Updates client-side Home preview in RAM; does NOT persist to database. |

---

## 2. Answers to Mandatory Invigilator Questions

### 1. Does the dashboard contain real user data?
**YES (When Authenticated).** When signed in, `/api/v1/dashboard` queries PostgreSQL tables `emotion_history` and `journal_entries` filtered strictly by `req.user.id`. For guest travelers, it displays a neutral baseline (Score: 50, zero entries).

### 2. Does it update after a new reflection?
**YES.** Upon completing a reflection in `reflectPane`, `renderRevelation()` calls `updateHomeRecentPreview()`. Furthermore, switching to `insightsPane` triggers `loadDashboardData()`, fetching updated database rows.

### 3. Does it update after facial analysis?
**YES.** If facial biometrics were enabled, the saved record includes `modality: 'multimodal'` in PostgreSQL. However, the dashboard charts aggregate overall dominant emotions and do not render separate "face vs text" trendlines.

### 4. Does it distinguish text vs facial vs fused results?
**PARTIALLY.** The database stores `modality: 'text'` or `modality: 'multimodal'`. The API returns this field, but the UI canvas chart merges all emotions into a single distribution regardless of modality.

### 5. Are charts based on actual database records?
**YES.** `renderDonutChart(data.emotionDistribution)` uses the object returned by `getEmotionDistribution(history)`, which counts real database records. If the database is wiped, the canvas renders *"No persistent emotional vectors yet"*.

### 6. Are values calculated or hardcoded?
**CALCULATED.** The emotion counts, confidence percentages, and Wellness Index are dynamically calculated at query time.

### 7. Are "wellness" values scientifically justified?
**NO.** The Wellness Index is an **explicit heuristic composite**, not a clinically or psychometrically standardized scale (such as PHQ-9 or GAD-7). The codebase honestly acknowledges this in `historyService.js:93`: *"Transparent wellness heuristic"*.

### 8. Does "calibrated" mean actual calibration was performed?
**NO.** In the machine learning sense (e.g. Platt scaling or Isotonic regression for Expected Calibration Error), the model outputs standard softmax probabilities. **Invigilator Warning:** Do not claim "psychometrically calibrated" in project viva; describe it accurately as "normalized probability output".

### 9. Does the dashboard show enough information to understand the user's emotional journey?
**YES.** The combination of dominant emotion, distribution breakdown, chronological timeline, and linked journal reflections provides a clear qualitative reflection of mood stability over time.

### 10. Does the dashboard merely display decorative UI?
**NO.** It is a functional data visualization layer backed by a relational database schema.

---

## 3. Recommended Polish
- **Rename Canvas Function**: In `frontend/app.js:857`, rename `renderDonutChart` to `renderBarChart` for code readability.
- **Differentiate Modality in Timeline**: Add a small 📷 icon next to reflection items in the history timeline if `record.modality === 'multimodal'`.
