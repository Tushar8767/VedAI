import sys
import os
import time
import json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score
from ml_model.app import predict_emotion, TextInput, CANONICAL_LABELS

BENCHMARK_DATASET = [
    # ANGER (15 samples)
    ("I am absolutely furious with how unfairly I was treated at work today.", "anger"),
    ("I feel so much rage inside me because they broke their promise.", "anger"),
    ("I resent my manager for taking credit for all my hard work.", "anger"),
    ("I am so mad right now I can barely speak without shouting.", "anger"),
    ("Their blatant disrespect makes my blood boil with hate.", "anger"),
    ("I hate how selfish people can be when you need them most.", "anger"),
    ("The constant hypocrisy and deceit infuriates me to no end.", "anger"),
    ("I am frustrated and bitter about being repeatedly passed over.", "anger"),
    ("Why does everyone keep lying to me? I feel pure anger.", "anger"),
    ("An explosive fury erupted when I discovered their betrayal.", "anger"),
    ("Their toxic remarks irritated me to the point of shouting.", "anger"),
    ("I am so annoyed and mad at the constant interruptions.", "anger"),
    ("Deep resentment is poisoning my thoughts towards them.", "anger"),
    ("I feel intense frustration with this unfair bureaucratic system.", "anger"),
    ("My heart is burning with rage and grievance.", "anger"),

    # FEAR (15 samples)
    ("I am terrified of failing my family and being abandoned.", "fear"),
    ("A paralyzing fear grips my chest whenever I think of tomorrow.", "fear"),
    ("I feel defenseless, vulnerable, and completely scared.", "fear"),
    ("The dark thoughts of danger make me afraid to sleep alone.", "fear"),
    ("I am scared of what will happen if things collapse suddenly.", "fear"),
    ("A terrifying nightmare left me trembling and scared.", "fear"),
    ("I feel helpless and vulnerable in this hostile environment.", "fear"),
    ("The fear of the unknown is completely paralyzing my decisions.", "fear"),
    ("I dread the horrifying possibility of losing everything.", "fear"),
    ("A creeping terror overcame me as the sirens began to wail.", "fear"),
    ("I am afraid that I will never be safe again.", "fear"),
    ("Sheer panic and horror gripped the room during the earthquake.", "fear"),
    ("I am terrified that they will discover how inadequate I am.", "fear"),
    ("Feeling deeply scared and vulnerable after the recent events.", "fear"),
    ("An acute fear of medical diagnoses is consuming my peace.", "fear"),

    # HAPPINESS (15 samples)
    ("I feel profound gratitude for the love and peace in my life today.", "happiness"),
    ("A quiet serenity and joy has filled my morning contemplation.", "happiness"),
    ("I am so happy and content with the simple blessings surrounding me.", "happiness"),
    ("A wave of calm and equanimity washed over my heart during prayer.", "happiness"),
    ("I feel truly blessed, fulfilled, and peaceful in this moment.", "happiness"),
    ("Waking up to birds chirping filled me with pure joy and lightness.", "happiness"),
    ("I am deeply thankful and happy for my friends and family.", "happiness"),
    ("Everything feels so serene, balanced, and harmonious right now.", "happiness"),
    ("A sense of profound inner stillness and contentment holds me.", "happiness"),
    ("I celebrated the success of my close friend with pure delight.", "happiness"),
    ("Grateful for the gift of another sunrise and fresh breath.", "happiness"),
    ("Experiencing quiet satisfaction and joy in my creative work.", "happiness"),
    ("Peaceful stillness in my meditation brought deep happiness.", "happiness"),
    ("My spirit feels light, joyful, and completely tranquil.", "happiness"),
    ("Such warmth, love, and gratitude fills my chest this evening.", "happiness"),

    # SADNESS (15 samples)
    ("A profound loneliness and grief has settled over my heart.", "sadness"),
    ("I cannot stop weeping over the loss of my dearest companion.", "sadness"),
    ("Everything feels empty, hopeless, and drenched in sorrow.", "sadness"),
    ("The pain of heartbreak leaves me weeping in the dark.", "sadness"),
    ("I feel so depressed and drained of all will to move forward.", "sadness"),
    ("An unbearable emptiness has hollowed out my chest.", "sadness"),
    ("Mourning the dreams that were shattered into irrecoverable pieces.", "sadness"),
    ("Tears flow silently as I remember the days that will never return.", "sadness"),
    ("A heavy sadness hangs over every room in this quiet house.", "sadness"),
    ("I feel completely lonely, unseen, and forgotten by everyone.", "sadness"),
    ("Grief is an overwhelming tide dragging me under the surface.", "sadness"),
    ("Hopeless thoughts cloud my vision of any possible joy ahead.", "sadness"),
    ("I am weeping with deep sorrow for what we lost.", "sadness"),
    ("The cold silence of bereavement is heartbreaking.", "sadness"),
    ("Feeling deeply down, depressed, and burdened by emotional pain.", "sadness"),

    # ANXIETY (15 samples)
    ("I am so anxious and nervous about the outcome of tomorrow's interview.", "anxiety"),
    ("Overthinking every tiny detail is driving me into severe anxiety.", "anxiety"),
    ("I feel intense worry about my uncertain career trajectory.", "anxiety"),
    ("Constant dread of what might go wrong keeps my mind racing.", "anxiety"),
    ("nourves and restless about the upcoming examination results.", "anxiety"),
    ("Panic sensations rise whenever I think of public speaking.", "anxiety"),
    ("I am plagued with nagging doubts and anxious thoughts.", "anxiety"),
    ("My mind will not stop worrying about hypothetical disasters.", "anxiety"),
    ("Feeling restless, nervous, and unsettled about relocating.", "anxiety"),
    ("Extreme dread regarding my pending performance evaluation.", "anxiety"),
    ("I am worrying myself sick over whether I made the right choice.", "anxiety"),
    ("Anxious palpitations and racing thoughts won't let me relax.", "anxiety"),
    ("Overwhelmed by uncertainty and anxious restlessness about the future.", "anxiety"),
    ("Doubt and anxiety are paralyzing my ability to commit.", "anxiety"),
    ("I feel jittery and nervous whenever the phone rings.", "anxiety"),

    # STRESS (15 samples)
    ("I am completely overwhelmed by these tight project deadlines.", "stress"),
    ("The crushing pressure at work is pushing me towards burnout.", "stress"),
    ("Exhausted and strained from balancing multiple demanding chores.", "stress"),
    ("The sheer workload this week is leaving me utterly depleted.", "stress"),
    ("Feeling immense stress from conflicting professional obligations.", "stress"),
    ("I am tired, overstretched, and hurried in every single task.", "stress"),
    ("The burden of financial pressure is weighing heavily on my shoulders.", "stress"),
    ("Chronic workplace burnout has drained all my physical stamina.", "stress"),
    ("So stressed out by back-to-back meetings and zero time to breathe.", "stress"),
    ("The strain of caregiving and working late is unsustainable.", "stress"),
    ("Feeling hurried, fatigued, and overwhelmed by endless to-do lists.", "stress"),
    ("Deeply exhausted from relentless deadlines and high stakes.", "stress"),
    ("The mental overload and stress are making it impossible to focus.", "stress"),
    ("Burdened by intense responsibilities with no support system.", "stress"),
    ("Living under high pressure with no room to decompress.", "stress"),

    # NEUTRAL (15 samples)
    ("I am sitting by the window watching the morning commute.", "neutral"),
    ("Reviewing my calendar and organizing the schedule for this week.", "neutral"),
    ("Making a cup of warm tea before starting my regular reading.", "neutral"),
    ("Walking through the grocery aisle picking up daily essentials.", "neutral"),
    ("The weather today is overcast with a gentle breeze.", "neutral"),
    ("Organizing files on my desk after the morning meeting.", "neutral"),
    ("Reading a chapter on ancient architecture in the library.", "neutral"),
    ("Checking train schedules for the upcoming weekend trip.", "neutral"),
    ("Preparing a simple lunch with lentils and steamed rice.", "neutral"),
    ("Observing the traffic flow from the balcony on a Tuesday afternoon.", "neutral"),
    ("Reviewing code pull requests and standard documentation.", "neutral"),
    ("Taking notes during a routine presentation on software architecture.", "neutral"),
    ("Browsing historical maps and geographic census data.", "neutral"),
    ("Filling out the registration form for the annual conference.", "neutral"),
    ("Setting an alarm for seven in the morning.", "neutral")
]

