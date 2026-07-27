/**
 * Represents a geographical coordinate.
 */
export interface Coordinate {
  latitude: number;
  longitude: number;
}

export class DistanceCalculator {
  private static readonly EARTH_RADIUS_KM = 6371;

  /**
   * Calculates the straight-line (Haversine) distance between two points in kilometers.
   */
  static calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
    const dLat = this.degreesToRadians(coord2.latitude - coord1.latitude);
    const dLon = this.degreesToRadians(coord2.longitude - coord1.longitude);

    const lat1 = this.degreesToRadians(coord1.latitude);
    const lat2 = this.degreesToRadians(coord2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return this.EARTH_RADIUS_KM * c;
  }

  /**
   * Estimates walking time in minutes based on distance (assuming ~5km/h walking speed).
   */
  static estimateWalkingTime(distanceKm: number): number {
    const walkingSpeedKmH = 5;
    return Math.round((distanceKm / walkingSpeedKmH) * 60);
  }

  /**
   * Estimates driving time in minutes based on distance (assuming ~30km/h average city driving speed).
   */
  static estimateDrivingTime(distanceKm: number): number {
    const drivingSpeedKmH = 30;
    return Math.round((distanceKm / drivingSpeedKmH) * 60);
  }

  /**
   * Formats a distance in kilometers to a readable string (e.g., '1.2 km' or '800 m').
   */
  static formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  }

  private static degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
