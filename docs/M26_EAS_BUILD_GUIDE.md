# EcoSnap & Segregate — M26 EAS Build & Sideloading Guide

**Document ID:** `docs/M26_EAS_BUILD_GUIDE.md`  
**Project:** EcoSnap & Segregate  
**Role:** Member 2 — AI, Mobile Intelligence, On-Device ML & Android Integration  
**Date of Audit:** November 24, 2026  
**Auditor:** Senior Android Release & Build Automation Specialist  
**Status:** **CONFIGURED & PREPARED (Awaiting Developer Build)**  

---

## 1. Executive Summary

This guide details the complete procedure for building and sideloading the **EcoSnap Standalone Preview APK** on physical Android hardware.

Because EcoSnap incorporates `react-native-fast-tflite` (which links against native C++ shared libraries `libtensorflowlite.so`), the application **cannot run in standard Expo Go**. A standalone Preview APK must be generated using EAS Build.

---

## 2. EAS Build Configuration (`mobile-app/eas.json`)

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
  },
  "submit": {
    "production": {}
  }
}
```

### Profile Breakdown:
- **`preview` Profile (Target for M26):**
  - Distribution: `internal`
  - Output Type: `apk` (Stand-alone installable Android Package)
  - Features: Self-contained native binary with bundled TFLite runtime, bundled model weights (`waste_classifier.tflite`), offline seed database, and camera permissions. Does not require an active Metro bundler.
- **`development` Profile:**
  - Distribution: `internal`
  - Output Type: `apk` with Expo Dev Client embedded for live code reloading.
- **`production` Profile:**
  - Output Type: `app-bundle` (`.aab`) for Google Play Store publication.

---

## 3. Step-by-Step Developer Sideloading Instructions

### Step 1: Install EAS CLI Globally
Open a Windows PowerShell terminal as Administrator or regular user and run:
```powershell
npm install -g eas-cli
```
Verify the installation:
```powershell
eas --version
```
*Expected output: `eas-cli/14.x.x` or similar.*

---

### Step 2: Authenticate with Expo Application Services (EAS)
Log in to your Expo developer account:
```powershell
eas login
```
Enter your Expo username and password when prompted. Verify authentication:
```powershell
eas whoami
```

---

### Step 3: Trigger the Standalone Preview APK Build
Navigate to the `mobile-app` directory and trigger the preview build:
```powershell
cd C:\Users\Lokesh\OneDrive\Desktop\Projects\EcoSnap\mobile-app
eas build -p android --profile preview
```

#### What EAS Build Will Do:
1. Package the project source code and native assets.
2. Upload the bundle to EAS Cloud Build servers.
3. Run `expo prebuild` to generate the native Android project with custom config plugins (`react-native-fast-tflite`, `expo-camera`, `expo-image-picker`).
4. Compile native C++ libraries and Java/Kotlin sources using Gradle.
5. Produce a downloadable `.apk` file and provide a public download URL and QR code.

---

### Step 4: Sideload APK onto Android Handset

#### Method A: Direct Phone Download (Recommended)
1. Open the EAS build completion URL in your phone's browser (or scan the terminal QR code).
2. Download the `.apk` file (approx. 45–65 MB).
3. Open the downloaded file. When prompted *"For your security, your phone is not allowed to install unknown apps from this source"*, tap **Settings** $\to$ toggle **Allow from this source**.
4. Tap **Install**.

#### Method B: USB Debugging via ADB
If you have Android SDK Platform-Tools installed:
```powershell
# 1. Connect phone via USB with USB Debugging enabled
adb devices
# Output should list your device: e.g., <device_serial> device

# 2. Install the APK directly:
adb install -r "C:\Users\Lokesh\Downloads\ecosnap-preview.apk"
```

---

### Step 5: Execute Physical Device Verification
Once installed, open the app and execute the 20 test cases documented in:  
[docs/M26_PHYSICAL_DEVICE_TEST_RESULTS.md](file:///c:/Users/Lokesh/OneDrive/Desktop/Projects/EcoSnap/docs/M26_PHYSICAL_DEVICE_TEST_RESULTS.md)
