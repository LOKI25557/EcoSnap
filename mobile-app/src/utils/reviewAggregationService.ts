import { Review, FacilityRatingSummary } from '../types/Review';

/**
 * Calculates rating statistics and distribution from an array of reviews.
 * 
 * NOTE: For production, this aggregate summary calculation should eventually be moved
 * to a Cloud Function (e.g., triggered onReviewWrite) to run in a trusted, transactional
 * server environment instead of relying on client-side calculations.
 */
export const calculateRatingSummary = (reviews: Review[]): FacilityRatingSummary => {
  const distribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  if (!reviews || reviews.length === 0) {
    return {
      averageRating: 0,
      ratingCount: 0,
      distribution,
    };
  }

  let totalRating = 0;
  reviews.forEach((review) => {
    const ratingVal = review.rating;
    if (ratingVal >= 1 && ratingVal <= 5) {
      distribution[ratingVal as 1 | 2 | 3 | 4 | 5] += 1;
      totalRating += ratingVal;
    }
  });

  const ratingCount = reviews.length;
  // Calculate average and round safely to 1 decimal place (avoiding floating point issues)
  const averageRating = Math.round((totalRating / ratingCount) * 10) / 10;

  return {
    averageRating,
    ratingCount,
    distribution,
  };
};
