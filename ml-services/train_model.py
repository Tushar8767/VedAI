"""
VedAI 2.0 - Multilingual Emotion Model Trainer & Evaluator
Base: DistilBERT Multilingual (104 languages, 768 dimensions)
Head: Calibrated Multiclass Softmax Emotion Classifier (7 VedAI categories)
"""

import os
import sys
import json
import time
import numpy as np
import torch
from transformers import AutoTokenizer, AutoModel
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import normalize
from sklearn.metrics import classification_report, confusion_matrix, f1_score, precision_score, recall_score
import joblib

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

EMOTION_CLASSES = [
    "stress_overwhelm",
    "anxiety_fear",
    "anger_frustration",
    "sadness_grief",
    "calm_peace",
    "hope_optimism",
    "neutral_unclear"
]

def load_data(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)

def extract_embeddings(texts, model, tokenizer, batch_size=16):
    model.eval()
    all_embeddings = []
    
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        inputs = tokenizer(
            batch,
            padding=True,
            truncation=True,
            max_length=64,
            return_tensors="pt"
        )
        with torch.no_grad():
            outputs = model(**inputs)
            # CLS token representation + Mean pooling
            cls_emb = outputs.last_hidden_state[:, 0, :].cpu().numpy()
            
            input_mask_expanded = inputs["attention_mask"].unsqueeze(-1).expand(outputs.last_hidden_state.size()).float()
            sum_embeddings = torch.sum(outputs.last_hidden_state * input_mask_expanded, 1)
            sum_mask = input_mask_expanded.sum(1)
            sum_mask = torch.clamp(sum_mask, min=1e-9)
            mean_pooled = (sum_embeddings / sum_mask).cpu().numpy()
            
            # Combine CLS and mean pooled embeddings
            combined = np.hstack([cls_emb, mean_pooled])
            all_embeddings.append(combined)
            
    raw_emb = np.vstack(all_embeddings)
    # L2 normalize for optimal linear separability
    return normalize(raw_emb, norm="l2")

def main():
    print("=" * 60)
    print("VEDAI 2.0 - TRAINING MULTILINGUAL TEXT EMOTION ML MODEL")
    print("=" * 60)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    train_file = os.path.join(base_dir, "data", "train_dataset.json")
    eval_file = os.path.join(base_dir, "data", "eval_dataset.json")
    model_dir = os.path.join(base_dir, "model")
    os.makedirs(model_dir, exist_ok=True)

    train_data = load_data(train_file)
    eval_data = load_data(eval_file)
    print(f"[1/5] Loaded {len(train_data)} training samples and {len(eval_data)} held-out evaluation samples.")

    # 1. Load Pretrained Multilingual Transformer
    print("[2/5] Initializing DistilBERT Multilingual Transformer (distilbert-base-multilingual-cased)...")
    model_name = "distilbert-base-multilingual-cased"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    transformer = AutoModel.from_pretrained(model_name)

    # 2. Extract Contextualized Embeddings
    print("[3/5] Extracting dual pooled representations (CLS + Mean, 1536-dim) with L2 normalization...")
    t0 = time.time()
    train_texts = [d["text"] for d in train_data]
    train_labels = [d["label"] for d in train_data]
    X_train = extract_embeddings(train_texts, transformer, tokenizer)

    eval_texts = [d["text"] for d in eval_data]
    eval_labels = [d["label"] for d in eval_data]
    X_eval = extract_embeddings(eval_texts, transformer, tokenizer)
    print(f"[3/5] Feature extraction complete in {time.time() - t0:.2f}s. Train shape: {X_train.shape}, Eval shape: {X_eval.shape}")

    # 3. Train Calibrated Softmax Classification Head
    print("[4/5] Training calibrated neural softmax classification head...")
    classifier = MLPClassifier(
        hidden_layer_sizes=(128,),
        max_iter=800,
        alpha=0.005,
        random_state=42
    )
    classifier.fit(X_train, train_labels)

    # 4. Rigorous Out-of-Sample Evaluation
    print("[5/5] Performing independent evaluation on held-out test dataset...")
    y_pred = classifier.predict(X_eval)
    y_prob = classifier.predict_proba(X_eval)

    classes = classifier.classes_.tolist()
    macro_f1 = f1_score(eval_labels, y_pred, average="macro")
    weighted_f1 = f1_score(eval_labels, y_pred, average="weighted")
    precision = precision_score(eval_labels, y_pred, average="weighted")
    recall = recall_score(eval_labels, y_pred, average="weighted")
    cm = confusion_matrix(eval_labels, y_pred, labels=classes)

    print("\n--- CLASSIFICATION REPORT (HELD-OUT EVALUATION SET) ---")
    print(classification_report(eval_labels, y_pred, digits=3))

    print(f"Macro-F1 Score: {macro_f1:.4f}")
    print(f"Weighted F1:    {weighted_f1:.4f}")
    print(f"Precision:      {precision:.4f}")
    print(f"Recall:         {recall:.4f}")

    # Language breakdown
    print("\n--- ACCURACY BREAKDOWN BY LANGUAGE MODALITY ---")
    lang_results = {}
    for item, pred in zip(eval_data, y_pred):
        lang = item.get("lang", "unknown")
        if lang not in lang_results:
            lang_results[lang] = {"total": 0, "correct": 0}
        lang_results[lang]["total"] += 1
        if item["label"] == pred:
            lang_results[lang]["correct"] += 1

    for lang, stats in lang_results.items():
        acc = (stats["correct"] / stats["total"]) * 100
        print(f"  {lang.ljust(12)}: {stats['correct']}/{stats['total']} ({acc:.1f}%)")

    # 5. Save Artifacts
    clf_path = os.path.join(model_dir, "emotion_classifier.joblib")
    joblib.dump(classifier, clf_path)

    metrics_path = os.path.join(model_dir, "evaluation_metrics.json")
    metrics_data = {
        "model_architecture": "distilbert-base-multilingual-cased + Dual CLS/Mean Pooling + Softmax Head",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "training_samples": len(train_data),
        "evaluation_samples": len(eval_data),
        "macro_f1": round(float(macro_f1), 4),
        "weighted_f1": round(float(weighted_f1), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "classes": classes,
        "confusion_matrix": cm.tolist(),
        "language_breakdown": lang_results
    }
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)

    print(f"\n[OK] Model classifier weights saved to: {clf_path}")
    print(f"[OK] Evaluation metrics recorded in: {metrics_path}")
    print("=" * 60)

if __name__ == "__main__":
    main()
