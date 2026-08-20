import { Facility, FacilityType } from '../../types/Facility';
import { mapsService } from '../location/mapsService';
import { firestoreService } from '../firebase/firestoreService';

export interface FacilityProvider {
  searchNearby(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    type?: FacilityType
  ): Promise<Facility[]>;
}

const MOCK_FACILITIES: Facility[] = [
  {
    id: '1',
    name: 'Green Earth Recycling Center',
    type: 'recycling_center',
    latitude: 37.7749,
    longitude: -122.4194,
    address: '123 Eco Way, San Francisco, CA 94102',
    phone: '+1 415-555-0101',
    website: 'https://example.com/greenearth',
    openingHours: 'Mon-Fri: 8AM-5PM, Sat: 9AM-2PM',
    acceptedMaterials: ['plastic', 'glass', 'paper', 'cardboard'],
    verified: true,
  },
  {
    id: '2',
    name: 'E-Waste Solutions',
    type: 'ewaste_facility',
    latitude: 37.7849,
    longitude: -122.4094,
    address: '456 Tech Blvd, San Francisco, CA 94105',
    phone: '+1 415-555-0202',
    website: 'https://example.com/ewastesolutions',
    openingHours: 'Mon-Sat: 10AM-6PM',
    acceptedMaterials: ['electronic', 'battery', 'metal'],
    verified: true,
  },
  {
    id: '3',
    name: 'City Compost & Yard Waste',
    type: 'recycling_center',
    latitude: 37.7649,
    longitude: -122.4294,
    address: '789 Nature Ln, San Francisco, CA 94103',
    phone: '+1 415-555-0303',
    website: 'https://example.com/citycompost',
    openingHours: 'Tue-Sun: 7AM-3PM',
    acceptedMaterials: ['organic', 'compost', 'wood'],
    verified: false,
  },
  {
    id: '4',
    name: 'SF Community Donation Center',
    type: 'donation_center',
    latitude: 37.7799,
    longitude: -122.4144,
    address: '321 Hope St, San Francisco, CA 94103',
    phone: '+1 415-555-0404',
    website: 'https://example.com/donation',
    openingHours: 'Mon-Sun: 9AM-5PM',
    acceptedMaterials: ['clothing', 'furniture', 'book'],
    verified: true,
  },
];

export class LocalFacilityProvider implements FacilityProvider {
  async searchNearby(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    type?: FacilityType
  ): Promise<Facility[]> {
    // Simulate minor network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const center = { latitude, longitude };
    return MOCK_FACILITIES.filter((f) => {
      // Map legacy/alternative types if matching type parameter
      let fType = f.type;
      if (type && fType !== type) {
        // Compatibility mapping: if searching for ewaste_facility, also map e_waste_center
        if (type === 'ewaste_facility' && fType === 'e_waste_center') {
          // match
        } else {
          return false;
        }
      }

      const distance = mapsService.calculateDistanceMeters(center, {
        latitude: f.latitude,
        longitude: f.longitude,
      });

      if (distance <= radiusMeters) {
        f.distanceMeters = distance;
        return true;
      }
      return false;
    });
  }
}

export class FirestoreFacilityProvider implements FacilityProvider {
  async searchNearby(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    type?: FacilityType
  ): Promise<Facility[]> {
    const result = await firestoreService.getFacilities(type);
    const center = { latitude, longitude };

    return result.items
      .map((f) => {
        const dist = mapsService.calculateDistanceMeters(center, {
          latitude: f.latitude,
          longitude: f.longitude,
        });
        return { ...f, distanceMeters: dist };
      })
      .filter((f) => f.distanceMeters !== undefined && f.distanceMeters <= radiusMeters);
  }
}

class FacilityServiceImpl {
  private provider: FacilityProvider;

  constructor(provider: FacilityProvider) {
    this.provider = provider;
  }

  setProvider(provider: FacilityProvider) {
    this.provider = provider;
  }

  async searchNearbyFacilities(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    type?: FacilityType
  ): Promise<Facility[]> {
    // Radius validation
    if (radiusMeters <= 0 || radiusMeters > 100000) {
      throw new Error('Invalid radius: must be between 1 and 100000 meters');
    }

    // Coordinate validation
    if (!mapsService.validateCoordinates({ latitude, longitude })) {
      throw new Error('Invalid coordinates for facility search');
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Facility search timed out')), 5000)
      );

      const facilities = await Promise.race([
        this.provider.searchNearby(latitude, longitude, radiusMeters, type),
        timeoutPromise,
      ]);

      return [...facilities].sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
    } catch (error) {
      console.error('Error in searchNearbyFacilities:', error);
      throw error;
    }
  }
}

export const facilityService = new FacilityServiceImpl(new LocalFacilityProvider());
