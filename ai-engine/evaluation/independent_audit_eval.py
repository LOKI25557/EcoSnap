"""Independent Audit Script: Full 275-image Evaluation & Keras vs. TFLite Parity."""

import hashlib
import json
import time
from pathlib import Path
import numpy as np
import tensorflow as tf
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, precision_score, recall_score

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
KERAS_PATH = ROOT_DIR / "ai-engine" / "models" / "waste_classifier.keras"
TFLITE_DEPLOYED = ROOT_DIR / "mobile-app" / "assets" / "models" / "waste_classifier.tflite"
TFLITE_CONVERTED = ROOT_DIR / "ai-engine" / "models" / "waste_classifier.tflite"
TEST_DIR = ROOT_DIR / "ai-engine" / "datasets" / "splits" / "test"
REPORT_OUTPUT = ROOT_DIR / "ai-engine" / "reports" / "independent_audit_evaluation.json"

CLASSES = [
    "Plastic",
    "Paper",
    "Glass",
    "Metal",
    "Cardboard",
    "Organic",
    "Battery",
    "E-waste",
]

def get_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    print("==================================================")
    print(" EcoSnap Independent Audit: Full 275-Image Eval")
    print("==================================================")

    # 1. Model Asset Verification
    print("1. Checking Model Files:")
    print("  Keras Model:", KERAS_PATH, f"({KERAS_PATH.stat().st_size} bytes)")
    print("  Deployed TFLite:", TFLITE_DEPLOYED, f"({TFLITE_DEPLOYED.stat().st_size} bytes)")
    print("  Converted TFLite:", TFLITE_CONVERTED, f"({TFLITE_CONVERTED.stat().st_size} bytes)")

    dep_hash = get_hash(TFLITE_DEPLOYED)
    conv_hash = get_hash(TFLITE_CONVERTED)
    print(f"  Deployed SHA-256:  {dep_hash}")
    print(f"  Converted SHA-256: {conv_hash}")
    print(f"  Byte-level Match: {dep_hash == conv_hash}\n")

    # 2. Load Models
    keras_model = tf.keras.models.load_model(KERAS_PATH)
    interpreter = tf.lite.Interpreter(model_path=str(TFLITE_DEPLOYED))
    interpreter.allocate_tensors()

    in_details = interpreter.get_input_details()
    out_details = interpreter.get_output_details()
    in_idx = in_details[0]["index"]
    out_idx = out_details[0]["index"]

    print("2. TFLite Tensor Details:")
    print(f"  Input Shape: {in_details[0]['shape']}, Dtype: {in_details[0]['dtype']}")
    print(f"  Output Shape: {out_details[0]['shape']}, Dtype: {out_details[0]['dtype']}\n")

    # 3. Load All 275 Test Images
    print("3. Loading and Evaluating All Test Images...")
    y_true = []
    keras_preds = []
    tflite_preds = []
    keras_probs = []
    tflite_probs = []
    image_names = []

    diffs = []
    matches = 0
    total = 0

    class_counts = {}

    for idx, cat_name in enumerate(CLASSES):
        cat_dir = TEST_DIR / cat_name
        files = sorted(list(cat_dir.iterdir()))
        class_counts[cat_name] = len(files)
        for f in files:
            if not f.is_file():
                continue
            raw = tf.io.read_file(str(f))
            img = tf.image.decode_image(raw, channels=3, expand_animations=False)
            img = tf.image.resize(img, (224, 224), method=tf.image.ResizeMethod.BILINEAR)
            tensor = (tf.cast(img, tf.float32) / 255.0).numpy()
            batch = np.expand_dims(tensor, axis=0).astype(np.float32)

            # Keras Prediction
            k_out = keras_model.predict(batch, verbose=0)[0]
            k_pred = int(np.argmax(k_out))

            # TFLite Prediction
            interpreter.set_tensor(in_idx, batch)
            interpreter.invoke()
            tf_out = interpreter.get_tensor(out_idx)[0]
            tf_pred = int(np.argmax(tf_out))

            y_true.append(idx)
            keras_preds.append(k_pred)
            tflite_preds.append(tf_pred)
            keras_probs.append(k_out)
            tflite_probs.append(tf_out)
            image_names.append(f.name)

            if k_pred == tf_pred:
                matches += 1
            diff = float(np.max(np.abs(k_out - tf_out)))
            diffs.append(diff)
            total += 1

    print(f"Total test images processed: {total}")
    print("Class distribution in test split:", class_counts)

    # 4. Keras Metrics
    k_acc = accuracy_score(y_true, keras_preds)
    k_prec_macro = precision_score(y_true, keras_preds, average="macro", zero_division=0)
    k_rec_macro = recall_score(y_true, keras_preds, average="macro", zero_division=0)
    k_f1_macro = f1_score(y_true, keras_preds, average="macro", zero_division=0)
    k_f1_weighted = f1_score(y_true, keras_preds, average="weighted", zero_division=0)
    k_cm = confusion_matrix(y_true, keras_preds).tolist()
    k_report = classification_report(y_true, keras_preds, target_names=CLASSES, output_dict=True, zero_division=0)

    # 5. TFLite Metrics
    tf_acc = accuracy_score(y_true, tflite_preds)
    tf_prec_macro = precision_score(y_true, tflite_preds, average="macro", zero_division=0)
    tf_rec_macro = recall_score(y_true, tflite_preds, average="macro", zero_division=0)
    tf_f1_macro = f1_score(y_true, tflite_preds, average="macro", zero_division=0)
    tf_f1_weighted = f1_score(y_true, tflite_preds, average="weighted", zero_division=0)
    tf_cm = confusion_matrix(y_true, tflite_preds).tolist()
    tf_report = classification_report(y_true, tflite_preds, target_names=CLASSES, output_dict=True, zero_division=0)

    # 6. Parity Statistics
    agreement_rate = matches / total
    mean_diff = float(np.mean(diffs))
    max_diff = float(np.max(diffs))
    p95_diff = float(np.percentile(diffs, 95))

    print("\n=== KERAS MODEL INDEPENDENT METRICS (275 TEST IMAGES) ===")
    print(f"  Accuracy:          {k_acc:.4f} ({k_acc*100:.2f}%)")
    print(f"  Macro Precision:   {k_prec_macro:.4f} ({k_prec_macro*100:.2f}%)")
    print(f"  Macro Recall:      {k_rec_macro:.4f} ({k_rec_macro*100:.2f}%)")
    print(f"  Macro F1:          {k_f1_macro:.4f} ({k_f1_macro*100:.2f}%)")
    print(f"  Weighted F1:       {k_f1_weighted:.4f} ({k_f1_weighted*100:.2f}%)")

    print("\n=== TFLITE MODEL INDEPENDENT METRICS (275 TEST IMAGES) ===")
    print(f"  Accuracy:          {tf_acc:.4f} ({tf_acc*100:.2f}%)")
    print(f"  Macro Precision:   {tf_prec_macro:.4f} ({tf_prec_macro*100:.2f}%)")
    print(f"  Macro Recall:      {tf_rec_macro:.4f} ({tf_rec_macro*100:.2f}%)")
    print(f"  Macro F1:          {tf_f1_macro:.4f} ({tf_f1_macro*100:.2f}%)")
    print(f"  Weighted F1:       {tf_f1_weighted:.4f} ({tf_f1_weighted*100:.2f}%)")

    print("\n=== KERAS VS. TFLITE PARITY (FULL 275 TEST SET) ===")
    print(f"  Top-1 Class Agreement: {agreement_rate:.2%} ({matches}/{total})")
    print(f"  Mean Absolute Diff:    {mean_diff:.5f}")
    print(f"  95th Percentile Diff:  {p95_diff:.5f}")
    print(f"  Max Absolute Diff:     {max_diff:.5f}")

    audit_data = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_test_samples": total,
        "class_counts": class_counts,
        "hashes": {
            "deployed_tflite": dep_hash,
            "converted_tflite": conv_hash,
            "models_match": dep_hash == conv_hash,
        },
        "keras_metrics": {
            "accuracy": k_acc,
            "precision_macro": k_prec_macro,
            "recall_macro": k_rec_macro,
            "f1_macro": k_f1_macro,
            "f1_weighted": k_f1_weighted,
            "confusion_matrix": k_cm,
            "classification_report": k_report,
        },
        "tflite_metrics": {
            "accuracy": tf_acc,
            "precision_macro": tf_prec_macro,
            "recall_macro": tf_rec_macro,
            "f1_macro": tf_f1_macro,
            "f1_weighted": tf_f1_weighted,
            "confusion_matrix": tf_cm,
            "classification_report": tf_report,
        },
        "parity": {
            "top1_matches": matches,
            "top1_agreement_rate": agreement_rate,
            "mean_prob_diff": mean_diff,
            "p95_prob_diff": p95_diff,
            "max_prob_diff": max_diff,
        }
    }

    REPORT_OUTPUT.write_text(json.dumps(audit_data, indent=2), encoding="utf-8")
    print(f"\nIndependent evaluation report written to: {REPORT_OUTPUT}")

if __name__ == "__main__":
    main()
