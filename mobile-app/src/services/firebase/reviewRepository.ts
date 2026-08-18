import { db } from './firebaseConfig';
import {
  Review,
  CreateReviewInput,
  UpdateReviewInput
} from '../../types/Review';

export const reviewRepository = {
  create: async (input: CreateReviewInput): Promise<string> => {
    throw new Error('Not implemented');
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
