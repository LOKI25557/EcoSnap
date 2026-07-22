# EcoSnap AI Engine - Deployment Guide

This guide provides step-by-step instructions for deploying the EcoSnap AI waste classifier from development to production.

## Phase Overview

```
Development → Testing → Validation → Deployment to Mobile
     ↓           ↓          ↓              ↓
  Local        Unit      Integration    Production
 Training      Tests     Testing        Inference
```

## Prerequisites

- Python 3.10+ (tested on 3.13.3)
- 8GB+ RAM recommended (16GB for larger datasets)
- 50GB+ disk space (for models and datasets)
- GPU (NVIDIA with CUDA) strongly recommended for training
- Git for version control

## Step 1: Environment Setup

### 1.1 Install Python Dependencies

```bash
# Navigate to ai-engine directory
cd ai-engine

# Create virtual environment (isolated dependencies)
python -m venv venv

# Activate environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Verify installation
python -c "import tensorflow; print(f'TensorFlow {tensorflow.__version__}')"
```

### 1.2 Verify GPU Support (Optional)

If you have an NVIDIA GPU:
```bash
python -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"
```

If no GPU found but NVIDIA GPU installed, install CUDA support:
```bash
pip install tensorflow[and-cuda]==2.15.0
```

### 1.3 Create Directory Structure

```bash
# Create required directories
mkdir -p datasets/raw datasets/prepared
mkdir -p models
mkdir -p evaluation/reports

# Create symlinks for easy access (optional)
# cd datasets/raw && ln -s /path/to/your/dataset waste_images
```

## Step 2: Data Preparation

### 2.1 Gather Dataset

Collect waste images and organize by category:
```
datasets/raw/
├── Plastic/           (target: 500+ images)
├── Paper/             (target: 500+ images)
├── Glass/             (target: 500+ images)
├── Metal/             (target: 500+ images)
├── Cardboard/         (target: 500+ images)
├── Organic/           (target: 500+ images)
├── Battery/           (target: 200+ images - harder to collect)
└── E-waste/           (target: 200+ images - harder to collect)
```

**Minimum dataset:** 50-100 images per category  
**Recommended:** 500-1000 images per category  
**Optimal:** 2000+ images per category

### 2.2 Data Quality Checks

Before preprocessing, manually review:
- ✓ Images clearly show the waste item
- ✓ Images have good lighting
- ✓ No blurry or corrupted images
- ✓ Multiple angles per category
- ✓ Representative of real-world conditions

### 2.3 Run Preprocessing

```bash
python training/preprocess_waste_dataset.py \
  --source-dir datasets/raw \
  --output-dir datasets/prepared \
  --validation-split 0.15 \
  --test-split 0.15

# Output:
# datasets/prepared/
# ├── train/          (70% of images, with augmentation applied)
# ├── validation/     (15% of images)
# ├── test/           (15% of images)
# └── preprocessing_report.json  (statistics)
```

**Review preprocessing report:**
```bash
python -c "
import json
with open('datasets/prepared/preprocessing_report.json') as f:
    report = json.load(f)
print('Category Distribution:')
for cat, count in report['category_counts'].items():
    print(f'  {cat}: {count} images')
print(f\"Total Images: {sum(report['category_counts'].values())}\")
"
```

**Expected output:**
```
Category Distribution:
  Plastic: 280
  Paper: 280
  Glass: 280
  Metal: 280
  Cardboard: 140
  Organic: 140
  Battery: 70
  E-waste: 70
```

If any category has <50 images, the dataset needs more collection.

## Step 3: Model Training

### 3.1 Start Training

```bash
# Training with default settings (recommended for first run)
python training/train_waste_classifier.py \
  --prepared-data-dir datasets/prepared

# Or with custom configuration
python training/train_waste_classifier.py \
  --prepared-data-dir datasets/prepared \
  --epochs 25 \
  --fine-tune-epochs 15 \
  --initial-lr 0.0005 \
  --fine-tune-lr 0.00001
```

**Training timeline:**
- CPU (~1h per epoch): 5-10 hours total
- GPU (~3-5 min per epoch): 30-60 minutes total

**Monitoring training:**
```bash
# Watch training loss/accuracy in real-time
# Output shows epoch-by-epoch progress
```

### 3.2 Training Artifacts

After training completes, check `models/`:
```bash
ls -lh models/
# waste_classifier.keras          (40-50 MB)
# waste_classifier_labels.json    (200 B)
# waste_classifier_history.json   (10-50 KB)
```

