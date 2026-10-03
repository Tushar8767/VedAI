import os
import json
import time
import numpy as np
import torch
from transformers import AutoTokenizer, AutoModel

MODEL_NAME = "distilbert-base-multilingual-cased"
VERSES_PATH = os.path.join(os.path.dirname(__file__), "..", "knowledge-base", "gita_verses.json")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "knowledge-base", "gita_dense_embeddings.json")

def main():
    print(f"[Dense RAG] Loading {MODEL_NAME} for dense neural indexing...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    transformer = AutoModel.from_pretrained(MODEL_NAME)
    transformer.eval()

    if not os.path.exists(VERSES_PATH):
        raise FileNotFoundError(f"Verses not found at {VERSES_PATH}")

    with open(VERSES_PATH, "r", encoding="utf-8") as f:
        verses = json.load(f)

    print(f"[Dense RAG] Precomputing dense embeddings for {len(verses)} canonical verses...")
    t0 = time.time()

    dense_index = []
    batch_size = 32

    # Prepare document texts: translation + simpleExplanation + whyThisVerse + themes
    texts = []
    for v in verses:
        themes_str = " ".join(v.get("themes", [])) if isinstance(v.get("themes"), list) else ""
        content = f"{v.get('translation', '')} {v.get('simpleExplanation', '')} {v.get('whyThisVerse', '')} {themes_str}".strip()
        texts.append(content)

    all_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i + batch_size]
        inputs = tokenizer(
            batch_texts,
            padding=True,
            truncation=True,
            max_length=96,
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
            normalized = (combined / norm).astype(np.float32)

            for j, emb in enumerate(normalized):
                verse_idx = i + j
                v = verses[verse_idx]
                dense_index.append({
                    "id": v.get("id") or v.get("verseId") or f"BG_{v['chapter']}_{v['verse']}",
                    "chapter": v.get("chapter") or v.get("chapterNumber"),
                    "verse": v.get("verse") or v.get("verseNumber"),
                    "embedding": [round(float(x), 5) for x in emb]
                })

        print(f"Processed {min(i + batch_size, len(texts))}/{len(texts)} verses...")

    duration = time.time() - t0
    print(f"[Dense RAG] Completed embedding generation in {duration:.2f}s. Saving to {OUTPUT_PATH}...")

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump({
            "model": MODEL_NAME,
            "dimension": len(dense_index[0]["embedding"]),
            "totalVerses": len(dense_index),
            "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "verses": dense_index
        }, f)

    print(f"[Dense RAG] Successfully generated {len(dense_index)} dense verse embeddings! Dimension: {len(dense_index[0]['embedding'])}")

if __name__ == "__main__":
    main()