def evaluate():
    y_true = []
    y_pred = []
    latencies = []

    print(f"==================================================")
    print(f" VedAI NLP Emotion Benchmark (N = {len(BENCHMARK_DATASET)})")
    print(f" Canonical Classes ({len(CANONICAL_LABELS)}): {', '.join(CANONICAL_LABELS)}")
    print(f"==================================================")

    for text, expected in BENCHMARK_DATASET:
        t0 = time.perf_counter()
        res = predict_emotion(TextInput(text=text))
        elapsed = (time.perf_counter() - t0) * 1000.0  # ms
        latencies.append(elapsed)

        pred = res["emotion"]
        y_true.append(expected)
        y_pred.append(pred)

    accuracy = accuracy_score(y_true, y_pred)
    macro_f1 = f1_score(y_true, y_pred, average="macro")
    weighted_f1 = f1_score(y_true, y_pred, average="weighted")

    print("\n--- CLASSIFICATION REPORT ---")
    report_dict = classification_report(y_true, y_pred, target_names=CANONICAL_LABELS, output_dict=True)
    print(classification_report(y_true, y_pred, target_names=CANONICAL_LABELS, digits=3))

    cm = confusion_matrix(y_true, y_pred, labels=CANONICAL_LABELS)
    print("--- CONFUSION MATRIX ---")
    header = f"{'':12}" + "".join([f"{l[:6]:>8}" for l in CANONICAL_LABELS])
    print(header)
    for idx, row in enumerate(cm):
        row_str = f"{CANONICAL_LABELS[idx]:12}" + "".join([f"{val:>8}" for val in row])
        print(row_str)

    mean_lat = np.mean(latencies)
    median_lat = np.median(latencies)
    p95_lat = np.percentile(latencies, 95)

    print("\n--- INFERENCE LATENCY (ms) ---")
    print(f"Mean:   {mean_lat:.2f} ms")
    print(f"Median: {median_lat:.2f} ms")
    print(f"p95:    {p95_lat:.2f} ms")

    summary = {
        "benchmark_samples": len(BENCHMARK_DATASET),
        "classes": CANONICAL_LABELS,
        "accuracy": round(float(accuracy), 4),
        "macro_f1": round(float(macro_f1), 4),
        "weighted_f1": round(float(weighted_f1), 4),
        "latency_ms": {
            "mean": round(float(mean_lat), 2),
            "median": round(float(median_lat), 2),
            "p95": round(float(p95_lat), 2)
        },
        "per_class": {
            cls: {
                "precision": round(float(report_dict[cls]["precision"]), 3),
                "recall": round(float(report_dict[cls]["recall"]), 3),
                "f1_score": round(float(report_dict[cls]["f1-score"]), 3),
                "support": int(report_dict[cls]["support"])
            }
            for cls in CANONICAL_LABELS
        }
    }

    out_path = "ml_model/evaluation_metrics.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"\nSaved empirical metrics to {out_path}")
    return summary

if __name__ == "__main__":
    evaluate()
