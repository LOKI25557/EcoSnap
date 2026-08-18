import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { authService } from './authService';
import { firestoreService } from './firestoreService';
import {
  Review,
  CreateReviewInput,
  UpdateReviewInput
} from '../../types/Review';

export const reviewRepository = {
  create: async (input: CreateReviewInput): Promise<string> => {
    // 1. Authenticated user validation
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }

    const userId = currentUser.uid;

    // 2. Validate input
    if (!input.facilityId || typeof input.facilityId !== 'string' || input.facilityId.trim() === '') {
      throw new Error('Invalid facility ID: must be a non-empty string');
    }

    if (
      input.rating === undefined ||
      typeof input.rating !== 'number' ||
      input.rating < 1 ||
      input.rating > 5 ||
      !Number.isInteger(input.rating)
    ) {
      throw new Error('Invalid rating: must be an integer between 1 and 5');
    }

    if (input.comment !== undefined && input.comment !== null) {
      if (typeof input.comment !== 'string') {
        throw new Error('Comment must be a string');
      }
      if (input.comment.trim() === '') {
        throw new Error('Comment cannot be empty or only whitespace');
      }
      if (input.comment.length > 500) {
        throw new Error('Comment cannot exceed 500 characters');
      }
    }

    try {
      // Get user details
      let userDisplayName: string | undefined;
      let userPhotoUrl: string | undefined;
      try {
        const profile = await firestoreService.getUserProfile(userId);
        if (profile) {
          userDisplayName = profile.displayName || profile.name || undefined;
          userPhotoUrl = profile.photoURL || profile.avatar || undefined;
        }
      } catch (e) {
        // Safe fallback if user profile cannot be read
      }

      // Check duplicate (one review per user per facility)
      const docRef = doc(db, 'facilities', input.facilityId, 'reviews', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        throw new Error('Duplicate review: User has already reviewed this facility');
      }

      const reviewData: any = {
        id: userId,
        facilityId: input.facilityId,
        userId: userId,
        rating: input.rating,
        comment: input.comment ? input.comment.trim() : '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (userDisplayName) reviewData.userDisplayName = userDisplayName;
      if (userPhotoUrl) reviewData.userPhotoUrl = userPhotoUrl;

      await setDoc(docRef, reviewData);
      return userId;
    } catch (error: any) {
      console.error('Error creating review:', error);
      throw new Error(`Failed to create review: ${error.message || error}`);
    }
  },

  get: async (facilityId: string, reviewId: string): Promise<Review | null> => {
    throw new Error('Not implemented');
  },

  list: async (
    facilityId: string,
    filters?: {
      limit?: number;
      cursor?: any;
      rating?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ items: Review[]; lastVisible: any | null }> => {
    throw new Error('Not implemented');
  },

  update: async (
    facilityId: string,
    reviewId: string,
    input: UpdateReviewInput
  ): Promise<void> => {
    throw new Error('Not implemented');
  },

  delete: async (facilityId: string, reviewId: string): Promise<void> => {
    throw new Error('Not implemented');
  }
};
