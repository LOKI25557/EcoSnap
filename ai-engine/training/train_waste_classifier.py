"""Train the EcoSnap waste classifier with MobileNetV2 transfer learning.

This script consumes the cleaned directory structure produced by the dataset
preprocessing step and trains a reusable image classifier for the supported
waste categories.

Expected input layout:
    prepared_data_dir/
        train/
            Plastic/
            Paper/
            ...
        validation/
            Plastic/
            Paper/
            ...
        test/
            Plastic/
            Paper/
            ...

Artifacts written by this script:
- models/waste_classifier.keras
- models/waste_classifier_labels.json
- training/waste_classifier_history.json

The model is trained in two stages:
1. Feature extraction with the MobileNetV2 backbone frozen.
2. Fine-tuning of the top backbone layers with a reduced learning rate.
"""

from __future__ import annotations

import argparse
import json
import os
import random
from dataclasses import dataclass, field, asdict
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
class TrainingConfig:
    """Training configuration for the waste classifier."""

    prepared_data_dir: Path
    model_output_path: Path = Path("../models/waste_classifier.keras")
    labels_output_path: Path = Path("../models/waste_classifier_labels.json")
    history_output_path: Path = Path("waste_classifier_history.json")
    image_size: tuple[int, int] = (224, 224)
    batch_size: int = 32
    epochs: int = 20
    fine_tune_epochs: int = 10
    initial_learning_rate: float = 1e-3
    fine_tune_learning_rate: float = 1e-5
    dropout_rate: float = 0.25
    fine_tune_at: int = 100
    seed: int = 42
    class_names: List[str] = field(default_factory=lambda: list(DEFAULT_CATEGORIES))

    def __post_init__(self) -> None:
        script_dir = Path(__file__).resolve().parent
        self.prepared_data_dir = Path(self.prepared_data_dir)
        self.model_output_path = self._resolve_relative_path(self.model_output_path, script_dir)
        self.labels_output_path = self._resolve_relative_path(self.labels_output_path, script_dir)
        self.history_output_path = self._resolve_relative_path(self.history_output_path, script_dir)

        if self.batch_size <= 0:
            raise ValueError("batch_size must be greater than zero.")
        if self.epochs <= 0:
            raise ValueError("epochs must be greater than zero.")
        if self.fine_tune_epochs < 0:
            raise ValueError("fine_tune_epochs cannot be negative.")
        if self.fine_tune_at < 0:
            raise ValueError("fine_tune_at cannot be negative.")

    @staticmethod
    def _resolve_relative_path(path: Path, base_dir: Path) -> Path:
        """Resolve artifact paths relative to the training script directory."""

        path = Path(path)
        return path if path.is_absolute() else (base_dir / path)


def set_global_seed(seed: int) -> None:
    """Make training as deterministic as the platform allows."""

    random.seed(seed)
    np.random.seed(seed)
    tf.keras.utils.set_random_seed(seed)
    os.environ["PYTHONHASHSEED"] = str(seed)


def build_dataset(directory: Path, config: TrainingConfig, training: bool) -> tf.data.Dataset:
    """Create a batched tf.data pipeline from a split directory."""

    if not directory.exists():
        raise FileNotFoundError(f"Dataset split not found: {directory}")

    dataset = tf.keras.utils.image_dataset_from_directory(
        directory,
        labels="inferred",
        label_mode="int",
        class_names=config.class_names,
        image_size=config.image_size,
        batch_size=config.batch_size,
        shuffle=training,
        seed=config.seed,
    )

    # Cache keeps the training loop fast after the first epoch and prefetch
    # overlaps preprocessing with model execution.
    options = tf.data.Options()
    options.experimental_deterministic = not training
    dataset = dataset.with_options(options)
    dataset = dataset.cache().prefetch(tf.data.AUTOTUNE)
    return dataset


