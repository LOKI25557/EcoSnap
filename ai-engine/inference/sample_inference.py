"""Sample inference script demonstrating the complete EcoSnap AI pipeline.

This script shows how to:
1. Load a trained TFLite model
2. Preprocess an image
3. Run inference
4. Display results with confidence scores and recommendations

This is a reference implementation for mobile and server-side use.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Tuple

import numpy as np
import tensorflow as tf

# Expected to be available after training and conversion
MODEL_PATH = Path("../models/waste_classifier.tflite")
LABELS_PATH = Path("../models/waste_classifier_labels.json")

# Model input specification
IMAGE_SIZE = (224, 224)
MIN_CONFIDENCE = 0.3


def load_labels(labels_path: Path) -> list[str]:
    """Load class labels from the training metadata."""
    if not labels_path.exists():
        raise FileNotFoundError(f"Labels file not found: {labels_path}")

    with open(labels_path) as f:
        data = json.load(f)
    return data.get("class_names", [])


def load_tflite_model(model_path: Path) -> tf.lite.Interpreter:
    """Load and initialize a TFLite model."""
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")

    interpreter = tf.lite.Interpreter(model_path=str(model_path))
    interpreter.allocate_tensors()
    return interpreter


def preprocess_image(image_path: Path) -> np.ndarray:
    """Load and preprocess an image for inference.

    Args:
        image_path: Path to the input image

    Returns:
        Preprocessed image tensor (1, 224, 224, 3) normalized to [0, 1]
    """
    # Load image
    image = tf.io.read_file(str(image_path))
    image = tf.image.decode_image(image, channels=3, expand_animations=False)

    # Resize to model input size
    image = tf.image.resize(image, IMAGE_SIZE)

    # Normalize to [0, 1]
    image = tf.cast(image, tf.float32) / 255.0

    # Add batch dimension
    image = tf.expand_dims(image, axis=0)

    return image.numpy().astype(np.float32)


def run_inference(
    interpreter: tf.lite.Interpreter, image: np.ndarray
) -> Tuple[np.ndarray, dict]:
    """Run inference on a preprocessed image.

    Args:
        interpreter: TFLite interpreter
        image: Preprocessed image tensor

    Returns:
        Tuple of (output logits, input/output details)
    """
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    # Set input
    interpreter.set_tensor(input_details[0]["index"], image)

    # Run inference
    interpreter.invoke()

    # Get output
    output = interpreter.get_tensor(output_details[0]["index"])
    return output, {"input": input_details[0], "output": output_details[0]}


def format_results(logits: np.ndarray, labels: list[str], min_confidence: float = MIN_CONFIDENCE) -> dict:
    """Format inference results as JSON-serializable dict.

    Args:
        logits: Model output logits from inference
        labels: List of class labels
        min_confidence: Minimum confidence threshold

    Returns:
        Formatted results with category, confidence, and alternatives
    """
    # Convert logits to probabilities (softmax)
    probabilities = tf.nn.softmax(logits[0]).numpy()
    predicted_class = int(np.argmax(probabilities))
    predicted_confidence = float(probabilities[predicted_class])

    # Get top 3 predictions
    top_indices = np.argsort(probabilities)[-3:][::-1]
    top_predictions = [
        {
            "label": labels[idx],
            "confidence": float(probabilities[idx]),
            "percentage": f"{probabilities[idx] * 100:.1f}%",
        }
        for idx in top_indices
    ]

    # Determine if confidence is acceptable
    if predicted_confidence < min_confidence:
        category = "Unknown"
        confidence = 0.0
    else:
        category = labels[predicted_class]
        confidence = predicted_confidence

    return {
        "predicted_category": category,
        "confidence": confidence,
        "confidence_percentage": f"{confidence * 100:.1f}%",
        "top_predictions": top_predictions,
        "accepted": predicted_confidence >= min_confidence,
    }


def main() -> None:
    """Example usage of the complete inference pipeline."""

    print("=" * 60)
    print("EcoSnap Waste Classifier - Inference Example")
    print("=" * 60)

    # Load model and labels
    print("\n1. Loading model and labels...")
    try:
        labels = load_labels(LABELS_PATH)
        interpreter = load_tflite_model(MODEL_PATH)
        print(f"   ✓ Model loaded successfully")
        print(f"   ✓ Supported categories: {', '.join(labels)}")
    except FileNotFoundError as e:
        print(f"   ✗ Error: {e}")
        print("   Please ensure the model has been trained and converted to TFLite format.")
        return

    # Example: process a sample image
    # In a real app, this would be the camera capture or uploaded image
    print("\n2. Preparing image for inference...")
    print("   (Using a sample image path - replace with actual image)")

    sample_image_path = Path("sample_waste.jpg")  # Replace with real image
    if not sample_image_path.exists():
        print(f"   ✗ Sample image not found: {sample_image_path}")
        print("   Creating a dummy image for demonstration...")

        # Create a dummy image for testing
        dummy_image = np.random.randint(0, 256, (224, 224, 3), dtype=np.uint8)
        from PIL import Image

        Image.fromarray(dummy_image).save(sample_image_path)

    # Preprocess image
    print(f"   ✓ Loading image: {sample_image_path}")
    image_tensor = preprocess_image(sample_image_path)
    print(f"   ✓ Image preprocessed: shape {image_tensor.shape}")

    # Run inference
    print("\n3. Running inference...")
    output_logits, details = run_inference(interpreter, image_tensor)
    print(f"   ✓ Inference complete")
    print(f"   ✓ Output shape: {output_logits.shape}")

    # Format and display results
    print("\n4. Results:")
    results = format_results(output_logits, labels)
    print(f"   Predicted Category: {results['predicted_category']}")
    print(f"   Confidence: {results['confidence_percentage']}")
    print(f"   Acceptable: {'Yes' if results['accepted'] else 'No (below threshold)'}")

    print("\n5. Top 3 Predictions:")
    for i, pred in enumerate(results["top_predictions"], 1):
        print(f"   {i}. {pred['label']}: {pred['percentage']}")

    print("\n" + "=" * 60)
    print("Inference Complete!")
    print("=" * 60)

    # Clean up
    if sample_image_path.name == "sample_waste.jpg":
        sample_image_path.unlink()


if __name__ == "__main__":
    main()
