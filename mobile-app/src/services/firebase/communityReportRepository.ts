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
  // Skeleton validator to be populated in commit 9
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
    return { items: [], lastVisible: null };
  },

  updateStatus: async (
    userId: string,
    reportId: string,
    newStatus: CommunityReportStatus,
    adminOverride = false
  ): Promise<void> => {},

  delete: async (userId: string, reportId: string): Promise<void> => {}
};
