# EcoSnap — Milestone 25: AI Waste Classification Training Report

**Document ID:** `docs/milestone_25_training_report.md`  
**Date:** November 21, 2026  
**Training Pipeline:** `ai-engine/training/train_waste_classifier.py`  
**Artifact Saved:** `ai-engine/models/waste_classifier.keras` (24,692,218 bytes)  
**Status:** Successfully Trained & Evaluated  

---

## 1. Model Architecture & Normalization Alignment

### 1.1 Inconsistency Discovery & Resolution
During the initial inspection of the training and inference pipeline, an inconsistency in image normalization was identified:
- The mobile preprocessor (`imagePreprocessor.ts`) and sample inference script (`sample_inference.py`) divide raw pixel values by $255.0$, delivering a `Float32Array` in the normalized range $[0.0, 1.0]$.
- If the model were defined with an internal `Rescaling(1.0 / 255.0)` layer, feeding it already-normalized inputs would result in a double-division ($[0.0, 0.00392]$), making incoming images almost completely black and degrading inference accuracy.
- Furthermore, MobileNetV2 pretrained on ImageNet expects pixel values in the symmetric range $[-1.0, 1.0]$.

### 1.2 Mathematical Harmonization
To ensure mathematical parity between training, testing, and on-device mobile inference:
1. All dataset pipelines (`train_waste_classifier.py` and `evaluate_waste_classifier.py`) explicitly scale input images by $1.0 / 255.0$, ensuring all tensors enter the graph in $[0.0, 1.0]$.
2. The model's input layer accepts $[0.0, 1.0]$ and includes an internal `Rescaling` layer:
   $$\text{Rescaling}(x) = x \times 2.0 - 1.0 \quad \implies \quad x \in [-1.0, 1.0]$$
3. This guarantees that:
   - $0.0 \to -1.0$ (black)
   - $0.5 \to 0.0$ (mid-gray)
   - $1.0 \to +1.0$ (white)
   This directly matches the MobileNetV2 ImageNet backbone input distribution.

### 1.3 Complete Graph Architecture
```text
Input Tensor (224, 224, 3) [Float32 in range 0.0 to 1.0]
    │
    ▼
tf.keras.layers.Rescaling(scale=2.0, offset=-1.0) [Transforms to range -1.0 to 1.0]
    │
    ▼
Augmentation Block (Training only: RandomFlip, RandomRotation(0.08), RandomZoom(0.1), RandomContrast(0.1))
    │
    ▼
MobileNetV2 Backbone (Weights: ImageNet, Include Top: False, 154 layers)
    │
    ▼
tf.keras.layers.GlobalAveragePooling2D()
    │
    ▼
tf.keras.layers.Dropout(0.25)
    │
    ▼
tf.keras.layers.Dense(8, activation="softmax", name="classifier")
```

---

## 2. Two-Stage Training Regime

### Stage 1: Feature Extraction
- **Objective:** Train the randomly initialized classification head on the 8 waste classes while keeping the MobileNetV2 backbone frozen.
- **Hyperparameters:**
  - Optimizer: Adam ($\eta = 1\times 10^{-3}$)
  - Loss: Sparse Categorical Crossentropy
  - Batch Size: 32
  - Epochs: 15 (EarlyStopping patience = 5, ModelCheckpoint monitoring `val_accuracy`)
- **Progression:**
  - Epoch 1: Loss = 1.6691, Train Acc = 38.97%, Val Acc = 65.45%
  - Epoch 5: Loss = 0.5446, Train Acc = 80.87%, Val Acc = 78.18%
  - Epoch 8: Loss = 0.4594, Train Acc = 84.11%, Val Acc = **82.55%** (Best Stage 1 checkpoint)
  - Epoch 13: Loss = 0.3332, Train Acc = 88.54%, Val Acc = 82.18%

### Stage 2: Fine-Tuning
- **Objective:** Unfreeze layers 100 through 154 of the MobileNetV2 backbone to allow upper-level feature representations to specialize in waste textures (plastic sheens, corrugated ridges, circuit tracks).
- **Hyperparameters:**
  - Optimizer: Adam ($\eta = 1\times 10^{-5}$, reduced learning rate)
  - Callbacks: `ReduceLROnPlateau(factor=0.2, patience=3, min_lr=1e-7)`, `EarlyStopping`
  - Epochs: 10 fine-tuning epochs
- **Progression:**
  - Fine-tune Epoch 1: Loss = 0.8528, Train Acc = 70.75%, Val Acc = 80.73%
  - Fine-tune Epoch 3: Loss = 0.5840, Train Acc = 80.08%, Val Acc = 79.64%
  - Fine-tune Epoch 5: Loss = 0.4951, Train Acc = 84.19%, Val Acc = 81.09% (LR reduced to $2\times 10^{-6}$, early stopping triggered)

---

## 3. Training & Validation Results

- **Best Validation Accuracy:** **82.55%** (achieved at Epoch 8)
- **Held-Out Test Set Accuracy (275 images):** **82.18%**
- **Held-Out Test Set Loss:** **0.4567**

Artifacts persisted:
- Keras model: `ai-engine/models/waste_classifier.keras`
- Label mappings: `ai-engine/models/waste_classifier_labels.json`
- History logs: `ai-engine/training/waste_classifier_history.json`
