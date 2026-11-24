# EcoSnap — Milestone 26: Native Integration & Architecture Report

**Document ID:** `docs/milestone_26_native_integration_report.md`  
**Date:** November 22, 2026  
**Project:** EcoSnap & Segregate  
**Scope:** Technical Audit of Native Modules, Permissions, and Hardware Bridges  
**Status:** Integrated, Configured & Automated Verified  

---

## 1. Native Module Architecture Overview

EcoSnap bridges React Native JavaScript/TypeScript code with device hardware and native runtimes through five primary modules:

```text
┌─────────────────────────────────────────────────────────────┐
│                   React Native UI / State                   │
│   (CameraScreen, DetectionCard, HistoryScreen, Analytics)   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
      ┌─────────────────┐           ┌───────────────────┐
      │  Camera & Vision │           │  Data Persistence │
      └────────┬────────┘           └─────────┬─────────┘
               │                              │
 ┌─────────────┴─────────────┐   ┌────────────┴─────────────┐
 │                           │   │                          │
 ▼                           ▼   ▼                          ▼
expo-camera         react-native-fast-tflite   AsyncStorage     expo-file-system
(CameraView)        (C++ / JSI / TFLite)       (Metadata/State) (Permanent Images)
```

---

## 2. Native Module Inspections & Configurations

### 2.1 TensorFlow Lite Native Inference (`react-native-fast-tflite` v3.0.1)
- **Role:** High-performance, zero-copy inference engine utilizing JavaScript Interface (JSI) directly into C++ TensorFlow Lite runtimes (`libtensorflowlite.so`).
- **Integration Layer:** `mobile-app/src/services/ai/modelLoader.ts` (Singleton pattern caching the loaded `TensorflowModel`).
- **Asset Resolution:** Bundled via Metro asset extension (`metro.config.js` with `assetExts.push('tflite', 'txt')`).
- **Model Asset:** `mobile-app/assets/models/waste_classifier.tflite` (2,540,592 bytes).
- **Execution Performance:** ~196 ms CPU inference latency on 224x224 input tensors.
- **Expo Config Plugin:** Added `"react-native-fast-tflite"` to `app.json` plugins.

### 2.2 Camera Hardware Access (`expo-camera` v15.0.16)
- **Role:** Viewfinder streaming, hardware camera shutter capture, and real-time barcode detection.
- **Integration Layer:** `mobile-app/src/screens/CameraScreen.tsx` & `mobile-app/src/hooks/useCamera.ts`.
- **Dual Capability:**
  1. Image capture via `cameraRef.takePictureAsync({ quality: 0.8, base64: true })`.
  2. Barcode scanning via `onBarcodeScanned` handler, with 3,000 ms duplicate debounce.
- **Permissions Configured:** `android.permission.CAMERA` and `expo-camera` plugin with user-facing explanation in `app.json`.

### 2.3 Image Manipulation & Preprocessing (`expo-image-manipulator` & `jpeg-js`)
- **Role:** Downsamples captured or gallery images to the exact $224\times 224$ dimensions expected by the neural network.
- **Integration Layer:** `mobile-app/src/services/ai/imagePreprocessor.ts`.
- **Normalization Flow:**
  1. `manipulateAsync(uri, [{ resize: { width: 224, height: 224 } }], { compress: 0.8, format: SaveFormat.JPEG, base64: true })`.
  2. `jpeg.decode(bytes)` extracts raw 32-bit RGBA pixels.
  3. Projects RGBA into an interleaved `Float32Array(150528)` normalized to $[0.0, 1.0]$.

### 2.4 Gallery Image Picker (`expo-image-picker` v15.1.0)
- **Role:** Allows users to pick existing waste photos from Android media storage.
- **Integration Layer:** `useCamera.ts:pickImage()` invoking `launchImageLibraryAsync({ mediaTypes: MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 })`.
- **Permissions Configured:** `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `READ_MEDIA_IMAGES` and `expo-image-picker` plugin in `app.json`.

### 2.5 Resilient Persistence Layer (`safeStorage.ts`)
- **Role:** Prevents app crashes from malformed, partial, or corrupted local storage files.
- **Storage Substrates:**
  - `@react-native-async-storage/async-storage`: Lightweight key-value storage for EcoPoints ledger, streak counters, and unlocked badges.
  - `expo-file-system`: Permanent sandboxed document directory storage for `detection_history.json`, `barcode_cache.json`, and cached photos (`${documentDirectory}detection_images/`).
- **Self-Healing Mechanism:** Catches any `JSON.parse` syntax error, logs a non-fatal warning, resets the key to its typed fallback value, and rewrites valid JSON to disk. Tested and verified in `safeStorage.test.ts` (8/8 tests pass).

---

## 3. Native App Configuration Audit (`app.json`)

The following audited configuration is active in `mobile-app/app.json`:

```json
{
  "expo": {
    "name": "EcoSnap",
    "slug": "ecosnap",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "package": "com.ecosnap.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_MEDIA_IMAGES"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-asset",
      [
        "expo-camera",
        {
          "cameraPermission": "Allow EcoSnap to access your camera to scan waste items and barcodes."
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow EcoSnap to access your photos to select waste images."
        }
      ],
      "react-native-fast-tflite"
    ]
  }
}
```

---

## 4. Build Environment & Runtime Compatibility

| Platform / Runtime | Compatibility Status | Notes |
|---|---|---|
| **Expo Go (Client App)** | **INCOMPATIBLE** | Does not bundle `react-native-fast-tflite` native C++ JSI binaries (`libtensorflowlite.so`). |
| **Expo Dev Client** | **COMPATIBLE** | Supported via `eas build --profile development` or `npx expo run:android`. |
| **Standalone Preview APK** | **COMPATIBLE (RECOMMENDED)** | Self-contained APK generated via `eas build -p android --profile preview` for direct sideloading. |
| **Google Play Release (AAB)** | **COMPATIBLE** | Supported via `eas build -p android --profile production` generating an `.aab` file. |

---

## 5. Verification Commands & Health Status

- `npx expo-doctor`: **17/17 checks passed. No issues detected!**
- `npm run ts:check`: **0 errors**.
- `npm test -- --runInBand`: **14 test suites passed, 91 unit tests passed**.
