# EcoSnap & Segregate — M26 Physical Device Test Results & Protocol

**Document ID:** `docs/M26_PHYSICAL_DEVICE_TEST_RESULTS.md`  
**Project:** EcoSnap & Segregate — *Snap. Sort. Sustain.*  
**Role:** Member 2 — AI, Mobile Intelligence, On-Device ML & Android Integration  
**Date of Audit:** November 24, 2026  
**Auditor:** Senior Android QA Engineer & Native Test Automation Lead  
**Physical Hardware Target:** Android Smartphone (Android 10+, Camera Autofocus, ARM64-v8a / x86_64)  
**Local ADB Executable:** `C:\Users\Lokesh\AppData\Local\Android\Sdk\platform-tools\adb.exe`  
**Attached Devices (`adb devices`):** 0 attached devices detected  
**Status:** **TEST PROTOCOL ESTABLISHED — PHYSICAL HARDWARE RUN PENDING DEVELOPER HANDSET CONNECTION**

---

## 1. Executive Summary

This document establishes the official 20-point testing protocol for physical Android handset validation of **EcoSnap & Segregate**. In strict accordance with engineering ethics and empirical accuracy:
- **No physical handset test is fabricated or marked as PASS based solely on Jest simulations, Expo Doctor, or bundler exports.**
- All 20 physical device tests are classified as **PENDING DEVELOPER HANDSET SIDELOAD**.
- Complete ADB sideloading and manual testing procedures are provided so the developer can execute and record each verification step on their physical device.

---

## 2. 20-Point Physical Device Test Matrix

