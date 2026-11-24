# EcoSnap & Segregate — M26 Android Native Readiness Report

**Document ID:** `docs/M26_ANDROID_NATIVE_READINESS.md`  
**Project:** EcoSnap & Segregate — *Snap. Sort. Sustain.*  
**Role:** Member 2 — AI, Mobile Intelligence, On-Device ML & Android Integration  
**Date of Audit:** November 24, 2026  
**Auditor:** Senior Android Build Engineer & Native Expo Architect  
**Status:** **BUNDLING & CONFIGURATION CERTIFIED (PENDING PHYSICAL HANDSET TESTING)**

---

## 1. Native Android Configuration Audit

### A. Identity & Package Specifications
- **Android Package (Application ID):** `com.ecosnap.app`
- **Application Display Name:** `EcoSnap`
- **Version:** `1.0.0`
- **Expo Owner:** `ecosnap-team`
- **EAS Project ID:** `5350d4a1-b0dc-418b-b914-309eb47fb335`

### B. Permissions & Security Minimization
- **Camera Permission:** Configured via `expo-camera` plugin:
  ```json
  [
    "expo-camera",
    {
      "cameraPermission": "Allow EcoSnap to use your camera to identify waste.",
      "microphonePermission": false,
      "recordAudioAndroid": false
    }
  ]
  ```
- **Microphone Recording:** Strictly disabled (`microphonePermission: false`, `recordAudioAndroid: false`).
- **Storage Access:** Scoped to internal sandboxed app files (`FileSystem.documentDirectory`). No excessive broad external storage permissions requested.

### C. Metro Asset Bundling (`metro.config.js`)
Configured to package binary neural network weights and label dictionaries directly into the APK bundle:
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('tflite', 'txt');
module.exports = config;
```

---

## 2. Command Execution Evidence

### A. Expo Public Config Verification (`npx expo config --type public`)
```json
{
  "name": "EcoSnap",
  "slug": "ecosnap",
  "version": "1.0.0",
  "owner": "ecosnap-team",
  "android": {
    "package": "com.ecosnap.app",
    "permissions": ["CAMERA", "android.permission.CAMERA"]
  },
  "plugins": [
    "expo-asset",
    ["expo-camera", {"microphonePermission": false, "recordAudioAndroid": false}],
    "react-native-fast-tflite"
  ],
  "extra": {
    "eas": {
      "projectId": "5350d4a1-b0dc-418b-b914-309eb47fb335"
    }
  }
}
```

### B. EAS Project Information (`npx eas-cli@latest project:info`)
```text
fullName  @ecosnap-team/ecosnap
ID        5350d4a1-b0dc-418b-b914-309eb47fb335
```

### C. Expo Health Diagnostics (`npx expo-doctor`)
```text
Running 17 checks on your project...
17/17 checks passed. No issues detected!
```

### D. Standalone Android Bundle Export (`npx expo export --platform android`)
```text
Starting Metro Bundler
Android Bundled 8271ms (1020 modules)

Exporting 8 assets:
assets\models\labels.txt (60 B)
assets\models\waste_classifier.tflite (2.54 MB)
node_modules\@react-navigation\elements\src\assets\back-icon-mask.png (913 B)
node_modules\@react-navigation\elements\src\assets\back-icon.png (5 variations | 148 B)

Exporting 1 bundle for android:
_expo/static/js/android/AppEntry-*.hbc (4.16 MB Hermes Bytecode)

Exporting 1 file:
metadata.json (667 B)
App exported to: dist
```

---

## 3. Important Architectural Disclaimer

> [!WARNING]
> **Metro Export is a Bundling Check, NOT Proof of Native Runtime Correctness.**
>
> While `expo export --platform android` certifies that:
> 1. All 1,020 JavaScript / TypeScript modules compile cleanly to Hermes bytecode.
> 2. Model assets (`waste_classifier.tflite` and `labels.txt`) resolve without packaging errors.
> 3. Zero missing asset or syntax issues exist in the static build graph.
>
> It does **not** execute native C++ JSI bindings or initialize `libtensorflowlite.so` on an Android Linux kernel. Only a physical device run of the compiled APK or development build can validate native runtime execution.
