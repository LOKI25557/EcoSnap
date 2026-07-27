import { RecyclingCenter } from './types';
import { DistanceCalculator, Coordinate } from '../location/DistanceCalculator';

export interface CenterWithDistance extends RecyclingCenter {
  distanceKm: number;
}

export class CenterSearch {
  /**
   * Calculates the distance for each center from the user location and sorts them by nearest.
   */
  static sortByNearest(centers: RecyclingCenter[], userLocation: Coordinate): CenterWithDistance[] {
    const centersWithDistance: CenterWithDistance[] = centers.map(center => ({
      ...center,
      distanceKm: DistanceCalculator.calculateDistance(userLocation, center.coordinate),
    }));

    return centersWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /**
   * Search centers by name or address keyword.
   */
  static searchByKeyword(centers: RecyclingCenter[], keyword: string): RecyclingCenter[] {
    if (!keyword.trim()) return centers;
    const lowerKeyword = keyword.toLowerCase();
    
    return centers.filter(center => 
      center.name.toLowerCase().includes(lowerKeyword) ||
      center.address.toLowerCase().includes(lowerKeyword)
    );
  }
}
