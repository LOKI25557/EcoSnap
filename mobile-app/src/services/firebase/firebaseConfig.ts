import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Read Expo public environment variables explicitly.
const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;

// Validate configuration.
const missingVars = [
  ['EXPO_PUBLIC_FIREBASE_API_KEY', apiKey],
  ['EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', authDomain],
  ['EXPO_PUBLIC_FIREBASE_PROJECT_ID', projectId],
  ['EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', storageBucket],
  ['EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', messagingSenderId],
  ['EXPO_PUBLIC_FIREBASE_APP_ID', appId],
].filter(([, value]) => !value);

if (missingVars.length > 0) {
  throw new Error(
    `Firebase configuration error: Missing environment variables:\n${missingVars
      .map(([key]) => `  - ${key}`)
      .join('\n')}\n\nPlease check your local .env file in the mobile-app directory.`
  );
}

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

// Initialize Firebase only once.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services.
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
