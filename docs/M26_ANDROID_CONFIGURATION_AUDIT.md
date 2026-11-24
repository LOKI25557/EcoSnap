# EcoSnap & Segregate — M26 Android Configuration & Native Integration Audit

**Document ID:** `docs/M26_ANDROID_CONFIGURATION_AUDIT.md`  
**Project:** EcoSnap & Segregate  
**Role:** Member 2 — AI, Mobile Intelligence, On-Device ML & Android Integration  
**Date of Audit:** November 24, 2026  
**Auditor:** Senior Android Build Engineer & Native Integration Specialist  
**Status:** **AUDITED & CERTIFIED**  

---

## 1. Application Identity & Configuration

The configuration in `mobile-app/app.json` was evaluated against Android 14+ (API 34) and Expo SDK 51 standards:

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

## 2. Permissions Analysis

| Declared Permission | Purpose | Target Android Versions | Handling Mechanism |
|---|---|---|---|
| `android.permission.CAMERA` | Hardware camera stream & optical barcode scanning | All Android versions (API 21+) | Runtime request via `useCameraPermissions()` hook |
| `android.permission.READ_EXTERNAL_STORAGE` | Gallery photo selection | Android $\le$ 12 (API $\le$ 32) | Managed transparently by `expo-image-picker` |
| `android.permission.WRITE_EXTERNAL_STORAGE` | Legacy sandboxed image persistence | Android $\le$ 12 (API $\le$ 32) | Scoped to internal sandbox directories |
| `android.permission.READ_MEDIA_IMAGES` | Granular media image selection | Android 13+ (API 33+) | Modern media picker intent via `expo-image-picker` |

### Key Privacy & Compliance Verifications:
- **No Broad Storage:** No `MANAGE_EXTERNAL_STORAGE` or arbitrary file access requested.
- **No Unnecessary Location/Audio in Core Manifest:** Audio recording is not requested by the app manifest. (Note: Expo Camera plugin automatically includes camera permissions).
- **Graceful Permission Denial:** When camera permissions are denied, `CameraScreen.tsx` renders a permission request card with a direct button to open system settings or enter offline guest manual entry.

---

## 3. Expo Config Plugins Verification

1. **`expo-asset`:** Injects build-time asset bundling logic, ensuring raw `.tflite` model binaries are extracted into the application cache directory upon launch.
2. **`expo-camera`:** Injects Android camera hardware features (`android.hardware.camera`, `android.hardware.camera.autofocus`) into the generated `AndroidManifest.xml`.
3. **`expo-image-picker`:** Injects media library intents and file provider paths for safe photo selection.
4. **`react-native-fast-tflite`:** Executes custom Gradle plugin `withFastTFLite.js` that links precompiled native C++ TensorFlow Lite shared objects (`libtensorflowlite.so`) and JSI bindings directly into the Android native binary.

---

## 4. Visual Branding Assets Audit

All assets referenced in `app.json` verified on disk:
- `mobile-app/assets/icon.png`: $1024 \times 1024$ RGBA, valid PNG.
- `mobile-app/assets/adaptive-icon.png`: $1024 \times 1024$ RGBA, valid PNG.
- `mobile-app/assets/splash.png`: $1242 \times 2436$ RGBA, valid PNG.
- `mobile-app/assets/favicon.png`: $48 \times 48$ RGBA, valid PNG.

---

## 5. Runtime Architecture: Expo Go vs. Standalone Build

| Environment | Supported for EcoSnap? | Rationale |
|---|---|---|
| **Expo Go** | **NO** | `react-native-fast-tflite` requires native C++ JSI libraries (`libtensorflowlite.so`) not pre-bundled in the stock Expo Go app. Running in Expo Go triggers `NitroModules: Module not found`. |
| **Development Build** | **YES** | Built via `eas build -p android --profile development` with `expo-dev-client`. |
| **Preview APK** | **YES (Recommended)** | Built via `eas build -p android --profile preview`. Produces a standalone `.apk` directly installable on physical Android hardware for offline and on-device testing. |
| **Production AAB** | **YES** | Built via `eas build -p android --profile production` for Google Play Console submission. |
