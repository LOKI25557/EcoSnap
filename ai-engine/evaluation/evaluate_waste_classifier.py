"""Evaluate the EcoSnap waste classifier and generate quality reports.

This module loads the trained Keras model produced by the training step,
evaluates it on the prepared test split, and exports:
- a confusion matrix plot
- a classification report JSON file
- precision / recall / F1 / accuracy metrics
- accuracy and loss graphs from training history

The script is intentionally data-agnostic beyond the known split layout so it
can be reused whenever the model is retrained.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Sequence

import matplotlib.pyplot as plt
import numpy as np
import tensorflow as tf
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)


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
class EvaluationConfig:
    """Configuration for model evaluation and report generation."""

    prepared_data_dir: Path
    model_path: Path = Path("../models/waste_classifier.keras")
    labels_path: Path = Path("../models/waste_classifier_labels.json")
    history_path: Path = Path("../training/waste_classifier_history.json")
    output_dir: Path = Path(".")
    image_size: tuple[int, int] = (224, 224)
    batch_size: int = 32
    class_names: List[str] = None  # type: ignore[assignment]

    def __post_init__(self) -> None:
        script_dir = Path(__file__).resolve().parent
        self.prepared_data_dir = Path(self.prepared_data_dir)
        self.model_path = self._resolve_relative_path(self.model_path, script_dir)
        self.labels_path = self._resolve_relative_path(self.labels_path, script_dir)
        self.history_path = self._resolve_relative_path(self.history_path, script_dir)
        self.output_dir = self._resolve_relative_path(self.output_dir, script_dir)
        if self.class_names is None:
            self.class_names = list(DEFAULT_CATEGORIES)

    @staticmethod
    def _resolve_relative_path(path: Path, base_dir: Path) -> Path:
        path = Path(path)
        return path if path.is_absolute() else base_dir / path


def load_class_names(labels_path: Path, fallback: Sequence[str]) -> List[str]:
    """Load the label order used during training."""

    if labels_path.exists():
        payload = json.loads(labels_path.read_text(encoding="utf-8"))
        class_names = payload.get("class_names")
        if isinstance(class_names, list) and class_names:
            return [str(item) for item in class_names]
    return list(fallback)


def build_dataset(directory: Path, config: EvaluationConfig) -> tf.data.Dataset:
    """Build the test dataset from the prepared directory."""

    if not directory.exists():
        raise FileNotFoundError(f"Dataset split not found: {directory}")

    dataset = tf.keras.utils.image_dataset_from_directory(
        directory,
        labels="inferred",
        label_mode="int",
        class_names=config.class_names,
        image_size=config.image_size,
        batch_size=config.batch_size,
        shuffle=False,
    )
    dataset = dataset.cache().prefetch(tf.data.AUTOTUNE)
    return dataset


def load_model(model_path: Path) -> tf.keras.Model:
    """Load the trained Keras model from disk."""

    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")
    return tf.keras.models.load_model(model_path)


def collect_predictions(model: tf.keras.Model, dataset: tf.data.Dataset) -> Dict[str, np.ndarray]:
    """Collect ground-truth labels, predicted labels, and confidence scores."""

    y_true: List[int] = []
    y_pred: List[int] = []
    y_confidence: List[float] = []

    for images, labels in dataset:
        probabilities = model.predict(images, verbose=0)
        predicted_labels = np.argmax(probabilities, axis=1)
        predicted_confidence = np.max(probabilities, axis=1)

        y_true.extend(labels.numpy().astype(int).tolist())
        y_pred.extend(predicted_labels.astype(int).tolist())
        y_confidence.extend(predicted_confidence.astype(float).tolist())

    return {
        "y_true": np.asarray(y_true, dtype=np.int32),
        "y_pred": np.asarray(y_pred, dtype=np.int32),
        "y_confidence": np.asarray(y_confidence, dtype=np.float32),
    }


def evaluate_predictions(y_true: np.ndarray, y_pred: np.ndarray, class_names: Sequence[str]) -> Dict[str, object]:
    """Compute evaluation metrics and a classification report."""

    report = classification_report(
        y_true,
        y_pred,
        target_names=list(class_names),
        output_dict=True,
        zero_division=0,
    )
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision_macro": float(precision_score(y_true, y_pred, average="macro", zero_division=0)),
        "recall_macro": float(recall_score(y_true, y_pred, average="macro", zero_division=0)),
        "f1_macro": float(f1_score(y_true, y_pred, average="macro", zero_division=0)),
        "classification_report": report,
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
    }


def save_confusion_matrix(confusion: Sequence[Sequence[int]], class_names: Sequence[str], output_path: Path) -> None:
    """Render and save a labeled confusion matrix heatmap."""

    matrix = np.asarray(confusion)
    fig, ax = plt.subplots(figsize=(10, 8))
    im = ax.imshow(matrix, interpolation="nearest", cmap=plt.cm.Blues)
    ax.figure.colorbar(im, ax=ax)
    ax.set(
        xticks=np.arange(len(class_names)),
        yticks=np.arange(len(class_names)),
        xticklabels=class_names,
        yticklabels=class_names,
        ylabel="True label",
        xlabel="Predicted label",
        title="Waste Classifier Confusion Matrix",
    )
    plt.setp(ax.get_xticklabels(), rotation=45, ha="right", rotation_mode="anchor")

    threshold = matrix.max() / 2.0 if matrix.size else 0
    for row_index in range(matrix.shape[0]):
        for col_index in range(matrix.shape[1]):
            ax.text(
                col_index,
                row_index,
                format(matrix[row_index, col_index], "d"),
                ha="center",
                va="center",
                color="white" if matrix[row_index, col_index] > threshold else "black",
            )

    fig.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=200, bbox_inches="tight")
    plt.close(fig)


def save_history_graphs(history_path: Path, output_dir: Path) -> Dict[str, str]:
    """Save accuracy and loss graphs if training history is available."""

    if not history_path.exists():
        return {}

    payload = json.loads(history_path.read_text(encoding="utf-8"))
    stages = payload.get("stages", {})

    # Prefer the fine-tuning stage if present, otherwise use the first stage.
    history = stages.get("fine_tuning") or stages.get("feature_extraction")
    if not isinstance(history, dict):
        return {}

    output_dir.mkdir(parents=True, exist_ok=True)
    saved_paths: Dict[str, str] = {}

    if "accuracy" in history or "val_accuracy" in history:
        fig, ax = plt.subplots(figsize=(8, 5))
        if "accuracy" in history:
            ax.plot(history["accuracy"], label="train_accuracy")
        if "val_accuracy" in history:
            ax.plot(history["val_accuracy"], label="val_accuracy")
        ax.set_title("Training and Validation Accuracy")
        ax.set_xlabel("Epoch")
        ax.set_ylabel("Accuracy")
        ax.legend()
        accuracy_path = output_dir / "accuracy_graph.png"
        fig.savefig(accuracy_path, dpi=200, bbox_inches="tight")
        plt.close(fig)
        saved_paths["accuracy_graph"] = str(accuracy_path)

    if "loss" in history or "val_loss" in history:
        fig, ax = plt.subplots(figsize=(8, 5))
        if "loss" in history:
            ax.plot(history["loss"], label="train_loss")
        if "val_loss" in history:
            ax.plot(history["val_loss"], label="val_loss")
        ax.set_title("Training and Validation Loss")
        ax.set_xlabel("Epoch")
        ax.set_ylabel("Loss")
        ax.legend()
        loss_path = output_dir / "loss_graph.png"
        fig.savefig(loss_path, dpi=200, bbox_inches="tight")
        plt.close(fig)
        saved_paths["loss_graph"] = str(loss_path)

    return saved_paths


def evaluate(config: EvaluationConfig) -> Dict[str, object]:
    """Run the full evaluation pipeline and write reports to disk."""

    config.output_dir.mkdir(parents=True, exist_ok=True)
    config.class_names = load_class_names(config.labels_path, config.class_names)

    test_dir = config.prepared_data_dir / "test"
    dataset = build_dataset(test_dir, config)
    model = load_model(config.model_path)

    predictions = collect_predictions(model, dataset)
    metrics = evaluate_predictions(predictions["y_true"], predictions["y_pred"], config.class_names)

    confusion_path = config.output_dir / "confusion_matrix.png"
    save_confusion_matrix(metrics["confusion_matrix"], config.class_names, confusion_path)
    graph_paths = save_history_graphs(config.history_path, config.output_dir)

    report = {
        "config": {
            "prepared_data_dir": str(config.prepared_data_dir),
            "model_path": str(config.model_path),
            "labels_path": str(config.labels_path),
            "history_path": str(config.history_path),
            "output_dir": str(config.output_dir),
            "image_size": list(config.image_size),
            "batch_size": config.batch_size,
            "class_names": config.class_names,
        },
        "metrics": {
            "accuracy": metrics["accuracy"],
            "precision_macro": metrics["precision_macro"],
            "recall_macro": metrics["recall_macro"],
            "f1_macro": metrics["f1_macro"],
        },
        "classification_report": metrics["classification_report"],
        "confusion_matrix": metrics["confusion_matrix"],
        "artifacts": {
            "confusion_matrix": str(confusion_path),
            **graph_paths,
        },
    }

    report_path = config.output_dir / "waste_classifier_evaluation.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments for the evaluation pipeline."""

    parser = argparse.ArgumentParser(description="Evaluate the EcoSnap waste classifier.")
    parser.add_argument("--prepared-data-dir", required=True, help="Path to the prepared dataset splits.")
    parser.add_argument("--model-path", default="../models/waste_classifier.keras", help="Path to the trained model.")
    parser.add_argument(
        "--labels-path",
        default="../models/waste_classifier_labels.json",
        help="Path to the label metadata saved during training.",
    )
    parser.add_argument(
        "--history-path",
        default="../training/waste_classifier_history.json",
        help="Path to the JSON training history file.",
    )
    parser.add_argument("--output-dir", default=".", help="Directory where evaluation artifacts are stored.")
    parser.add_argument("--batch-size", type=int, default=32, help="Evaluation batch size.")
    return parser.parse_args()


def main() -> None:
    """CLI entrypoint."""

    args = parse_args()
    config = EvaluationConfig(
        prepared_data_dir=Path(args.prepared_data_dir),
        model_path=Path(args.model_path),
        labels_path=Path(args.labels_path),
        history_path=Path(args.history_path),
        output_dir=Path(args.output_dir),
        batch_size=args.batch_size,
    )
    report = evaluate(config)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
