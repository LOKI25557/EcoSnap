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
import { PickupRequest } from '../../types/PickupRequest';
import { CommunityReport } from '../../types/CommunityReport';
import { Facility } from '../../types/Facility';
import { Review } from '../../types/Review';
import { Notification } from '../../types/Notification';
import { notificationRepository } from './notificationRepository';
import { authService } from './authService';
import { facilityRepository } from './facilityRepository';
import { wasteRepository } from './wasteRepository';
import { pickupRepository } from './pickupRepository';
import { communityReportRepository } from './communityReportRepository';
import { reviewRepository } from './reviewRepository';

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
        avatarStoragePath: data.avatarStoragePath || '',
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
        avatarStoragePath: profileData.avatarStoragePath || '',
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
  createWasteRecord: async (record: Omit<WasteRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    return await wasteRepository.create(record);
  },

  getWasteRecord: async (id: string): Promise<WasteRecord | null> => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('Unauthenticated: User must be logged in');
    return await wasteRepository.get(currentUser.uid, id);
  },

  getUserWasteRecords: async (
    userId: string,
    limitVal?: number,
    startAfterDoc?: any
  ): Promise<{ items: WasteRecord[]; lastVisible: any | null }> => {
    return await wasteRepository.list({
      userId,
      limit: limitVal,
      cursor: startAfterDoc,
    });
  },

  updateWasteRecord: async (id: string, recordData: Partial<WasteRecord>): Promise<void> => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('Unauthenticated: User must be logged in');
    return await wasteRepository.update(currentUser.uid, id, recordData);
  },

  deleteWasteRecord: async (id: string): Promise<void> => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('Unauthenticated: User must be logged in');
    return await wasteRepository.delete(currentUser.uid, id);
  },

  // Pickup Request Repository
  createPickupRequest: async (request: Omit<PickupRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    return await pickupRepository.create(request as any);
  },

  getPickupRequest: async (id: string): Promise<PickupRequest | null> => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('Unauthenticated: User must be logged in');
    return await pickupRepository.get(currentUser.uid, id);
  },

  getUserPickupRequests: async (
    userId: string,
    limitVal?: number,
    startAfterDoc?: any
  ): Promise<{ items: PickupRequest[]; lastVisible: any | null }> => {
    return await pickupRepository.list({
      userId,
      limit: limitVal,
      cursor: startAfterDoc,
    });
  },

  updatePickupRequest: async (id: string, requestData: Partial<PickupRequest>): Promise<void> => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('Unauthenticated: User must be logged in');
    if (requestData.status) {
      await pickupRepository.updateStatus(currentUser.uid, id, requestData.status, false);
    } else {
      const docRef = doc(db, COLLECTIONS.USERS, currentUser.uid, COLLECTIONS.PICKUP_REQUESTS, id);
      await updateDoc(docRef, requestData as any);
    }
  },

  // Community Report Repository
  createCommunityReport: async (report: Omit<CommunityReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    return await communityReportRepository.create(report as any);
  },

  getCommunityReport: async (id: string): Promise<CommunityReport | null> => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('Unauthenticated: User must be logged in');
    return await communityReportRepository.get(currentUser.uid, id);
  },

  getCommunityReports: async (
    status?: string,
    limitVal?: number,
    startAfterDoc?: any
  ): Promise<{ items: CommunityReport[]; lastVisible: any | null }> => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('Unauthenticated: User must be logged in');
    return await communityReportRepository.list({
      userId: currentUser.uid,
      status: status as any,
      limit: limitVal,
      cursor: startAfterDoc,
    });
  },

  updateCommunityReport: async (id: string, reportData: Partial<CommunityReport>): Promise<void> => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('Unauthenticated: User must be logged in');
    if (reportData.status) {
      await communityReportRepository.updateStatus(currentUser.uid, id, reportData.status, false);
    } else {
      const docRef = doc(db, COLLECTIONS.USERS, currentUser.uid, COLLECTIONS.COMMUNITY_REPORTS, id);
      await updateDoc(docRef, reportData as any);
    }
  },

  // Facility Repository
  getFacility: async (id: string): Promise<Facility | null> => {
    return await facilityRepository.get(id);
  },

  getFacilities: async (
    type?: string,
    limitVal?: number,
    startAfterDoc?: any
  ): Promise<{ items: Facility[]; lastVisible: any | null }> => {
    return await facilityRepository.list({
      type: type as any,
      activeOnly: true,
      limit: limitVal,
      cursor: startAfterDoc,
    });
  },

  // Reviews Repository
  createReview: async (review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    return await reviewRepository.create({
      facilityId: review.facilityId,
      rating: review.rating,
      comment: review.comment,
    });
  },

  getReview: async (id: string): Promise<Review | null> => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('Unauthenticated: User must be logged in');
    throw new Error('Not implemented: Facility ID required to fetch specific review');
  },

  getFacilityReviews: async (
    facilityId: string,
    limitVal?: number,
    startAfterDoc?: any
  ): Promise<{ items: Review[]; lastVisible: any | null }> => {
    return await reviewRepository.getFacilityReviews(facilityId, {
      limit: limitVal,
      cursor: startAfterDoc,
    });
  },

  updateReview: async (id: string, reviewData: Partial<Review>): Promise<void> => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error('Unauthenticated: User must be logged in');
    if (!reviewData.facilityId) throw new Error('Facility ID is required to update a review');
    return await reviewRepository.update(reviewData.facilityId, id, {
      rating: reviewData.rating,
      comment: reviewData.comment,
    });
  },

  deleteReview: async (id: string): Promise<void> => {
    throw new Error('Not implemented: Facility ID required to delete review');
  },

  // Notification Repository delegates
  createNotification: async (notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> => {
    return await notificationRepository.create({
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body || notification.message || '',
      data: notification.data,
      expiresAt: notification.expiresAt,
      imageUrl: notification.imageUrl,
      actionUrl: notification.actionUrl,
    });
  },

  getUserNotifications: async (
    userId: string,
    limitVal?: number,
    startAfterDoc?: any
  ): Promise<{ items: Notification[]; lastVisible: any | null }> => {
    return await notificationRepository.list({
      userId,
      limit: limitVal,
      cursor: startAfterDoc,
    });
  },

  markNotificationAsRead: async (id: string): Promise<void> => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    await notificationRepository.markAsRead(currentUser.uid, id);
  },

  deleteNotification: async (id: string): Promise<void> => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    await notificationRepository.delete(currentUser.uid, id);
  }
};
