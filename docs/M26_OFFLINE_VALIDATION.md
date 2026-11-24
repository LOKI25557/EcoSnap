# EcoSnap & Segregate — M26 Offline-First & Local Storage Validation Report

**Document ID:** `docs/M26_OFFLINE_VALIDATION.md`  
**Project:** EcoSnap & Segregate  
**Role:** Member 2 — AI, Mobile Intelligence, On-Device ML & Android Integration  
**Date of Audit:** November 24, 2026  
**Auditor:** Senior Mobile Application Architect & Offline-First Systems Engineer  
**Status:** **AUDITED, SIMULATED & CERTIFIED**  

---

## 1. Executive Summary

EcoSnap is engineered with an **offline-first** paradigm. All core user journeys—AI visual waste classification, disposal recommendations, environmental impact calculations, seed barcode product lookups, scan history, EcoPoints accumulation, and milestone badges—function autonomously without requiring an active internet connection.

---

## 2. Offline Capability Boundary Matrix

| Capability / Flow | Offline Support | Local Data Source / Technology | Verification Status |
|---|---|---|---|
| **AI Waste Classification** | **100% Offline** | Bundled `waste_classifier.tflite` executed via JSI native C++ runtime | **VERIFIED** |
| **Waste Guidance & Instructions** | **100% Offline** | `recyclingKnowledgeBase.ts` (Static encyclopedia of 7 categories) | **VERIFIED** |
| **LCA Environmental Analytics** | **100% Offline** | `analyticsService.ts` formula calculations (CO2 saved, landfill diversion) | **VERIFIED** |
| **Barcode Scanning (Seed Items)**| **100% Offline** | `assets/data/barcode_seed_products.json` (10 traceable products) | **VERIFIED** |
| **Barcode Scanning (Cached)** | **100% Offline** | `${documentDirectory}barcode_cache.json` via `safeStorage` | **VERIFIED** |
| **Barcode Scanning (Unseeded)** | **Online Fallback** | Open Food Facts REST API v2 (`world.openfoodfacts.org`). When offline, gracefully falls back to not-found without crashing | **VERIFIED** |
| **Permanent Image Persistence** | **100% Offline** | `${documentDirectory}detection_images/` via `expo-file-system` | **VERIFIED** |
| **Detection History Logs** | **100% Offline** | `${documentDirectory}detection_history.json` via `safeStorage` | **VERIFIED** |
| **EcoPoints Ledger & Streaks** | **100% Offline** | `@react-native-async-storage/async-storage` via `EcoPointsService` | **VERIFIED** |
| **Milestone Badges** | **100% Offline** | `@react-native-async-storage/async-storage` via `BadgeService` | **VERIFIED** |
| **Application Startup** | **100% Offline** | Offline Guest Mode initialized in `firebaseConfig.ts` without `.env` | **VERIFIED** |
| **Cloud Synchronization** | **Online (Member 1)**| Firestore sync worker (Member 1 scope); non-blocking when offline | **NOT STARTED** |

---

## 3. Local Persistence Subsystems & Resilience

EcoSnap relies on two storage substrates with self-healing wrappers:

### 3.1 AsyncStorage Substrate (`@react-native-async-storage/async-storage`)
- **Managed Entities:**
  - `ecopoints_state`: Points balance, transaction history, daily streak timestamps.
  - `user_badges`: List of unlocked milestone badges and unlock timestamps.
- **Corrupted Data Recovery:**
  - `safeStorage.getAsyncStorage(key, fallback)` catches any JSON parse exception, logs a warning, resets the key to its fallback value, and rewrites valid JSON.
  - Tested and verified in `safeStorage.test.ts`.

### 3.2 FileSystem Substrate (`expo-file-system`)
- **Sandboxed Directory:** `${documentDirectory}` (private to app sandbox, never cleared by OS cache purges).
- **Subdirectories & Files:**
  - `detection_images/`: Copies temporary camera URIs to permanent UUID-named files.
  - `detection_history.json`: Array of `ScanHistoryItem` records.
  - `barcode_cache.json`: Cache of previously looked up barcodes and their packaging breakdowns.
- **Corrupted File Recovery:**
  - `safeStorage.getFile(path, fallback)` catches syntax errors, overwrites corrupt file with fallback, and prevents application crashes. Tested in `safeStorage.test.ts`.

---

## 4. Offline Guest Mode Verification (`firebaseConfig.ts`)

```typescript
// Safe initialization prevents startup crashes when .env is unconfigured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'undefined'
);

if (isFirebaseConfigured) {
  // Initialize Firebase app & auth
} else {
  console.warn('Firebase configuration missing. Running in Offline Guest Mode.');
}
```
When running on an offline device or when `.env` is absent, the app boots into **Offline Guest Mode**, enabling full scanning, guidance, and points accumulation without crashing.
