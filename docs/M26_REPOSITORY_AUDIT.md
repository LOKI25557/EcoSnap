# EcoSnap & Segregate — M26 Repository & Architecture Audit Report

**Document ID:** `docs/M26_REPOSITORY_AUDIT.md`  
**Project:** EcoSnap & Segregate  
**Role:** Member 2 — AI, Mobile Intelligence, On-Device ML & Android Integration  
**Date of Audit:** November 24, 2026  
**Auditor:** Senior Full-Stack Mobile Application Engineer, AI/ML Specialist & Android Build Architect  
**Audited Root:** `c:\Users\Lokesh\OneDrive\Desktop\Projects\EcoSnap`  
**Git Branch:** `loki`  

---

## 1. Executive Summary

This comprehensive repository audit evaluates the entire source tree of the EcoSnap project, establishing exact implementation statuses, identifying architectural boundaries between Member 1 and Member 2, and verifying technical dependencies.

---

## 2. Directory Structure & Scope Division

```text
EcoSnap/
├── .venv/                   # Python virtual environment for ML scripts (3.13 / TensorFlow 2.21)
├── ai-engine/               # AI/ML model training, evaluation, and conversion pipeline (Member 2)
│   ├── datasets/            # Raw, processed, and split waste datasets (TrashNet, Waste Garbage, EWasteNet)
│   ├── evaluation/          # Held-out evaluation scripts, parity validation (Keras vs TFLite)
│   ├── inference/           # TFLite conversion and parity verification scripts
│   ├── models/              # Canonical trained models: waste_classifier.keras, waste_classifier.tflite
│   ├── reports/             # Confusion matrices, classification reports, loss curves
│   └── training/            # Preprocessing, data augmentation, MobileNetV2 transfer learning
├── backend/                 # Backend and Cloud Infrastructure (Member 1 - Untouched)
│   ├── cloud-functions/     # Firebase Cloud Functions (notifications, facility routing)
│   ├── firestore-indexes/   # Firestore query index definitions
│   └── firestore-rules/     # Database security rules
├── docs/                    # Technical architecture, audits, setup guides, and validation reports
├── mobile-app/              # React Native + Expo mobile application (Member 1 & Member 2)
│   ├── assets/              # Native icons, adaptive icons, splash screens, and binary models
│   ├── src/                 # Application source code
│   │   ├── components/      # UI components (DetectionCard, ImpactCard, etc.)
│   │   ├── constants/       # Waste categories, resin codes, bin themes
│   │   ├── hooks/           # useCamera, lifecycle hooks
│   │   ├── screens/         # CameraScreen, HistoryScreen, AnalyticsScreen, DashboardScreen
│   │   ├── services/
│   │   │   ├── ai/          # TFLite inference, image preprocessor, recommendations, pipeline
│   │   │   ├── barcode/     # Barcode scanner, Open Food Facts API, packaging mapper, seed DB
│   │   │   ├── firebase/    # Member 1 Firebase Auth and Firestore integration (offline safe)
│   │   │   ├── history/     # DetectionHistoryService, permanent image sandboxing
│   │   │   └── points/      # EcoPointsService, streaks, gamification
│   │   ├── types/           # DetectionResult, WasteItem, Product, PackagingComponent
│   │   └── utils/           # safeStorage (self-healing), recyclingKnowledgeBase, calculateScore
│   ├── app.json             # Android package (com.ecosnap.app), permissions, config plugins
│   ├── eas.json             # EAS build profiles (development, preview APK, production AAB)
│   ├── metro.config.js      # Bundles raw .tflite and .txt binary assets
│   └── package.json         # Expo SDK 51, React Native 0.74.5, fast-tflite 3.0.1
└── models/                  # Root deployment mirror for binary models (waste_classifier.tflite)
```

---

## 3. Comprehensive Module Audit Matrix

