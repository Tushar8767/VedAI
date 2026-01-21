from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI(title="Emotion Detection API")

emotion_detector = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    return_all_scores=True,
    framework="pt"   
)

class TextInput(BaseModel):
    text: str

LABEL_MAP = {
    "anger": "anger",
    "fear": "fear",
    "joy": "happiness",
    "sadness": "sadness",
    "neutral": "neutral",
    "surprise": "neutral",
    "disgust": "anger"
}

@app.post("/predict")
def predict_emotion(data: TextInput):
    results = emotion_detector(data.text)[0]
    top = max(results, key=lambda x: x["score"])

    return {
        "emotion": LABEL_MAP.get(top["label"], "neutral"),
        "confidence": float(top["score"])
    }
