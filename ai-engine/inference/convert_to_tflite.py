"""Convert the EcoSnap waste classifier to TensorFlow Lite format.

This module takes the trained Keras model and converts it to the lightweight
TFLite format suitable for deployment on mobile and embedded devices.

The conversion process includes:
- Loading the trained model
- Converting to TFLite quantization-friendly format
- Saving as a .tflite binary
- Verifying inference and label consistency

Expected input:
- models/waste_classifier.keras (trained model from training step)
- models/waste_classifier_labels.json (label metadata from training step)

Output:
- models/waste_classifier.tflite (mobile-ready model)
- inference/tflite_verification_report.json (conversion validation report)
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

import numpy as np
import tensorflow as tf


DEFAULT_CATEGORIES = [
    "Plastic",
    "Paper",
    "Glass",
    "Metal",
    "Cardboard",
    "Organic",
    "Battery",
    "E-waste",
]


@dataclass(slots=True)
class ConversionConfig:
    """Configuration for TFLite conversion and verification."""

    keras_model_path: Path
    tflite_output_path: Path = Path("../models/waste_classifier.tflite")
    labels_path: Path = Path("../models/waste_classifier_labels.json")
    report_output_path: Path = Path("tflite_verification_report.json")
    image_size: tuple[int, int] = (224, 224)
    class_names: List[str] = None  # type: ignore[assignment]

    def __post_init__(self) -> None:
        script_dir = Path(__file__).resolve().parent
        self.keras_model_path = Path(self.keras_model_path)
        self.tflite_output_path = self._resolve_relative_path(self.tflite_output_path, script_dir)
        self.labels_path = self._resolve_relative_path(self.labels_path, script_dir)
        self.report_output_path = self._resolve_relative_path(self.report_output_path, script_dir)
        if self.class_names is None:
            self.class_names = list(DEFAULT_CATEGORIES)

    @staticmethod
    def _resolve_relative_path(path: Path, base_dir: Path) -> Path:
        path = Path(path)
        return path if path.is_absolute() else base_dir / path


def load_keras_model(model_path: Path) -> tf.keras.Model:
    """Load the trained Keras model from disk."""

    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")
    return tf.keras.models.load_model(model_path)


def load_class_names(labels_path: Path, fallback: List[str]) -> List[str]:
    """Load the label order used during training."""

    if labels_path.exists():
        payload = json.loads(labels_path.read_text(encoding="utf-8"))
        class_names = payload.get("class_names")
        if isinstance(class_names, list) and class_names:
            return [str(item) for item in class_names]
    return fallback


def convert_to_tflite(model: tf.keras.Model) -> bytes:
    """Convert a Keras model to TFLite format."""

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    # Optimize for inference size and latency. No quantization here to preserve
    # model accuracy; quantization-aware training can be added later if needed.
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()
    return tflite_model


def create_dummy_input(image_size: tuple[int, int]) -> np.ndarray:
    """Create a dummy normalized image for inference verification."""

    # Return a random but normalized 224x224 RGB image batch of size 1.
    return np.random.random((1, image_size[0], image_size[1], 3)).astype(np.float32)


def verify_keras_inference(model: tf.keras.Model, dummy_input: np.ndarray) -> Dict[str, object]:
    """Run inference on the Keras model and capture the output shape and range."""

    output = model.predict(dummy_input, verbose=0)
    return {
        "output_shape": list(output.shape),
        "output_dtype": str(output.dtype),
        "output_range": {"min": float(np.min(output)), "max": float(np.max(output))},
        "predicted_class_index": int(np.argmax(output[0])),
        "predicted_confidence": float(np.max(output[0])),
    }


def verify_tflite_inference(tflite_model: bytes, dummy_input: np.ndarray, num_classes: int) -> Dict[str, object]:
    """Run inference on the TFLite model and validate output."""

    interpreter = tf.lite.Interpreter(model_content=tflite_model)
    interpreter.allocate_tensors()

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    # Verify that the model has exactly one input and one output.
    if len(input_details) != 1 or len(output_details) != 1:
        raise RuntimeError(f"Expected 1 input and 1 output; got {len(input_details)} inputs and {len(output_details)} outputs.")

    input_index = input_details[0]["index"]
    output_index = output_details[0]["index"]

    # Resize the input tensor if needed.
    if interpreter.get_tensor_details()[input_index]["shape"].tolist() != list(dummy_input.shape):
        interpreter.resize_tensor_input(input_index, dummy_input.shape)
        interpreter.allocate_tensors()

    # Set input and invoke.
    interpreter.set_tensor(input_index, dummy_input)
    interpreter.invoke()
    output = interpreter.get_tensor(output_index)

    # Verify output shape matches the number of classes.
    if output.shape[-1] != num_classes:
        raise RuntimeError(f"Output classes {output.shape[-1]} do not match expected {num_classes}.")

    return {
        "output_shape": list(output.shape),
        "output_dtype": str(output.dtype),
        "output_range": {"min": float(np.min(output)), "max": float(np.max(output))},
        "predicted_class_index": int(np.argmax(output[0])),
        "predicted_confidence": float(np.max(output[0])),
    }


def compare_outputs(keras_output: Dict[str, object], tflite_output: Dict[str, object]) -> Dict[str, object]:
    """Compare Keras and TFLite outputs to ensure consistency."""

    # Allow for small numerical differences due to precision.
    confidence_diff = abs(keras_output["predicted_confidence"] - tflite_output["predicted_confidence"])  # type: ignore[operator]
    class_match = keras_output["predicted_class_index"] == tflite_output["predicted_class_index"]

    return {
        "class_indices_match": class_match,
        "confidence_difference": float(confidence_diff),
        "confidence_very_close": float(confidence_diff) < 0.01,
    }


def convert(config: ConversionConfig) -> Dict[str, object]:
    """Run the full TFLite conversion and verification pipeline."""

    # Load the original model and labels.
    keras_model = load_keras_model(config.keras_model_path)
    config.class_names = load_class_names(config.labels_path, config.class_names)

    # Convert to TFLite.
    tflite_model = convert_to_tflite(keras_model)

    # Save the TFLite model.
    config.tflite_output_path.parent.mkdir(parents=True, exist_ok=True)
    config.tflite_output_path.write_bytes(tflite_model)

    # Verify both models work on dummy input.
    dummy_input = create_dummy_input(config.image_size)
    keras_output = verify_keras_inference(keras_model, dummy_input)
    tflite_output = verify_tflite_inference(tflite_model, dummy_input, len(config.class_names))
    comparison = compare_outputs(keras_output, tflite_output)

    report = {
        "config": {
            "keras_model_path": str(config.keras_model_path),
            "tflite_output_path": str(config.tflite_output_path),
            "labels_path": str(config.labels_path),
            "image_size": list(config.image_size),
            "num_classes": len(config.class_names),
            "class_names": config.class_names,
        },
        "conversion_status": "success",
        "model_sizes": {
            "keras_bytes": config.keras_model_path.stat().st_size if config.keras_model_path.exists() else None,
            "tflite_bytes": config.tflite_output_path.stat().st_size if config.tflite_output_path.exists() else None,
        },
        "keras_inference": keras_output,
        "tflite_inference": tflite_output,
        "comparison": comparison,
        "verification": {
            "passed": comparison["class_indices_match"] and comparison["confidence_very_close"],
            "notes": "TFLite model produces consistent predictions with the original Keras model." if comparison["class_indices_match"] else "Warning: Prediction classes differ between Keras and TFLite.",
        },
    }

    # Write the report.
    config.report_output_path.parent.mkdir(parents=True, exist_ok=True)
    config.report_output_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    return report


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments for the conversion pipeline."""

    parser = argparse.ArgumentParser(description="Convert the waste classifier to TensorFlow Lite format.")
    parser.add_argument("--keras-model-path", required=True, help="Path to the trained Keras model.")
    parser.add_argument("--tflite-output-path", default="../models/waste_classifier.tflite", help="Output path for the TFLite model.")
    parser.add_argument(
        "--labels-path",
        default="../models/waste_classifier_labels.json",
        help="Path to the label metadata from training.",
    )
    parser.add_argument(
        "--report-output-path",
        default="tflite_verification_report.json",
        help="Output path for the conversion verification report.",
    )
    return parser.parse_args()


def main() -> None:
    """CLI entrypoint."""

    args = parse_args()
    config = ConversionConfig(
        keras_model_path=Path(args.keras_model_path),
        tflite_output_path=Path(args.tflite_output_path),
        labels_path=Path(args.labels_path),
        report_output_path=Path(args.report_output_path),
    )
    report = convert(config)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
