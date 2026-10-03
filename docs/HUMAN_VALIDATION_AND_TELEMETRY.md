# VedAI 2.0 — Human Validation, Explainability, and Research Telemetry Specification

**Phase**: 2G  
**Version**: 2.0.0-phase2g  
**Status**: Verified & Passing (115/115 Backend Tests, Production Frontend Build Clean)  
**Core Epistemological Principle**:  
> *"AI suggests. Evidence explains. The user decides."*

---

## 1. Architectural Philosophy & Non-Diagnostic Stance

VedAI 2.0 treats all artificial intelligence inferences—whether textual, facial, or multimodal—as **observational hypotheses**, never clinical diagnoses, psychic ground truth, or psychological assessments.

1. **Human Authority**: The user remains the exclusive authority over their internal lived experience.
2. **Observational Language**: VedAI exclusively uses non-diagnostic, tentative observational phrasing:
   - *"VedAI noticed signs that might suggest..."*
   - *"Observational cues, not diagnostic truth."*
   - *"Text cues suggest patterns of..."*
   - *"Facial cues suggest..."*
3. **No Coercion**: VedAI never argues with, challenges, or attempts to convince a user regarding their emotional state.
4. **Epistemological Priority Order**:
   $$\text{User Correction} > \text{User Validation} > \text{Fused Multimodal AI} > \text{Individual Model Signal}$$

---

## 2. Human Validation State Machine

The validation state machine governs how AI estimates transition into guided reflection contexts:

```
[ AI Multimodal Observation ]
             │
             ▼
  [ Does this feel accurate? ]
   ├── YES ────────────────────────► Context: Fused AI Signal (User Confirmed)
   ├── PARTLY ─────────────────────► Context: User Adjustment / Partial Resonance
   ├── NOT_REALLY ─────────────────► Context: "Self-Directed Reflection" (No Assumptions)
   ├── TELL_VEDAI / CUSTOM ────────► Context: Exact User Correction Text (Highest Priority)
   ├── YES_TEXT (Conflict Mode) ───► Context: Text Model Signal
   ├── YES_FACE (Conflict Mode) ───► Context: Facial Expression Signal
   └── SKIPPED ────────────────────► Context: Default Open Reflection
```

### Authoritative User Override Guarantee
When the user submits a custom correction (`USER_CORRECTED` / `TELL_VEDAI`), the UI immediately acknowledges:
> **"Thanks. VedAI will use what you told it rather than the earlier estimate."**

The backend pipeline (`reflectController.js` and `llmService.js`) immediately passes `userCorrection` as the primary reflection context. The Grounded LLM generator is strictly constrained to honor this statement and cannot revert to earlier inferences.

---

## 3. Multimodal Conflict Handling (`MULTIMODAL_CONFLICT`)

When verbal words and facial cues diverge significantly (e.g., words indicate anxiety while facial cues exhibit calm, or vice versa):
1. **No Forced Winner**: VedAI explicitly refuses to prioritize one modality over the other.
2. **Mixed Signals Card**: A dedicated UI card alerts the user:
   - *"VedAI received mixed signals"*
   - Displays **What your words suggested** alongside **What your facial cues suggested**.
3. **6 Non-Coercive User Choices**:
   1. `YES_TEXT`: *"My words reflect how I feel"*
   2. `YES_FACE`: *"My facial cues reflect how I feel"*
   3. `PARTLY`: *"Both capture different parts of what I feel"*
   4. `NOT_REALLY`: *"Neither captures how I feel"*
   5. `TELL_VEDAI`: *"Let me tell you what I'm experiencing"*
   6. `SKIPPED`: *"Continue without validation"*

---

## 4. Interactive Explainability Drawer

The explainability drawer answers the question: **"Why did VedAI say this?"**

### Evidence Breakdown Provided:
- **Synthesis Overview**: Current fusion state (`TEXT_ONLY`, `MULTIMODAL_AGREE`, `MULTIMODAL_CONFLICT`), contributing modalities, and evidence strength.
- **Written Language Evidence**: Model name (`distilbert_multilingual_ml`), confidence percentage, and quality tier.
- **Facial Expression Cues**: Expression detected, confidence, ephemeral landmark notice, or explicit status if camera was not active.
- **Conflict / Agreement Narrative**: Contextual explanation of why mixed signals or modality agreement occurred.
- **Technical Research Metadata Drawer**: Collapsible view showing `pipelineVersion`, `conflictScore`, `cosineDistance`, weights ($w_{\text{text}}$, $w_{\text{face}}$), and quality scores.

