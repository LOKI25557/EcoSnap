# EcoSnap & Segregate — M26 Security & Privacy Audit Report

**Document ID:** `docs/M26_SECURITY_PRIVACY_AUDIT.md`  
**Project:** EcoSnap & Segregate  
**Role:** Member 2 — AI, Mobile Intelligence, On-Device ML & Android Integration  
**Date of Audit:** November 24, 2026  
**Auditor:** Senior Mobile Application Security Architect & Privacy Engineer  
**Status:** **AUDITED & CERTIFIED**  

---

## 1. Executive Summary

This security and privacy audit evaluates the data flow, storage mechanisms, network traffic, credentials exposure, and permission surface of the EcoSnap mobile application.

---

## 2. Hardcoded Secrets & Credentials Audit

- **Environment File:** `mobile-app/.env.example` contains placeholder tokens only (`EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here`). No production API keys, service accounts, or private tokens exist in git history or tracked source code.
- **Gitignore Protection:** Root `.gitignore` and `mobile-app/.gitignore` explicitly exclude `.env`, `.env.local`, `.env.*.local`, `credentials.json`, `google-services.json`, and `*.keystore`.
- **Firebase Initialization:** `firebaseConfig.ts` employs fallback handling that initializes cleanly in Offline Guest Mode without throwing authentication or network exceptions when `.env` is unpopulated.

---

## 3. Privacy Surface & Data Minimization

### 3.1 On-Device AI Classification Privacy
- **Zero Cloud Image Leaks:** Unlike cloud vision APIs (such as Google Cloud Vision or AWS Rekognition), EcoSnap processes all camera frames and uploaded images **entirely on-device** using the local TensorFlow Lite MobileNetV2 model.
- **No Remote Telemetry of Photos:** Captured images are never sent to external servers or remote endpoints for classification.

### 3.2 Sandboxed Local Persistence
- **Sandboxed Directory:** Images saved for scan history are stored exclusively inside the application sandbox (`${documentDirectory}detection_images/`).
- **No Shared External Storage Exposure:** Images are not written to public shared storage (`/sdcard/DCIM` or `/sdcard/Pictures`), preventing unauthorized third-party apps from scraping waste history photos.

### 3.3 Permissions Scope
- **Camera (`CAMERA`):** Restricted to live camera preview and optical barcode scanning.
- **Photos (`READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE`):** Restricted to user-initiated image selection via system picker intents.
- **No Location/Audio Creep:** Audio recording permissions are not requested.

---

## 4. Network Security & Third-Party APIs

### 4.1 Open Food Facts API v2
- **Endpoint:** `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
- **Transport Security:** Enforced HTTPS with TLS 1.3 encryption.
- **Data Transmitted:** Only the scanned numerical barcode string is transmitted. No user identifiers, device IDs, or GPS locations are attached to queries.
- **Offline Fallback:** When offline or when the network times out, the app gracefully degrades to the local seed database and returns an offline error without crashing.

---

## 5. Security Verdict

The EcoSnap mobile application adheres to the principle of least privilege, enforces on-device data processing, protects user privacy, and exposes zero hardcoded secrets.
