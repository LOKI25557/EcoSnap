# EcoSnap — Milestone 26: Android Native Configuration & Setup Guide

**Document ID:** `docs/milestone_26_android_setup.md`  
**Date:** November 22, 2026  
**Project:** EcoSnap & Segregate  
**Platform:** Android (React Native 0.74.5, Expo SDK 51.0.39)  
**Status:** Native Config Complete & Validated  

---

## 1. Executive Overview

EcoSnap incorporates machine learning inference and computer vision capabilities via:
- **`react-native-fast-tflite` (v3.0.1):** A high-performance, JSI-based native TensorFlow Lite runtime executing C++ bindings and native Android libraries (`libtensorflowlite.so`).
- **`expo-camera` (v15.0.16):** Full camera hardware access utilizing `CameraView` with integrated barcode scanning.
- **`expo-image-picker` (v15.1.0):** Native media library access for image uploads.

### Critical Runtime Distinction: Expo Go vs. Native Development/Preview Build
> [!IMPORTANT]
> **Standard Expo Go cannot execute `react-native-fast-tflite`.**
> Expo Go only contains a fixed set of precompiled native libraries. Because `react-native-fast-tflite` relies on custom native C++ JSI code and native TensorFlow Lite binaries, attempting to run model inference inside Expo Go will throw a native link error (`NitroModules: Module not found`).
> 
> To test on a physical Android device or emulator, a **Standalone Preview APK** or **Custom Development Build** must be generated.

---

## 2. Native Android Configuration (`app.json`)

The application manifest and native configuration in `mobile-app/app.json` has been configured with verified parameters:

### 2.1 Package Identifier & Versioning
- **Android Package:** `com.ecosnap.app`
- **Version Code:** `1`
- **Version:** `1.0.0`
- **Orientation:** `portrait`

### 2.2 Permissions
The following native permissions are defined in `app.json`:
```json
"permissions": [
  "android.permission.CAMERA",
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.READ_MEDIA_IMAGES"
]
```

### 2.3 Expo Config Plugins
Expo config plugins ensure that native manifests, Gradle scripts, and permission strings are injected during build:
```json
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
```

### 2.4 App Icons & Splash Assets
Standard assets are generated and placed in `mobile-app/assets/`:
- App Icon: `assets/icon.png` (1024x1024 PNG)
- Adaptive Foreground: `assets/adaptive-icon.png` (1024x1024 PNG, background: `#ffffff`)
- Splash Screen: `assets/splash.png` (1242x2436 PNG, background: `#ffffff`)
- Web Favicon: `assets/favicon.png` (48x48 PNG)

### 2.5 Metro Asset Extension Configuration (`metro.config.js`)
To ensure Metro bundles binary model weights and plain-text labels into the APK bundle, `metro.config.js` includes:
```javascript
config.resolver.assetExts.push('tflite', 'txt');
```
This guarantees that `require('../../../assets/models/waste_classifier.tflite')` resolves directly at native runtime.

---

## 3. EAS Build Profiles (`eas.json`)

`mobile-app/eas.json` defines three build profiles:

```json
{
  "cli": {
    "version": ">= 7.6.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

- **`preview` Profile (Recommended for Physical Testing):**
  Produces a standalone, self-contained `.apk` file that can be installed directly onto any physical Android device without needing a local development server.
- **`development` Profile:**
  Produces a custom developer client APK with hot-reloading support.
- **`production` Profile:**
  Produces an optimized Android App Bundle (`.aab`) for Google Play Store release.

---

## 4. Step-by-Step Android Build & Installation Instructions

### Method A: EAS Cloud Build (Zero Local Toolchain Required)
*Recommended for team members without a local Android Studio / NDK setup.*

1. **Install EAS CLI:**
   ```powershell
   npm install -g eas-cli
   ```
2. **Log into Expo Account:**
   ```powershell
   cd mobile-app
   eas login
   ```
3. **Configure Project:**
   ```powershell
   eas project:init
   ```
4. **Build Preview APK:**
   ```powershell
   eas build -p android --profile preview
   ```
5. **Download and Sideload:**
   Upon completion, EAS provides a direct download link and QR code to download the `.apk`. Sideload onto the Android device via USB or direct download.

---

### Method B: Local Standalone Build via Expo Prebuild & Gradle
*For developers with local Android Studio and Android SDK installed.*

1. **Prerequisites:**
   - Android Studio with Android SDK (API 34).
   - Android NDK (version 26+) and CMake (for compiling `react-native-fast-tflite`).
   - Java Development Kit (JDK 17).
2. **Generate Native Android Project:**
   ```powershell
   cd mobile-app
   npx expo prebuild --platform android
   ```
3. **Build APK Locally:**
   ```powershell
   cd android
   .\gradlew assembleRelease
   ```
   *Output APK Location:* `mobile-app/android/app/build/outputs/apk/release/app-release.apk`
4. **Install to Connected Device via ADB:**
   ```powershell
   adb install -r app-release.apk
   ```

---

## 5. Offline Operation & Hardware Readiness Verification

- **TFLite Model Bundled:** `waste_classifier.tflite` (2.54 MB) is bundled into the APK assets. No internet connection is required to run real-time camera inference.
- **Offline Seed DB:** 10 verified commercial product barcodes and component packaging rules are bundled into `assets/data/barcode_seed_products.json`.
- **Safe Storage Layer:** `safeStorage.ts` provides resilient local storage on AsyncStorage and FileSystem, gracefully persisting scan histories, user EcoPoints, and unlocked badges across restarts.
