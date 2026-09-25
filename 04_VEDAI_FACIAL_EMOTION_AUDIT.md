# 04_VEDAI_FACIAL_EMOTION_AUDIT: Deep Pipeline & Visibility Audit

**Auditor**: External Technical Invigilator  
**Audit Target**: Complete Facial Emotion Processing Pipeline (`frontend/app.js` -> `backend/server.js` -> `ml_model/app.py`)  
**Verdict**: **PIPELINE TECHNICALLY FUNCTIONAL IN MEMORY — USER-VISIBLE DISPLAY INCOMPLETE**  

---

## 1. End-to-End Pipeline Verification (Stage-by-Stage)

```
[1. User Activates Toggle]
         ↓
[2. navigator.mediaDevices.getUserMedia] -> Requests video stream (320x240)
         ↓
[3. captureCameraFrame()]                -> Draws video frame to hidden HTML5 Canvas
         ↓
[4. toDataURL('image/jpeg', 0.8)]       -> Encodes to ephemeral Base64 JPEG in Browser RAM
         ↓
[5. POST /api/v1/process]                -> Sent in JSON body: { user_text, face_image }
         ↓
[6. Express Gateway]                     -> Receives base64 string, forwards to FastAPI
         ↓
[7. POST /predict/face]                  -> FastAPI decodes base64 into OpenCV numpy array
         ↓
[8. cv2.CascadeClassifier]               -> Detects bounding box (x, y, w, h) via Haar
         ↓
[9. PyTorch FaceEmotionCNN]              -> Crops ROI (48x48), runs 7-class CNN with softmax
         ↓
[10. Return 7-Class Probabilities]       -> { anger, fear, happiness, sadness, neutral, anxiety, stress }
         ↓
[11. Decision-Level Late Fusion]         -> Express fuses: P = 0.6 * P_text + 0.4 * P_face
         ↓
[12. renderRevelation() in UI]           -> Renders Fused Emotion, Modality Pill, and Fused Spectrum
                                            [CRITICAL GAP: Individual Face Result is NOT Rendered]
```

---

## 2. Answers to Mandatory Invigilator Questions

### 1. Does the camera actually open?
**YES.** `initBiometricCamera()` in `frontend/app.js:342` attaches an event listener to `cameraToggle`. When toggled, it calls `navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })` and attaches the stream to `#cameraVideo`.

### 2. Is a frame actually captured?
**YES.** `captureCameraFrame()` in `frontend/app.js:373` draws the video frame into an internal canvas element and extracts a JPEG Data URL via `cameraCanvas.toDataURL('image/jpeg', 0.8)`.

### 3. Is the frame sent to the ML service?
**YES.** When the user clicks "Receive Wisdom & Remedies", `handleReflectionSubmit()` places `face_image: faceImage` into the POST payload to `/api/v1/process`. The Express backend forwards it via Axios POST to `http://127.0.0.1:8001/predict/face`.

### 4. Does the ML service actually process it?
**YES.** In `ml_model/app.py:248`, `predict_face_emotion(data: FaceInput)` strips the Data URL prefix, decodes the raw base64 bytes using `base64.b64decode`, and converts it to an OpenCV BGR image using `cv2.imdecode`.

### 5. Is a face detected?
**YES.** The service converts the image to grayscale (`cv2.cvtColor`) and executes `face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))`.

### 6. Is facial emotion actually predicted?
**YES.** If faces are detected, the largest face ROI is cropped, resized to $48 \times 48$, normalized to $[0.0, 1.0]$, converted to a PyTorch tensor, and passed through `FaceEmotionCNN` with temperature softmax.

### 7. What emotions can the facial model output?
**7 CANONICAL EMOTIONS**: `anger`, `fear`, `happiness`, `sadness`, `neutral`, `anxiety`, and `stress`.

### 8. Are facial probabilities returned?
**YES.** FastAPI returns a dictionary of probabilities for all 7 emotions, along with `bounding_box`, `emotion`, and `confidence`.

