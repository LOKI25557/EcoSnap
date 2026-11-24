# EcoSnap & Segregate — M26 Dependency & Security Audit

**Document ID:** `docs/M26_DEPENDENCY_SECURITY_AUDIT.md`  
**Project:** EcoSnap & Segregate — *Snap. Sort. Sustain.*  
**Role:** Member 2 — AI, Mobile Intelligence, On-Device ML & Android Integration  
**Date of Audit:** November 24, 2026  
**Auditor:** Senior Software Security Auditor & React Native Architect  
**Status:** **AUDITED & RISK-CLASSIFIED (ZERO FORCED BREAKING UPGRADES APPLIED)**

---

## 1. Dependency Tree & Expo Compatibility

### A. Environment Core
- **Expo SDK:** `51.0.39`
- **React Native:** `0.74.5`
- **React:** `18.2.0`
- **TypeScript:** `~5.3.3`
- **Firebase:** `12.17.1`
- **AsyncStorage:** `^2.2.0` (with `expo.install.exclude` configured in `package.json`)

### B. Compatibility Diagnostics (`npx expo install --check`)
```text
Skipped checking dependencies: @react-native-async-storage/async-storage.
Dependencies are up to date
```

---

## 2. Security Vulnerability Classification

A complete scan was executed via `npm audit` and `npm audit --omit=dev`. In strict adherence to engineering safety policies, **`npm audit fix --force` was NOT executed**, as npm proposed breaking changes (e.g., upgrading to Expo 58 or downgrading Firebase to 9.14.0) that would dismantle the Expo SDK 51 runtime.

### Vulnerability Classification Matrix

| Package Name | Severity | Direct / Transitive | Scope (Prod / Dev) | Originating Dependency | Risk Classification & Recommended Action |
|---|---|---|---|---|---|
| `@grpc/grpc-js` | High | Transitive | Production | `@firebase/firestore` $\to$ `firebase` | **Accepted Temporary Risk:** Upstream gRPC client issue within Firebase JS SDK. Remediation requires Google Firebase team patch in a future 12.x release. |
| `@xmldom/xmldom` | High | Transitive | Production | `@firebase/firestore` $\to$ `firebase` | **Accepted Temporary Risk:** XML parsing vulnerability in Firestore serialization. App does not process untrusted external XML documents. |
| `tar` | Critical | Transitive | Development | CLI & Build tooling (`expo`, `metro`) | **Dev-Only Risk:** Hardlink/symlink traversal during local extraction. Does not affect mobile client APK execution on Android devices. |
| `shell-quote` | Critical | Transitive | Development | Local CLI scripts / Metro | **Dev-Only Risk:** Command injection during build CLI execution. Workstation-only build tool; not bundled into Android APK runtime. |
| `zod` | High | Transitive | Development | `babel-plugin-react-compiler` $\to$ `babel-preset-expo` | **Dev-Only Risk:** Compiler memory exhaustion during Babel AST transformation. Transpiler-only dependency. |
| `postcss` | Moderate | Transitive | Development | Web build bundling tools | **Dev-Only Risk:** Source map path traversal during web bundling. Unused in native Android Hermes APK. |
| `uuid` | Moderate | Transitive | Development | `@expo/bunyan`, `@expo/rudder-sdk-node` | **Dev-Only Risk:** Buffer bounds check in CLI telemetry tooling. Not included in client production APK. |

---

## 3. Security Recommendations

1. **Do Not Run Forced Upgrades:** Forced automated upgrades (`npm audit fix --force`) break Expo SDK 51 and React Native 0.74.5 native bridge bindings.
2. **Offline-First Security Advantage:** Because the waste classification engine, TFLite inference, image preprocessing, and disposal guidance run 100% locally on-device without network calls, EcoSnap's core AI pipeline is completely isolated from remote network and HTTP-layer vulnerabilities.
3. **Future Migration Horizon:** When migrating to a future Expo SDK version (e.g., Expo SDK 52+), coordinate a synchronized upgrade of `@firebase/firestore` and CLI tooling.
