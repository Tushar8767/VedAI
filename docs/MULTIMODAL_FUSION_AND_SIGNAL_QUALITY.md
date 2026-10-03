# VedAI 2.0 — Multimodal Emotion Fusion & Signal Quality Architecture

---

## 1. Executive Summary & Core Principle

VedAI 2.0 implements an evidence-aware multimodal emotion fusion system based on the foundational paradigm:

> **"AI suggests. Evidence explains. The user decides."**

### Critical Ethical Premise:
- **Facial expression $\neq$ internal emotional state.** A smile can mask distress; furrowed brows may signify intense concentration rather than anger; a flat neutral expression does not mean emotional tranquility.
- **Text patterns $\neq$ absolute psychiatric reality.** Verbal expressions reflect transient communicative choices, cultural framing, and slang.
- **Non-Diagnostic Imperative**: The system never states *"You are anxious because your face shows..."*. Instead, it reports: *"VedAI detected signals in your text and facial cues that may be associated with..."*, followed immediately by an invitation for human confirmation or correction.

---

## 2. Multimodal Fusion Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │           User Input Modalities             │
                  └───────┬──────────────────────────────┬───────┘
                          │                              │
                          ▼                              ▼
                 [ Text Modality ]              [ Face Modality ]
             DistilBERT Transformer ML       MediaPipe / Client Face Cues
             Dual Pooling (1536-dim)         Normalized Dominant Expression
             Calibrated Softmax Head         Detection Confidence / Occlusion
                          │                              │
                          ▼                              ▼
                 [ Quality Evaluator ]          [ Quality Evaluator ]
                 Length, Fallback,              Confidence, Occlusion,
                 Shannon Entropy                Clarity, Lighting
                          │                              │
                          └──────────────┬───────────────┘
                                         ▼
                   ┌───────────────────────────────────────────┐
                   │    Multimodal Evidence Fusion Engine      │
                   │                                           │
                   │ 1. Validate & Standardize Distributions   │
                   │ 2. Evaluate Signal Quality Tiers          │
                   │ 3. Compute Mathematical Conflict (C)      │
                   │ 4. Assign Deterministic Fusion State      │
                   │ 5. Calculate Quality-Weighted Fused Probs │
                   │ 6. Handle Conflict: ZERO FORCED WINNER    │
                   └─────────────────────┬─────────────────────┘
                                         ▼
                   ┌───────────────────────────────────────────┐
                   │    Human-in-the-Loop Validation Gate      │
                   │                                           │
                   │   USER CORRECTION                         │
                   │         >                                 │
                   │   USER VALIDATION                         │
                   │         >                                 │
                   │   FUSED AI SIGNAL                         │
                   │         >                                 │
                   │   INDIVIDUAL MODEL SIGNAL                 │
                   └─────────────────────┬─────────────────────┘
                                         ▼
                   ┌───────────────────────────────────────────┐
                   │      Grounded LLM & Contextual RAG        │
                   │                                           │
                   │ • Receives structured evidence contract   │
                   │ • Explains evidence; cannot override user │
                   │ • Contextual Gita wisdom (not "proof")    │
                   └───────────────────────────────────────────┘
