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
    if (!facilityId || typeof facilityId !== 'string' || facilityId.trim() === '') {
      throw new Error('Invalid facility ID: must be a non-empty string');
    }
    if (!reviewId || typeof reviewId !== 'string' || reviewId.trim() === '') {
      throw new Error('Invalid review ID: must be a non-empty string');
    }

    try {
      const docRef = doc(db, 'facilities', facilityId, 'reviews', reviewId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;

      const data = docSnap.data();
      const toDate = (ts: any): Date => {
        if (!ts) return new Date();
        return ts.toDate ? ts.toDate() : new Date(ts);
      };

      return {
        id: docSnap.id,
        facilityId: data.facilityId,
        userId: data.userId,
        rating: data.rating,
        comment: data.comment,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        userDisplayName: data.userDisplayName,
        userPhotoUrl: data.userPhotoUrl,
      } as Review;
    } catch (error: any) {
      console.error(`Error getting review ${reviewId} for facility ${facilityId}:`, error);
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied: You do not have permission to access this review');
      }
      throw new Error(`Failed to retrieve review: ${error.message || error}`);
    }
  },

  getFacilityReviews: async (
    facilityId: string,
    filters?: {
      limit?: number;
      cursor?: any;
      rating?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ items: Review[]; lastVisible: any | null }> => {
    if (!facilityId || typeof facilityId !== 'string' || facilityId.trim() === '') {
      throw new Error('Invalid facility ID: must be a non-empty string');
    }

    try {
      const reviewsCol = collection(db, 'facilities', facilityId, 'reviews');
      const constraints: any[] = [];

      // We will add more filtering constraints in Commit 10
      constraints.push(orderBy('createdAt', 'desc'));

      const q = query(reviewsCol, ...constraints);
      const querySnapshot = await getDocs(q);

      const items: Review[] = [];
      const toDate = (ts: any): Date => {
        if (!ts) return new Date();
        return ts.toDate ? ts.toDate() : new Date(ts);
      };

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          facilityId: data.facilityId,
          userId: data.userId,
          rating: data.rating,
          comment: data.comment,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
          userDisplayName: data.userDisplayName,
          userPhotoUrl: data.userPhotoUrl,
        } as Review);
      });

      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      return { items, lastVisible };
    } catch (error: any) {
      console.error(`Error listing reviews for facility ${facilityId}:`, error);
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied: You do not have permission to access these reviews');
      }
      throw new Error(`Failed to retrieve reviews: ${error.message || error}`);
    }
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
    return reviewRepository.getFacilityReviews(facilityId, filters);
  },

  update: async (
    facilityId: string,
    reviewId: string,
    input: UpdateReviewInput
  ): Promise<void> => {
    // 1. Authenticated user validation
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }

    const userId = currentUser.uid;

    if (!facilityId || typeof facilityId !== 'string' || facilityId.trim() === '') {
      throw new Error('Invalid facility ID: must be a non-empty string');
    }
    if (!reviewId || typeof reviewId !== 'string' || reviewId.trim() === '') {
      throw new Error('Invalid review ID: must be a non-empty string');
    }

    // 2. Validate edit constraints
    if (input.rating !== undefined) {
      if (
        typeof input.rating !== 'number' ||
        input.rating < 1 ||
        input.rating > 5 ||
        !Number.isInteger(input.rating)
      ) {
        throw new Error('Invalid rating: must be an integer between 1 and 5');
      }
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
      const docRef = doc(db, 'facilities', facilityId, 'reviews', reviewId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Review not found');
      }

      const existingReview = docSnap.data();

      // Enforce ownership
      if (existingReview.userId !== userId) {
        throw new Error('Permission denied: Cannot edit another user\'s review');
      }

      const updates: any = {
        updatedAt: serverTimestamp(),
      };

      if (input.rating !== undefined) {
        updates.rating = input.rating;
      }
      if (input.comment !== undefined) {
        updates.comment = input.comment ? input.comment.trim() : '';
      }

      await setDoc(docRef, updates, { merge: true });
    } catch (error: any) {
      console.error(`Error updating review ${reviewId} for facility ${facilityId}:`, error);
      if (error.code === 'permission-denied' || error.message.includes('Permission denied')) {
        throw new Error('Permission denied: You do not have permission to update this review');
      }
      throw new Error(`Failed to update review: ${error.message || error}`);
    }
  },

  delete: async (facilityId: string, reviewId: string): Promise<void> => {
    // 1. Authenticated user validation
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }

    const userId = currentUser.uid;

    if (!facilityId || typeof facilityId !== 'string' || facilityId.trim() === '') {
      throw new Error('Invalid facility ID: must be a non-empty string');
    }
    if (!reviewId || typeof reviewId !== 'string' || reviewId.trim() === '') {
      throw new Error('Invalid review ID: must be a non-empty string');
    }

    try {
      const docRef = doc(db, 'facilities', facilityId, 'reviews', reviewId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Review not found');
      }

      const existingReview = docSnap.data();

      // Enforce ownership
      if (existingReview.userId !== userId) {
        throw new Error('Permission denied: Cannot delete another user\'s review');
      }

      await deleteDoc(docRef);
    } catch (error: any) {
      console.error(`Error deleting review ${reviewId} for facility ${facilityId}:`, error);
      if (error.code === 'permission-denied' || error.message.includes('Permission denied')) {
        throw new Error('Permission denied: You do not have permission to delete this review');
      }
      throw new Error(`Failed to delete review: ${error.message || error}`);
    }
  }
};
