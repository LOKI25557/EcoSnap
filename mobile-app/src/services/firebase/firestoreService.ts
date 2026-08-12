import { db } from './firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { User } from '../../types/User';

export const COLLECTIONS = {
  USERS: 'users',
  WASTE_RECORDS: 'wasteRecords',
  PICKUP_REQUESTS: 'pickupRequests',
  COMMUNITY_REPORTS: 'communityReports',
  FACILITIES: 'facilities',
  REVIEWS: 'reviews',
  NOTIFICATIONS: 'notifications',
} as const;

// Implement Firestore CRUD methods
export const firestoreService = {
  getDocument: async (collectionName: string, id: string) => {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  },
  
  addDocument: async (collectionName: string, data: any) => {
    try {
      const docRef = doc(db, collectionName);
      await setDoc(docRef, data);
      return docRef.id;
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  },

  setDocument: async (collectionName: string, id: string, data: any) => {
    try {
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error(`Error setting document in ${collectionName}:`, error);
      throw error;
    }
  },

  updateDocument: async (collectionName: string, id: string, data: any) => {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  },

  deleteDocument: async (collectionName: string, id: string) => {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document in ${collectionName}:`, error);
      throw error;
    }
  },

  // User Profile Helpers
  getUserProfile: async (uid: string): Promise<User | null> => {
    try {
      const data = await firestoreService.getDocument(COLLECTIONS.USERS, uid);
      if (!data) return null;

      return {
        id: uid,
        email: data.email || '',
        displayName: data.displayName || '',
        photoURL: data.photoURL || '',
        score: data.score || 0,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  createUserProfile: async (uid: string, profileData: Partial<User>): Promise<void> => {
    try {
      const profile = {
        email: profileData.email,
        displayName: profileData.displayName || '',
        photoURL: profileData.photoURL || '',
        score: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await firestoreService.setDocument(COLLECTIONS.USERS, uid, profile);
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }
};