def build_augmentation_layer() -> tf.keras.Sequential:
    """Create a lightweight augmentation block for the training graph."""

    return tf.keras.Sequential(
        [
            tf.keras.layers.RandomFlip("horizontal"),
            tf.keras.layers.RandomRotation(0.08),
            tf.keras.layers.RandomZoom(0.1),
            tf.keras.layers.RandomContrast(0.1),
        ],
        name="augmentation",
    )


def build_model(config: TrainingConfig, num_classes: int) -> tf.keras.Model:
    """Create a MobileNetV2 transfer-learning classifier."""

    inputs = tf.keras.layers.Input(shape=(*config.image_size, 3), name="image")
    x = tf.keras.layers.Rescaling(1.0 / 255.0, name="rescaling")(inputs)
    x = build_augmentation_layer()(x)

    base_model = tf.keras.applications.MobileNetV2(
        include_top=False,
        weights="imagenet",
        input_shape=(*config.image_size, 3),
        name="mobilenetv2_backbone",
    )
    base_model.trainable = False

    x = base_model(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D(name="global_average_pooling")(x)
    x = tf.keras.layers.Dropout(config.dropout_rate, name="dropout")(x)
    outputs = tf.keras.layers.Dense(num_classes, activation="softmax", name="classifier")(x)

    model = tf.keras.Model(inputs=inputs, outputs=outputs, name="waste_classifier")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=config.initial_learning_rate),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def unfreeze_top_layers(model: tf.keras.Model, fine_tune_at: int) -> None:
    """Unfreeze the top MobileNetV2 layers for a controlled fine-tuning phase."""

    base_model = next(
        layer for layer in model.layers if isinstance(layer, tf.keras.Model) and layer.name == "mobilenetv2_backbone"
    )
    base_model.trainable = True
    for layer in base_model.layers[:fine_tune_at]:
        layer.trainable = False


def create_callbacks(config: TrainingConfig) -> List[tf.keras.callbacks.Callback]:
    """Build the callbacks required by the training specification."""

    config.model_output_path.parent.mkdir(parents=True, exist_ok=True)
    return [
        tf.keras.callbacks.ModelCheckpoint(
            filepath=str(config.model_output_path),
            monitor="val_accuracy",
            mode="max",
            save_best_only=True,
            save_weights_only=False,
            verbose=1,
        ),
        tf.keras.callbacks.EarlyStopping(
            monitor="val_accuracy",
            mode="max",
            patience=5,
            restore_best_weights=True,
            verbose=1,
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.2,
            patience=3,
            min_lr=1e-7,
            verbose=1,
        ),
    ]


def train(config: TrainingConfig) -> Dict[str, object]:
    """Run the full training pipeline and persist training artifacts."""

    set_global_seed(config.seed)

    train_dir = config.prepared_data_dir / "train"
    validation_dir = config.prepared_data_dir / "validation"
    test_dir = config.prepared_data_dir / "test"

    train_dataset = build_dataset(train_dir, config, training=True)
    validation_dataset = build_dataset(validation_dir, config, training=False)
    test_dataset = build_dataset(test_dir, config, training=False)

    model = build_model(config, num_classes=len(config.class_names))
    callbacks = create_callbacks(config)

    history_log: Dict[str, object] = {
        "config": {
            **asdict(config),
            "prepared_data_dir": str(config.prepared_data_dir),
            "model_output_path": str(config.model_output_path),
            "labels_output_path": str(config.labels_output_path),
            "history_output_path": str(config.history_output_path),
        },
        "stages": {},
    }

    # Stage 1: train only the new classification head.
    initial_history = model.fit(
        train_dataset,
        validation_data=validation_dataset,
        epochs=config.epochs,
        callbacks=callbacks,
        verbose=1,
    )
    history_log["stages"]["feature_extraction"] = initial_history.history

    # Stage 2: fine-tune the top of the backbone using a smaller learning rate.
    unfreeze_top_layers(model, config.fine_tune_at)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=config.fine_tune_learning_rate),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    fine_tune_history = model.fit(
        train_dataset,
        validation_data=validation_dataset,
        epochs=config.epochs + config.fine_tune_epochs,
        initial_epoch=initial_history.epoch[-1] + 1 if initial_history.epoch else 0,
        callbacks=callbacks,
        verbose=1,
    )
    history_log["stages"]["fine_tuning"] = fine_tune_history.history

    # Re-save the best checkpoint explicitly so the final artifact is always present.
    config.model_output_path.parent.mkdir(parents=True, exist_ok=True)
    model.save(config.model_output_path)

    test_loss, test_accuracy = model.evaluate(test_dataset, verbose=1)
    history_log["test_metrics"] = {
        "loss": float(test_loss),
        "accuracy": float(test_accuracy),
    }

    write_history(history_log, config)
    write_labels(config)

    return history_log


