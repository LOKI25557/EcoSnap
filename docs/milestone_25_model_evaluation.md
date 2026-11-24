# EcoSnap — Milestone 25: Model Evaluation Report

**Document ID:** `docs/milestone_25_model_evaluation.md`  
**Date:** November 21, 2026  
**Evaluation Script:** `ai-engine/evaluation/evaluate_waste_classifier.py`  
**Evaluation Target:** 275 held-out test images across all 8 classes  
**Evaluation Artifacts Directory:** `ai-engine/reports/`  

---

## 1. Evaluation Methodology

The model was evaluated against the unseen test split comprising 275 images (15% stratified sample per class) using `evaluate_waste_classifier.py`. The evaluation pipeline:
1. Loads the saved Keras model `ai-engine/models/waste_classifier.keras`.
2. Loads class metadata `ai-engine/models/waste_classifier_labels.json`.
3. Streams the test dataset without shuffling, scaling pixel values to $[0.0, 1.0]$.
4. Computes model predictions, class probabilities, and argmax labels.
5. Calculates the confusion matrix, per-class classification metrics (Precision, Recall, F1), macro/weighted metrics, and renders publication-ready plots.

---

## 2. Quantitative Results Summary

- **Total Test Images:** 275
- **Overall Accuracy:** **82.18%** (226 correct out of 275)
- **Macro Precision:** **84.42%**
- **Macro Recall:** **83.67%**
- **Macro F1-Score:** **83.72%**
- **Weighted Precision:** **83.16%**
- **Weighted Recall:** **82.18%**
- **Weighted F1-Score:** **82.31%**

---

## 3. Per-Class Performance Breakdown

| Class Index | Class Name | Precision | Recall | F1-Score | Support (N) | Evaluation Assessment |
|---|---|---|---|---|---|---|
| **0** | **Plastic** | 74.29% | 68.42% | 71.23% | 38 | 26 correctly classified. 9 misclassified as Glass due to transparent bottles. |
| **1** | **Paper** | 83.33% | 78.95% | 81.08% | 38 | 30 correctly classified. Strong discrimination against metals and plastics. |
| **2** | **Glass** | 58.82% | 78.95% | 67.42% | 38 | 30 correctly classified. High recall; false positives come from clear plastics and shiny metals. |
| **3** | **Metal** | 77.42% | 63.16% | 69.57% | 38 | 24 correctly classified. Specular reflection causes confusion with glass. |
| **4** | **Cardboard** | 94.29% | 86.84% | 90.41% | 38 | 33 correctly classified. Excellent texture detection on corrugated fiberboard. |
| **5** | **Organic** | **100.00%** | **100.00%** | **100.00%** | 27 | 27 correctly classified. Zero misclassifications across food and biological waste. |
| **6** | **Battery** | 96.30% | 96.30% | 96.30% | 27 | 26 correctly classified. 1 misclassified as E-waste. |
| **7** | **E-waste** | 90.91% | 96.77% | 93.75% | 31 | 30 correctly classified. 1 misclassified as Glass. |

---

## 4. Full Confusion Matrix

```text
                  Predicted Labels
            Pla  Pap  Gla  Met  Car  Org  Bat  Ewa | Total
True Labels:
Plastic      26    2    9    1    0    0    0    0 |    38
Paper         1   30    2    1    2    0    1    1 |    38
Glass         3    0   30    5    0    0    0    0 |    38
Metal         4    1    9   24    0    0    0    0 |    38
Cardboard     1    3    0    0   33    0    0    1 |    38
Organic       0    0    0    0    0   27    0    0 |    27
Battery       0    0    0    0    0    0   26    1 |    27
E-waste       0    0    1    0    0    0    0   30 |    31
Total Pred   35   36   51   31   35   27   27   33 |   275
```

---

## 5. Visual Artifacts

The evaluation generated the following high-resolution performance plots:
1. **Confusion Matrix Plot:** `ai-engine/reports/confusion_matrix.png`
2. **Training & Validation Accuracy History:** `ai-engine/reports/accuracy_graph.png`
3. **Training & Validation Loss History:** `ai-engine/reports/loss_graph.png`
4. **Machine-Readable Metrics Report:** `ai-engine/reports/waste_classifier_evaluation.json`
