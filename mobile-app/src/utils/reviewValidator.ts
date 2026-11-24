import { MIN_RATING, MAX_RATING, MAX_REVIEW_LENGTH } from '../constants/firebase';
import { CreateReviewInput, UpdateReviewInput } from '../types/Review';

/**
 * Validates a review input object.
 * Throws an Error if validation fails.
 */
export const validateReview = (
  input: any,
  isUpdate = false
) => {
  // If not an update, check required fields
  if (!isUpdate) {
    const createInput = input as CreateReviewInput;
    if (!createInput.facilityId || typeof createInput.facilityId !== 'string' || createInput.facilityId.trim() === '') {
      throw new Error('Facility ID is required');
    }
  }

  // Validate facilityId if present
  if (input.facilityId !== undefined) {
    if (typeof input.facilityId !== 'string' || input.facilityId.trim() === '') {
      throw new Error('Invalid facility ID: must be a non-empty string');
    }
    // Reject obviously malformed IDs (e.g. contains illegal characters for Firestore document IDs)
    if (input.facilityId.includes('/') || input.facilityId.trim() === '.' || input.facilityId.trim() === '..') {
      throw new Error('Invalid facility ID: contains malformed characters');
    }
  }

  // Validate rating if present
  if (input.rating !== undefined) {
    if (
      typeof input.rating !== 'number' ||
      input.rating < MIN_RATING ||
      input.rating > MAX_RATING ||
      !Number.isInteger(input.rating)
    ) {
      throw new Error(`Rating must be an integer between ${MIN_RATING} and ${MAX_RATING}`);
    }
  } else if (!isUpdate) {
    throw new Error('Rating is required');
  }

  // Validate comment if present
  if (input.comment !== undefined && input.comment !== null) {
    if (typeof input.comment !== 'string') {
      throw new Error('Comment must be a string');
    }
    const trimmed = input.comment.trim();
    if (trimmed === '') {
      throw new Error('Comment cannot be empty or only whitespace');
    }
    if (trimmed.length > MAX_REVIEW_LENGTH) {
      throw new Error(`Comment cannot exceed ${MAX_REVIEW_LENGTH} characters`);
    }
  }
};
