# EcoSnap AI Engine - Phase 1 Complete

The AI Engine is the core machine learning component of EcoSnap & Segregate, providing waste image classification, environmental impact tracking, and personalized sustainability recommendations.

## Overview

```
ai-engine/
├── training/              # Model training pipeline
│   ├── preprocess_waste_dataset.py      # Dataset preparation & augmentation
│   ├── train_waste_classifier.py        # MobileNetV2 transfer learning
│   └── test_preprocess_waste_dataset.py # Unit tests
├── evaluation/            # Model evaluation
│   └── evaluate_waste_classifier.py     # Metrics & report generation
├── inference/             # Model conversion & inference
│   ├── convert_to_tflite.py            # Keras → TFLite conversion
│   └── sample_inference.py             # End-to-end inference example
├── models/                # Generated model artifacts (gitignored)
│   ├── waste_classifier.keras          # Trained model
│   ├── waste_classifier.tflite         # Mobile-ready model
│   ├── waste_classifier_labels.json    # Class mapping
│   └── waste_classifier_history.json   # Training history
├── datasets/              # Dataset storage (gitignored)
│   ├── raw/              # Original dataset
│   └── prepared/         # Preprocessed dataset (splits)
└── requirements.txt       # Python dependencies
```

## Quick Start

### 1. Setup Environment

```bash
# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt
```

### 2. Prepare Dataset

Organize your dataset with the following structure:
```
raw_dataset/
├── Plastic/
│   ├── 001.jpg
│   ├── 002.jpg
│   └── ...
├── Paper/
├── Glass/
├── Metal/
├── Cardboard/
├── Organic/
├── Battery/
└── E-waste/
```

Run preprocessing:
```bash
python training/preprocess_waste_dataset.py \
  --source-dir /path/to/raw_dataset \
  --output-dir datasets/prepared
```

**Output:**
- `datasets/prepared/{train,validation,test}/` - Stratified image splits
- `datasets/prepared/preprocessing_report.json` - Dataset statistics

### 3. Train Model

```bash
python training/train_waste_classifier.py \
  --prepared-data-dir datasets/prepared
```

**Output:**
- `models/waste_classifier.keras` - Best model (saved during training)
- `models/waste_classifier_labels.json` - Class order
- `models/waste_classifier_history.json` - Training curves

**Training process:**
- Stage 1: Train custom head (backbone frozen) - ~20 epochs
- Stage 2: Fine-tune top layers (reduced LR) - ~10 epochs
- EarlyStopping on validation accuracy (patience=5)
- Checkpoint best model based on val_accuracy

### 4. Evaluate Model

```bash
python evaluation/evaluate_waste_classifier.py \
  --prepared-data-dir datasets/prepared
```

**Output:**
- `models/waste_classifier_evaluation.json` - Detailed metrics
- `models/confusion_matrix.png` - Per-class confusion
- `models/accuracy_graph.png` - Training/validation accuracy
- `models/loss_graph.png` - Training/validation loss

**Metrics included:**
- Accuracy, Precision (macro), Recall (macro), F1 (macro)
- Per-class classification report
- Confusion matrix heatmap

### 5. Convert to TFLite

```bash
python inference/convert_to_tflite.py \
  --keras-model-path models/waste_classifier.keras \
  --tflite-output-path models/waste_classifier.tflite
```

**Output:**
- `models/waste_classifier.tflite` - TensorFlow Lite model (~20-30MB)
- `models/tflite_verification_report.json` - Conversion report

The TFLite model is optimized for mobile deployment with:
- INT8 quantization support
- Smaller file size (~4-5MB with full quantization)
- Fast inference on mobile devices

### 6. Test Inference

```bash
python inference/sample_inference.py
```

Demonstrates:
- Loading TFLite model and labels
- Preprocessing input images
- Running inference
- Formatting results with top-3 predictions

## Architecture

### Training Pipeline

```
Raw Images
    ↓
Discovery & Validation (reject corrupted files)
    ↓
Stratified Split (train/val/test by category)
    ↓
Image Resizing (224×224)
    ↓
Normalization ([0,1])
    ↓
Augmentation (train only: rotation, flip, zoom, contrast)
    ↓
TF Dataset Creation (batching, shuffling, prefetching, caching)
    ↓
MobileNetV2 Transfer Learning
    ↓
Best Model Checkpoint
```

### Model Architecture

```
Input (224×224×3)
  ↓
Rescaling (1/255)
  ↓
Augmentation (random rotation, flip, zoom)
  ↓
MobileNetV2 Backbone (ImageNet pretrained)
  ├─ Frozen during stage 1
  └─ Fine-tune top layers during stage 2
  ↓
Global Average Pooling
  ↓
Dropout (0.25)
  ↓
Dense (num_classes, softmax)
  ↓
Output (8 classes: Plastic, Paper, Glass, Metal, Cardboard, Organic, Battery, E-waste)
```

### Training Strategy

**Stage 1: Feature Extraction (20 epochs)**
- MobileNetV2 backbone frozen (pre-trained ImageNet features)
- Train custom head only (GlobalPool + Dense)
- Learning rate: 0.001
- Optimizer: Adam
- Callbacks:
  - ModelCheckpoint (best on val_accuracy)
  - EarlyStopping (patience=5)
  - ReduceLROnPlateau (patience=3, factor=0.2)

**Stage 2: Fine-tuning (10 epochs)**
- Unfreeze top 100 layers of MobileNetV2
- Train entire model with reduced learning rate
- Learning rate: 0.00001
- Helps adapt backbone features to waste domain

### Inference Pipeline (Mobile)