```

---

## 3. Explicit Fusion States

The fusion engine transitions deterministically across 8 distinct states:

| Fusion State | Condition | Fused Signal Outcome |
|---|---|---|
| `TEXT_ONLY` | Camera not used, denied, or face missing | Uses text ML prediction; face flagged as unused |
| `FACE_ONLY` | Input text empty, face cues provided | Uses facial expression cues with explicit personal variance warning |
| `MULTIMODAL_AGREE` | Both modalities present, quality usable, conflict metric $C < 0.35$ | Fused probability distribution with high confidence |
| `MULTIMODAL_PARTIAL_AGREE` | Modalities share broad semantic clusters, $0.35 \le C < 0.65$ | Fused probability distribution with moderate confidence |
| `MULTIMODAL_CONFLICT` | Modalities point to contradictory emotions, $C \ge 0.65$ | **`fusedSignal = null` (Zero forced winner)**; reports mixed signals |
| `LOW_QUALITY` | One or both modalities have degraded quality ($Q < 0.35$) | Influences reduced; marks confidence as tentative |
| `INSUFFICIENT_EVIDENCE` | Both text and face missing, corrupt, or unusable | Yields `neutral_unclear`; prompts user for input |
| `USER_CORRECTED` | User submitted an explicit correction or validation override | **100% precedence over all AI estimations** |

---

## 4. Conflict Detection: Mathematical Methodology

Disagreement between text and facial modalities is measured deterministically without fabricating scientific claims:

1. **Standardized Probability Distributions**: Both modalities are projected onto the 7 shared canonical emotion classes:
   $$\mathbf{p}_{\text{text}}, \mathbf{p}_{\text{face}} \in \Delta^6$$
2. **Cosine Distance**:
   $$D_{\cos}(\mathbf{p}_{\text{text}}, \mathbf{p}_{\text{face}}) = 1 - \frac{\mathbf{p}_{\text{text}} \cdot \mathbf{p}_{\text{face}}}{\|\mathbf{p}_{\text{text}}\|_2 \|\mathbf{p}_{\text{face}}\|_2}$$
3. **Deterministic Conflict Metric ($C \in [0, 1]$)**:
   - If top labels match: $C = D_{\cos} \times 0.40$
   - If top labels belong to the same semantic cluster (e.g., tension vs. fear): $C = 0.35 + (D_{\cos} \times 0.30)$
   - If top labels directly diverge (e.g., stress vs. calm): $C = \min(1.0, 0.55 + D_{\cos} \times 0.45)$
4. **Resolution Rule**: If $C \ge 0.65$, the system triggers `MULTIMODAL_CONFLICT`, refuses to declare a winner, and presents both observations to the user.

---

## 5. Signal Quality Assessment & Weighting Strategy

Each modality is assigned an empirical quality score $Q \in [0, 1]$:

- **Text Quality ($Q_{\text{text}}$)**: Assesses character length, transformer vs. heuristic fallback penalty ($-0.20$), and Shannon entropy penalty ($-0.25$).
- **Face Quality ($Q_{\text{face}}$)**: Assesses landmark detection confidence, occlusion factor $(1 - \text{occlusion})$, clarity, and lighting factor.

### Quality-Aware Weights:
$$W_{\text{text}} = Q_{\text{text}} \times (1 - U_{\text{text}}), \quad W_{\text{face}} = Q_{\text{face}} \times (1 - U_{\text{face}})$$
$$w_{\text{text}} = \frac{W_{\text{text}}}{W_{\text{text}} + W_{\text{face}}}, \quad w_{\text{face}} = \frac{W_{\text{face}}}{W_{\text{text}} + W_{\text{face}}}$$

---

## 6. Human-in-the-Loop Validation Priority

The system enforces strict epistemological priority:

$$\mathbf{\text{USER CORRECTION}} > \mathbf{\text{USER VALIDATION}} > \mathbf{\text{FUSED AI SIGNAL}} > \mathbf{\text{INDIVIDUAL MODEL SIGNAL}}$$

- **Option YES (`ACCURATE`)**: User verifies observation $\rightarrow$ working context confirmed.
- **Option PARTLY (`PARTIALLY_ACCURATE`)**: User confirms partial resonance $\rightarrow$ working context adjusted.
- **Option NOT_REALLY (`NOT_ACCURATE`)**: User rejects observation $\rightarrow$ context set to `'Self-Directed Reflection'`.
- **Option TELL_VEDAI (`USER_CORRECTED`)**: User provides own words $\rightarrow$ overrides all AI inferences across RAG, LLM, and Journal.
- **Conflict Choice (`YES_TEXT` / `YES_FACE`)**: User chooses which modality resonated with their internal experience.

---

## 7. LLM Evidence Contract & Gita Decoupling

1. **Structured Evidence Contract**: The LLM prompt receives `<multimodal_observational_evidence>` containing:
   - `Fusion State`
   - `Confidence Level`
   - `Observational Notice`
   - `Text Evidence`
   - `Facial Cue Evidence`
   - `Safety State`
2. **LLM Restraints**:
   - The LLM explains observational evidence; it does not independently invent emotions.
   - The LLM can never override explicit user corrections.
3. **Decoupled Gita Retrieval**:
   - Gita verses are retrieved based on contextual inquiry, never as "proof" that a user has a specific emotion.

---

## 8. Privacy, Consent, & Ephemeral Camera Processing

- **Zero Frame Persistence**: Raw webcam frames, base64 images, or video streams are **NEVER stored on disk, sent to the database, or logged**.
- **Ephemeral Client Landmark Extraction**: Facial expressions are analyzed on-device or passed as ephemeral landmark numerical coordinates during the active session.
- **Independent Consent**: Camera permission is requested completely independently from account creation or text reflection. Users can use 100% of VedAI features with camera permanently disabled.

---

## 9. Research Metadata Preservation

Every multimodal inference record preserves technical metadata for auditing and future scientific refinement without compromising user privacy:

- `modelVersions`: Base transformer and face analyzer versions
- `modalitiesAvailable`: Array of active modalities
- `textQuality` & `faceQuality`: Numerical quality indices
- `conflictScore`: Cosine divergence & conflict metric
- `wText` & `wFace`: Assigned fusion weights
- `pipelineVersion`: `'2.0.0-fusion-phase2f'`
- `timestamp`: ISO-8601 generation time

---

## 10. Evaluation Framework Status

> [!NOTE]
> **Status:** Integration complete; independent multimodal evaluation pending.
>
> In accordance with VedAI's strict scientific integrity guidelines, multimodal accuracy metrics are not fabricated in the absence of a verified, dual-annotated multimodal dataset. The architecture is equipped with telemetry hooks to evaluate human-AI agreement, divergence rates, and calibration on empirical held-out data in subsequent phases.
