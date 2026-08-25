// Mock environment variables for Firebase configuration
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'mock-api-key';
process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = 'mock-auth-domain';
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'mock-project-id';
process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = 'mock-storage-bucket';
process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'mock-sender-id';
process.env.EXPO_PUBLIC_FIREBASE_APP_ID = 'mock-app-id';
process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = 'mock-maps-api-key';

// Mock AsyncStorage
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Global mock for firebase/firestore to avoid ESM import errors
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  getDocs: jest.fn(() => {
    const docs = [];
    return {
      docs,
      forEach: (cb) => docs.forEach(cb),
    };
  }),
  serverTimestamp: jest.fn(() => new Date()),
}));

// Global mocks for other firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
}));
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
}));
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
}));
