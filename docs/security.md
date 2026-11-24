# Production Security Hardening Document

This document outlines the security architecture, rules, API configuration restrictions, input validations, error-handling mechanisms, and checklist prepared for the EcoSnap & Segregate production release.

---

## 1. Authentication Hardening

1. **Client-Side Validations:**
   - E-mail addresses are normalized and validated against standard formats before transmission to Firebase Auth.
   - Registration passwords must be at least 6 characters in length to meet Firebase password complexity standards.
2. **Error Normalization:**
   - Firebase Auth internal errors are mapped to user-friendly warnings (defined in `authErrors.ts`) such as "Invalid email or password", "This email address is already in use", or "A network error occurred. Please check your connection."
   - Raw database errors, system traces, or technical error messages are never exposed to clients.
3. **Sensitive Logs Prevention:**
   - Password fields, session tokens, and raw credentials are never logged or stored.

---

## 2. Firestore Access Control & Rules

Firestore rules enforce authorization at the database level:

1. **User Profiles (`/users/{userId}`):**
   - Read/write access restricted to the profile owner.
   - Immutability: Users cannot modify their own `score`, `createdAt`, or `joinedDate` fields directly; score incrementing is reserved for backend logic.
2. **Waste Records (`/users/{userId}/wasteRecords`):**
   - Scoped to the authenticated owner.
   - Prevents other users from reading or editing someone else's waste detection logs.
3. **Pickup Requests (`/users/{userId}/pickupRequests`):**
   - Creation restricted to the authenticated owner with status initialized to `'pending'`.
   - Update constraints: Only status changes conforming to transition paths (e.g. `pending -> scheduled -> completed` or cancellation) are permitted. User ID and waste parameters are immutable.
4. **Community Reports (`/users/{userId}/communityReports`):**
   - Read/write restricted to the reporting user. Status and resolving metadata are protected from client writes.
5. **Facilities & Reviews (`/facilities/{facilityId}/reviews`):**
   - Facilities are write-protected against all clients.
   - Review creation is restricted to one review per user per facility. Ratings are validated to be integers in `[1, 5]`. Users can only edit or delete reviews that they created.
6. **Defense-in-depth:**
   - All legacy top-level collection names (`/wasteRecords`, `/pickupRequests`, `/communityReports`, `/reviews`, `/notifications`) are explicitly denied write/read access to block accidental bypasses.

---

## 3. Storage Rules & Media Validation

Firebase Storage security rules protect user uploads:

1. **Path-based Scoping:**
   - Upload paths are restricted to user directories: `/users/{uid}/profile/...`, `/users/{uid}/waste/...`, and `/users/{uid}/reports/...`.
2. **Size Validation:**
   - Profile images are restricted to `< 5MB`.
   - Waste records and report images are restricted to `< 10MB`.
3. **MIME-Type Restrictions:**
   - Only standard image uploads (`image/.*`) are allowed. Executable, text, or script uploads are blocked.

---

## 4. Cloud Functions Security

1. **Input Validation:**
   - Input payloads (e.g., status changes or targets) are validated explicitly before processing.
2. **Authentication Checks:**
   - The caller's identity is verified via `context.auth`. If `context.auth` is undefined, the function returns a `functions.https.HttpsError` with status `unauthenticated`.
3. **Authorization & Role Verification:**
   - Admin functions (e.g., `sendSystemNotification`) verify that the calling UID corresponds to a user record with role `'admin'`.
4. **Safe Errors:**
   - internal stack traces are captured in logging buckets, and only sanitized, predictable results are returned to the client.
5. **Atomic Aggregation:**
   - Review statistics are calculated inside a transaction on the backend, preventing race conditions or corrupted values.

---

## 5. Google Maps Security API Restrictions

Client-facing API keys must be locked down in Google Cloud Console:
- **HTTP Referrers / Platform Restrictions:**
  - The Android key is restricted to the package name `com.pravee.ecosnap` and the SHA-1 fingerprint of the signing certificate.
  - The iOS key is restricted to bundle identifier `com.pravee.ecosnap`.
- **API Restrictions:** Keys should strictly be allowed access to **Maps SDK for Android** and **Maps SDK for iOS** only.
- **Backend Routing:** Server-secret APIs (e.g. Geocoding, Places) should not be used client-side; native device features (e.g. `expo-location`) or secure backend proxy endpoints should be used instead.

---

## 6. Production Security Checklist

- [ ] Firebase project created and correct aliases configured in `.firebaserc`.
- [ ] Authentication providers enabled and email verification activated.
- [ ] Firestore Security Rules deployed.
- [ ] Firebase Storage Security Rules deployed.
- [ ] Firestore composite indexes deployed.
- [ ] Cloud Functions compiled and deployed.
- [ ] Google Maps API keys created and platform/API restrictions applied on Google Cloud Console.
- [ ] Environment variables configured correctly in EAS Secrets or production `.env`.
- [ ] Verification audit: no keys, passwords, or credentials exist in version-controlled source files.
- [ ] TypeScript check passing (`npm run ts:check`).
- [ ] Jest Unit/Integration tests passing (`npm run test`).
- [ ] Expo configuration check completed (`npx expo-doctor`).
- [ ] Production build compiled and manually validated on physical devices.