### 3.3 Training Success Criteria

Model is ready for evaluation if:
- ✓ Training completed without errors
- ✓ Final validation accuracy > 80%
- ✓ No signs of overfitting (val_loss increasing while train_loss decreasing)
- ✓ Model file saved successfully

Check training history:
```bash
python -c "
import json
with open('models/waste_classifier_history.json') as f:
    history = json.load(f)
print(f\"Final Train Acc: {history['history']['accuracy'][-1]:.3f}\")
print(f\"Final Val Acc: {history['history']['val_accuracy'][-1]:.3f}\")
print(f\"Best Val Acc: {max(history['history']['val_accuracy']):.3f}\")
print(f\"Epochs: {len(history['history']['loss'])}\")
"
```

## Step 4: Model Evaluation

### 4.1 Run Evaluation

```bash
python evaluation/evaluate_waste_classifier.py \
  --prepared-data-dir datasets/prepared
```

**Outputs generated:**
```bash
models/
├── waste_classifier_evaluation.json  (detailed metrics)
├── confusion_matrix.png              (per-class performance)
├── accuracy_graph.png                (training curves)
└── loss_graph.png                    (loss curves)
```

### 4.2 Review Evaluation Report

```bash
python -c "
import json
with open('models/waste_classifier_evaluation.json') as f:
    report = json.load(f)
    
metrics = report['metrics']
print(f\"Overall Accuracy: {metrics['accuracy']:.3f}\")
print(f\"Precision (macro): {metrics['precision']:.3f}\")
print(f\"Recall (macro): {metrics['recall']:.3f}\")
print(f\"F1 Score (macro): {metrics['f1']:.3f}\")
print(f\"\nPer-Category Performance:\")
for cat, scores in report['per_category_report'].items():
    print(f\"  {cat}: precision={scores['precision']:.2f}, recall={scores['recall']:.2f}, f1={scores['f1']:.2f}\")
"
```

### 4.3 Evaluation Pass Criteria

Model passes evaluation if:
- ✓ Overall accuracy ≥ 85%
- ✓ No class has recall < 70%
- ✓ Macro F1 score ≥ 0.80
- ✓ Confusion matrix shows clear diagonal dominance

If criteria not met, consider:
- Collecting more training data
- Balancing dataset by category
- Adjusting augmentation intensity
- Retraining with different hyperparameters

## Step 5: Model Conversion

### 5.1 Convert to TFLite

```bash
python inference/convert_to_tflite.py \
  --keras-model-path models/waste_classifier.keras \
  --tflite-output-path models/waste_classifier.tflite
```

**Output:**
```bash
models/
├── waste_classifier.tflite           (8-12 MB)
└── tflite_verification_report.json   (conversion details)
```

### 5.2 Verify Conversion

```bash
python -c "
import json
with open('models/tflite_verification_report.json') as f:
    report = json.load(f)
    
print(f\"Keras Model Size: {report['keras_model_size_mb']:.1f} MB\")
print(f\"TFLite Model Size: {report['tflite_model_size_mb']:.1f} MB\")
print(f\"Conversion Successful: {report['conversion_successful']}\")
print(f\"Output Verification: {report['output_verification']}\")
print(f\"Class Count: {report['num_classes']}\")
"
```

### 5.3 Conversion Success Criteria

- ✓ TFLite file created without errors
- ✓ File size < 50MB (likely 8-15MB for this model)
- ✓ Inference verification passed
- ✓ Output shape matches num_classes

## Step 6: Testing & Validation

### 6.1 Run Inference Tests

```bash
# Test with sample image
python inference/sample_inference.py

# Should output:
# Predicted Category: Paper
# Confidence: 92.3%
# Acceptable: Yes
# Top 3 Predictions:
#   1. Paper: 92.3%
#   2. Cardboard: 5.2%
#   3. Plastic: 1.8%
```

### 6.2 Run Unit Tests

```bash
python -m unittest training/test_preprocess_waste_dataset.py -v

# Expected output:
# test_dataset_discovery ... ok
# test_dataset_splitting ... ok
# test_image_validation_detection ... ok
# ...
# Ran 8 tests - OK
```

### 6.3 Integration Testing

