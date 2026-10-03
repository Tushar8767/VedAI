"""
VedAI 2.0 - Multilingual Text Emotion Intelligence ML Microservice
Port: 8001
Endpoint: POST /predict

Architecture:
1. DistilBERT Multilingual Transformer (distilbert-base-multilingual-cased, 104 languages)
2. Contextualized 1536-dim Embedding Extraction (CLS + Mean Pooling + L2 Normalization)
3. Calibrated Softmax Multi-Class Classification Head
4. Real Probability Distribution across 7 VedAI emotion categories
5. Mathematical Uncertainty Estimation (Shannon Entropy & Prediction Margin)
6. Strictly Non-Diagnostic (AI-estimated emotional signal, never medical diagnosis)
"""

import os
import sys
import math
import time
import numpy as np
import torch
from transformers import AutoTokenizer, AutoModel
import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
import uvicorn

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

app = FastAPI(
    title="VedAI Multilingual Emotion Intelligence ML Service",
    description="Genuine Transformer-based text emotion inference for English, Hindi, Marathi, and Hinglish.",
    version="2.0.0"
)

# VedAI Official Signal Categories & Display Labels
SIGNAL_LABELS = {
    "stress_overwhelm": "Signals associated with stress or feeling overwhelmed",
    "anxiety_fear": "Signals associated with worry, uncertainty, or fear",
    "anger_frustration": "Signals associated with frustration or agitation",
    "sadness_grief": "Signals associated with sadness or emotional fatigue",
    "calm_peace": "Signals associated with calm, peace, or clarity",
    "hope_optimism": "Signals associated with hope, optimism, or faith",
    "neutral_unclear": "General reflective thought or unclear emotional signal"
}

# Request & Response Schemas
class PredictRequest(BaseModel):
    text: str
    face_landmarks: Optional[List[float]] = None

class SignalItem(BaseModel):
    signal: str
    label: str
    probability: float
    confidence: float

class UncertaintyMetrics(BaseModel):
    isUncertain: bool
    entropy: float
    confidenceMargin: float
    threshold: float

class PredictResponse(BaseModel):
    modality: str
    primarySignal: SignalItem
    allSignals: List[SignalItem]
    uncertainty: UncertaintyMetrics
    rawConfidence: float
    source: str
    modelVersion: str
    disclaimer: str

# Model State
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model")
CLASSIFIER_PATH = os.path.join(MODEL_DIR, "emotion_classifier.joblib")
MODEL_NAME = "distilbert-base-multilingual-cased"
MODEL_VERSION = "distilbert-base-multilingual-cased-emotion-v1.0"

tokenizer = None
transformer = None
classifier = None