def write_history(history_log: Dict[str, object], config: TrainingConfig) -> None:
    """Persist the training history and metrics as JSON."""

    history_path = config.history_output_path
    if not history_path.is_absolute():
        history_path = Path(__file__).resolve().parent / history_path
    history_path.parent.mkdir(parents=True, exist_ok=True)
    history_path.write_text(json.dumps(history_log, indent=2), encoding="utf-8")


def write_labels(config: TrainingConfig) -> None:
    """Persist the label order used during training for inference consumers."""

    labels_payload = {
        "class_names": config.class_names,
        "label_to_index": {label: index for index, label in enumerate(config.class_names)},
    }
    labels_path = config.labels_output_path
    if not labels_path.is_absolute():
        labels_path = Path(__file__).resolve().parent / labels_path
    labels_path.parent.mkdir(parents=True, exist_ok=True)
    labels_path.write_text(json.dumps(labels_payload, indent=2), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments for the training pipeline."""

    parser = argparse.ArgumentParser(description="Train the EcoSnap waste classifier.")
    parser.add_argument("--prepared-data-dir", required=True, help="Path to the cleaned dataset splits.")
    parser.add_argument("--model-output-path", default="../models/waste_classifier.keras", help="Model output path.")
    parser.add_argument(
        "--labels-output-path",
        default="../models/waste_classifier_labels.json",
        help="JSON file storing the class order used during training.",
    )
    parser.add_argument(
        "--history-output-path",
        default="waste_classifier_history.json",
        help="JSON file storing the training history.",
    )
    parser.add_argument("--batch-size", type=int, default=32, help="Training batch size.")
    parser.add_argument("--epochs", type=int, default=20, help="Feature-extraction epochs.")
    parser.add_argument("--fine-tune-epochs", type=int, default=10, help="Fine-tuning epochs.")
    parser.add_argument("--initial-learning-rate", type=float, default=1e-3, help="Initial learning rate.")
    parser.add_argument("--fine-tune-learning-rate", type=float, default=1e-5, help="Fine-tuning learning rate.")
    parser.add_argument("--dropout-rate", type=float, default=0.25, help="Dropout rate for the classifier head.")
    parser.add_argument("--fine-tune-at", type=int, default=100, help="Number of backbone layers to freeze.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    return parser.parse_args()


def main() -> None:
    """CLI entrypoint."""

    args = parse_args()
    config = TrainingConfig(
        prepared_data_dir=Path(args.prepared_data_dir),
        model_output_path=Path(args.model_output_path),
        labels_output_path=Path(args.labels_output_path),
        history_output_path=Path(args.history_output_path),
        batch_size=args.batch_size,
        epochs=args.epochs,
        fine_tune_epochs=args.fine_tune_epochs,
        initial_learning_rate=args.initial_learning_rate,
        fine_tune_learning_rate=args.fine_tune_learning_rate,
        dropout_rate=args.dropout_rate,
        fine_tune_at=args.fine_tune_at,
        seed=args.seed,
    )
    history = train(config)
    print(json.dumps(history, indent=2))


if __name__ == "__main__":
    main()