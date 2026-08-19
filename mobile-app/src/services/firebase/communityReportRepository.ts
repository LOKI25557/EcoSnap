import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  query,
  orderBy,
  getDocs,
  limit,
  startAfter,
  QueryConstraint,
  where,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { authService } from './authService';
import { storageService } from './storageService';
import { notificationEventService } from './notificationEventService';
import {
  FIRESTORE_COLLECTIONS,
  REPORT_QUERY_DEFAULTS,
  REPORT_TYPES,
  REPORT_STATUS_VALUES,
  MAX_REPORT_DESCRIPTION_LENGTH,
  MAX_REPORT_ADDRESS_LENGTH
} from '../../constants/firebase';
import {
  CommunityReport,
  CommunityReportType,
  CommunityReportStatus,
  CreateCommunityReportInput,
  UpdateCommunityReportInput
} from '../../types/CommunityReport';

export const validateCommunityReport = (
  input: Partial<CreateCommunityReportInput | CommunityReport>,
  isUpdate = false
) => {
  // If not an update, check required fields
  if (!isUpdate) {
    if (!input.userId) throw new Error('User ID is required');
    if (!input.type) throw new Error('Report type is required');
    if (!input.description || input.description.trim() === '') throw new Error('Description is required');
  }

  if (input.userId !== undefined) {
    if (typeof input.userId !== 'string' || input.userId.trim() === '') {
      throw new Error('Invalid userId: must be a non-empty string');
    }
  }

  if (input.type !== undefined) {
    if (!REPORT_TYPES.includes(input.type as any)) {
      throw new Error(`Invalid report type: must be one of ${REPORT_TYPES.join(', ')}`);
    }
  }

  if (input.description !== undefined) {
    if (typeof input.description !== 'string' || input.description.trim() === '') {
      throw new Error('Description must be a non-empty string');
    }
    if (input.description.length > MAX_REPORT_DESCRIPTION_LENGTH) {
      throw new Error(`Description cannot exceed ${MAX_REPORT_DESCRIPTION_LENGTH} characters`);
    }
  }

  if (input.address !== undefined && input.address !== null) {
    if (typeof input.address !== 'string' || input.address.trim() === '') {
      throw new Error('Address must be a non-empty string');
    }
    if (input.address.length > MAX_REPORT_ADDRESS_LENGTH) {
      throw new Error(`Address cannot exceed ${MAX_REPORT_ADDRESS_LENGTH} characters`);
    }
  }

  const hasLat = input.latitude !== undefined && input.latitude !== null;
  const hasLng = input.longitude !== undefined && input.longitude !== null;

  if (hasLat || hasLng) {
    if (!hasLat || !hasLng) {
      throw new Error('Both latitude and longitude must be provided together');
    }

    if (typeof input.latitude !== 'number' || isNaN(input.latitude) || input.latitude < -90 || input.latitude > 90) {
      throw new Error('Latitude must be a number between -90 and 90');
    }

    if (typeof input.longitude !== 'number' || isNaN(input.longitude) || input.longitude < -180 || input.longitude > 180) {
      throw new Error('Longitude must be a number between -180 and 180');
    }
  }

  if (input.photoUrl !== undefined && input.photoUrl !== null) {
    if (typeof input.photoUrl !== 'string') {
      throw new Error('photoUrl must be a string');
    }
  }

  if (input.photoPath !== undefined && input.photoPath !== null) {
    if (typeof input.photoPath !== 'string') {
      throw new Error('photoPath must be a string');
    }
  }
};

