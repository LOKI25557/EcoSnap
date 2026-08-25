# Member 1 Production Configuration Validation

This document presents the validation results of the **EcoSnap & Segregate** project configurations (focusing on Member 1 systems) as of August 25, 2026.

## 1. Firebase Environments (`.firebaserc` & `firebase.json`)

* **Environment Separation**:
  * Development project: `ecosnap-dev` (default environment)
  * Production project: `ecosnap-production`
* **Predeploy Steps**:
  * `firebase.json` defines a standard structure linking `firestore`, `storage`, and `functions`.
  * The cloud functions predeploy command compiles Typescript: `npm --prefix "$RESOURCE_DIR" run build`.

---

## 2. Security Rules Audit

### Firestore Rules (`backend/firestore-rules/firestore.rules`)
* **User Profile Security**:
  * Scoped to the individual owner.
  * Creating a user profile validates that the starting score must be `0`.
  * Updating a user profile blocks modifying critical fields: `score`, `createdAt`, and `joinedDate`.
* **Waste History Security**:
  * Scoped to the individual owner.
  * Updating a waste record blocks modifying `userId` and `createdAt`.
* **Pickup Request Security**:
  * Scoped to the individual owner.
  * Creation requires status to be `pending`.
  * Updates allow status modification only to `cancelled` (if currently `pending` or `scheduled`), or if the status remains the same.
  * Prevents editing `userId`, `createdAt`, `wasteRecordId`, and `wasteCategory`.
* **Community Report Security**:
  * Scoped to the individual owner.
  * Creation requires status to be `pending`.
  * Updates block modifying `status`, `resolvedAt`, `rejectedAt`, `userId`, and `createdAt`.
* **Reviews Security**:
  * Publicly readable by authenticated users.
  * Creation/updates require `rating` to be between 1 and 5 and `userId`/`facilityId` to match correctly.
  * Edits/deletions are restricted only to the review owner.

### Storage Rules (`backend/storage-rules/storage.rules`)
* **Profile Images**: Max size 5MB, must match `image/*` mime type, writable/deletable only by owner, readable by authenticated users.
* **Waste Images**: Max size 10MB, must match `image/*` mime type, completely private (readable, writable, deletable only by owner).
* **Report Images**: Max size 10MB, must match `image/*` mime type, readable by all authenticated users (to render on maps), writable/deletable only by owner.

---

## 3. Firestore Indexes Audit (`firestore.indexes.json`)

All complex queries used by repository listings have corresponding compound indexes defined:
* `wasteRecords`: Composite `category` (ASC) + `detectedAt` (DESC)
* `pickupRequests`: Composite `status` (ASC) + `createdAt` (DESC) and `wasteCategory` (ASC) + `createdAt` (DESC)
* `communityReports`: Composite `status` (ASC) + `createdAt` (DESC) and `type` (ASC) + `createdAt` (DESC)
* `notifications`: Composite `userId` (ASC) + `createdAt` (DESC)
* `facilities`: Several composite indexes supporting filters for `isActive`, `verified`, `type`, and sorting by `name`
* `reviews`: Composite `rating` (ASC) + `createdAt` (DESC)

---

## 4. Expo Application & EAS Configuration (`eas.json` & `app.json`)

* **EAS Configuration**:
  * `development`: Development Client enabled, android buildType `apk`
  * `preview`: Internal distribution, android buildType `apk`
  * `production`: App Store distribution, android buildType `app-bundle` (AAB)
* **SDK Version**:
  * Expo SDK version is locked to `^51.0.39` in `package.json`.

---

## 5. Tooling Availability & Diagnostics

Command execution diagnostics returned:
* **`firebase --version`**: **NOT INSTALLED / UNAVAILABLE** (CLI tool is not available in the global path. Configuration changes should be deployed from administrative terminals or CI/CD runner pipelines where the Firebase CLI is set up).
* **`eas --version`**: **NOT INSTALLED / UNAVAILABLE** (CLI tool is not available in the global path. Mobile builds should be executed using CI/CD integration or from developer environments equipped with EAS CLI).