```
Camera Image
  ↓
Preprocess (resize, normalize)
  ↓
TFLite Inference
  ↓
Softmax → Probabilities
  ↓
Apply Confidence Threshold (0.3)
  ↓
Map Model Class → App Category (8→7 mapping)
  ↓
DetectionResult
  {
    "category": WasteCategory,
    "confidence": 0.0-1.0,
    "accepted": boolean
  }
```

**Category Mapping:**
- Model outputs 8 classes (indices 0-7)
- App uses 7 WasteCategory enums + UNKNOWN
- Mapping applied in `detectionService.ts`
- Confidence < 0.3 returns UNKNOWN

## Configuration

All configurable parameters are in dataclass Config objects:

### PreprocessingConfig (training/preprocess_waste_dataset.py)

```python
@dataclass
class PreprocessingConfig:
    source_dir: Path              # Raw dataset location
    output_dir: Path              # Output splits location
    validation_split: float = 0.15  # Val set percentage
    test_split: float = 0.15        # Test set percentage
    target_size: Tuple = (224, 224)
    batch_size: int = 32
    seed: int = 42
```

### TrainingConfig (training/train_waste_classifier.py)

```python
@dataclass
class TrainingConfig:
    prepared_data_dir: Path       # Preprocessed dataset
    output_model_path: Path       # Where to save model
    epochs: int = 20              # Stage 1 epochs
    fine_tune_epochs: int = 10    # Stage 2 epochs
    initial_lr: float = 1e-3      # Stage 1 learning rate
    fine_tune_lr: float = 1e-5    # Stage 2 learning rate
    batch_size: int = 32
    fine_tune_at: int = 100       # Unfreeze top N layers
```

### EvaluationConfig (evaluation/evaluate_waste_classifier.py)

```python
@dataclass
class EvaluationConfig:
    prepared_data_dir: Path       # Test set location
    model_path: Path              # Trained model path
    batch_size: int = 32
```

### ConversionConfig (inference/convert_to_tflite.py)

```python
@dataclass
class ConversionConfig:
    keras_model_path: Path        # Input model
    tflite_output_path: Path      # Output model
    image_size: Tuple = (224, 224)
```

## Performance Targets

- **Training time:** ~10-15 minutes on GPU, ~30-45 minutes on CPU
- **Model size:** ~40MB (Keras), ~8-12MB (TFLite)
- **Inference time:** ~100-200ms per image (CPU), ~50-100ms (mobile GPU)
- **Expected accuracy:** 85-95% validation accuracy on clean dataset
- **Confidence threshold:** 0.3 (30%) minimum for acceptance

## Troubleshooting

### TensorFlow/Protobuf Mismatch

**Error:** `RuntimeError: Failed to initialize Graph`

**Solution:**
```bash
pip install --upgrade protobuf
```

### Out of Memory

**For training:**
```python
# Reduce batch size in TrainingConfig
batch_size = 16  # from 32
```

**For preprocessing:**
```python
# Increase prefetch buffer (preprocessing handles pagination automatically)
```

### Model Not Found

Ensure you've run training before evaluation/inference:
```bash
# Check that model exists
ls models/waste_classifier.keras
ls models/waste_classifier.tflite
```

### Corrupted Images in Dataset

The preprocessor automatically rejects corrupted files. Check report:
```bash
cat datasets/prepared/preprocessing_report.json | grep invalid_files
```

## Integration with Mobile App

1. **Download TFLite model:**
   ```bash
   cp models/waste_classifier.tflite ../mobile-app/assets/models/
   ```

2. **Use in detectionService.ts:**
   ```typescript
   import { bundleResourceIO, load } from '@tensorflow/tfjs-react-native';
   
   // Load model
   const model = await load(
     bundleResourceIO(require('../../assets/models/waste_classifier.tflite'))
   );
   ```

3. **Preprocess and infer:**
   ```typescript
   const tensor = tf.image.resizeBilinear(imageTensor, [224, 224]);
   const predictions = model.predict(tensor);
   ```

## Testing

Run unit tests:
```bash
python -m unittest training/test_preprocess_waste_dataset.py -v
```

**Test coverage:**
- Configuration validation
- Dataset discovery
- Stratified splitting
- Image format detection
- Corruption handling

Run inference example:
```bash
python inference/sample_inference.py
```

## Deployment Checklist

- [ ] Dataset prepared and validated
- [ ] Model trained with target accuracy achieved
- [ ] Evaluation report reviewed
- [ ] TFLite model converted and verified
- [ ] Inference example tested
- [ ] Unit tests passing
- [ ] Dependencies documented (requirements.txt)
- [ ] Model artifacts committed (or gitignored if large)
- [ ] Documentation reviewed
- [ ] Mobile integration tested

## Performance Optimization

### For Better Accuracy
- Increase dataset size (more images per category)
- Extend Stage 1 training (more epochs)
- Fine-tune at earlier layer (fine_tune_at=50)
- Reduce learning rates (initial_lr=1e-4)

### For Faster Inference
- Use INT8 quantization (smaller model, slightly lower accuracy)
- Use dynamic batch sizes
- Cache model in memory on mobile

### For Better Generalization
- Increase augmentation intensity
- Use dropout layers
- Reduce fine_tune_epochs if overfitting

## References

- [MobileNetV2 Paper](https://arxiv.org/abs/1801.04381)
- [TensorFlow Transfer Learning Guide](https://www.tensorflow.org/tutorials/images/transfer_learning)
- [TensorFlow Lite Documentation](https://www.tensorflow.org/lite/guide)
- [scikit-learn Metrics](https://scikit-learn.org/stable/modules/model_evaluation.html)

## Contact & Support

For issues or questions about the AI engine, refer to the architecture documentation at `docs/architecture/system-architecture.md`.

---

**Last Updated:** 2026-07-04  
**Status:** Phase 1 Complete ✅  
**Next Phase:** Model deployment, real-time inference optimization, user feedback loop

