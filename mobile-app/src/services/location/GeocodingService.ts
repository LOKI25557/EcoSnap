import * as Location from 'expo-location';
import { Coordinate } from './DistanceCalculator';

export class GeocodingService {
  /**
   * Reverse geocodes a coordinate to a readable address.
   */
  static async reverseGeocode(coordinate: Coordinate): Promise<Location.LocationGeocodedAddress | null> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      });

      if (results.length > 0) {
        return results[0];
      }
      return null;
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Formats a reverse geocoded address into a display string.
   */
  static formatAddress(address: Location.LocationGeocodedAddress | null): string {
    if (!address) {
      return 'Unknown Location';
    }

    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    else if (address.subregion) parts.push(address.subregion);
    if (address.region) parts.push(address.region);

    return parts.join(', ') || 'Unknown Location';
  }
}
