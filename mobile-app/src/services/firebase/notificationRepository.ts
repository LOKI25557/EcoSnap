import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { authService } from './authService';
import {
  NOTIFICATIONS_COLLECTION,
  NOTIFICATION_PREFERENCES_COLLECTION,
  NOTIFICATION_PREFERENCES_DOC,
  DEVICES_COLLECTION,
  NOTIFICATION_QUERY_DEFAULTS
} from '../../constants/firebase';
import {
  Notification,
  CreateNotificationInput,
  NotificationType,
  NotificationPreferences,
  DeviceToken
} from '../../types/Notification';

const VALID_NOTIFICATION_TYPES: NotificationType[] = [
  'pickup_created',
  'pickup_scheduled',
  'pickup_assigned',
  'pickup_completed',
  'pickup_cancelled',
  'report_under_review',
  'report_verified',
  'report_rejected',
  'report_resolved',
  'review_update',
  'general',
  'pickup_update',
  'community_update',
  'recycling_reminder',
  'system'
];

export const notificationRepository = {
  create: async (input: CreateNotificationInput): Promise<string> => {
    // 1. Authenticated user validation
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    if (currentUser.uid !== input.userId) {
      throw new Error('Permission denied: Cannot create notification for another user');
    }

    // 2. Validate type
    if (!VALID_NOTIFICATION_TYPES.includes(input.type)) {
      throw new Error(`Invalid notification type: ${input.type}`);
    }

    // 3. Validate title and body
    if (!input.title || input.title.trim() === '') {
      throw new Error('Notification title is required');
    }
    if (!input.body || input.body.trim() === '') {
      throw new Error('Notification body is required');
    }

    try {
      const notificationsRef = collection(db, 'users', input.userId, NOTIFICATIONS_COLLECTION);
      const docRef = doc(notificationsRef);
      
      const data: any = {
        id: docRef.id,
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        message: input.body, // Fallback for legacy
        read: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        data: input.data || null,
        expiresAt: input.expiresAt || null,
        imageUrl: input.imageUrl || null,
        actionUrl: input.actionUrl || null
      };

      await setDoc(docRef, data);
      return docRef.id;
    } catch (error: any) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  get: async (userId: string, notificationId: string): Promise<Notification | null> => {
    if (!userId || userId.trim() === '') {
      throw new Error('Invalid user ID');
    }
    if (!notificationId || notificationId.trim() === '') {
      throw new Error('Invalid notification ID');
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    if (currentUser.uid !== userId) {
      throw new Error('Permission denied: Cannot access another user\'s notifications');
    }

    try {
      const docRef = doc(db, 'users', userId, NOTIFICATIONS_COLLECTION, notificationId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      const toDate = (ts: any): Date => {
        if (!ts) return new Date();
        return ts.toDate ? ts.toDate() : new Date(ts);
      };

      return {
        id: docSnap.id,
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        message: data.message,
        read: data.read ?? false,
        isRead: data.read ?? false,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        expiresAt: data.expiresAt ? toDate(data.expiresAt) : undefined,
        data: data.data || undefined,
        imageUrl: data.imageUrl || undefined,
        actionUrl: data.actionUrl || undefined
      } as Notification;
    } catch (error: any) {
      console.error(`Error getting notification ${notificationId}:`, error);
      throw error;
    }
  },

  list: async (params: {
    userId: string;
    unreadOnly?: boolean;
    limit?: number;
    cursor?: any;
  }): Promise<{ items: Notification[]; lastVisible: any | null }> => {
    const { userId, unreadOnly = false, limit: limitVal, cursor } = params;

    if (!userId || userId.trim() === '') {
      throw new Error('Invalid user ID');
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    if (currentUser.uid !== userId) {
      throw new Error('Permission denied: Cannot list another user\'s notifications');
    }

    try {
      const notificationsRef = collection(db, 'users', userId, NOTIFICATIONS_COLLECTION);
      const constraints: any[] = [];

      if (unreadOnly) {
        constraints.push(where('read', '==', false));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      const defaultLimit = NOTIFICATION_QUERY_DEFAULTS.DEFAULT_LIMIT;
      const maxLimit = NOTIFICATION_QUERY_DEFAULTS.MAX_LIMIT;
      const appliedLimit = limitVal ? Math.min(limitVal, maxLimit) : defaultLimit;
      constraints.push(limit(appliedLimit));

      if (cursor) {
        constraints.push(startAfter(cursor));
      }

      const q = query(notificationsRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const items: Notification[] = [];
      const toDate = (ts: any): Date => {
        if (!ts) return new Date();
        return ts.toDate ? ts.toDate() : new Date(ts);
      };

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          body: data.body,
          message: data.message,
          read: data.read ?? false,
          isRead: data.read ?? false,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
          expiresAt: data.expiresAt ? toDate(data.expiresAt) : undefined,
          data: data.data || undefined,
          imageUrl: data.imageUrl || undefined,
          actionUrl: data.actionUrl || undefined
        } as Notification);
      });

      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      return { items, lastVisible };
    } catch (error: any) {
      console.error(`Error listing notifications for user ${userId}:`, error);
      throw error;
    }
  },

  getUserNotifications: async (params: {
    userId: string;
    unreadOnly?: boolean;
    limit?: number;
    cursor?: any;
  }): Promise<{ items: Notification[]; lastVisible: any | null }> => {
    return await notificationRepository.list(params);
  },

  markAsRead: async (userId: string, notificationId: string): Promise<void> => {
    if (!userId || userId.trim() === '') {
      throw new Error('Invalid user ID');
    }
    if (!notificationId || notificationId.trim() === '') {
      throw new Error('Invalid notification ID');
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    if (currentUser.uid !== userId) {
      throw new Error('Permission denied: Cannot update another user\'s notifications');
    }

    try {
      const docRef = doc(db, 'users', userId, NOTIFICATIONS_COLLECTION, notificationId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Notification not found');
      }

      await setDoc(docRef, {
        read: true,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error: any) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      throw error;
    }
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    if (!userId || userId.trim() === '') {
      throw new Error('Invalid user ID');
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    if (currentUser.uid !== userId) {
      throw new Error('Permission denied: Cannot update another user\'s notifications');
    }

    try {
      const notificationsRef = collection(db, 'users', userId, NOTIFICATIONS_COLLECTION);
      const q = query(notificationsRef, where('read', '==', false));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return;
      }

      const batch = writeBatch(db);
      querySnapshot.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          read: true,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
    } catch (error: any) {
      console.error(`Error marking all notifications as read for user ${userId}:`, error);
      throw error;
    }
  },

  markNotificationAsRead: async (userId: string, notificationId: string): Promise<void> => {
    return await notificationRepository.markAsRead(userId, notificationId);
  },

  markAllNotificationsAsRead: async (userId: string): Promise<void> => {
    return await notificationRepository.markAllAsRead(userId);
  },

  getUnreadNotificationCount: async (userId: string): Promise<number> => {
    if (!userId || userId.trim() === '') {
      throw new Error('Invalid user ID');
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    if (currentUser.uid !== userId) {
      throw new Error('Permission denied: Cannot access another user\'s notifications');
    }

    try {
      const notificationsRef = collection(db, 'users', userId, NOTIFICATIONS_COLLECTION);
      const q = query(notificationsRef, where('read', '==', false));
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error: any) {
      console.error(`Error getting unread count for user ${userId}:`, error);
      throw error;
    }
  },

  getNotificationPreferences: async (userId: string): Promise<NotificationPreferences> => {
    if (!userId || userId.trim() === '') {
      throw new Error('Invalid user ID');
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    if (currentUser.uid !== userId) {
      throw new Error('Permission denied: Cannot access another user\'s preferences');
    }

    const defaultPrefs: NotificationPreferences = {
      pickupUpdates: true,
      communityReports: true,
      reviews: false,
      general: true,
      marketing: false,
      dailyReminders: true,
      streakAlerts: true,
      challenges: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00'
    };

    try {
      const docRef = doc(db, 'users', userId, NOTIFICATION_PREFERENCES_COLLECTION, NOTIFICATION_PREFERENCES_DOC);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...defaultPrefs,
          ...data
        } as NotificationPreferences;
      }

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.notificationPreferences) {
          const merged = {
            ...defaultPrefs,
            ...userData.notificationPreferences
          };
          await setDoc(docRef, merged);
          return merged as NotificationPreferences;
        }
      }

      return defaultPrefs;
    } catch (error: any) {
      console.error(`Error getting notification preferences for user ${userId}:`, error);
      throw error;
    }
  },

  updateNotificationPreferences: async (userId: string, preferences: Partial<NotificationPreferences>): Promise<void> => {
    if (!userId || userId.trim() === '') {
      throw new Error('Invalid user ID');
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    if (currentUser.uid !== userId) {
      throw new Error('Permission denied: Cannot update another user\'s preferences');
    }

    try {
      const current = await notificationRepository.getNotificationPreferences(userId);
      const updated = {
        ...current,
        ...preferences
      };

      const docRef = doc(db, 'users', userId, NOTIFICATION_PREFERENCES_COLLECTION, NOTIFICATION_PREFERENCES_DOC);
      await setDoc(docRef, updated, { merge: true });

      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          await setDoc(userRef, {
            notificationPreferences: updated
          }, { merge: true });
        }
      } catch (profileError) {
        console.warn('Soft fail updating notificationPreferences in profile document:', profileError);
      }
    } catch (error: any) {
      console.error(`Error updating notification preferences for user ${userId}:`, error);
      throw error;
    }
  },

  registerDeviceToken: async (
    userId: string,
    device: { deviceId: string; pushToken: string; platform: 'ios' | 'android' | 'web' }
  ): Promise<void> => {
    if (!userId || userId.trim() === '') {
      throw new Error('Invalid user ID');
    }
    if (!device.deviceId || device.deviceId.trim() === '') {
      throw new Error('Invalid device ID');
    }
    if (!device.pushToken || device.pushToken.trim() === '') {
      throw new Error('Invalid push token');
    }
    const validPlatforms = ['ios', 'android', 'web'];
    if (!validPlatforms.includes(device.platform)) {
      throw new Error(`Invalid platform: ${device.platform}`);
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    if (currentUser.uid !== userId) {
      throw new Error('Permission denied: Cannot register device token under another user\'s account');
    }

    try {
      const docRef = doc(db, 'users', userId, DEVICES_COLLECTION, device.deviceId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await setDoc(docRef, {
          pushToken: device.pushToken,
          platform: device.platform,
          updatedAt: serverTimestamp(),
          lastSeenAt: serverTimestamp()
        }, { merge: true });
      } else {
        await setDoc(docRef, {
          deviceId: device.deviceId,
          userId,
          pushToken: device.pushToken,
          platform: device.platform,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastSeenAt: serverTimestamp()
        });
      }
    } catch (error: any) {
      console.error(`Error registering device token for user ${userId}:`, error);
      throw error;
    }
  },

  removeDeviceToken: async (userId: string, deviceId: string): Promise<void> => {
    if (!userId || userId.trim() === '') {
      throw new Error('Invalid user ID');
    }
    if (!deviceId || deviceId.trim() === '') {
      throw new Error('Invalid device ID');
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    if (currentUser.uid !== userId) {
      throw new Error('Permission denied: Cannot remove device token for another user');
    }

    try {
      const docRef = doc(db, 'users', userId, DEVICES_COLLECTION, deviceId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Device token not found');
      }
      await deleteDoc(docRef);
    } catch (error: any) {
      console.error(`Error removing device token ${deviceId} for user ${userId}:`, error);
      throw error;
    }
  },

  getDeviceTokens: async (userId: string): Promise<DeviceToken[]> => {
    if (!userId || userId.trim() === '') {
      throw new Error('Invalid user ID');
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    if (currentUser.uid !== userId) {
      throw new Error('Permission denied: Cannot access another user\'s device tokens');
    }

    try {
      const devicesRef = collection(db, 'users', userId, DEVICES_COLLECTION);
      const querySnapshot = await getDocs(devicesRef);

      const items: DeviceToken[] = [];
      const toDate = (ts: any): Date => {
        if (!ts) return new Date();
        return ts.toDate ? ts.toDate() : new Date(ts);
      };

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          deviceId: docSnap.id,
          userId: data.userId,
          pushToken: data.pushToken,
          platform: data.platform,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
          lastSeenAt: toDate(data.lastSeenAt)
        } as DeviceToken);
      });

      return items;
    } catch (error: any) {
      console.error(`Error getting device tokens for user ${userId}:`, error);
      throw error;
    }
  },

  delete: async (userId: string, notificationId: string): Promise<void> => {
    if (!userId || userId.trim() === '') {
      throw new Error('Invalid user ID');
    }
    if (!notificationId || notificationId.trim() === '') {
      throw new Error('Invalid notification ID');
    }

    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    if (currentUser.uid !== userId) {
      throw new Error('Permission denied: Cannot delete another user\'s notifications');
    }

    try {
      const docRef = doc(db, 'users', userId, NOTIFICATIONS_COLLECTION, notificationId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Notification not found');
      }

      await deleteDoc(docRef);
    } catch (error: any) {
      console.error(`Error deleting notification ${notificationId}:`, error);
      throw error;
    }
  }
};