| Subsystem / Module | Path | Owner | Status | Technical Evidence & Verification |
|---|---|---|---|---|
| **AI Model Asset** | `mobile-app/assets/models/waste_classifier.tflite` | Member 2 | **COMPLETE** | 2,540,592 bytes, SHA-256 `cd9c26aa9e9247382683c2338cb9496ac2233e0e07951b05247ffea43e6a384f`, 8 classes. |
| **Model Loader (JSI)** | `mobile-app/src/services/ai/modelLoader.ts` | Member 2 | **COMPLETE** | Singleton caching `TensorflowModel`, loads via Metro asset resolution. |
| **Image Preprocessor** | `mobile-app/src/services/ai/imagePreprocessor.ts` | Member 2 | **COMPLETE** | 224x224 resize, JPEG pure-JS decode, Float32 RGB normalization [0, 1]. |
| **Inference Engine** | `mobile-app/src/services/ai/inferenceEngine.ts` | Member 2 | **COMPLETE** | Float32 tensor execution, Softmax probability parsing, deterministic mapping. |
| **Detection Service** | `mobile-app/src/services/ai/detectionService.ts` | Member 2 | **COMPLETE** | Threshold enforcement (`MIN_CONFIDENCE_THRESHOLD = 0.3`), fallback to `UNKNOWN`. |
| **Unified Scan Pipeline** | `mobile-app/src/services/ai/pipelineService.ts` | Member 2 | **COMPLETE** | Unified entry for image & barcode, 3000ms debounce protection, EcoPoints linking. |
| **Barcode Lookup Engine** | `mobile-app/src/services/barcode/barcodeService.ts` | Member 2 | **COMPLETE** | Multi-tier: Memory cache $\to$ File cache $\to$ 10 Seed items $\to$ Open Food Facts v2. |
| **Packaging Mapper** | `mobile-app/src/services/barcode/packagingMapperService.ts`| Member 2 | **COMPLETE** | Resin code parsing (1–7, 20–22, 40–41, 70–72, 81–84), material normalization. |
| **Disposal Recommendations**| `mobile-app/src/services/ai/recommendationService.ts` | Member 2 | **COMPLETE** | Category guidance, bin assignment, hazard instructions, decomposition times. |
| **Recycling Knowledge Base**| `mobile-app/src/utils/recyclingKnowledgeBase.ts` | Member 2 | **COMPLETE** | Encyclopedia of materials, disposal methods, and recycling rates. |
| **Camera Hardware Bridge** | `mobile-app/src/hooks/useCamera.ts` | Member 2 | **COMPLETE** | `expo-camera` `CameraView`, barcode capture, permission requests. |
| **Gallery Picker Bridge** | `mobile-app/src/hooks/useCamera.ts` | Member 2 | **COMPLETE** | `expo-image-picker` with aspect ratio, compression, and URI resolution. |
| **Local Detection History** | `mobile-app/src/services/history/DetectionHistoryService.ts`| Member 2 | **COMPLETE** | Permanent image sandboxing to `${documentDirectory}detection_images/`. |
| **Gamification (Points)** | `mobile-app/src/services/points/EcoPointsService.ts` | Member 2 | **COMPLETE** | Points accumulation, streak preservation, daily bonuses. |
| **Gamification (Badges)** | `mobile-app/src/services/badges/BadgeService.ts` | Member 2 | **COMPLETE** | Milestone badges, singleton cache reset (`resetCache()`). |
| **Self-Healing Storage** | `mobile-app/src/utils/safeStorage.ts` | Member 2 | **COMPLETE** | Catches corrupted JSON, falls back gracefully, rewrites clean state. |
| **Android Manifest Config** | `mobile-app/app.json` | Member 2 | **COMPLETE** | `com.ecosnap.app`, version 1.0.0, camera and media storage permissions. |
| **EAS Build Profiles** | `mobile-app/eas.json` | Member 2 | **COMPLETE** | Standalone Preview APK profile configured (`buildType: "apk"`). |
| **Metro Asset Bundling** | `mobile-app/metro.config.js` | Member 2 | **COMPLETE** | Raw binary `.tflite` and `.txt` asset extensions registered. |
| **Offline Guest Mode** | `mobile-app/src/services/firebase/firebaseConfig.ts` | Member 2 | **COMPLETE** | Boots cleanly without `.env` or Firebase credentials without throwing crashes. |
| **Firebase Cloud Sync** | `mobile-app/src/services/firebase/` | Member 1 | **NOT STARTED** | Member 1 responsibility; cloud sync deferred until backend integration. |
| **Physical Handset Test** | Physical Android phone | Member 2 / Dev | **BLOCKED** | Standalone preview APK requires developer sideloading to execute on physical hardware. |

---

## 4. Key Architectural Findings & Risk Analysis

1. **JSI Runtime Boundary:** Standard Expo Go cannot execute `react-native-fast-tflite`. Testing on mobile devices requires a standalone Preview APK or Custom Development Client.
2. **Offline-First Resilience:** All AI inference, seed barcode lookups, packaging intelligence, and persistence operate 100% locally on-device without network access.
3. **Safety Guardrails:** Hazardous waste (batteries) and special recyclables (cardboard) are safely mapped and carry distinct safety instructions.
