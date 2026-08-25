import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';
import { LocationService } from '../LocationService';
import { mapsService } from '../mapsService';
import { facilityService, LocalFacilityProvider, FirestoreFacilityProvider } from '../../recycling/facilityService';
import { firestoreService } from '../../firebase/firestoreService';

// Mock firebaseConfig to bypass environment variable check
jest.mock('../../firebase/firebaseConfig', () => ({
  db: {},
  auth: {},
  storage: {},
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
  Accuracy: {
    Balanced: 2,
  },
}));

// Mock react-native components
jest.mock('react-native', () => ({
  Platform: {
    select: jest.fn((options) => options.ios || options.android || options.default),
    OS: 'ios',
  },
  Linking: {
    canOpenURL: jest.fn(),
    openURL: jest.fn(),
  },
}));

// Mock firestoreService
jest.mock('../../firebase/firestoreService', () => ({
  firestoreService: {
    getFacilities: jest.fn(),
  },
}));

describe('Location and Map Services Tests (Milestone 14 QA Regression Verified)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Coordinate Validation', () => {
    test('should validate correct coordinates', () => {
      const valid = { latitude: 37.7749, longitude: -122.4194 };
      expect(mapsService.validateCoordinates(valid)).toBe(true);
    });

    test('should reject invalid latitude values', () => {
      const invalidLat1 = { latitude: 95.0, longitude: -122.4194 };
      const invalidLat2 = { latitude: -100.0, longitude: -122.4194 };
      expect(mapsService.validateCoordinates(invalidLat1)).toBe(false);
      expect(mapsService.validateCoordinates(invalidLat2)).toBe(false);
    });

    test('should reject invalid longitude values', () => {
      const invalidLon1 = { latitude: 37.7749, longitude: 185.0 };
      const invalidLon2 = { latitude: 37.7749, longitude: -190.0 };
      expect(mapsService.validateCoordinates(invalidLon1)).toBe(false);
      expect(mapsService.validateCoordinates(invalidLon2)).toBe(false);
    });

    test('should reject NaN or undefined coordinates', () => {
      expect(mapsService.validateCoordinates(null)).toBe(false);
      expect(mapsService.validateCoordinates({ latitude: NaN, longitude: -122.4194 })).toBe(false);
      expect(mapsService.validateCoordinates({ latitude: 37.7749, longitude: undefined })).toBe(false);
    });
  });

  describe('Distance Calculation', () => {
    test('should calculate distance correctly in meters using Haversine formula', () => {
      // Points approximately 1.11 km apart
      const c1 = { latitude: 37.7749, longitude: -122.4194 };
      const c2 = { latitude: 37.7849, longitude: -122.4194 };
      
      const distance = mapsService.calculateDistanceMeters(c1, c2);
      expect(distance).toBeGreaterThan(1100);
      expect(distance).toBeLessThan(1120);
    });

    test('should format distances correctly for UI display', () => {
      expect(mapsService.formatDistance(450)).toBe('450 m');
      expect(mapsService.formatDistance(2400)).toBe('2.4 km');
      expect(mapsService.formatDistance(0)).toBe('0 m');
    });
  });

  describe('Location Permissions & Tracking', () => {
    test('should return granted status when location permission is allowed', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
        canAskAgain: true,
      });

      const status = await LocationService.getLocationPermissionStatus();
      expect(status).toBe('granted');
      
      const allowed = await LocationService.hasLocationPermission();
      expect(allowed).toBe(true);
    });

    test('should return blocked status when permission is denied and cannot ask again', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
        canAskAgain: false,
      });

      const status = await LocationService.getLocationPermissionStatus();
      expect(status).toBe('blocked');
      
      const allowed = await LocationService.hasLocationPermission();
      expect(allowed).toBe(false);
    });

    test('should fallback to cached location when GPS fails or permissions are denied', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
        canAskAgain: true,
      });

      const loc = await LocationService.getCurrentLocation();
      // Should return last known location (which is initially null)
      expect(loc).toBeNull();
    });
  });

  describe('Facility Search & Filtering', () => {
    beforeAll(() => {
      facilityService.setProvider(new LocalFacilityProvider());
    });

    test('should search nearby mock facilities inside radius', async () => {
      // SF green earth recycling center coordinates: 37.7749, -122.4194
      // We search with a small radius of 100 meters
      const results = await facilityService.searchNearbyFacilities(37.7749, -122.4194, 100);
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Green Earth Recycling Center');
    });

    test('should filter nearby facilities by type', async () => {
      // Search with large radius (10km) but filtered for ewaste
      const results = await facilityService.searchNearbyFacilities(37.7749, -122.4194, 10000, 'ewaste_facility');
      expect(results.length).toBe(1);
      expect(results[0].type).toBe('ewaste_facility');
    });

    test('should handle empty facility results when none are in range', async () => {
      // Search in coordinates far away (e.g. London)
      const results = await facilityService.searchNearbyFacilities(51.5074, -0.1278, 1000);
      expect(results.length).toBe(0);
    });

    test('should fail if search parameters are invalid', async () => {
      await expect(facilityService.searchNearbyFacilities(37.7749, -122.4194, -50)).rejects.toThrow();
      await expect(facilityService.searchNearbyFacilities(100.0, -122.4194, 5000)).rejects.toThrow();
    });
  });

  describe('Navigation URL & Handoff Validation', () => {
    test('should generate correct platform navigation URL', () => {
      const url = mapsService.getNavigationUrl(37.7749, -122.4194);
      expect(url).toContain('37.7749');
      expect(url).toContain('-122.4194');
    });

    test('should throw error when generating navigation URL with invalid coordinates', () => {
      expect(() => mapsService.getNavigationUrl(120.0, -122.4194)).toThrow();
    });

    test('should launch external navigation successfully if URL is supported', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
      (Linking.openURL as jest.Mock).mockResolvedValue(true);

      const launched = await mapsService.launchNavigation(37.7749, -122.4194);
      expect(launched).toBe(true);
      expect(Linking.openURL).toHaveBeenCalled();
    });
  });
});