@app.on_event("startup")
def load_ml_models():
    global tokenizer, transformer, classifier
    print(f"[ML Service] Loading {MODEL_NAME} tokenizer and transformer...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    transformer = AutoModel.from_pretrained(MODEL_NAME)
    transformer.eval()

    if os.path.exists(CLASSIFIER_PATH):
        print(f"[ML Service] Loading trained emotion classifier from {CLASSIFIER_PATH}...")
        classifier = joblib.load(CLASSIFIER_PATH)
        print("[ML Service] Trained classification head loaded successfully.")
    else:
        print(f"[ML Service] Warning: {CLASSIFIER_PATH} not found. Running training script...")
        import train_model
        train_model.main()
        classifier = joblib.load(CLASSIFIER_PATH)

    print("[ML Service] Multilingual Emotion Intelligence ML Service is ONLINE and READY.")

def compute_embedding(text: str) -> np.ndarray:
    """Extract dual pooled L2-normalized 1536-dim embedding from transformer"""
    inputs = tokenizer(
        text,
        padding=True,
        truncation=True,
        max_length=64,
        return_tensors="pt"
    )
    with torch.no_grad():
        outputs = transformer(**inputs)
        cls_emb = outputs.last_hidden_state[:, 0, :].cpu().numpy()

        input_mask = inputs["attention_mask"].unsqueeze(-1).expand(outputs.last_hidden_state.size()).float()
        sum_embeddings = torch.sum(outputs.last_hidden_state * input_mask, 1)
        sum_mask = input_mask.sum(1)
        sum_mask = torch.clamp(sum_mask, min=1e-9)
        mean_pooled = (sum_embeddings / sum_mask).cpu().numpy()

        combined = np.hstack([cls_emb, mean_pooled])
        norm = np.linalg.norm(combined, axis=1, keepdims=True)
        norm = np.where(norm == 0, 1.0, norm)
        return combined / norm

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "VedAI Multilingual Text Emotion ML Microservice",
        "modelVersion": MODEL_VERSION,
        "baseTransformer": MODEL_NAME,
        "classes": classifier.classes_.tolist() if classifier else [],
        "device": "cpu"
    }

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    raw_text = req.text.strip() if req.text else ""
    
    # Handle empty or whitespace text gracefully
    if not raw_text or len(raw_text) < 2:
        neutral_item = SignalItem(
            signal="neutral_unclear",
            label=SIGNAL_LABELS["neutral_unclear"],
            probability=1.0,
            confidence=0.5
        )
        return PredictResponse(
            modality="text",
            primarySignal=neutral_item,
            allSignals=[neutral_item],
            uncertainty=UncertaintyMetrics(
                isUncertain=True,
                entropy=0.0,
                confidenceMargin=0.0,
                threshold=0.32
            ),
            rawConfidence=0.5,
            source="distilbert_multilingual_ml",
            modelVersion=MODEL_VERSION,
            disclaimer="AI-estimated emotional signal based on contextual text patterns. Not a clinical psychological diagnosis."
        )

    # 1. Transform text through DistilBERT
    emb = compute_embedding(raw_text)

    # 2. Compute Softmax Probabilities across classes
    probs = classifier.predict_proba(emb)[0]
    classes = classifier.classes_

    # Sort signals descending by probability
    ranked_indices = np.argsort(probs)[::-1]
    all_signals = []
    for idx in ranked_indices:
        cls_name = classes[idx]
        prob = float(probs[idx])
        all_signals.append(SignalItem(
            signal=cls_name,
            label=SIGNAL_LABELS.get(cls_name, "Reflective thought"),
            probability=round(prob, 4),
            confidence=round(prob, 4)
        ))

    top_prob = all_signals[0].probability
    second_prob = all_signals[1].probability if len(all_signals) > 1 else 0.0

    # 3. Mathematical Uncertainty Estimation
    # Shannon Entropy: H = -sum(p * log(p))
    entropy = float(-sum(p * math.log(max(p, 1e-12)) for p in probs if p > 0))
    margin = float(top_prob - second_prob)

    # Confidence Thresholding:
    # Random guessing across 7 classes is 1/7 = 0.143.
    # If top probability is < 0.25, or prediction margin is < 0.04, flag uncertainty.
    UNCERTAINTY_THRESHOLD = 0.25
    is_uncertain = (top_prob < UNCERTAINTY_THRESHOLD) or (margin < 0.04) or (entropy > 1.65)

    primary_signal = all_signals[0]
    if top_prob < UNCERTAINTY_THRESHOLD:
        # When model has near-uniform distribution across classes, report neutral_unclear
        primary_signal = SignalItem(
            signal="neutral_unclear",
            label="Unclear or blended emotional signals (human validation requested)",
            probability=round(top_prob, 4),
            confidence=round(top_prob, 4)
        )

    return PredictResponse(
        modality="text",
        primarySignal=primary_signal,
        allSignals=all_signals,
        uncertainty=UncertaintyMetrics(
            isUncertain=is_uncertain,
            entropy=round(entropy, 4),
            confidenceMargin=round(margin, 4),
            threshold=UNCERTAINTY_THRESHOLD
        ),
        rawConfidence=round(top_prob, 4),
        source="distilbert_multilingual_ml",
        modelVersion=MODEL_VERSION,
        disclaimer="AI-estimated emotional signal based on contextual text patterns. Not a clinical psychological diagnosis."
    )

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
