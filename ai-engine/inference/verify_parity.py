"""Parity verification between Keras model and exported TFLite model on real test images."""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Dict, List

import numpy as np
import tensorflow as tf

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
KERAS_MODEL_PATH = ROOT_DIR / "ai-engine" / "models" / "waste_classifier.keras"
TFLITE_MODEL_PATH = ROOT_DIR / "mobile-app" / "assets" / "models" / "waste_classifier.tflite"
LABELS_PATH = ROOT_DIR / "ai-engine" / "models" / "waste_classifier_labels.json"
TEST_DATA_DIR = ROOT_DIR / "ai-engine" / "datasets" / "prepared" / "test"
REPORT_OUTPUT_PATH = ROOT_DIR / "ai-engine" / "reports" / "parity_verification_report.json"

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


def load_sample_images(samples_per_class: int = 2) -> List[Dict[str, object]]:
    """Select representative test images from each class directory."""
    samples = []
    for category in CLASSES:
        cat_dir = TEST_DATA_DIR / category
        if not cat_dir.exists():
            continue
        img_paths = list(cat_dir.glob("*.jpg"))[:samples_per_class]
        for p in img_paths:
            # Read, decode, resize to 224x224, scale to [0.0, 1.0] matching mobile app
            raw = tf.io.read_file(str(p))
            img = tf.image.decode_image(raw, channels=3, expand_animations=False)
            img = tf.image.resize(img, (224, 224), method=tf.image.ResizeMethod.BILINEAR)
            tensor = (tf.cast(img, tf.float32) / 255.0).numpy()
            batch_tensor = np.expand_dims(tensor, axis=0).astype(np.float32)
            samples.append({
                "path": str(p),
                "true_category": category,
                "input_tensor": batch_tensor,
            })
    return samples


def main() -> None:
    print("==================================================")
    print(" EcoSnap Keras vs. TFLite Parity Verification")
    print("==================================================")

    # 1. Load Keras Model
    print(f"Loading Keras model from: {KERAS_MODEL_PATH}")
    keras_model = tf.keras.models.load_model(KERAS_MODEL_PATH)

    # 2. Load TFLite Model
    print(f"Loading TFLite model from: {TFLITE_MODEL_PATH}")
    interpreter = tf.lite.Interpreter(model_path=str(TFLITE_MODEL_PATH))
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    input_index = input_details[0]["index"]
    output_index = output_details[0]["index"]

    print(f"TFLite Input: {input_details[0]['shape']}, dtype: {input_details[0]['dtype']}")
    print(f"TFLite Output: {output_details[0]['shape']}, dtype: {output_details[0]['dtype']}")

    # 3. Load Samples
    samples = load_sample_images(samples_per_class=2)
    print(f"Loaded {len(samples)} test samples across {len(CLASSES)} classes.\n")

    results = []
    matches = 0
    max_prob_diff = 0.0
    keras_latencies = []
    tflite_latencies = []

    print(f"{'Class':<12} | {'True Label':<10} | {'Keras Pred':<10} (Conf) | {'TFLite Pred':<10} (Conf) | {'Diff':<8} | {'Match'}")
    print("-" * 75)

    for item in samples:
        tensor = item["input_tensor"]
        true_label = item["true_category"]

        # Keras Inference
        t0 = time.perf_counter()
        k_out = keras_model.predict(tensor, verbose=0)[0]
        keras_latencies.append((time.perf_counter() - t0) * 1000)

        # TFLite Inference
        t0 = time.perf_counter()
        interpreter.set_tensor(input_index, tensor)
        interpreter.invoke()
        tf_out = interpreter.get_tensor(output_index)[0]
        tflite_latencies.append((time.perf_counter() - t0) * 1000)

        k_idx = int(np.argmax(k_out))
        tf_idx = int(np.argmax(tf_out))
        k_conf = float(k_out[k_idx])
        tf_conf = float(tf_out[tf_idx])
        k_pred = CLASSES[k_idx]
        tf_pred = CLASSES[tf_idx]

        is_match = (k_idx == tf_idx)
        if is_match:
            matches += 1

        prob_diff = float(np.max(np.abs(k_out - tf_out)))
        if prob_diff > max_prob_diff:
            max_prob_diff = prob_diff

        print(f"{true_label:<12} | {true_label:<10} | {k_pred:<10} ({k_conf:.1%}) | {tf_pred:<10} ({tf_conf:.1%}) | {prob_diff:.4f} | {'YES' if is_match else 'NO'}")

        results.append({
            "image": Path(item["path"]).name,
            "true_class": true_label,
            "keras_pred": k_pred,
            "keras_conf": k_conf,
            "tflite_pred": tf_pred,
            "tflite_conf": tf_conf,
            "prob_diff": prob_diff,
            "matched": is_match,
        })

    agreement_rate = matches / len(samples) if samples else 0.0
    avg_k_lat = float(np.mean(keras_latencies))
    avg_tf_lat = float(np.mean(tflite_latencies))

    print("-" * 75)
    print(f"Total Samples Tested: {len(samples)}")
    print(f"Model Parity Agreement: {agreement_rate:.1%} ({matches}/{len(samples)})")
    print(f"Max Absolute Probability Difference: {max_prob_diff:.4f}")
    print(f"Average Keras Latency: {avg_k_lat:.2f} ms")
    print(f"Average TFLite Latency: {avg_tf_lat:.2f} ms (Speedup: {avg_k_lat/avg_tf_lat:.2f}x)")

    report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "keras_model_path": str(KERAS_MODEL_PATH),
        "tflite_model_path": str(TFLITE_MODEL_PATH),
        "total_samples": len(samples),
        "agreement_count": matches,
        "agreement_rate": agreement_rate,
        "max_prob_diff": max_prob_diff,
        "avg_keras_latency_ms": avg_k_lat,
        "avg_tflite_latency_ms": avg_tf_lat,
        "speedup_factor": round(avg_k_lat / avg_tf_lat, 2) if avg_tf_lat > 0 else 0,
        "samples": results,
        "parity_status": "PASSED" if agreement_rate >= 0.90 else "FAILED",
    }

    REPORT_OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_OUTPUT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"\nParity verification report saved to: {REPORT_OUTPUT_PATH}")


if __name__ == "__main__":
    main()
