# Final Android Testing & Hardware Readiness Checklist

**Role:** Senior Android Application Testing & Release Engineer  
**Date:** November 21, 2026  
**Platform:** Android (React Native 0.74.5 + Expo SDK 51.0.39)  

---

## 1. Executive Summary & Hardware Testing Status

> [!IMPORTANT]
> **Honest Assessment of Device Testing:**  
> All camera, barcode decoding, and machine learning components have been verified via **automated Jest unit tests, TypeScript type checks, and simulated mocks**.  
> **No testing on physical Android hardware or standalone APK has taken place in this desktop workspace environment.** Any claim of physical Android device validation is unverified.

---

## 2. Feature-by-Feature Android Verification Matrix

| Subsystem / Feature | Implementation Status | Automated Tested (Jest) | Verified on Physical Android | Notes & Risks |
|---|---|---|---|---|
| **Expo Camera Hardware** | **IMPLEMENTED** | Yes (Mocked) | **NO** | Uses `CameraView` with `onBarcodeScanned`. Physical optical autofocus and light conditions unverified. |
| **Image Capture** | **IMPLEMENTED** | Yes (Mocked) | **NO** | `cameraRef.current.takePictureAsync` implemented in `useCamera.ts`. |
| **Gallery Upload** | **IMPLEMENTED** | Yes (Mocked) | **NO** | Integrated via `expo-image-picker` with media type and quality controls. |
| **TFLite Native Runtime** | **IMPLEMENTED** | Yes (Mocked) | **NO** | Uses `react-native-fast-tflite` (JSI TurboModule). Requires Expo Development Client (`npx expo run:android`), not standard Expo Go. |
| **Asset Bundling** | **IMPLEMENTED** | Yes (`metro.config.js`) | **NO** | `tflite` and `txt` extensions added to resolver. Tested via Expo packager asset mapping. |
| **Permanent File Storage** | **IMPLEMENTED** | Yes (Mocked) | **NO** | Files copied to `${documentDirectory}detection_images/`. |
| **Barcode Scanning Engine** | **IMPLEMENTED** | Yes (Unit Tests) | **NO** | Pipeline and debounce tested; physical optical barcode scanning unverified. |
| **Permissions Handling** | **PARTIAL** | Yes (Runtime hook) | **NO** | Runtime permission hooks present in `useCamera.ts`, but manifest declarations in `app.json` are incomplete. |

---

## 3. Android Configuration & Manifest Audit (`mobile-app/app.json`)

### 3.1 Permissions Audit
Current `mobile-app/app.json` configuration:
```json
{
  "expo": {
    "name": "EcoSnap",
    "slug": "ecosnap",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "assetBundlePatterns": ["**/*"],
    "android": {
      "adaptiveIcon": { "backgroundColor": "#ffffff" }
    },
    "plugins": ["expo-asset"]
  }
}
```

### 3.2 Required Manifest & Plugin Fixes Before EAS Android Build
1. **Missing Plugins in `app.json`:**
   - `"expo-camera"` must be added to `plugins` with `cameraPermission` rationale string.
   - `"expo-image-picker"` must be added to `plugins` with `photosPermission` rationale string.
2. **Missing Explicit Permissions:**
   ```json
   "android": {
     "permissions": [
       "android.permission.CAMERA",
       "android.permission.READ_EXTERNAL_STORAGE",
       "android.permission.WRITE_EXTERNAL_STORAGE",
       "android.permission.INTERNET"
     ]
   }
   ```
3. **Native Build Requirement:**
   - Because `react-native-fast-tflite` uses native C++ code and NitroModules, **the app cannot run in the pre-built Expo Go app**.
   - A custom Expo development client must be generated using `npx expo prebuild` and `npx expo run:android` or `eas build --profile development --platform android`.

---

## 4. Pre-Release Android Physical Device Checklist

Before EcoSnap can be certified for production deployment on Android:

- [ ] **EAS Build Generation:** Successfully run `eas build --profile preview --platform android` to produce an installable `.apk`.
- [ ] **Physical Camera Verification:**
  - [ ] Test on minimum supported Android version (Android 10 / API 29).
  - [ ] Test on target Android version (Android 14 / API 34).
  - [ ] Verify camera preview rendering, rotation, and aspect ratio on diverse screen resolutions.
  - [ ] Verify barcode scan detection on curved surfaces (cans, bottles).
- [ ] **Native TFLite Memory & Performance Profile:**
  - [ ] Measure inference execution time on low-end device (target: $< 150\text{ ms}$).
  - [ ] Monitor memory usage to ensure no native heap leaks occur during repeated scans.
- [ ] **Gallery Upload:**
  - [ ] Pick high-resolution image ($> 12\text{ MP}$) and verify downscaling to 224x224 without out-of-memory errors.
- [ ] **Offline Airplane Mode Test:**
  - [ ] Disconnect WiFi and cellular.
  - [ ] Scan Coca-Cola can barcode and verify instant recognition from offline seed DB.
  - [ ] Verify image capture and local history persistence while offline.
