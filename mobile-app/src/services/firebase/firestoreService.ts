import { db } from './firebaseConfig';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryConstraint
} from 'firebase/firestore';
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
  getDocument: async <T>(collectionName: string, id: string): Promise<T | null> => {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as T) : null;
    } catch (error) {
      console.error(`Error getting document from ${collectionName} with id ${id}:`, error);
      throw error;
    }
  },
  
  addDocument: async <T extends object>(collectionName: string, data: T): Promise<string> => {
    try {
      const docRef = doc(db, collectionName);
      await setDoc(docRef, data);
      return docRef.id;
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  },

  setDocument: async <T extends object>(collectionName: string, id: string, data: T): Promise<void> => {
    try {
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error(`Error setting document in ${collectionName} with id ${id}:`, error);
      throw error;
    }
  },

  updateDocument: async <T extends object>(collectionName: string, id: string, data: Partial<T>): Promise<void> => {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, data as any);
    } catch (error) {
      console.error(`Error updating document in ${collectionName} with id ${id}:`, error);
      throw error;
    }
  },

  deleteDocument: async (collectionName: string, id: string): Promise<void> => {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document in ${collectionName} with id ${id}:`, error);
      throw error;
    }
  },

  queryDocuments: async <T>(
    collectionName: string,
    constraints: QueryConstraint[]
  ): Promise<{ items: T[]; lastVisible: any | null }> => {
    try {
      const colRef = collection(db, collectionName);
      const q = query(colRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const items: T[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push({
          id: docSnap.id,
          ...docSnap.data()
        } as T);
      });

      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      return { items, lastVisible };
    } catch (error) {
      console.error(`Error querying documents from ${collectionName}:`, error);
      throw error;
    }
  },

  // User Profile Helpers
  getUserProfile: async (uid: string): Promise<User | null> => {
    try {
      const data = await firestoreService.getDocument<any>(COLLECTIONS.USERS, uid);
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
