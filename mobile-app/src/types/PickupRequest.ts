export type PickupStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';

export interface PickupRequest {
  id: string;
  userId: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  wasteCategories: string[];
  status: PickupStatus;
  requestedAt: Date;
  scheduledFor?: Date;
  notes?: string;
}
