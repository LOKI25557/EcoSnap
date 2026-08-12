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
  QueryConstraint,
  serverTimestamp
} from 'firebase/firestore';
import { User } from '../../types/User';
import { UserProfile } from '../../types/Profile';
import { WasteRecord } from '../../types/WasteRecord';

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
  getUserProfile: async (uid: string): Promise<UserProfile | null> => {
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
        name: data.name || data.displayName || 'Eco Warrior',
        avatar: data.avatar || data.photoURL || '',
        preferredLanguage: data.preferredLanguage || 'en',
        themePreference: data.themePreference || 'system',
        notificationPreferences: data.notificationPreferences || {
          dailyReminders: true,
          streakAlerts: true,
          challenges: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
        },
        favoriteCategories: data.favoriteCategories || [],
        dailyGoal: data.dailyGoal || 5,
        weeklyGoal: data.weeklyGoal || 30,
        monthlyGoal: data.monthlyGoal || 120,
        joinedDate: data.joinedDate || Date.now(),
        totalAchievements: data.totalAchievements || 0,
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  createUserProfile: async (uid: string, profileData: Partial<UserProfile>): Promise<void> => {
    try {
      const profile = {
        email: profileData.email,
        displayName: profileData.displayName || profileData.name || '',
        photoURL: profileData.photoURL || profileData.avatar || '',
        score: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        name: profileData.name || profileData.displayName || 'Eco Warrior',
        avatar: profileData.avatar || profileData.photoURL || '',
        preferredLanguage: profileData.preferredLanguage || 'en',
        themePreference: profileData.themePreference || 'system',
        notificationPreferences: profileData.notificationPreferences || {
          dailyReminders: true,
          streakAlerts: true,
          challenges: true,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
        },
        favoriteCategories: profileData.favoriteCategories || [],
        dailyGoal: profileData.dailyGoal || 5,
        weeklyGoal: profileData.weeklyGoal || 30,
        monthlyGoal: profileData.monthlyGoal || 120,
        joinedDate: profileData.joinedDate || Date.now(),
        totalAchievements: profileData.totalAchievements || 0,
      };
      await firestoreService.setDocument(COLLECTIONS.USERS, uid, profile);
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  updateUserProfile: async (uid: string, profileData: Partial<UserProfile>): Promise<void> => {
    try {
      const updates = {
        ...profileData,
        updatedAt: serverTimestamp(),
      };
      await firestoreService.updateDocument(COLLECTIONS.USERS, uid, updates);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Waste Record Repository
  createWasteRecord: async (record: Omit<WasteRecord, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const newRecord = {
        ...record,
        createdAt: serverTimestamp(),
      };
      return await firestoreService.addDocument(COLLECTIONS.WASTE_RECORDS, newRecord);
    } catch (error) {
      console.error('Error creating waste record:', error);
      throw error;
    }
  },

  getWasteRecord: async (id: string): Promise<WasteRecord | null> => {
    try {
      const data = await firestoreService.getDocument<any>(COLLECTIONS.WASTE_RECORDS, id);
      if (!data) return null;
      return {
        id,
        ...data,
        detectedAt: data.detectedAt?.toDate ? data.detectedAt.toDate() : new Date(data.detectedAt || Date.now()),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
      } as WasteRecord;
    } catch (error) {
      console.error(`Error getting waste record ${id}:`, error);
      throw error;
    }
  },

  getUserWasteRecords: async (
    userId: string,
    limitVal?: number,
    startAfterDoc?: any
  ): Promise<{ items: WasteRecord[]; lastVisible: any | null }> => {
    try {
      const constraints: QueryConstraint[] = [
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      ];

      if (limitVal) {
        constraints.push(limit(limitVal));
      }
      if (startAfterDoc) {
        constraints.push(startAfter(startAfterDoc));
      }

      const result = await firestoreService.queryDocuments<any>(COLLECTIONS.WASTE_RECORDS, constraints);
      const items = result.items.map((data) => ({
        ...data,
        detectedAt: data.detectedAt?.toDate ? data.detectedAt.toDate() : new Date(data.detectedAt || Date.now()),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
      })) as WasteRecord[];

      return { items, lastVisible: result.lastVisible };
    } catch (error) {
      console.error(`Error getting waste records for user ${userId}:`, error);
      throw error;
    }
  },

  updateWasteRecord: async (id: string, recordData: Partial<WasteRecord>): Promise<void> => {
    try {
      await firestoreService.updateDocument(COLLECTIONS.WASTE_RECORDS, id, recordData);
    } catch (error) {
      console.error(`Error updating waste record ${id}:`, error);
      throw error;
    }
  },

  deleteWasteRecord: async (id: string): Promise<void> => {
    try {
      await firestoreService.deleteDocument(COLLECTIONS.WASTE_RECORDS, id);
    } catch (error) {
      console.error(`Error deleting waste record ${id}:`, error);
      throw error;
    }
  }
};
