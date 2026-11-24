# EcoSnap — Milestone 25: TensorFlow Lite Integration & Parity Verification Report

**Document ID:** `docs/milestone_25_tflite_integration.md`  
**Date:** November 21, 2026  
**Integration Status:** Deployed, Validated & Passing All Mobile Tests  
**Mobile Runtime:** React Native 0.74.5, Expo SDK 51.0.39, `react-native-fast-tflite`  
**Deployed Model File:** `mobile-app/assets/models/waste_classifier.tflite` (2,540,592 bytes)  

---

## 1. TensorFlow Lite Conversion

The trained Keras model was converted to TensorFlow Lite using `ai-engine/inference/convert_to_tflite.py` with the following configuration:
- Optimization: `tf.lite.Optimize.DEFAULT` (dynamic range weight quantization)
- Input Tensor Shape: `[1, 224, 224, 3]`, `float32`
- Output Tensor Shape: `[1, 8]`, `float32`
- Output Activation: Softmax probabilities across the 8 categories

### Model Footprint Comparison:
| Model Format | File Path | File Size | Reduction |
|---|---|---|---|
| Keras (HDF5 / SavedModel) | `ai-engine/models/waste_classifier.keras` | 24,692,218 bytes (24.7 MB) | Baseline |
| **TensorFlow Lite (Deployed)** | `mobile-app/assets/models/waste_classifier.tflite` | **2,540,592 bytes (2.54 MB)** | **89.7% Smaller** |

Backup file created: `mobile-app/assets/models/waste_classifier.tflite.bak`.

---

## 2. Parity Verification (Keras vs. TFLite)

Verification script: `ai-engine/inference/verify_parity.py`

To guarantee that the on-device TFLite model produces outputs consistent with the trained Keras model, 16 representative test samples (2 per category) were evaluated sequentially through both runtimes using real test images:

| Category | True Label | Keras Pred (Confidence) | TFLite Pred (Confidence) | Max Prob Diff | Agreement |
|---|---|---|---|---|---|
| **Plastic** | Plastic | Glass (61.3%) | Glass (59.5%) | 0.0271 | **YES** |
| **Plastic** | Plastic | Plastic (70.2%) | Plastic (71.9%) | 0.0172 | **YES** |
| **Paper** | Paper | E-waste (76.0%) | E-waste (63.3%) | 0.1270 | **YES** |
| **Paper** | Paper | Paper (99.4%) | Paper (99.5%) | 0.0006 | **YES** |
| **Glass** | Glass | Glass (92.1%) | Glass (90.0%) | 0.0216 | **YES** |
| **Glass** | Glass | Glass (75.1%) | Glass (76.6%) | 0.0156 | **YES** |
| **Metal** | Metal | Metal (54.2%) | Metal (61.2%) | 0.0705 | **YES** |
| **Metal** | Metal | Metal (52.7%) | Metal (54.4%) | 0.0758 | **YES** |
| **Cardboard** | Cardboard | E-waste (54.1%) | E-waste (48.5%) | 0.0558 | **YES** |
| **Cardboard** | Cardboard | Cardboard (98.8%) | Cardboard (99.0%) | 0.0024 | **YES** |
| **Organic** | Organic | Organic (99.8%) | Organic (99.8%) | 0.0001 | **YES** |
| **Organic** | Organic | Organic (71.7%) | Organic (79.2%) | 0.0749 | **YES** |
| **Battery** | Battery | Battery (79.4%) | Battery (75.8%) | 0.0365 | **YES** |
| **Battery** | Battery | Battery (98.2%) | Battery (98.1%) | 0.0015 | **YES** |
| **E-waste** | E-waste | E-waste (99.1%) | E-waste (99.1%) | 0.0004 | **YES** |
| **E-waste** | E-waste | E-waste (85.7%) | E-waste (83.5%) | 0.0222 | **YES** |

### Parity Metrics:
- **Total Samples Tested:** 16
- **Model Parity Agreement:** **100.0%** (16 out of 16 identical top-1 class selections)
- **Mean Keras CPU Latency:** 582.85 ms
- **Mean TFLite CPU Latency:** **196.11 ms** (~2.97x faster execution on CPU)
- **Parity Status:** **PASSED**

---

## 3. End-to-End Mobile App Integration

### 3.1 Asset Placement
- Model asset: `mobile-app/assets/models/waste_classifier.tflite`
- Class labels: `mobile-app/assets/models/labels.txt`
- Bundled offline product data: `mobile-app/assets/data/barcode_seed_products.json`

### 3.2 Label Loader & Mapping
`labelLoader.ts` parses `labels.txt`:
```text
Plastic (index 0)
Paper (index 1)
Glass (index 2)
Metal (index 3)
Cardboard (index 4)
Organic (index 5)
Battery (index 6)
E-Waste (index 7)
```
In `inferenceEngine.ts`, these 8 indices map directly to the domain enum `WasteCategory` (`PLASTIC`, `PAPER`, `GLASS`, `METAL`, `ORGANIC`, `E_WASTE`).

### 3.3 Image Preprocessing
`imagePreprocessor.ts`:
1. Resizes input image to $224\times 224$ pixels via `expo-image-manipulator`.
2. Decodes JPEG bytes to raw RGBA buffers via `jpeg-js`.
3. Normalizes RGB pixel channels to $[0.0, 1.0]$:
   ```typescript
   rgbArray[i * 3] = data[i * 4] / 255.0;         // Red
   rgbArray[i * 3 + 1] = data[i * 4 + 1] / 255.0; // Green
   rgbArray[i * 3 + 2] = data[i * 4 + 2] / 255.0; // Blue
   ```
4. Returns a `Float32Array` of size $224\times 224\times 3 = 150,528$ elements directly consumable by the TFLite runtime.

---

## 4. Mobile Application Validation

From the `mobile-app` directory, the full test and verification suite was executed:

### 4.1 TypeScript Check (`npm run ts:check`)
```powershell
> ecosnap@1.0.0 ts:check
> tsc --noEmit
# 0 errors
```

### 4.2 Automated Unit & Integration Tests (`npm test`)
```powershell
Test Suites: 14 passed, 14 total
Tests:       91 passed, 91 total
Snapshots:   0 total
Time:        9.24 s
```
All 14 suites passed:
- `src/services/ai/__tests__/analyticsService.test.ts`
- `src/services/points/__tests__/EcoPointsService.test.ts`
- `src/services/barcode/__tests__/packagingMapperService.test.ts`
- `src/utils/__tests__/safeStorage.test.ts`
- `src/services/ai/__tests__/imagePreprocessor.test.ts`
- `src/services/barcode/__tests__/barcodeService.test.ts`
- `src/services/badges/__tests__/BadgeService.test.ts`
- `src/services/challenges/__tests__/ChallengeService.test.ts`
- `src/services/dashboard/__tests__/GoalService.test.ts`
- `src/services/ai/__tests__/recommendationService.test.ts`
- `src/services/history/__tests__/DetectionHistoryService.test.ts`
- `src/utils/__tests__/wasteAnalytics.test.ts`
- `src/services/ai/__tests__/inferenceEngine.test.ts`
- `src/services/ai/__tests__/pipelineService.test.ts`

### 4.3 Expo Configuration Check (`npx expo-doctor`)
```powershell
Running 17 checks on your project...
17/17 checks passed. No issues detected!
```
