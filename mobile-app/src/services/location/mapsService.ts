import { DistanceCalculator } from './DistanceCalculator';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapMarkerData {
  id: string;
  coordinate: Coordinates;
  title: string;
  description: string;
  type: string;
  raw: any;
}

/**
 * Validates coordinate limits and type.
 */
export function validateCoordinates(coords: any): coords is Coordinates {
  if (!coords) return false;
  const { latitude, longitude } = coords;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  if (isNaN(latitude) || isNaN(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  return true;
}

/**
 * Normalizes an arbitrary coordinate object to standard Coordinates.
 */
export function normalizeCoordinates(coords: any): Coordinates {
  if (!validateCoordinates(coords)) {
    throw new Error(`Invalid coordinates: ${JSON.stringify(coords)}`);
  }
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

/**
 * Calculates a map region containing all provided coordinates.
 */
export function calculateRegion(coords: Coordinates[], paddingFactor = 1.3): MapRegion {
  if (coords.length === 0) {
    // Default to San Francisco
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  const validCoords = coords.filter(validateCoordinates);
  if (validCoords.length === 0) {
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  if (validCoords.length === 1) {
    return {
      latitude: validCoords[0].latitude,
      longitude: validCoords[0].longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }

  let minLat = validCoords[0].latitude;
  let maxLat = validCoords[0].latitude;
  let minLon = validCoords[0].longitude;
  let maxLon = validCoords[0].longitude;

  for (const c of validCoords) {
    minLat = Math.min(minLat, c.latitude);
    maxLat = Math.max(maxLat, c.latitude);
    minLon = Math.min(minLon, c.longitude);
    maxLon = Math.max(maxLon, c.longitude);
  }

  const midLat = (minLat + maxLat) / 2;
  const midLon = (minLon + maxLon) / 2;

  const latDelta = Math.max(0.005, (maxLat - minLat) * paddingFactor);
  const lonDelta = Math.max(0.005, (maxLon - minLon) * paddingFactor);

  return {
    latitude: midLat,
    longitude: midLon,
    latitudeDelta: latDelta,
    longitudeDelta: lonDelta,
  };
}

/**
 * Calculates distance between two points in meters using the Haversine formula.
 */
export function calculateDistanceMeters(coord1: Coordinates, coord2: Coordinates): number {
  if (!validateCoordinates(coord1) || !validateCoordinates(coord2)) {
    throw new Error('Invalid coordinates for distance calculation');
  }

  const R = 6371000; // Earth's radius in meters
  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const dLatRad = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLonRad = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLonRad / 2) * Math.sin(dLonRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Formats distance dynamically for user interface.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
}

/**
 * Generates structured marker data from raw inputs.
 */
export function generateMarkerData(
  id: string,
  latitude: number,
  longitude: number,
  title: string,
  description: string,
  type: string,
  raw: any
): MapMarkerData {
  const coordinate = { latitude, longitude };
  if (!validateCoordinates(coordinate)) {
    throw new Error(`Invalid coordinate for marker ${id}`);
  }
  return {
    id,
    coordinate,
    title,
    description,
    type,
    raw,
  };
}

/**
 * Returns platform-specific navigation url for coordinates.
 */
export function getNavigationUrl(latitude: number, longitude: number): string {
  const coordinate = { latitude, longitude };
  if (!validateCoordinates(coordinate)) {
    throw new Error('Invalid destination coordinates for navigation');
  }
  return Platform.select({
    ios: `maps://app?daddr=${latitude},${longitude}`,
    android: `google.navigation:q=${latitude},${longitude}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
  });
}

/**
 * Launches the external native maps navigation handoff.
 */
export async function launchNavigation(latitude: number, longitude: number): Promise<boolean> {
  try {
    const url = getNavigationUrl(latitude, longitude);
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    } else {
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      await Linking.openURL(webUrl);
      return true;
    }
  } catch (error) {
    console.error('Error launching navigation:', error);
    return false;
  }
}

export const mapsService = {
  validateCoordinates,
  normalizeCoordinates,
  calculateRegion,
  calculateDistanceMeters,
  formatDistance,
  generateMarkerData,
  getNavigationUrl,
  launchNavigation,
};
import { Linking, Platform } from 'react-native';

