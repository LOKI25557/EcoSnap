# Final AI Model Validation Report: EcoSnap Waste Classifier

**Role:** Senior AI/ML Validation Engineer  
**Date:** November 21, 2026  
**Target Artifacts:**  
- `mobile-app/assets/models/waste_classifier.tflite`
- `models/waste_classifier.tflite`
- `models/waste_classifier_labels.json`
- `mobile-app/assets/models/labels.txt`
- `ai-engine/training/train_waste_classifier.py`
- `ai-engine/inference/convert_to_tflite.py`
- `ai-engine/evaluation/evaluate_waste_classifier.py`

---

## 1. Executive Summary & Verification Verdict

| Component | Status | Reality vs. Prior Claims |
|---|---|---|
| **TFLite Model File** | **IMPLEMENTED** | Valid binary exists on disk (2,539,728 bytes). |
| **Tensor Flow Graph** | **IMPLEMENTED** | MobileNetV2 architecture with input shape `[1, 224, 224, 3]` and output `[1, 8]`. |
| **Model Preprocessing** | **IMPLEMENTED & MATCHED** | 224x224 RGB, Float32 scaled $[0.0, 1.0]$ in `imagePreprocessor.ts`. |
| **Label Mapping** | **IMPLEMENTED & MATCHED** | 8 classes in `labels.txt` mapped to 7 app categories in `inferenceEngine.ts`. |
| **Trained Weights** | **NOT IMPLEMENTED (CRITICAL RISK)** | **Dense(8) classification head is randomly initialized; NOT fine-tuned on waste data.** |
| **Training Completion** | **NOT IMPLEMENTED** | No training run was completed; no `.keras` weights or training logs exist. |
| **Evaluation Metrics** | **NOT AVAILABLE** | Accuracy, Precision, Recall, Confusion Matrix cannot be generated (no dataset). |
| **Prediction Reliability**| **UNRELIABLE / RANDOM** | Model runs technically, but output probabilities are uncalibrated and non-predictive. |

---

## 2. Technical Inspection of Model Assets

### 2.1 File Location & Dimensions
- **Asset Path:** `mobile-app/assets/models/waste_classifier.tflite`
- **Secondary Path:** `models/waste_classifier.tflite`
- **File Size:** 2,539,728 bytes (~2.42 MB)
- **Label Assets:**
  - `mobile-app/assets/models/labels.txt`
  - `models/waste_classifier_labels.json`

### 2.2 Tensor Signatures Verified via `tf.lite.Interpreter`
Direct Python interpreter inspection yields:
- **Input Details:**
  - Shape: `[1, 224, 224, 3]`
  - Dtype: `numpy.float32`
  - Quantization: Float32 (optimized flatbuffer)
- **Output Details:**
  - Shape: `[1, 8]`
  - Dtype: `numpy.float32`
  - Activation: Softmax ($\sum p_i = 1.0$)

---

## 3. Label Consistency & Preprocessing Alignment

### 3.1 Class Mapping Consistency
The 8 model output indices match between python and TypeScript:

| Index | Label (`labels.txt`) | TypeScript Mapping (`inferenceEngine.ts`) | App WasteCategory |
|---|---|---|---|
| 0 | Plastic | `case 'plastic': return WasteCategory.PLASTIC` | `Plastic` |
| 1 | Paper | `case 'paper': return WasteCategory.PAPER` | `Paper` |
| 2 | Glass | `case 'glass': return WasteCategory.GLASS` | `Glass` |
| 3 | Metal | `case 'metal': return WasteCategory.METAL` | `Metal` |
| 4 | Cardboard | `case 'cardboard': return WasteCategory.PAPER` | `Paper` |
| 5 | Organic | `case 'organic': return WasteCategory.ORGANIC` | `Organic` |
| 6 | Battery | `case 'battery': return WasteCategory.E_WASTE` | `E-Waste` |
| 7 | E-waste | `case 'ewaste': return WasteCategory.E_WASTE` | `E-Waste` |

*Note:* `Cardboard` and `Paper` both appropriately map into `WasteCategory.PAPER`, and `Battery` and `E-waste` both map into `WasteCategory.E_WASTE`.

### 3.2 Preprocessing Mathematical Equivalence
- **Training Graph Expectation (`train_waste_classifier.py:153-154`):**
  ```python
  inputs = tf.keras.layers.Input(shape=(224, 224, 3), name="image")
  x = tf.keras.layers.Rescaling(1.0 / 255.0, name="rescaling")(inputs)
  ```
- **Mobile Runtime Preprocessor (`imagePreprocessor.ts:40-49`):**
  ```typescript
  for (let i = 0; i < numPixels; i++) {
    rgbArray[i * 3]     = data[i * 4] / 255.0;     // R
    rgbArray[i * 3 + 1] = data[i * 4 + 1] / 255.0; // G
    rgbArray[i * 3 + 2] = data[i * 4 + 2] / 255.0; // B
  }
  ```
The normalization range $[0.0, 1.0]$ and channel ordering (RGB) match.

---

## 4. The Critical Gap: Lack of Model Training

### 4.1 Missing Training Artifacts
Investigation of `ai-engine/` reveals:
1. `models/waste_classifier.keras` does **not exist**.
2. `ai-engine/datasets/` is **empty** (0 images, 0 annotations).
3. `ai-engine/training/waste_classifier_history.json` does **not exist**.
4. `ai-engine/inference/tflite_verification_report.json` does **not exist**.

### 4.2 Why the Model Cannot Accurately Classify Waste
The current `waste_classifier.tflite` was exported from a MobileNetV2 base initialized with generic ImageNet weights and an un-trained `Dense(8)` classification head. While this successfully satisfies bundler requirements and verifies that the C++ TurboModule JSI pipeline can execute inference without crashing, **the model has zero real-world classification capability**.

Passing an actual image of a plastic bottle or an aluminum can produces essentially arbitrary softmax distributions.

### 4.3 Evaluation Metrics
Because no test dataset split (`prepared_data_dir/test/`) exists on disk, `evaluate_waste_classifier.py` cannot execute.

- **Test Accuracy:** N/A (Cannot be computed without dataset)
- **Precision / Recall / F1:** N/A
- **Confusion Matrix:** N/A

---

## 5. Required Actions for Production Readiness

1. **Obtain Waste Dataset:**
   - Download TrashNet or TACO dataset into `ai-engine/datasets/raw/`.
   - Organize into the 8 class directories: `Plastic`, `Paper`, `Glass`, `Metal`, `Cardboard`, `Organic`, `Battery`, `E-waste`.
2. **Execute Preprocessing:**
   - Run `python ai-engine/training/preprocess_waste_dataset.py --raw_data_dir ai-engine/datasets/raw --output_dir ai-engine/datasets/prepared`.
3. **Execute Two-Stage Fine-Tuning:**
   - Run `python ai-engine/training/train_waste_classifier.py --prepared_data_dir ai-engine/datasets/prepared --epochs 25 --fine_tune_epochs 15`.
   - Verify that validation accuracy exceeds 85%.
4. **Export True Trained Model:**
   - Run `python ai-engine/inference/convert_to_tflite.py --keras_model_path models/waste_classifier.keras --tflite_output_path mobile-app/assets/models/waste_classifier.tflite`.
5. **Run Evaluation:**
   - Run `python ai-engine/evaluation/evaluate_waste_classifier.py` to generate the true confusion matrix and precision/recall report.
