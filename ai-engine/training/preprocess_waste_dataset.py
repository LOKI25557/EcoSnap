"""Waste dataset preprocessing utilities for EcoSnap & Segregate.

This module prepares an image classification dataset for the supported waste
categories using TensorFlow only.

Responsibilities:
- Discover image files from a category-based directory layout.
- Remove corrupted images by validating decodeability before use.
- Split the dataset into train/validation/test partitions in a stratified way.
- Resize images to 224x224.
- Normalize images into the [0, 1] range for model consumption.
- Apply lightweight augmentation to the training split.
- Export a reproducible manifest and a cleaned, resized copy of the dataset.

Expected input layout:
    source_dir/
        Plastic/
        Paper/
        Glass/
        Metal/
        Cardboard/
        Organic/
        Battery/
        E-waste/

The module can be used as a CLI or imported from later training scripts.
"""

from __future__ import annotations

import argparse
import json
import random
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Sequence, Tuple

import tensorflow as tf

SUPPORTED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".gif", ".webp"}
DEFAULT_IMAGE_SIZE = (224, 224)
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
class PreprocessingConfig:
    """Configuration for dataset preprocessing.

    The split ratios are applied per class so the final dataset remains as
    balanced as possible across train, validation, and test partitions.
    """

    source_dir: Path
    output_dir: Path
    image_size: Tuple[int, int] = DEFAULT_IMAGE_SIZE
    validation_split: float = 0.15
    test_split: float = 0.15
    seed: int = 42
    batch_size: int = 32
    augment: bool = True
    categories: List[str] = field(default_factory=lambda: list(DEFAULT_CATEGORIES))

    def __post_init__(self) -> None:
        if self.validation_split < 0 or self.test_split < 0:
            raise ValueError("validation_split and test_split must be non-negative.")
        if self.validation_split + self.test_split >= 1.0:
            raise ValueError("validation_split + test_split must be less than 1.0.")
        if self.batch_size <= 0:
            raise ValueError("batch_size must be greater than zero.")
        self.source_dir = Path(self.source_dir)
        self.output_dir = Path(self.output_dir)


