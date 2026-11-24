# Production Deployment Guide

This document describes how to deploy the EcoSnap & Segregate services, databases, rules, indexes, and mobile apps to production.

---

## 1. Firebase Backend Deployment

Ensure you have the Firebase CLI installed and you are logged into the correct Google Account:
```bash
npm install -g firebase-tools
firebase login
```

### 1.1 Project Selection
Ensure you are using the correct target Firebase project:
```bash
# Verify configured project aliases
firebase projects:list

# Switch to the production target (defined in .firebaserc)
firebase use production
```

### 1.2 Deployment Commands

Deploy all Firebase services together:
```bash
firebase deploy
```

Deploy specific components separately to minimize downtime or test rules changes:

- **Firestore Security Rules:**
  ```bash
  firebase deploy --only firestore:rules
  ```

- **Firestore Composite Indexes:**
  ```bash
  firebase deploy --only firestore:indexes
  ```

- **Cloud Storage Security Rules:**
  ```bash
  firebase deploy --only storage:rules
  ```

- **Cloud Functions:**
  ```bash
  firebase deploy --only functions
  ```

---

## 2. Environment Variables Configuration

The React Native application uses dynamic environment variables loaded via Expo. Do **not** commit actual keys to version control.

Prepare a local production `.env` file in the `mobile-app` directory (this file is excluded from Git via `.gitignore`):

```env
EXPO_PUBLIC_FIREBASE_API_KEY=production_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=production_auth_domain_here
EXPO_PUBLIC_FIREBASE_PROJECT_ID=production_project_id_here
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=production_storage_bucket_here
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=production_messaging_sender_id_here
EXPO_PUBLIC_FIREBASE_APP_ID=production_app_id_here
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=production_google_maps_key_here
```

---

## 3. Expo Mobile App Build (EAS)

Ensure you have EAS CLI installed and initialized:
```bash
npm install -g eas-cli
eas login
```

### 3.1 Build Commands
To compile production builds for release:

- **Android App Bundle (AAB):**
  ```bash
  eas build --platform android --profile production
  ```

- **iOS App (IPA):**
  ```bash
  eas build --platform ios --profile production
  ```

- **All platforms:**
  ```bash
  eas build --platform all --profile production
  ```

---

## 4. Rollback and Recovery Considerations

### 4.1 Security Rules Rollback
If a newly deployed Firestore or Storage rule set causes production issues:
1. Locate the previous working rules in your Git history.
2. Revert the file (`firestore.rules` or `storage.rules`).
3. Re-deploy the rules immediately:
   ```bash
   firebase deploy --only firestore:rules
   ```

### 4.2 Composite Indexes Rollback
*Note: Firestore indexes cannot be updated in-place. Deleting an index takes effect immediately.*
To revert an index optimization:
1. Revert the index structure in `firestore.indexes.json`.
2. Deploy the index changes:
   ```bash
   firebase deploy --only firestore:indexes
   ```
3. Alternately, navigate to the Firebase Console -> Firestore -> Indexes and manually delete the index.

### 4.3 Cloud Functions Rollback
If a Cloud Function introduces bugs:
1. Revert code changes in `backend/cloud-functions/src/index.ts`.
2. Redeploy the functions:
   ```bash
   firebase deploy --only functions
   ```
3. To temporarily stop function triggers, you can disable them in the Google Cloud Console Function Panel.
