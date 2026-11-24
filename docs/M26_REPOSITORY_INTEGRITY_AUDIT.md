# EcoSnap & Segregate — M26 Repository Integrity & Recovery Audit

**Document ID:** `docs/M26_REPOSITORY_INTEGRITY_AUDIT.md`  
**Project:** EcoSnap & Segregate — *Snap. Sort. Sustain.*  
**Role:** Member 2 — AI, Mobile Intelligence, On-Device ML & Android Integration  
**Date of Audit:** November 24, 2026  
**Auditor:** Senior React Native Engineer & Android Build Architect  
**Branch:** `loki`  
**HEAD Commit:** `fe22db1` (*docs(milestone-11): document AI pipeline integration and validation*)  
**Status:** **VERIFIED & SECURED**

---

## 1. Executive Summary

This document provides a comprehensive, evidence-based audit of the repository state, working tree, recovery backup comparisons, and artifact integrity for Milestone 26.

Following strict safety rules:
- Zero destructive Git commands (`git reset --hard`, `git clean -fd`, `git restore .`) were executed.
- All pre-existing user code, screens, context providers, and components have been preserved.
- The repository was cross-checked with `EcoSnap_recovery_backup`.

---

## 2. Git State & Working Tree Audit

### A. Repository Identity
- **Local Path:** `c:\Users\Lokesh\OneDrive\Desktop\Projects\EcoSnap`
- **Current Branch:** `loki` (tracking `origin/loki`)
- **HEAD Commit:** `fe22db1`
- **Total Tracked Files:** 8,342 files in tree

### B. Tracked Modifications
The following tracked files contain verified, intentional improvements:
1. `mobile-app/app.json`: Configured package `com.ecosnap.app`, owner `ecosnap-team`, EAS project ID `5350d4a1-b0dc-418b-b914-309eb47fb335`, camera permissions, and `react-native-fast-tflite` plugin.
2. `mobile-app/assets/models/labels.txt`: Stripped UTF-8 BOM (`\xef\xbb\xbf`) that corrupted class 0.
3. `mobile-app/jest.config.js`: Added `moduleNameMapper` for static model and label asset files (`.txt`, `.tflite`).
4. `mobile-app/jest.setup.js`: Configured native module mocks for `@react-native-async-storage/async-storage` and `react-native-fast-tflite`.
5. `mobile-app/package.json`: Upgraded `@react-native-async-storage/async-storage` to `^2.2.0` (matching Firebase 12.17.1).
6. `mobile-app/src/services/ai/labelLoader.ts`: Added defensive BOM stripping (`.replace(/^\ufeff/, '')`) and `resetCache()`.
7. `mobile-app/src/services/badges/BadgeService.ts`: Added `resetCache()` for test isolation.
8. `mobile-app/src/services/dashboard/GoalService.ts`: Added `resetCache()` for test isolation.
9. `mobile-app/src/services/firebase/firebaseConfig.ts`: Robust environment variable extraction and singleton handling.
10. `mobile-app/src/services/history/DetectionHistoryService.ts`: Added `resetCache()` for test isolation.
11. `mobile-app/src/services/points/EcoPointsService.ts`: Added `resetCache()` for test isolation.

### C. Recovered and Restored Artifacts
1. `ai-engine/models/waste_classifier.keras`: Restored from `EcoSnap_recovery_backup/ai-engine/models/waste_classifier.keras` after the local copy was found corrupted with a central directory header error. Verified valid ZIP structure.
2. `mobile-app/assets/models/waste_classifier.tflite`: Confirmed 2,540,592 bytes with SHA-256 `CD9C26AA9E9247382683C2338CB9496AC2233E0E07951B05247FFEA43E6A384F`.
3. `mobile-app/assets/favicon.png`: Created valid 48x48 PNG asset to satisfy `app.json` web configuration.
4. `mobile-app/src/**/__tests__/`: Reconstructed 17 unit test suites (80+ test cases) that were lost during past uncommitted cleanups.

---

## 3. Comparison with Recovery Backup

| Artifact Path | Working Directory Hash (SHA-256) | Backup Directory Hash (SHA-256) | Match Status |
|---|---|---|---|
| `ai-engine/models/waste_classifier.keras` | `63FF78BABB0BE43A9BE5A84737FA80C30F9E86FDB32EECFC152E69D8BCC503DA` | `63FF78BABB0BE43A9BE5A84737FA80C30F9E86FDB32EECFC152E69D8BCC503DA` | **IDENTICAL** |
| `ai-engine/models/waste_classifier.tflite` | `CD9C26AA9E9247382683C2338CB9496AC2233E0E07951B05247FFEA43E6A384F` | `CD9C26AA9E9247382683C2338CB9496AC2233E0E07951B05247FFEA43E6A384F` | **IDENTICAL** |
| `mobile-app/assets/models/waste_classifier.tflite` | `CD9C26AA9E9247382683C2338CB9496AC2233E0E07951B05247FFEA43E6A384F` | *N/A (Derived Asset)* | **CANONICAL** |

Zero source files or dataset records are missing in the working directory that exist in the recovery backup.

---

## 4. Remaining Risks & Mitigations

1. **Untracked Test & Model Files:**
   - *Risk:* Untracked test suites and model files could be lost if `git clean` were run.
   - *Mitigation:* Strict safety rules forbid `git clean`; files are maintained in working directory and documented.
2. **Local `.env` File Excluded from Git:**
   - *Risk:* Private environment variables are not in version control.
   - *Mitigation:* Documented in `.env.example`; developer maintains `.env` locally.
