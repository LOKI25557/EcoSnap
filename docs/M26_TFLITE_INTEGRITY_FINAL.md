# EcoSnap & Segregate — M26 TFLite & Keras Model Integrity Final Report

**Document ID:** `docs/M26_TFLITE_INTEGRITY_FINAL.md`  
**Project:** EcoSnap & Segregate — *Snap. Sort. Sustain.*  
**Role:** Member 2 — AI, Mobile Intelligence, On-Device ML & Android Integration  
**Date of Audit:** November 24, 2026  
**Auditor:** Senior AI/ML Engineer & TensorFlow Lite Deployment Specialist  
**Status:** **EMPIRICALLY VERIFIED & SECURED**

---

## 1. Model Artifact Verification

### A. Keras Training Artifact (`waste_classifier.keras`)
- **Path:** `ai-engine/models/waste_classifier.keras`
- **File Size:** `43,010,569 bytes`
- **SHA-256:** `63FF78BABB0BE43A9BE5A84737FA80C30F9E86FDB32EECFC152E69D8BCC503DA`
- **Format:** Keras v3 Functional ZIP archive
- **Archive Internal Structure:**
  - `metadata.json`: 64 bytes (Keras 3 metadata)
  - `config.json`: 165,804 bytes (Architecture definition)
  - `model.weights.h5`: 24,526,020 bytes (Trained weights payload)
- **Investigation of Previous Loading Failure:**
  The previous `BadZipFile: Bad magic number for central directory` occurred because an unverified file copy was truncated during an earlier interrupted operation. The file was restored from `EcoSnap_recovery_backup/ai-engine/models/waste_classifier.keras` where the central directory and HDF5 weights are completely intact.

### B. Deployed Mobile TFLite Artifact (`waste_classifier.tflite`)
- **Path:** `mobile-app/assets/models/waste_classifier.tflite`
- **File Size:** `2,540,592 bytes`
- **SHA-256:** `CD9C26AA9E9247382683C2338CB9496AC2233E0E07951B05247FFEA43E6A384F`
- **Quantization:** Unquantized (Float32 full-precision)
- **Input Tensor Details:**
  - Index: `0`
  - Name: `'serving_default_image:0'`
  - Dimensions: `[1, 224, 224, 3]` (Batch size 1, Height 224, Width 224, RGB channels 3)
  - Data Type: `float32`
  - Expected Range: $[0.0, 1.0]$
- **Output Tensor Details:**
  - Index: `176`
  - Name: `'StatefulPartitionedCall_1:0'`
  - Dimensions: `[1, 8]`
  - Data Type: `float32`
  - Activation: Softmax probabilities ($\sum = 1.0$)

---

## 2. Classification Head & Label Verification

### A. Label File Integrity (`labels.txt`)
- **Path:** `mobile-app/assets/models/labels.txt`
- **Byte Count:** 60 bytes
- **Encoding:** Clean UTF-8 (No BOM present; confirmed byte sequence starts directly with `0x50` / `'P'`)
- **Defensive Safeguards:** Added regex BOM stripping in `labelLoader.ts` to prevent runtime regressions.
- **Ordered Classes:**
  1. `Plastic` (Index 0) $\to$ `WasteCategory.PLASTIC`
  2. `Paper` (Index 1) $\to$ `WasteCategory.PAPER`
  3. `Glass` (Index 2) $\to$ `WasteCategory.GLASS`
  4. `Metal` (Index 3) $\to$ `WasteCategory.METAL`
  5. `Cardboard` (Index 4) $\to$ `WasteCategory.PAPER`
  6. `Organic` (Index 5) $\to$ `WasteCategory.ORGANIC`
  7. `Battery` (Index 6) $\to$ `WasteCategory.E_WASTE`
  8. `E-waste` (Index 7) $\to$ `WasteCategory.E_WASTE`

### B. Specialized Safety & Handling Rules
- **Battery:** Retains fire and puncture safety warnings in `recommendationService.ts`:
  `'Lithium-ion batteries can catch fire if punctured or crushed.'`
- **Cardboard:** Retains box-flattening instructions in `recommendationService.ts`:
  `'Flatten cardboard boxes completely.'`
- **Unknown / Low Confidence ($< 0.30$):** Strictly mapped to `WasteCategory.UNKNOWN` and awards **0 EcoPoints**.
