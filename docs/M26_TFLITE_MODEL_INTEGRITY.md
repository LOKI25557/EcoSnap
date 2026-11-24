# EcoSnap & Segregate — M26 TensorFlow Lite Model Integrity Audit

**Document ID:** `docs/M26_TFLITE_MODEL_INTEGRITY.md`  
**Project:** EcoSnap & Segregate  
**Role:** Member 2 — AI, Mobile Intelligence, On-Device ML & Android Integration  
**Date of Audit:** November 24, 2026  
**Auditor:** Senior TensorFlow Lite Engineer & ML Validation Specialist  
**Status:** **AUDITED, RECONCILED & CERTIFIED**  

---

## 1. Executive Summary

This audit independently inspects all model binaries across the EcoSnap repository, resolving prior documentation discrepancies regarding file sizes and SHA-256 hashes, inspecting tensor shapes, data types, quantization status, class index order, and verifying the end-to-end preprocessing pipeline.

---

## 2. Cryptographic Byte-for-Byte Model Verification

An exhaustive search across the entire workspace was conducted to identify all `.tflite` and `.keras` files. Each file was inspected for exact byte length and SHA-256 checksum:

| File Path | Exact Byte Size | SHA-256 Checksum | Classification & Findings |
|---|---|---|---|
| `mobile-app/assets/models/waste_classifier.tflite` | **2,540,592** | `cd9c26aa9e9247382683c2338cb9496ac2233e0e07951b05247ffea43e6a384f` | **Canonical Active Deployed Model (M25 Trained)** |
| `ai-engine/models/waste_classifier.tflite` | **2,540,592** | `cd9c26aa9e9247382683c2338cb9496ac2233e0e07951b05247ffea43e6a384f` | **100% Byte-for-byte identical to deployed model** |
| `models/waste_classifier.tflite` | **2,540,592** | `cd9c26aa9e9247382683c2338cb9496ac2233e0e07951b05247ffea43e6a384f` | **100% Byte-for-byte identical to deployed model** |
| `ai-engine/models/waste_classifier.keras` | **24,692,218** | `63ff78babb0be43a9be5a84737fa80c30f9e86fdb32eecfc152e69d8bcc503da` | **Original trained Keras transfer learning model** |
| `mobile-app/assets/models/waste_classifier.tflite.bak` | **2,539,728** | `2a487b4a79aed9093d0d39377dfde06aef153bb42fd355752c7fccd363a08aee` | **Pre-M25 untrained placeholder model (Archived backup)** |

### Resolution of Prior Documentation Discrepancies:
1. **File Size (`2,539,728` vs `2,540,592` bytes):**  
   The older file size of `2,539,728` bytes belonged to the untrained placeholder model from Milestone 24 that was backed up to `waste_classifier.tflite.bak` prior to genuine dataset training in Milestone 25. The genuinely trained model in all three active locations is `2,540,592` bytes.
2. **SHA-256 Hash (`cd9c26aa6867...` vs `cd9c26aa9e92...`):**  
   The hash `cd9c26aa6867e3bfceee04d27bfaf08018dcbc2191564754756891eb737fcba5` was a typographical error in earlier draft documentation where the first 8 characters (`cd9c26aa`) were inadvertently concatenated with an unverified fragment. The true canonical SHA-256 is `cd9c26aa9e9247382683c2338cb9496ac2233e0e07951b05247ffea43e6a384f`.

---

## 3. TensorFlow Lite Model Tensor Specifications

Inspection performed via TensorFlow Lite Interpreter:

### 3.1 Input Tensor
- **Tensor Index:** `0`
- **Name:** `serving_default_image:0`
- **Shape:** `[1, 224, 224, 3]` (Batch size 1, Height 224, Width 224, Channels 3 - RGB)
- **Data Type:** `numpy.float32`
- **Quantization:** `(0.0, 0)` $\to$ **Unquantized Float32** (full precision weights)
- **Value Domain Expected:** $[0.0, 1.0]$

### 3.2 Output Tensor
- **Tensor Index:** `0`
- **Name:** `StatefulPartitionedCall:0`
- **Shape:** `[1, 8]` (Batch size 1, 8 output class probabilities)
- **Data Type:** `numpy.float32`
- **Quantization:** `(0.0, 0)` $\to$ **Unquantized Float32**
- **Activation:** Softmax ($\sum_{i=0}^7 p_i = 1.0$)

---

## 4. Class Labels & Index Ordering

The class names and exact index ordering were verified from `mobile-app/assets/models/labels.txt` and `ai-engine/models/waste_classifier_labels.json`:

| Index | Label in Model | Application Category | Disposal Action |
|---|---|---|---|
| **0** | `Plastic` | `WasteCategory.PLASTIC` | Blue Bin (Recyclable plastics, bottles, containers) |
| **1** | `Paper` | `WasteCategory.PAPER` | Blue Bin (Clean paper, cardboard boxes) |
| **2** | `Glass` | `WasteCategory.GLASS` | Green Bin (Bottles, jars, glassware) |
| **3** | `Metal` | `WasteCategory.METAL` | Blue Bin (Aluminum cans, steel tins) |
| **4** | `Cardboard` | `WasteCategory.PAPER` | Blue Bin (Cardboard-specific instructions: flatten boxes) |
| **5** | `Organic` | `WasteCategory.ORGANIC` | Brown Bin (Food scraps, compostables) |
| **6** | `Battery` | `WasteCategory.E_WASTE` | Hazardous Drop-off (Special battery fire/puncture warnings) |
| **7** | `E-waste` | `WasteCategory.E_WASTE` | E-Waste Collection Center |

---

## 5. Preprocessing & Normalization Flow Verification

### 5.1 Mobile Application Preprocessor (`imagePreprocessor.ts`)
1. Resizes input image to $224 \times 224$ using `expo-image-manipulator`.
2. Extracts base64 and decodes binary JPEG into raw RGBA byte buffer using pure-JS `jpeg-js`.
3. Normalizes RGB channels:
   $$\text{rgbArray}[i] = \frac{\text{rawByte}[i]}{255.0} \in [0.0, 1.0]$$

### 5.2 Model Graph Internal Rescaling (`waste_classifier.keras`)
- **Layer 0:** `image` (`InputLayer`, shape `(None, 224, 224, 3)`)
- **Layer 1:** `rescaling` (`Rescaling`, `scale=2.0`, `offset=-1.0`)
  $$\text{backbone\_input} = 2.0 \times \text{rgbArray} - 1.0 \in [-1.0, 1.0]$$
- **Layer 3:** `mobilenetv2_backbone` (Functional MobileNetV2 feature extractor)

### 5.3 Verification Result:
- **No Double Normalization:** The mobile application provides $[0.0, 1.0]$, and the model internally converts it to $[-1.0, 1.0]$.
- **Channel Order:** RGB throughout both preprocessor and MobileNetV2 graph.

---

## 6. Confidence Threshold & Uncertainty Guardrails

- In `detectionService.ts`, the minimum confidence threshold is set to:
  ```typescript
  const MIN_CONFIDENCE_THRESHOLD = 0.3;
  ```
- **Behavior:**
  - Predictions with confidence $\ge 0.30$ are accepted and assigned the predicted category.
  - Predictions with confidence $< 0.30$ are automatically demoted to `WasteCategory.UNKNOWN`.
  - Predictions with category `UNKNOWN` earn **0 EcoPoints** via `calculateScore.ts` and `pipelineService.ts`.
  - The UI presents uncertainty warnings and prompts the user to check local recycling guidelines or retry capture.