---

## 5. Camera Controls & Privacy Guarantees

1. **Explicit, Accessible Toggles**:
   - Camera status displayed via text badges (`Camera Analysis: Active` vs `Camera Analysis: Inactive`) with `ON` / `OFF` chips, not color alone.
   - Text-only reflection is 100% supported at all times.
2. **Zero-Storage Privacy Guarantee**:
   - Facial expressions are processed client-side into ephemeral numerical landmark vectors.
   - **Zero raw video frames or photos are saved, stored on disk, or transmitted to any server**.
   - Landmark coordinates are processed in real-time memory and immediately discarded.
3. **Direct Navigation**:
   - Direct link to application Privacy & Data settings for consent management.

---

## 6. Personal Journal Segregation

VedAI enforces strict segregation between user writings and AI-generated text. Personal reflections are never adulterated:

| Database Field | Content Stored | Isolation Principle |
| :--- | :--- | :--- |
| `rawUserInput` | Untouched words typed by user | Never altered or overwritten by AI |
| `aiEstimatedSignal` | Model estimate (e.g. `stress_overwhelm`) | Explicitly categorized as machine inference |
| `aiConfidence` | Confidence level string | Machine estimate |
| `multimodalState` | `TEXT_ONLY`, `MULTIMODAL_AGREE`, etc. | Technical synthesis status |
| `aiExplanation` | Scripture connection / summary | Stored in dedicated explanation field |
| `userValidationChoice` | User's validation choice enum | User's feedback record |
| `userCorrection` | User's typed correction text | User's authoritative override |
| `finalWorkingContext` | Final working context | Derived under user override priority |
| `linkedVerseId` | Gita verse reference (e.g., `BG2.47`) | Scripture metadata |
| `userReflectionNotes` | User's inquiry answers + private notes | Private personal writing |

---

## 7. Privacy-Preserving Research Telemetry

De-identified research telemetry allows empirical evaluation of multimodal AI without sacrificing privacy.

### Strict Privacy Gates
1. **Consent Gate**: Telemetry is **only** recorded if explicit research consent is granted (`userConsent === true`). If consent is absent or false, the backend returns:
   ```json
   { "recorded": false, "reason": "RESEARCH_CONSENT_NOT_GRANTED" }
   ```
2. **Zero PII & Zero Text**:
   - **No raw user thoughts** are stored in telemetry (`rawUserInput` is never passed).
   - **No user correction text** is stored (`userCorrectionPresent` is strictly a boolean flag).
   - **No video frames or face images** exist in telemetry.
3. **Separate Storage Collections**:
   - Production journal entries reside in `JournalEntry` (or resilient local `journals.json`).
   - Research telemetry resides in `ResearchLog` (or in-memory buffer), partitioned with random pseudonymous `anonymousSessionId`.

### Telemetry Schema (`ResearchLog.js`)
```javascript
{
  eventId: "evt_uuid",
  anonymousSessionId: "anon_sess_abc123",
  pipelineVersion: "2.0.0-phase2g",
  modalitiesUsed: ["text", "face"],
  fusionState: "MULTIMODAL_CONFLICT",
  textModel: "distilbert_multilingual_ml",
  textQuality: 0.88,
  faceQuality: 0.82,
  conflictScore: 0.65,
  userValidationChoice: "YES_TEXT",
  userCorrectionPresent: false, // Boolean only
  agreementLevel: "FULL_AGREEMENT",
  gitaRetrieved: true,
  consentGiven: true,
  timestamp: ISODate
}
```

---

## 8. Verification & Test Summary

| Test Suite | Tests Passing | Status |
| :--- | :--- | :--- |
| `auth_reset_flow.test.js` | 14 / 14 | Passed |
| `auth_gmail_validation.test.js` | 7 / 7 | Passed |
| `gita_corpus.test.js` | 24 / 24 | Passed |
| `llm_integration.test.js` | 11 / 11 | Passed |
| `multimodal_fusion.test.js` | 23 / 23 | Passed |
| `phase1_verification.test.js` | 11 / 11 | Passed |
| `scenario_pipeline.test.js` | 11 / 11 | Passed |
| `validation_explainability.test.js` | 14 / 14 | Passed |
| **Total Backend Tests** | **115 / 115** | **100% Passing** |
| **Frontend Production Build** | **Vite v6.4.3** | **0 errors, 4.68s** |
