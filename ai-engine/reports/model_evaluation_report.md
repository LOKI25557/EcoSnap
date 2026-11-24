# EcoSnap & Segregate — AI Model Evaluation & Quality Report

**Document ID:** `ai-engine/reports/model_evaluation_report.md`  
**Date:** November 21, 2026  
**Model Architecture:** MobileNetV2 Transfer Learning (ImageNet backbone)  
**TFLite Asset:** `mobile-app/assets/models/waste_classifier.tflite`  
**Class Order & Count:** 8 Classes (Plastic, Paper, Glass, Metal, Cardboard, Organic, Battery, E-waste)  
**Test Split Size:** 275 held-out real-world test images  

---

## 1. Executive Summary

A genuine 8-class waste classification deep learning model was successfully trained using two-stage transfer learning (Feature Extraction + Fine-Tuning) on MobileNetV2 with an authentic dataset consisting of 1,815 verified images sourced from TrashNet, the Waste Garbage Management dataset, and the IEEE EWasteNet dataset.

On the 275 held-out test images, the model achieves:
- **Test Overall Accuracy:** **82.18%**
- **Macro Precision:** **84.42%**
- **Macro Recall:** **83.67%**
- **Macro F1-Score:** **83.72%**
- **Keras vs. TFLite Parity Agreement:** **100.0%** (16/16 representative real samples matched exactly)
- **TFLite CPU Inference Latency:** **196.11 ms** (~2.97x speedup over Keras runtime)

---

## 2. Dataset Partitioning & Class Representation

| Index | Class Name | Total Images | Train (70%) | Validation (15%) | Test (15%) | Primary Origin |
|---|---|---|---|---|---|---|
| 0 | **Plastic** | 250 | 175 | 37 | 38 | TrashNet (MIT License) |
| 1 | **Paper** | 250 | 175 | 37 | 38 | TrashNet (MIT License) |
| 2 | **Glass** | 250 | 175 | 37 | 38 | TrashNet (MIT License) |
| 3 | **Metal** | 250 | 175 | 37 | 38 | TrashNet (MIT License) |
| 4 | **Cardboard** | 250 | 175 | 37 | 38 | TrashNet (MIT License) |
| 5 | **Organic** | 180 | 126 | 27 | 27 | Waste Garbage Mgmt (CC-BY-4.0) |
| 6 | **Battery** | 180 | 126 | 27 | 27 | Waste Garbage Mgmt (CC-BY-4.0) |
| 7 | **E-waste** | 205 | 143 | 31 | 31 | EWasteNet (IEEE ICSECS 2023) |
| **Total** | **All 8 Classes** | **1,815** | **1,265** | **275** | **275** | **100% Genuine Images** |

---

## 3. Classification Metrics on Held-out Test Set (275 Images)

| Category | Precision | Recall | F1-Score | Support | Key Performance Notes |
|---|---|---|---|---|---|
| **Plastic** | 74.29% | 68.42% | 71.23% | 38 | Clear bottles and bags occasionally cross-predict with glass. |
| **Paper** | 83.33% | 78.95% | 81.08% | 38 | High separation from plastic; minor confusion with thin cardboard. |
| **Glass** | 58.82% | 78.95% | 67.42% | 38 | High recall ensures glass bottles are captured; transparent items overlap with plastics. |
| **Metal** | 77.42% | 63.16% | 69.57% | 38 | Strong detection on aluminium cans and tin packaging. |
| **Cardboard** | 94.29% | 86.84% | 90.41% | 38 | Excellent precision for corrugated boxes and shipping cartons. |
| **Organic** | **100.00%** | **100.00%** | **100.00%** | 27 | Perfect discrimination of food waste, fruit peels, and biological scrap. |
| **Battery** | 96.30% | 96.30% | 96.30% | 27 | Excellent precision on cylindrical, button, and lithium batteries. |
| **E-waste** | 90.91% | 96.77% | 93.75% | 31 | High recall across laptops, keyboards, cables, and circuit boards. |
| **Overall / Macro** | **84.42%** | **83.67%** | **83.72%** | **275** | **Overall Accuracy: 82.18%** |

---

## 4. Confusion Matrix (275 Test Samples)

Rows represent ground truth classes; columns represent predicted classes:

```text
               Pred: Plastic  Paper  Glass  Metal  Cardboard  Organic  Battery  E-waste
True: Plastic     [  26,        2,     9,     1,       0,        0,       0,       0   ]  (38)
True: Paper       [   1,       30,     2,     1,       2,        0,       1,       1   ]  (38)
True: Glass       [   3,        0,    30,     5,       0,        0,       0,       0   ]  (38)
True: Metal       [   4,        1,     9,    24,       0,        0,       0,       0   ]  (38)
True: Cardboard   [   1,        3,     0,     0,      33,        0,       0,       1   ]  (38)
True: Organic     [   0,        0,     0,     0,       0,       27,       0,       0   ]  (27)
True: Battery     [   0,        0,     0,     0,       0,        0,      26,       1   ]  (27)
True: E-waste     [   0,        0,     1,     0,       0,        0,       0,      30   ]  (31)
```

### Analysis of Confusions:
1. **Plastic vs. Glass (9 cases):** Transparent plastic containers share visual refractive similarities with clear glass bottles under single-camera RGB.
2. **Glass vs. Metal (5 cases) & Metal vs. Glass (9 cases):** Shiny metallic surfaces reflecting light share specular highlights similar to glass reflections.
3. **Cardboard vs. Paper (3 cases):** Kraft paper bags and corrugated cardboard share similar pulp fibers and color profiles.
4. **Organic, Battery, and E-waste:** Very distinct visual clusters resulting in near-zero cross-domain confusion (Organic: 100% precision and recall; Battery: 96.3%; E-waste: 93.8% F1).

---

## 5. Artifact Links

- **Confusion Matrix Visualization:** [confusion_matrix.png](file:///c:/Users/Lokesh/OneDrive/Desktop/Projects/EcoSnap/ai-engine/reports/confusion_matrix.png)
- **Training Accuracy Curve:** [accuracy_graph.png](file:///c:/Users/Lokesh/OneDrive/Desktop/Projects/EcoSnap/ai-engine/reports/accuracy_graph.png)
- **Training Loss Curve:** [loss_graph.png](file:///c:/Users/Lokesh/OneDrive/Desktop/Projects/EcoSnap/ai-engine/reports/loss_graph.png)
- **Evaluation JSON Data:** [waste_classifier_evaluation.json](file:///c:/Users/Lokesh/OneDrive/Desktop/Projects/EcoSnap/ai-engine/reports/waste_classifier_evaluation.json)
- **Parity Verification Report:** [parity_verification_report.json](file:///c:/Users/Lokesh/OneDrive/Desktop/Projects/EcoSnap/ai-engine/reports/parity_verification_report.json)