### 9. Are those probabilities visible to the user?
**CRITICAL DEFICIENCY: NO.**
`renderRevelation(res)` receives `res.face_prediction`, but only renders `res.probabilities` (which are the **fused** probabilities). The facial probabilities are swallowed into the fusion calculation and not rendered independently.

### 10. Is the detected facial emotion shown separately from text emotion?
**CRITICAL DEFICIENCY: NO.**
The UI renders a single header: *"Dominant Psychological State"* displaying `res.emotion`. It does not show:
- Text Emotion: `[Emotion]`
- Facial Emotion: `[Emotion]`

### 11. Is the user told whether the face was detected?
**PARTIALLY.** The camera HUD in the composer pane displays `FACE: LOCKED` or `NO FACE DETECTED`. In the revelation pane, the modality pill says *"Multimodal (Text 60% + Face 40%)"* if a face was detected, or *"Text Stream Only"* if no face was detected. However, no post-analysis facial confirmation card exists.

### 12. Is face confidence shown?
**NO.** Only the fused confidence gauge (e.g. `65% Confidence`) is shown.

### 13. Is the facial model result included in fusion?
**YES.** Mathematically verified in `backend/services/fusionService.js` and `ml_model/app.py:327`. If a face is detected, the late fusion formula $0.6 \times \text{text} + 0.4 \times \text{face}$ is applied.

### 14. Can the user distinguish Text Result vs Face Result vs Fused Result?
**NO.** The user can only see the final fused result.

### 15. What happens when no face is detected?
The system falls back gracefully. `ml_model/app.py:270` returns `face_detected: false`. Express detects this and falls back to `text_only` fusion without failing or showing an error.

### 16. What happens with multiple faces?
`ml_model/app.py:280` safely selects the largest face by area (`max(faces, key=lambda f: f[2] * f[3])`), isolating the primary user.

### 17. What happens when camera permission is denied?
`frontend/app.js:353` catches the `NotAllowedError`, alerts *"Camera access was not granted. Analysis will proceed text-only"*, unchecks the toggle, and hides the camera HUD.

### 18. What happens when the camera is unavailable?
Treated identically to permission denial; gracefully disabled.

### 19. What happens when ML processing fails?
`processController.js:39` wraps face analysis in a Promise handler. If FastAPI fails or times out, `faceResult` resolves to `null`, and the system seamlessly delivers text-only guidance.

---

## 3. Invigilator Summary & Recommended Correction

### Feature Verdict:
**PARTIALLY IMPLEMENTED (FUNCTIONAL IN BACKEND, USER-VISIBLE OUTPUT INCOMPLETE)**

The backend engineering and ML inference are genuine and functional. The only gap is that the frontend does not expose the individual facial telemetry that the backend already returns.

### Exact Correction Required (Recommended for Post-Audit Polish):
In `frontend/index.html` and `renderRevelation()` in `frontend/app.js`, add a dedicated **"Multimodal Biometric Decomposition"** card whenever `res.face_prediction?.face_detected` is true:
```html
<div class="multimodal-decomposition-card">
    <div class="modality-col">
        <span class="col-label">Text Signal (60%)</span>
        <span class="col-emotion">${res.text_prediction.emotion.toUpperCase()}</span>
        <span class="col-conf">${Math.round(res.text_prediction.confidence * 100)}% Conf</span>
    </div>
    <div class="modality-col">
        <span class="col-label">Facial Signal (40%)</span>
        <span class="col-emotion">${res.face_prediction.emotion.toUpperCase()}</span>
        <span class="col-conf">${Math.round(res.face_prediction.confidence * 100)}% Conf</span>
    </div>
    <div class="modality-col highlight">
        <span class="col-label">Fused State</span>
        <span class="col-emotion">${res.emotion.toUpperCase()}</span>
        <span class="col-conf">${Math.round(res.confidence * 100)}% Conf</span>
    </div>
</div>
```
*(As per instructions, this is documented as an audit finding and NOT modified automatically during this evaluation).*