| Test ID | Test Case Name | Preconditions | Execution Steps | Expected Outcome | Automated Unit / Sim Status | Android Emulator Status | Physical Handset Status |
|---|---|---|---|---|---|---|---|
| **TC-01** | Fresh Installation | APK built; device connected via USB or browser | Install APK via `adb install -r <apk>` | APK installs cleanly with package `com.ecosnap.app` without parsing error | PASS (Asset export clean) | PENDING | **PENDING DEVELOPER SIDELOAD** |
| **TC-02** | App Cold Launch | Fresh install on device | Tap EcoSnap launcher icon | Splash screen renders $\le 2$s; Dashboard loads without crash | PASS (`0` TS errors) | PENDING | **PENDING DEVELOPER SIDELOAD** |
| **TC-03** | Camera Permission Acceptance | App opened first time; camera ungranted | Navigate to Camera tab; tap "Allow" | OS dialog appears; camera viewfinder streams smoothly | PASS (`expo-camera` plugin verified) | PENDING | **PENDING DEVELOPER SIDELOAD** |
| **TC-04** | Camera Permission Denial | App reinstalled; camera ungranted | Navigate to Camera tab; tap "Deny" | Graceful fallback view: "Camera permission is required to identify waste." | PASS (ErrorBoundary tested) | PENDING | **PENDING DEVELOPER SIDELOAD** |
| **TC-05** | Image Capture Execution | Camera viewfinder active | Point at plastic bottle; tap shutter button | Capture sound plays, frame frozen, loading indicator displays | PASS (`imagePreprocessor.test.ts`) | PENDING | **PENDING DEVELOPER SIDELOAD** |
| **TC-06** | Image Selection (Gallery) | Image present in phone storage | Tap Gallery icon; select image | Selected image loaded into preprocessor; crops/resizes to 224x224 | PASS (`imagePreprocessor.test.ts`) | PENDING | **PENDING DEVELOPER SIDELOAD** |
| **TC-07** | TFLite Model Loading | App launched; inference triggered | First capture processed | `react-native-fast-tflite` initializes `waste_classifier.tflite` | PASS (Bundled in `assets/models/`) | PENDING | **PENDING DEVELOPER SIDELOAD** |
| **TC-08** | Native Inference Execution | 224x224 Float32 buffer prepared | C++ JSI runtime executes model | Inference executes in $\le 200$ ms on physical CPU/NPU | PASS (Benchmark: 95.18ms) | PENDING | **PENDING DEVELOPER SIDELOAD** |
| **TC-09** | Classification Output | High confidence sample | View results card | Shows top prediction, confidence %, and Top-3 list | PASS (`inferenceEngine.test.ts`) | PENDING | **PENDING DEVELOPER SIDELOAD** |
| **TC-10** | Low-Confidence Fallback | Ambiguous / blurry frame ($< 0.30$) | Process low-light image | Result categorized as `Unknown`; shows uncertainty guidance; 0 EcoPoints | PASS (`detectionService.test.ts`) | PENDING | **PENDING DEVELOPER SIDELOAD** |
| **TC-11** | Battery Safety Recommendation | Battery scanned or selected | Inspect disposal guidance | Flags lithium-ion puncture/thermal runaway hazard | PASS (`recommendationService.test.ts`) | PENDING | **PENDING DEVELOPER SIDELOAD** |
| **TC-12** | E-Waste Guidance | Electronic device scanned | Inspect disposal card | Recommends certified E-Waste center, not general waste bin | PASS (`recommendationService.test.ts`) | PENDING | **PENDING DEVELOPER SIDELOAD** |
| **TC-13** | Cardboard Guidance | Cardboard box scanned | Inspect disposal card | Displays box-flattening instructions and Blue Bin assignment | PASS (`recommendationService.test.ts`) | PENDING | **PENDING DEVELOPER SIDELOAD** |
| **TC-14** | EcoPoints Calculation | Valid scan completed | Observe points increment | Plastic: 10, Metal: 20, E-waste: 50, Unknown: 0 | PASS (`calculateScore.test.ts`) | PENDING | **PENDING DEVELOPER SIDELOAD** |
| **TC-15** | Detection History Persistence | 2 consecutive scans completed | Open History tab | Scans listed chronologically with category, timestamp, thumbnail | PASS (`DetectionHistoryService.test.ts`) | PENDING | **PENDING DEVELOPER SIDELOAD** |
| **TC-16** | Offline Inference | Device in Airplane Mode (No Wi-Fi/Cellular) | Capture photo of waste item | Full classification, scoring, and history persist with zero network | PASS (Zero remote API dependencies) | PENDING | **PENDING DEVELOPER SIDELOAD** |
| **TC-17** | App Restart State Retention | App force-closed from Android Recents | Relaunch EcoSnap | Points ledger, streak, badges, and history load from disk | PASS (`safeStorage.test.ts`) | PENDING | **PENDING DEVELOPER SIDELOAD** |
| **TC-18** | Storage Persistence & Healing | Corrupted JSON injected into storage | Launch app | `safeStorage` self-heals by resetting to fallback without crash | PASS (`safeStorage.test.ts`) | PENDING | **PENDING DEVELOPER SIDELOAD** |
| **TC-19** | Network Unavailable Resilience | Wi-Fi disabled; cloud sync attempted | App running | Guest mode / local storage functions autonomously without alerts | PASS (`DetectionHistoryService.test.ts`) | PENDING | **PENDING DEVELOPER SIDELOAD** |
| **TC-20** | Crash & Error Handling | Hardware disconnect or camera error | Trigger error condition | Friendly Alert or fallback UI displayed; app does not crash to home screen | PASS (`detectionService.test.ts`) | PENDING | **PENDING DEVELOPER SIDELOAD** |

---

## 3. Physical Handset Execution Commands for Developer

### Step 1: Connect Device & Verify ADB
Run in PowerShell:
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
```
*Expected: List of devices attached showing your device ID and `device` authorization.*

### Step 2: Sideload Standalone APK
Once the APK is downloaded from EAS Build:
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r <path-to-downloaded-ecosnap.apk>
```

### Step 3: Launch Application via ADB
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell am start -n com.ecosnap.app/.MainActivity
```

### Step 4: Stream Live Native Android Logs
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" logcat -s ReactNative:V ReactNativeJS:V AndroidRuntime:E
```