class WasteDatasetPreprocessor:
    """End-to-end preprocessing pipeline for waste image datasets."""

    def __init__(self, config: PreprocessingConfig) -> None:
        self.config = config
        self._rng = random.Random(config.seed)
        self._augmentation_layer = self._build_augmentation_layer()

    def run(self) -> Dict[str, object]:
        """Execute the preprocessing flow and persist the cleaned dataset.

        Returns:
            A structured summary containing split counts, invalid files, and
            output paths that can be consumed by downstream training jobs.
        """

        discovered = self._discover_dataset()
        split_data = self._split_dataset(discovered)
        self._export_cleaned_dataset(split_data)
        report = self._build_report(discovered, split_data)
        self._write_report(report)
        return report

    def build_tf_datasets(self) -> Dict[str, tf.data.Dataset]:
        """Create tf.data datasets for training, validation, and testing.

        The datasets are normalized, batched, and prefetched. Augmentation is
        only applied to the training split.
        """

        discovered = self._discover_dataset()
        split_data = self._split_dataset(discovered)

        datasets: Dict[str, tf.data.Dataset] = {}
        for split_name, records in split_data["splits"].items():
            dataset = self._build_dataset_from_records(
                records=records,
                training=split_name == "train",
            )
            datasets[split_name] = dataset
        return datasets

    def _discover_dataset(self) -> Dict[str, object]:
        """Collect valid image files per category and reject corrupted files."""

        category_records: Dict[str, List[str]] = {category: [] for category in self.config.categories}
        invalid_files: List[str] = []
        missing_categories: List[str] = []

        for category in self.config.categories:
            category_dir = self.config.source_dir / category
            if not category_dir.exists():
                missing_categories.append(category)
                continue

            image_paths = sorted(
                path for path in category_dir.rglob("*") if path.is_file() and path.suffix.lower() in SUPPORTED_IMAGE_EXTENSIONS
            )
            for image_path in image_paths:
                if self._is_valid_image(image_path):
                    category_records[category].append(str(image_path))
                else:
                    invalid_files.append(str(image_path))

        return {
            "category_records": category_records,
            "invalid_files": invalid_files,
            "missing_categories": missing_categories,
        }

    def _split_dataset(self, discovered: Dict[str, object]) -> Dict[str, object]:
        """Create train/validation/test splits on a per-category basis."""

        category_records = discovered["category_records"]
        splits = {"train": [], "validation": [], "test": []}
        label_to_index = {category: index for index, category in enumerate(self.config.categories)}

        for category, paths in category_records.items():
            shuffled_paths = list(paths)
            self._rng.shuffle(shuffled_paths)

            total_count = len(shuffled_paths)
            if total_count == 0:
                continue

            validation_count, test_count, train_count = self._compute_split_sizes(total_count)
            train_paths = shuffled_paths[:train_count]
            validation_paths = shuffled_paths[train_count:train_count + validation_count]
            test_paths = shuffled_paths[train_count + validation_count:]

            splits["train"].extend(self._build_records(train_paths, label_to_index[category], category))
            splits["validation"].extend(self._build_records(validation_paths, label_to_index[category], category))
            splits["test"].extend(self._build_records(test_paths, label_to_index[category], category))

        for split_name in splits:
            self._rng.shuffle(splits[split_name])

        return {
            "splits": splits,
            "label_to_index": label_to_index,
            "index_to_label": {index: category for category, index in label_to_index.items()},
        }

    def _build_records(self, paths: Sequence[str], label_index: int, category: str) -> List[Dict[str, object]]:
        return [
            {
                "path": path,
                "label_index": label_index,
                "label_name": category,
            }
            for path in paths
        ]

    def _compute_split_sizes(self, total_count: int) -> Tuple[int, int, int]:
        """Compute validation, test, and train counts for one category."""

        validation_count = int(round(total_count * self.config.validation_split))
        test_count = int(round(total_count * self.config.test_split))

        # Keep at least one sample in training whenever possible.
        if total_count > 2 and validation_count + test_count >= total_count:
            overflow = validation_count + test_count - (total_count - 1)
            while overflow > 0 and validation_count > 0:
                validation_count -= 1
                overflow -= 1
            while overflow > 0 and test_count > 0:
                test_count -= 1
                overflow -= 1

        train_count = total_count - validation_count - test_count
        if train_count <= 0:
            train_count = 1
            if validation_count > test_count and validation_count > 0:
                validation_count -= 1
            elif test_count > 0:
                test_count -= 1

        return validation_count, test_count, train_count

    def _export_cleaned_dataset(self, split_data: Dict[str, object]) -> None:
        """Write cleaned, resized images to the output directory."""

        output_root = self.config.output_dir
        output_root.mkdir(parents=True, exist_ok=True)

        for split_name, records in split_data["splits"].items():
            for record in records:
                source_path = Path(record["path"])
                category = record["label_name"]
                destination_dir = output_root / split_name / category
                destination_dir.mkdir(parents=True, exist_ok=True)
                destination_path = destination_dir / source_path.name
                self._save_resized_image(source_path, destination_path)

    def _build_report(self, discovered: Dict[str, object], split_data: Dict[str, object]) -> Dict[str, object]:
        """Create a JSON-serializable preprocessing summary."""

        category_counts = {
            category: len(paths)
            for category, paths in discovered["category_records"].items()
        }
        split_counts = {
            split_name: len(records)
            for split_name, records in split_data["splits"].items()
        }
        return {
            "config": {
                "source_dir": str(self.config.source_dir),
                "output_dir": str(self.config.output_dir),
                "image_size": list(self.config.image_size),
                "validation_split": self.config.validation_split,
                "test_split": self.config.test_split,
                "seed": self.config.seed,
                "batch_size": self.config.batch_size,
                "augment": self.config.augment,
                "categories": self.config.categories,
            },
            "category_counts": category_counts,
            "split_counts": split_counts,
            "invalid_files": discovered["invalid_files"],
            "missing_categories": discovered["missing_categories"],
            "label_to_index": split_data["label_to_index"],
            "index_to_label": split_data["index_to_label"],
            "output_layout": {
                "train": str(self.config.output_dir / "train"),
                "validation": str(self.config.output_dir / "validation"),
                "test": str(self.config.output_dir / "test"),
            },
        }

    def _write_report(self, report: Dict[str, object]) -> None:
        report_path = self.config.output_dir / "preprocessing_report.json"
        report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    def _build_dataset_from_records(self, records: Sequence[Dict[str, object]], training: bool) -> tf.data.Dataset:
        """Build a normalized tf.data pipeline from split records."""

        if not records:
            empty_images = tf.zeros((0, self.config.image_size[0], self.config.image_size[1], 3), dtype=tf.float32)
            empty_labels = tf.zeros((0,), dtype=tf.int32)
            return tf.data.Dataset.from_tensor_slices((empty_images, empty_labels))

        paths = [record["path"] for record in records]
        labels = [int(record["label_index"]) for record in records]

        dataset = tf.data.Dataset.from_tensor_slices((paths, labels))
        if training:
            dataset = dataset.shuffle(buffer_size=len(records), seed=self.config.seed, reshuffle_each_iteration=True)

        dataset = dataset.map(self._load_and_preprocess_image, num_parallel_calls=tf.data.AUTOTUNE)

        if training and self.config.augment:
            dataset = dataset.map(self._apply_augmentation, num_parallel_calls=tf.data.AUTOTUNE)

        dataset = dataset.batch(self.config.batch_size).prefetch(tf.data.AUTOTUNE)
        return dataset

    def _load_and_preprocess_image(self, path: tf.Tensor, label: tf.Tensor) -> Tuple[tf.Tensor, tf.Tensor]:
        """Load, decode, resize, and normalize a single image."""

        image_bytes = tf.io.read_file(path)
        image = tf.image.decode_image(image_bytes, channels=3, expand_animations=False)
        image = tf.image.resize(image, self.config.image_size, method=tf.image.ResizeMethod.BILINEAR)
        image = tf.cast(image, tf.float32) / 255.0
        image.set_shape([self.config.image_size[0], self.config.image_size[1], 3])
        return image, label

    def _apply_augmentation(self, image: tf.Tensor, label: tf.Tensor) -> Tuple[tf.Tensor, tf.Tensor]:
        """Apply augmentation only during training."""

        augmented = self._augmentation_layer(image, training=True)
        return augmented, label

    def _build_augmentation_layer(self) -> tf.keras.Sequential:
        """Construct a lightweight, image-safe augmentation pipeline."""

        if not self.config.augment:
            return tf.keras.Sequential(name="no_augmentation")

        return tf.keras.Sequential(
            [
                tf.keras.layers.RandomFlip("horizontal"),
                tf.keras.layers.RandomRotation(0.08),
                tf.keras.layers.RandomZoom(0.1),
                tf.keras.layers.RandomContrast(0.1),
            ],
            name="waste_augmentation",
        )

    def _save_resized_image(self, source_path: Path, destination_path: Path) -> None:
        """Persist a resized JPEG copy of the input image."""

        image_bytes = tf.io.read_file(str(source_path))
        image = tf.image.decode_image(image_bytes, channels=3, expand_animations=False)
        image = tf.image.resize(image, self.config.image_size, method=tf.image.ResizeMethod.BILINEAR)
        image = tf.cast(tf.clip_by_value(image, 0.0, 255.0), tf.uint8)
        encoded = tf.io.encode_jpeg(image, quality=95)
        tf.io.write_file(str(destination_path), encoded)

    def _is_valid_image(self, image_path: Path) -> bool:
        """Return True only if TensorFlow can decode the image successfully."""

        try:
            image_bytes = tf.io.read_file(str(image_path))
            image = tf.image.decode_image(image_bytes, channels=3, expand_animations=False)
            _ = tf.shape(image)
            return True
        except Exception:
            return False


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments for the preprocessing pipeline."""

    parser = argparse.ArgumentParser(description="Prepare the EcoSnap waste image dataset.")
    parser.add_argument("--source-dir", required=True, help="Path to the raw, category-organized dataset.")
    parser.add_argument(
        "--output-dir",
        required=True,
        help="Directory where cleaned splits, resized images, and reports will be written.",
    )
    parser.add_argument("--validation-split", type=float, default=0.15, help="Validation split ratio per category.")
    parser.add_argument("--test-split", type=float, default=0.15, help="Test split ratio per category.")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size for downstream tf.data pipelines.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed used for shuffling and splitting.")
    parser.add_argument("--no-augment", action="store_true", help="Disable training augmentation.")
    return parser.parse_args()


def main() -> None:
    """CLI entrypoint."""

    args = parse_args()
    config = PreprocessingConfig(
        source_dir=Path(args.source_dir),
        output_dir=Path(args.output_dir),
        validation_split=args.validation_split,
        test_split=args.test_split,
        batch_size=args.batch_size,
        seed=args.seed,
        augment=not args.no_augment,
    )
    preprocessor = WasteDatasetPreprocessor(config)
    report = preprocessor.run()
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
