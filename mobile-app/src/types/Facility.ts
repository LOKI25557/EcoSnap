export type FacilityType = 'recycling_center' | 'ewaste_facility' | 'donation_center' | 'e_waste_center' | 'collection_point';

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  acceptedMaterials?: string[];
  verified?: boolean;
  distanceMeters?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

