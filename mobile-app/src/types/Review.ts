export interface Review {
  id: string;
  userId: string;
  facilityId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}
