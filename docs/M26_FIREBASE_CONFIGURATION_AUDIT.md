# EcoSnap & Segregate — M26 Firebase & Environment Configuration Audit

**Document ID:** `docs/M26_FIREBASE_CONFIGURATION_AUDIT.md`  
**Project:** EcoSnap & Segregate — *Snap. Sort. Sustain.*  
**Role:** Member 2 — AI, Mobile Intelligence, On-Device ML & Android Integration  
**Date of Audit:** November 24, 2026  
**Auditor:** Senior Security Architect & Full-Stack React Native Engineer  
**Status:** **AUDITED & VERIFIED SAFE**

---

## 1. Project Identity Disambiguation

| Configuration Scope | Identifier | Purpose | Authority / Member |
|---|---|---|---|
| **Firebase Project ID** | `ecosnap-c97dc` | Cloud Backend, Auth, Firestore, Storage | Member 1 (Praveena) |
| **Expo EAS Project ID** | `5350d4a1-b0dc-418b-b914-309eb47fb335` | EAS Build Cloud Pipeline, Android APK | Member 2 (Lokesh) |
| **Expo Owner** | `ecosnap-team` | Expo Application Services Organization | Joint Workspace |
| **Android Application ID** | `com.ecosnap.app` | Android Operating System Identity | Member 2 (Lokesh) |

---

## 2. Environment Variables & Secret Protection Audit

### A. Environment Variable Ingestion
In [firebaseConfig.ts](file:///c:/Users/Lokesh/OneDrive/Desktop/Projects/EcoSnap/mobile-app/src/services/firebase/firebaseConfig.ts), environment variables are consumed via Expo's static replacement prefix (`EXPO_PUBLIC_`):
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID` (`ecosnap-c97dc`)
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

### B. Defensive Missing Configuration Guard
If any variable is absent from the developer's local environment, `firebaseConfig.ts` fails fast with an explicit, actionable error:
```typescript
const missingVars = [...].filter(([, value]) => !value);
if (missingVars.length > 0) {
  throw new Error(`Firebase configuration error: Missing environment variables:\n...`);
}
```

### C. Git Exclusion & Secret Hygiene
- Root [.gitignore](file:///c:/Users/Lokesh/OneDrive/Desktop/Projects/EcoSnap/.gitignore) explicitly contains:
  ```gitignore
  .env
  .env.local
  .env.*.local
  ```
- No API keys, secret hashes, or private tokens are checked into version control or logged in test output.
- Template file [.env.example](file:///c:/Users/Lokesh/OneDrive/Desktop/Projects/EcoSnap/mobile-app/.env.example) is committed to guide developer configuration without exposing credentials.

---

## 3. Firebase Singleton & Authentication Architecture

### A. Singleton Initialization
To prevent duplicate app initialization during Expo Fast Refresh in development:
```typescript
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
```

### B. Authentication & Member 1 Ownership Boundaries
- Primary authentication methods are managed by Member 1 in [authService.ts](file:///c:/Users/Lokesh/OneDrive/Desktop/Projects/EcoSnap/mobile-app/src/services/firebase/authService.ts).
- Member 2's AI and inference pipeline operates in **100% offline guest mode**:
  - Detection, image capture, TFLite inference, disposal recommendations, and local scan history function with zero network access and zero Firebase dependency.
  - When the user is logged in, scans save locally first, enabling subsequent cloud synchronization once online.

### C. Analytics Distinction Note
> [!NOTE]
> The presence of a web measurement ID in Firebase console or `.env` template does not establish native React Native Google Analytics support. Native analytics requires `@react-native-firebase/analytics` or Expo-compatible native bridges. EcoSnap relies on local on-device metrics in `analyticsService.ts` and does not claim native Firebase Analytics integration.
