export type FacilityType = 'recycling_center' | 'e_waste_center' | 'donation_center' | 'collection_point';

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  acceptedMaterials: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
