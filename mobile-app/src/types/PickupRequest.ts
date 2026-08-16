import { WasteCategory } from '../constants/wasteCategories';

export type PickupStatus = 'pending' | 'scheduled' | 'assigned' | 'picked_up' | 'completed' | 'cancelled';

export type PickupTimeSlot = 'morning' | 'afternoon' | 'evening';

export interface PickupRequest {
  id: string;
  userId: string;
  wasteRecordId: string;
  wasteCategory: WasteCategory;
  quantity: string;
  pickupAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  preferredDate: Date;
  preferredTimeSlot: PickupTimeSlot;
  notes?: string;
  status: PickupStatus;
  createdAt: Date;
  updatedAt: Date;
  scheduledAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
}

export interface PickupRequestInput {
  userId: string;
  wasteRecordId: string;
  wasteCategory: WasteCategory;
  quantity: string;
  pickupAddress: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  preferredDate: Date;
  preferredTimeSlot: PickupTimeSlot;
  notes?: string;
}

export interface PickupRequestUpdate {
  wasteCategory?: WasteCategory;
  quantity?: string;
  pickupAddress?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  preferredDate?: Date;
  preferredTimeSlot?: PickupTimeSlot;
  notes?: string;
  status?: PickupStatus;
  scheduledAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
}
