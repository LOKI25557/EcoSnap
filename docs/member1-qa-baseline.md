# Member 1 QA Validation Baseline

This document establishes the final QA baseline and testing organization for the **EcoSnap & Segregate** Member 1 (Pravee) services on the `pravee` branch.

## Services Under Test

The following core modules and services fall under Member 1's responsibility:

1. **Authentication**: `authService.ts`, `AuthContext.tsx`, `AuthNavigator.tsx`
2. **Firestore Repository Layer**: `wasteRepository.ts`, `pickupRepository.ts`, `communityReportRepository.ts`, `reviewRepository.ts`
3. **Firebase Storage**: `storageService.ts`
4. **Notifications & Reminders**: `notificationRepository.ts`, `notificationEventService.ts`
5. **Location & Maps**: `LocationService.ts`, `mapsService.ts`
6. **Recycling Facilities**: `facilityService.ts`

---

## Core Requirements & Expected Behavior

### 1. Authentication
* **Expected Behavior**:
  * Users can register with valid credentials (name, email, password >= 6 characters).
  * Registered users have a corresponding profile initialized in the Firestore `users` collection.
  * Users can log in with valid credentials, reset passwords via email, and log out securely.
  * Unauthenticated users are redirected to `AuthNavigator`. Authenticated users are directed to `MainNavigator`/`TabNavigator`.
  * Protect operations so that logged-out or unauthenticated sessions are blocked.

### 2. Firestore & Repository Layer
* **Expected Behavior**:
  * **Waste History**: Create waste records, list history sorted by detection date descending, support pagination and category filtering.
  * **Pickup Requests**: Users can create pickup requests (with location coordinates, dates in the future, and valid time slots) associated with a waste record.
  * **Community Reports**: Create, read, and list reports. Restrict status updates (`pending`, `under_review`, `verified`, `resolved`, `rejected`) to admin override. Validate latitude `[-90, 90]` and longitude `[-180, 180]`.
  * **Reviews & Ratings**: Allow users to rate and review facilities (ratings 1-5, comments <= 500 chars). Limit one review per user per facility.
  * **Permissions & Ownership**: Client services must enforce that users cannot query, read, update, or delete records belonging to another user.

### 3. Firebase Storage
* **Expected Behavior**:
  * Users can upload files (blob conversions) to path structures:
    * Profile images: `users/{uid}/profile/{filename}`
    * Waste images: `users/{uid}/waste/{recordId}/{filename}`
    * Report images: `users/{uid}/reports/{reportId}/{filename}`
  * Enforce that deletion of waste records or community reports deletes the corresponding Storage file.
  * Map storage errors correctly (e.g. object-not-found, unauthorized).

### 4. Location & Maps
* **Expected Behavior**:
  * Gracefully handle cases where location permission is denied by fallback to last known location.
  * Verify out-of-bounds latitude/longitude checks.
  * Generate OS-specific map navigation URLs (Apple Maps on iOS, Google Maps on Android/default).
  * Calculate correct distance in meters between coordinates using the Haversine formula.

### 5. Notifications & Reminders
* **Expected Behavior**:
  * Prevent sending credentials, tokens, passwords, or precise locations in notification payloads.
  * Safely handle cases where push notifications are disabled or permissions are denied without crashing the app.

---

## Existing Test Suites

The project already contains the following Jest tests located in `mobile-app/src`:

1. `utils/__tests__/wasteAnalytics.test.ts`
2. `services/recycling/__tests__/facilityService.test.ts`
3. `services/location/__tests__/LocationAndMapsService.test.ts`
4. `services/firebase/__tests__/wasteRepository.test.ts`
5. `services/firebase/__tests__/reviewRepository.test.ts`
6. `services/firebase/__tests__/pickupRepository.test.ts`
7. `services/firebase/__tests__/notificationRepository.test.ts`
8. `services/firebase/__tests__/communityReportRepository.test.ts`
9. `services/firebase/__tests__/authService.test.ts`
10. `services/ai/__tests__/pipelineService.test.ts`

These existing tests are highly comprehensive, covering validations, pagination, filtering, ownership boundaries, and status transitions.

---

## Final QA Execution Checklist

We will execute validation checks across the following phases:
* **Phase 1**: Setup test environment variables globally for Jest, add `MainNavigator` and `storageService` regression tests.
* **Phase 2**: Audit existing tests, check coordinates, error fallbacks, status transitions, and data ownership validations.
* **Phase 3**: Audit files for hardcoded secrets, passwords, sensitive logs, and console statements. Validate Firestore and Storage production-ready security rules.
* **Phase 4**: Run compiler type-checking (`npm run ts:check`), run Jest tests (`npm run test`), and run Expo doctor diagnostics.
