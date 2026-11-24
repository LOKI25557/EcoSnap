
// Mock environment variables for Firebase configuration
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'mock-api-key';
process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = 'mock-auth-domain';
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'mock-project-id';
process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = 'mock-storage-bucket';
process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'mock-sender-id';
process.env.EXPO_PUBLIC_FIREBASE_APP_ID = 'mock-app-id';
process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID = 'mock-measurement-id';
process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = 'mock-maps-api-key';

// Mock AsyncStorage
jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-fast-tflite
jest.mock('react-native-fast-tflite', () => ({
  loadTensorflowModel: jest.fn(),
}));

// Mock Firebase Firestore
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
  getDocs: jest.fn(() => ({
    docs: [],
    forEach: jest.fn(),
  })),
  serverTimestamp: jest.fn(() => new Date()),
}));

// Mock Firebase App
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
}));

// Mock Firebase Authentication
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
}));

// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
}));
