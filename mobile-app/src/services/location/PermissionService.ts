import * as Location from 'expo-location';

export class PermissionService {
  /**
   * Request foreground location permission.
   */
  static async requestForegroundPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting foreground location permission', error);
      return false;
    }
  }

  /**
   * Check current foreground location permission status.
   */
  static async checkForegroundPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking foreground location permission', error);
      return false;
    }
  }
}
