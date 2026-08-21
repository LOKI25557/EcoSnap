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
  getDocs: jest.fn(() => ({ docs: [] })),
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
