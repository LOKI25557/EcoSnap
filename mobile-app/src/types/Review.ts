export type Rating = 1 | 2 | 3 | 4 | 5;

export interface Review {
  id: string;
  facilityId: string;
  userId: string;
  rating: Rating;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  userDisplayName?: string;
  userPhotoUrl?: string;
}

export interface CreateReviewInput {
  facilityId: string;
  rating: Rating;
  comment?: string;
}

export interface UpdateReviewInput {
  rating?: Rating;
  comment?: string;
}

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface FacilityRatingSummary {
  averageRating: number;
  ratingCount: number;
  distribution: RatingDistribution;
}
