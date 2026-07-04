"""Unit tests for the waste dataset preprocessing pipeline.

This module provides test cases for the preprocessing utilities to ensure
that dataset discovery, splitting, normalization, and augmentation work correctly.
"""

import tempfile
import unittest
from pathlib import Path
from typing import Tuple

import numpy as np
from PIL import Image

from preprocess_waste_dataset import (
    PreprocessingConfig,
    SUPPORTED_IMAGE_EXTENSIONS,
    WasteDatasetPreprocessor,
)


class TestPreprocessingConfig(unittest.TestCase):
    """Test configuration validation."""

    def test_invalid_split_ratios(self) -> None:
        """Test that invalid split ratios raise errors."""
        with self.assertRaises(ValueError):
            PreprocessingConfig(
                source_dir=Path("/tmp/source"),
                output_dir=Path("/tmp/output"),
                validation_split=-0.1,
                test_split=0.15,
            )

        with self.assertRaises(ValueError):
            PreprocessingConfig(
                source_dir=Path("/tmp/source"),
                output_dir=Path("/tmp/output"),
                validation_split=0.5,
                test_split=0.6,  # Sum > 1.0
            )

    def test_valid_config(self) -> None:
        """Test that valid configuration is accepted."""
        config = PreprocessingConfig(
            source_dir=Path("/tmp/source"),
            output_dir=Path("/tmp/output"),
            validation_split=0.15,
            test_split=0.15,
        )
        self.assertEqual(config.validation_split, 0.15)
        self.assertEqual(config.test_split, 0.15)


class TestDatasetPreprocessor(unittest.TestCase):
    """Test dataset preprocessing functionality."""

    def setUp(self) -> None:
        """Create temporary directories and test images."""
        self.temp_dir = tempfile.TemporaryDirectory()
        self.source_dir = Path(self.temp_dir.name) / "source"
        self.output_dir = Path(self.temp_dir.name) / "output"
        self._create_test_dataset()

    def tearDown(self) -> None:
        """Clean up temporary directories."""
        self.temp_dir.cleanup()

    def _create_test_dataset(self) -> None:
        """Create a small test dataset with images."""
        self.source_dir.mkdir(parents=True, exist_ok=True)

        categories = ["Plastic", "Paper"]
        for category in categories:
            cat_dir = self.source_dir / category
            cat_dir.mkdir(parents=True, exist_ok=True)

            # Create 10 test images per category
            for i in range(10):
                img_path = cat_dir / f"test_{i}.jpg"
                # Create a simple 224x224 RGB image
                img = Image.new("RGB", (224, 224), color=(i * 25, i * 25, i * 25))
                img.save(img_path, "JPEG")

    def test_dataset_discovery(self) -> None:
        """Test that the preprocessor discovers images correctly."""
        config = PreprocessingConfig(
            source_dir=self.source_dir,
            output_dir=self.output_dir,
        )
        preprocessor = WasteDatasetPreprocessor(config)
        discovered = preprocessor._discover_dataset()

        self.assertEqual(len(discovered["category_records"]["Plastic"]), 10)
        self.assertEqual(len(discovered["category_records"]["Paper"]), 10)
        self.assertEqual(len(discovered["invalid_files"]), 0)

    def test_dataset_splitting(self) -> None:
        """Test that the preprocessor splits data correctly."""
        config = PreprocessingConfig(
            source_dir=self.source_dir,
            output_dir=self.output_dir,
            validation_split=0.2,
            test_split=0.2,
        )
        preprocessor = WasteDatasetPreprocessor(config)
        discovered = preprocessor._discover_dataset()
        split_data = preprocessor._split_dataset(discovered)

        # Check split counts
        total_items = sum(len(records) for records in split_data["splits"].values())
        self.assertEqual(total_items, 20)  # 10 + 10 items

        # Roughly verify split ratios
        train_count = len(split_data["splits"]["train"])
        val_count = len(split_data["splits"]["validation"])
        test_count = len(split_data["splits"]["test"])

        self.assertGreater(train_count, 0)
        self.assertGreater(val_count, 0)
        self.assertGreater(test_count, 0)

    def test_split_sizes_computation(self) -> None:
        """Test the split size computation for edge cases."""
        config = PreprocessingConfig(
            source_dir=Path("/tmp"),
            output_dir=Path("/tmp"),
            validation_split=0.5,
            test_split=0.5,
        )
        preprocessor = WasteDatasetPreprocessor(config)

        # Test with small number of items
        val, test, train = preprocessor._compute_split_sizes(2)
        self.assertGreaterEqual(train, 1)
        self.assertEqual(val + test + train, 2)

        # Test with zero items
        val, test, train = preprocessor._compute_split_sizes(0)
        self.assertEqual(val + test + train, 0)


class TestImageValidation(unittest.TestCase):
    """Test image corruption detection."""

    def setUp(self) -> None:
        """Create temporary directory for test images."""
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_path = Path(self.temp_dir.name)

    def tearDown(self) -> None:
        """Clean up."""
        self.temp_dir.cleanup()

    def test_valid_image_detection(self) -> None:
        """Test that valid images are recognized."""
        config = PreprocessingConfig(
            source_dir=self.temp_path,
            output_dir=self.temp_path,
        )
        preprocessor = WasteDatasetPreprocessor(config)

        # Create a valid image
        img_path = self.temp_path / "test.jpg"
        img = Image.new("RGB", (224, 224))
        img.save(img_path, "JPEG")

        self.assertTrue(preprocessor._is_valid_image(img_path))

    def test_corrupted_image_rejection(self) -> None:
        """Test that corrupted images are rejected."""
        config = PreprocessingConfig(
            source_dir=self.temp_path,
            output_dir=self.temp_path,
        )
        preprocessor = WasteDatasetPreprocessor(config)

        # Create a corrupted file
        img_path = self.temp_path / "corrupted.jpg"
        img_path.write_text("This is not a valid image")

        self.assertFalse(preprocessor._is_valid_image(img_path))


class TestSupportedFormats(unittest.TestCase):
    """Test supported image format detection."""

    def test_supported_extensions(self) -> None:
        """Test that known formats are supported."""
        self.assertIn(".jpg", SUPPORTED_IMAGE_EXTENSIONS)
        self.assertIn(".png", SUPPORTED_IMAGE_EXTENSIONS)
        self.assertIn(".jpeg", SUPPORTED_IMAGE_EXTENSIONS)


if __name__ == "__main__":
    unittest.main()