export const communityReportRepository = {
  create: async (input: CreateCommunityReportInput): Promise<string> => {
    // 1. Authenticated user validation
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    if (currentUser.uid !== input.userId) {
      throw new Error('Permission denied: Cannot create community report for another user');
    }

    // 2. Input validation placeholder (will be fully implemented in Commit 9)
    validateCommunityReport(input, false);

    try {
      const userReportsCol = collection(
        db,
        FIRESTORE_COLLECTIONS.USERS,
        input.userId,
        FIRESTORE_COLLECTIONS.COMMUNITY_REPORTS
      );
      const docRef = doc(userReportsCol);

      const newReport = {
        id: docRef.id,
        userId: input.userId,
        type: input.type,
        description: input.description,
        address: input.address || null,
        latitude: input.latitude !== undefined ? input.latitude : null,
        longitude: input.longitude !== undefined ? input.longitude : null,
        photoUrl: input.photoUrl || null,
        photoPath: input.photoPath || null,
        status: 'pending' as CommunityReportStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, newReport);
      return docRef.id;
    } catch (error: any) {
      console.error('Error creating community report in repository:', error);
      throw new Error(`Failed to create community report: ${error.message || error}`);
    }
  },

  get: async (userId: string, reportId: string): Promise<CommunityReport | null> => {
    if (!userId) throw new Error('User ID is required');
    if (!reportId) throw new Error('Report ID is required');

    // Local ownership check
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    if (currentUser.uid !== userId) {
      throw new Error('Permission denied: Cannot access another user\'s community reports');
    }

    try {
      const docRef = doc(
        db,
        FIRESTORE_COLLECTIONS.USERS,
        userId,
        FIRESTORE_COLLECTIONS.COMMUNITY_REPORTS,
        reportId
      );
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();

      const toDate = (ts: any): Date | undefined => {
        if (!ts) return undefined;
        return ts.toDate ? ts.toDate() : new Date(ts);
      };

      return {
        id: docSnap.id,
        userId: data.userId,
        type: data.type,
        description: data.description,
        address: data.address || undefined,
        latitude: data.latitude !== null && data.latitude !== undefined ? data.latitude : undefined,
        longitude: data.longitude !== null && data.longitude !== undefined ? data.longitude : undefined,
        photoUrl: data.photoUrl || undefined,
        photoPath: data.photoPath || undefined,
        status: data.status,
        createdAt: toDate(data.createdAt)!,
        updatedAt: toDate(data.updatedAt)!,
        resolvedAt: toDate(data.resolvedAt),
        rejectedAt: toDate(data.rejectedAt),
      } as CommunityReport;
    } catch (error: any) {
      console.error(`Error retrieving community report ${reportId} for user ${userId}:`, error);
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied: You do not have access to this community report');
      }
      throw new Error(`Failed to retrieve community report: ${error.message || error}`);
    }
  },

  list: async (params: {
    userId: string;
    type?: CommunityReportType;
    status?: CommunityReportStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    cursor?: any;
  }): Promise<{ items: CommunityReport[]; lastVisible: any | null }> => {
    const { userId } = params;
    if (!userId) throw new Error('User ID is required');

    // Local ownership check
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    if (currentUser.uid !== userId) {
      throw new Error('Permission denied: Cannot access another user\'s community reports');
    }

    try {
      const userReportsCol = collection(
        db,
        FIRESTORE_COLLECTIONS.USERS,
        userId,
        FIRESTORE_COLLECTIONS.COMMUNITY_REPORTS
      );

      const constraints: QueryConstraint[] = [];

      // 1. Filtering by status
      if (params.status) {
        constraints.push(where('status', '==', params.status));
      }

      // 2. Filtering by report type
      if (params.type) {
        constraints.push(where('type', '==', params.type));
      }

      // 3. Filtering by date range on createdAt
      if (params.startDate) {
        constraints.push(where('createdAt', '>=', params.startDate));
      }
      if (params.endDate) {
        constraints.push(where('createdAt', '<=', params.endDate));
      }

      // 4. Sort newest first
      constraints.push(orderBy('createdAt', 'desc'));

      // Limit setup
      const limitVal = params.limit !== undefined && params.limit > 0
        ? Math.min(params.limit, REPORT_QUERY_DEFAULTS.MAX_LIMIT)
        : REPORT_QUERY_DEFAULTS.DEFAULT_LIMIT;
      constraints.push(limit(limitVal));

      if (params.cursor) {
        constraints.push(startAfter(params.cursor));
      }

      const q = query(userReportsCol, ...constraints);
      const querySnapshot = await getDocs(q);

      const toDate = (ts: any): Date | undefined => {
        if (!ts) return undefined;
        return ts.toDate ? ts.toDate() : new Date(ts);
      };

      const items: CommunityReport[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId,
          type: data.type,
          description: data.description,
          address: data.address || undefined,
          latitude: data.latitude !== null && data.latitude !== undefined ? data.latitude : undefined,
          longitude: data.longitude !== null && data.longitude !== undefined ? data.longitude : undefined,
          photoUrl: data.photoUrl || undefined,
          photoPath: data.photoPath || undefined,
          status: data.status,
          createdAt: toDate(data.createdAt)!,
          updatedAt: toDate(data.updatedAt)!,
          resolvedAt: toDate(data.resolvedAt),
          rejectedAt: toDate(data.rejectedAt),
        } as CommunityReport);
      });

      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      return { items, lastVisible };
    } catch (error: any) {
      console.error(`Error listing community reports for user ${userId}:`, error);
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied: You do not have access to these community reports');
      }
      throw new Error(`Failed to list community reports: ${error.message || error}`);
    }
  },

  updateStatus: async (
    userId: string,
    reportId: string,
    newStatus: CommunityReportStatus,
    adminOverride = false
  ): Promise<void> => {
    if (!userId) throw new Error('User ID is required');
    if (!reportId) throw new Error('Report ID is required');

    // Local authentication/ownership check (unless adminOverride is true)
    if (!adminOverride) {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Unauthenticated: User must be logged in');
      }
      if (currentUser.uid !== userId) {
        throw new Error('Permission denied: Cannot update status of another user\'s report');
      }
      // Ordinary clients are not allowed to change status at all.
      throw new Error('Permission denied: Ordinary users cannot change report status');
    }

    try {
      const docRef = doc(
        db,
        FIRESTORE_COLLECTIONS.USERS,
        userId,
        FIRESTORE_COLLECTIONS.COMMUNITY_REPORTS,
        reportId
      );
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Community report not found');
      }

      const data = docSnap.data();
      const currentStatus = data.status as CommunityReportStatus;

      // 1. Check if transition is valid
      const VALID_TRANSITIONS: Record<CommunityReportStatus, CommunityReportStatus[]> = {
        pending: ['under_review'],
        under_review: ['verified', 'rejected'],
        verified: ['resolved'],
        resolved: [],
        rejected: [],
      };

      if (!VALID_TRANSITIONS[currentStatus].includes(newStatus)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
      }

      // 2. Prepare updates
      const updates: Record<string, any> = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      if (newStatus === 'resolved') {
        updates.resolvedAt = serverTimestamp();
      } else if (newStatus === 'rejected') {
        updates.rejectedAt = serverTimestamp();
      }

      await setDoc(docRef, updates, { merge: true });

      try {
        let eventType: any = null;
        if (newStatus === 'under_review') eventType = 'report_under_review';
        else if (newStatus === 'verified') eventType = 'report_verified';
        else if (newStatus === 'rejected') eventType = 'report_rejected';
        else if (newStatus === 'resolved') eventType = 'report_resolved';

        if (eventType) {
          await notificationEventService.triggerReportEvent(userId, eventType, reportId);
        }
      } catch (notifErr) {
        console.warn('Failed to send community report status update notification:', notifErr);
      }
    } catch (error: any) {
      console.error(`Error updating status for community report ${reportId}:`, error);
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied: You do not have permission to update this community report');
      }
      throw new Error(`Failed to update community report status: ${error.message || error}`);
    }
  },

  uploadPhoto: async (userId: string, reportId: string, fileUri: string): Promise<{ downloadURL: string; path: string }> => {
    if (!userId) throw new Error('User ID is required');
    if (!reportId) throw new Error('Report ID is required');

    // Local ownership check
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    if (currentUser.uid !== userId) {
      throw new Error('Permission denied: Cannot upload photo for another user\'s report');
    }

    try {
      const result = await storageService.uploadReportImage(userId, reportId, fileUri);
      return {
        downloadURL: result.downloadURL,
        path: result.path
      };
    } catch (error: any) {
      console.error(`Error uploading report photo for user ${userId} and report ${reportId}:`, error);
      throw new Error(`Failed to upload report photo: ${error.message || error}`);
    }
  },

  delete: async (userId: string, reportId: string): Promise<void> => {
    if (!userId) throw new Error('User ID is required');
    if (!reportId) throw new Error('Report ID is required');

    // Local ownership check
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    if (currentUser.uid !== userId) {
      throw new Error('Permission denied: Cannot delete another user\'s community reports');
    }

    try {
      const docRef = doc(
        db,
        FIRESTORE_COLLECTIONS.USERS,
        userId,
        FIRESTORE_COLLECTIONS.COMMUNITY_REPORTS,
        reportId
      );
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Community report not found');
      }

      const data = docSnap.data();
      const photoPath = data.photoPath;

      if (photoPath) {
        try {
          await storageService.deleteFile(photoPath);
        } catch (storageError) {
          console.warn(`Failed to delete associated storage image at ${photoPath}:`, storageError);
        }
      }

      await deleteDoc(docRef);
    } catch (error: any) {
      console.error(`Error deleting community report ${reportId} for user ${userId}:`, error);
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied: You do not have permission to delete this community report');
      }
      throw new Error(`Failed to delete community report: ${error.message || error}`);
    }
  }
};
