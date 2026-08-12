export type PickupStatus = 'pending' | 'scheduled' | 'assigned' | 'picked_up' | 'completed' | 'cancelled';

export interface PickupRequest {
  id: string;
  userId: string;
  wasteType: string;
  quantity: string;
  pickupAddress: string;
  latitude?: number;
  longitude?: number;
  scheduledDate: Date;
  status: PickupStatus;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}
