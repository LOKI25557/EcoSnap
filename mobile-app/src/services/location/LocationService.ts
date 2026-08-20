import * as Location from 'expo-location';
import { Coordinate } from './DistanceCalculator';

export type LocationPermissionResult = 'granted' | 'denied' | 'blocked' | 'undetermined';

class LocationServiceImpl {
  private lastKnownLocation: Coordinate | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;

  /**
   * Requests foreground location permission.
   */
  async requestLocationPermission(): Promise<LocationPermissionResult> {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') return 'granted';
      if (!canAskAgain) return 'blocked';
      return 'denied';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return 'denied';
    }
  }

  /**
   * Checks the current foreground location permission status.
   */
  async getLocationPermissionStatus(): Promise<LocationPermissionResult> {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') return 'granted';
      if (status === 'undetermined') return 'undetermined';
      if (!canAskAgain) return 'blocked';
      return 'denied';
    } catch (error) {
      console.error('Error checking location permission status:', error);
      return 'undetermined';
    }
  }

  /**
   * Checks if foreground location permission is granted.
   */
  async hasLocationPermission(): Promise<boolean> {
    const status = await this.getLocationPermissionStatus();
    return status === 'granted';
  }

  /**
   * Retrieves the current location, using cached if GPS is unavailable or fails.
   */
  async getCurrentLocation(): Promise<Coordinate | null> {
    const hasPermission = await this.hasLocationPermission();
    if (!hasPermission) {
      console.warn('Location permission not granted. Returning last known location.');
      return this.lastKnownLocation;
    }

    try {
      // First try to get the last known location quickly
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        this.lastKnownLocation = {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
        };
      }

      // Try to get a fresh location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      this.lastKnownLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      return this.lastKnownLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      return this.lastKnownLocation; // Fallback to cache on error
    }
  }

  /**
   * Watches the user's location and calls the callback on updates.
   */
  async watchLocation(callback: (location: Coordinate) => void): Promise<void> {
    const hasPermission = await this.hasLocationPermission();
    if (!hasPermission) {
      console.warn('Location permission not granted. Cannot watch location.');
      return;
    }

    if (this.locationSubscription) {
      this.locationSubscription.remove();
    }

    try {
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
          distanceInterval: 10,
        },
        (location) => {
          const coord = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          this.lastKnownLocation = coord;
          callback(coord);
        }
      );
    } catch (error) {
      console.error('Error watching location:', error);
    }
  }

  /**
   * Stops watching the user's location.
   */
  stopWatchingLocation(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }

  /**
   * Returns the last known cached location without making an asynchronous call.
   */
  getCachedLocation(): Coordinate | null {
    return this.lastKnownLocation;
  }
}

// Export as singleton
export const LocationService = new LocationServiceImpl();

