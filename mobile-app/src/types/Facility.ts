export type FacilityType = 'recycling_center' | 'ewaste_facility' | 'donation_center';

export interface TimeRange {
  open: string;  // e.g. "09:00"
  close: string; // e.g. "18:00"
}

export interface OpeningHours {
  monday?: TimeRange | null;
  tuesday?: TimeRange | null;
  wednesday?: TimeRange | null;
  thursday?: TimeRange | null;
  friday?: TimeRange | null;
  saturday?: TimeRange | null;
  sunday?: TimeRange | null;
  is24Hours?: boolean;
}

export type FacilityStatus = 'active' | 'inactive' | 'pending' | 'suspended' | 'review' | 'verified';

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  description?: string;
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  openingHours?: OpeningHours | string;
  acceptedMaterials?: string[];
  verified?: boolean;
  distanceMeters?: number;
  isActive?: boolean;
  status?: FacilityStatus;
  rating?: number;
  reviewCount?: number;
  source?: string;
  createdAt?: Date;
  updatedAt?: Date;
  imageUrl?: string;
  directionsUrl?: string;
}

