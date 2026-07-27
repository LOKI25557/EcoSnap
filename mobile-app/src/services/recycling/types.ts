import { Coordinate } from '../location/DistanceCalculator';

export interface RecyclingCenter {
  id: string;
  name: string;
  coordinate: Coordinate;
  address: string;
  acceptedMaterials: string[];
  openingHours: string;
  rating: number;
  contactNumber: string;
  website?: string;
}