Create a test script to verify full pipeline:
```bash
python -c "
from pathlib import Path
import tensorflow as tf

# 1. Load model
model = tf.keras.models.load_model('models/waste_classifier.keras')
print('✓ Keras model loaded')

# 2. Load TFLite model
interpreter = tf.lite.Interpreter('models/waste_classifier.tflite')
interpreter.allocate_tensors()
print('✓ TFLite model loaded')

# 3. Load labels
import json
with open('models/waste_classifier_labels.json') as f:
    labels = json.load(f)['class_names']
print(f'✓ Labels loaded: {len(labels)} classes')

# 4. Test evaluation report
with open('models/waste_classifier_evaluation.json') as f:
    eval_report = json.load(f)
print(f'✓ Evaluation report: {eval_report[\"metrics\"][\"accuracy\"]:.1%} accuracy')

print('\\n✅ All integration tests passed!')
"
```

## Step 7: Deployment to Mobile

### 7.1 Prepare Mobile Integration

```bash
# Copy TFLite model to mobile app
cp models/waste_classifier.tflite ../mobile-app/assets/models/
cp models/waste_classifier_labels.json ../mobile-app/assets/models/

# Copy to React Native assets
mkdir -p ../mobile-app/src/assets/models
cp models/waste_classifier.tflite ../mobile-app/src/assets/models/
```

### 7.2 Verify Mobile Integration

In `mobile-app/src/services/ai/detectionService.ts`:
```typescript
// Should be able to load the model
const modelPath = require('../../assets/models/waste_classifier.tflite');
// And initialize inference service
const detector = new WasteDetector();
```

### 7.3 Test Mobile Inference

```bash
# Navigate to mobile app
cd ../mobile-app

# Test that model loads without errors
npm run test:detection

# Or manually test in app
npm run start
```

## Step 8: Production Deployment Checklist

- [ ] All tests passing (unit + integration)
- [ ] Model accuracy > 85%
- [ ] Model size < 50MB
- [ ] TFLite model converts without errors
- [ ] Sample inference test successful
- [ ] Mobile integration tested
- [ ] Documentation complete
- [ ] Performance benchmarks recorded
- [ ] Edge cases tested (low light, various angles)
- [ ] Fallback handling for model not found
- [ ] Error logging implemented
- [ ] User feedback mechanism ready

## Monitoring & Maintenance

### Performance Monitoring

Track in production:
- Average inference time
- Model accuracy on real user data
- Category distribution
- Confidence score distribution
- Error rates

### Retraining Triggers

Retrain model if:
- User feedback accuracy < 80%
- New waste category appears
- Model drift detected (accuracy decline)
- Dataset size increases >20%

### Data Collection

Collect real-world data:
- User-submitted images (with consent)
- Category corrections
- False positive/negative cases
- Device-specific performance data

### Version Management

```bash
# Tag model versions
git tag -a v1.0.0-model -m "Phase 1 complete: 87.3% accuracy"
git push origin v1.0.0-model

# Keep history of model performance
echo "Model v1.0.0: 87.3% accuracy, 12.3MB" >> models/VERSION_HISTORY.md
```

## Troubleshooting

### Common Issues

**Issue: Out of memory during training**
```bash
# Reduce batch size in TrainingConfig
batch_size = 16  # from 32
```

**Issue: Model not improving**
```bash
# Collect more data or improve dataset quality
# Adjust learning rates or augmentation
python training/train_waste_classifier.py \
  --initial-lr 0.0001 \
  --fine-tune-epochs 20
```

**Issue: TFLite conversion fails**
```bash
# Update TensorFlow
pip install --upgrade tensorflow
```

**Issue: Mobile inference crashes**
```bash
# Verify model path is correct
# Ensure model file is bundled in app
# Check memory on device
```

## Performance Benchmarks

Target metrics for Phase 1:
- **Accuracy:** 85-92% on validation set
- **Inference Time:** 100-200ms (CPU), 50-100ms (mobile GPU)
- **Model Size:** 40MB (Keras), 8-12MB (TFLite)
- **Training Time:** 30-60 min (GPU), 5-10 hours (CPU)

## Next Steps

After Phase 1 deployment:
1. Collect real-world inference data
2. Implement user feedback loop
3. Analyze misclassifications
4. Plan Phase 2 improvements
5. Consider multi-class scenarios
6. Optimize for edge devices

## Contact & Support

For deployment issues, check:
1. README.md - General documentation
2. Individual script `--help` for parameters
3. Error logs in model output
4. GitHub issues tracker

---

**Last Updated:** 2026-07-04  
**Deployment Status:** Ready for Production  
**Version:** 1.0.0

