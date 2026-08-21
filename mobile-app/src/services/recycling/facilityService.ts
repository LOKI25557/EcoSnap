import { Facility, FacilityType, OpeningHours } from '../../types/Facility';
import { mapsService } from '../location/mapsService';
import { facilityRepository } from '../firebase/facilityRepository';
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
    isActive: true,
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
    isActive: true,
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
    isActive: true,
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
    isActive: true,
  },
];

export function validateFacility(facility: any, isUpdate = false, adminOverride = false) {
  // Common validations
  if (!isUpdate) {
    if (!facility.name || typeof facility.name !== 'string' || facility.name.trim() === '') {
      throw new Error('Invalid name: must be a non-empty string');
    }
    if (!facility.type || !['recycling_center', 'ewaste_facility', 'donation_center'].includes(facility.type)) {
      throw new Error('Invalid type: must be one of recycling_center, ewaste_facility, donation_center');
    }
    if (!facility.address || typeof facility.address !== 'string' || facility.address.trim() === '') {
      throw new Error('Invalid address: must be a non-empty string');
    }
    if (facility.latitude === undefined || facility.longitude === undefined) {
      throw new Error('Coordinates are required');
    }
  }

  if (facility.name !== undefined && (typeof facility.name !== 'string' || facility.name.trim() === '')) {
    throw new Error('Invalid name: must be a non-empty string');
  }

  if (facility.type !== undefined && !['recycling_center', 'ewaste_facility', 'donation_center'].includes(facility.type)) {
    throw new Error('Invalid type: must be one of recycling_center, ewaste_facility, donation_center');
  }

  if (facility.address !== undefined && (typeof facility.address !== 'string' || facility.address.trim() === '')) {
    throw new Error('Invalid address: must be a non-empty string');
  }

  // Coordinates validation
  if (facility.latitude !== undefined || facility.longitude !== undefined) {
    const lat = facility.latitude;
    const lon = facility.longitude;

    if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon) || !isFinite(lat) || !isFinite(lon)) {
      throw new Error('Invalid coordinates: latitude and longitude must be valid finite numbers');
    }

    if (lat < -90 || lat > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90');
    }

    if (lon < -180 || lon > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180');
    }
  }

  // Accepted Materials validation
  if (facility.acceptedMaterials !== undefined) {
    if (!Array.isArray(facility.acceptedMaterials)) {
      throw new Error('Invalid acceptedMaterials: must be an array of strings');
    }
    facility.acceptedMaterials.forEach((material: any) => {
      if (typeof material !== 'string' || material.trim() === '') {
        throw new Error('Invalid material: must be a non-empty string');
      }
    });
  }

  // Opening Hours validation
  if (facility.openingHours !== undefined && facility.openingHours !== null) {
    if (typeof facility.openingHours === 'object') {
      const oh = facility.openingHours;
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      days.forEach((day) => {
        const val = oh[day];
        if (val !== undefined && val !== null) {
          if (typeof val.open !== 'string' || typeof val.close !== 'string') {
            throw new Error(`Invalid opening hours for ${day}: open and close times must be strings`);
          }
        }
      });
    } else if (typeof facility.openingHours !== 'string') {
      throw new Error('Invalid openingHours: must be a structured object or a string');
    }
  }

  // Privileged fields validation
  if (!adminOverride) {
    if (facility.verified !== undefined && facility.verified !== false) {
      throw new Error('Permission denied: Ordinary users cannot verify facilities');
    }
    if (facility.rating !== undefined && facility.rating !== 0) {
      throw new Error('Permission denied: Ordinary users cannot modify facility rating');
    }
    if (facility.reviewCount !== undefined && facility.reviewCount !== 0) {
      throw new Error('Permission denied: Ordinary users cannot modify facility reviewCount');
    }
    if (facility.status !== undefined && facility.status !== 'pending') {
      throw new Error('Permission denied: Ordinary users cannot set facility status');
    }
  }
}

export function isFacilityOpen(facility: Facility, date = new Date()): boolean {
  const oh = facility.openingHours;
  if (!oh) return false;
  if (typeof oh === 'string') {
    return oh.toLowerCase().includes('24');
  }

  if (oh.is24Hours) return true;

  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday';

  const range = oh[dayOfWeek];
  if (!range) return false; // Closed today

  const openTime = range.open;
  const closeTime = range.close;

  if (!openTime || !closeTime) return false;

  const currentHours = date.getHours().toString().padStart(2, '0');
  const currentMinutes = date.getMinutes().toString().padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  return currentTimeStr >= openTime && currentTimeStr <= closeTime;
}

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
      let fType = f.type;
      if (type && fType !== type) {
        return false;
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
    const result = await facilityRepository.list({ type, activeOnly: true, limit: 50 });
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

  async createFacility(
    input: Omit<Facility, 'id' | 'createdAt' | 'updatedAt'>,
    adminOverride = false
  ): Promise<string> {
    validateFacility(input, false, adminOverride);

    const facilityData = {
      ...input,
      verified: input.verified ?? false,
      rating: input.rating ?? 0,
      reviewCount: input.reviewCount ?? 0,
      status: input.status ?? 'pending',
      isActive: input.isActive ?? true,
    };

    return await facilityRepository.create(facilityData);
  }

  async updateFacility(
    id: string,
    updates: Partial<Facility>,
    adminOverride = false
  ): Promise<void> {
    const existing = await facilityRepository.get(id);
    if (!existing) {
      throw new Error('Facility not found');
    }

    validateFacility(updates, true, adminOverride);

    await facilityRepository.update(id, updates);
  }

  async getFacilityById(id: string): Promise<Facility | null> {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('Invalid facility ID: must be a non-empty string');
    }
    return await facilityRepository.get(id);
  }

  async listFacilities(filters?: {
    type?: FacilityType;
    activeOnly?: boolean;
    verifiedOnly?: boolean;
    limit?: number;
    cursor?: any;
  }): Promise<{ items: Facility[]; lastVisible: any | null }> {
    return await facilityRepository.list(filters);
  }

  async getFacilitiesByType(type: FacilityType): Promise<Facility[]> {
    if (!type || !['recycling_center', 'ewaste_facility', 'donation_center'].includes(type)) {
      throw new Error('Invalid type: must be one of recycling_center, ewaste_facility, donation_center');
    }
    const result = await facilityRepository.list({ type, activeOnly: true, limit: 50 });
    return result.items;
  }

  isFacilityOpen(facility: Facility, date = new Date()): boolean {
    return isFacilityOpen(facility, date);
  }

  async getFacilityRating(facilityId: string): Promise<{ averageRating: number; reviewCount: number }> {
    const facility = await this.getFacilityById(facilityId);
    if (!facility) {
      throw new Error('Facility not found');
    }

    if (facility.rating !== undefined && facility.reviewCount !== undefined) {
      return {
        averageRating: facility.rating,
        reviewCount: facility.reviewCount,
      };
    }

    const reviewsResult = await firestoreService.getFacilityReviews(facilityId);
    let total = 0;
    reviewsResult.items.forEach((r) => (total += r.rating));
    const count = reviewsResult.items.length;
    const avg = count > 0 ? Math.round((total / count) * 10) / 10 : 0;

    return {
      averageRating: avg,
      reviewCount: count,
    };
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

  async searchFacilities(params: {
    query?: string;
    type?: FacilityType;
    material?: string;
    verifiedOnly?: boolean;
    activeOnly?: boolean;
    latitude?: number;
    longitude?: number;
    radiusMeters?: number;
    limit?: number;
    cursor?: any;
  }): Promise<{ items: Facility[]; lastVisible: any | null }> {
    if (params.radiusMeters !== undefined && (params.radiusMeters <= 0 || params.radiusMeters > 100000)) {
      throw new Error('Invalid radius: must be between 1 and 100000 meters');
    }
    if (params.latitude !== undefined || params.longitude !== undefined) {
      if (params.latitude === undefined || params.longitude === undefined) {
        throw new Error('Both latitude and longitude are required for location filtering');
      }
      if (!mapsService.validateCoordinates({ latitude: params.latitude, longitude: params.longitude })) {
        throw new Error('Invalid coordinates for search');
      }
    }

    try {
      const listParams = {
        type: params.type,
        activeOnly: params.activeOnly ?? true,
        verifiedOnly: params.verifiedOnly,
        limit: params.limit || 50,
        cursor: params.cursor,
      };

      const result = await facilityRepository.list(listParams);
      let items = result.items;

      if (params.query && params.query.trim()) {
        const q = params.query.trim().toLowerCase();
        items = items.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.address.toLowerCase().includes(q) ||
            (f.description && f.description.toLowerCase().includes(q))
        );
      }

      if (params.material && params.material.trim()) {
        const m = params.material.trim().toLowerCase();
        items = items.filter(
          (f) =>
            f.acceptedMaterials &&
            f.acceptedMaterials.some((mat) => mat.toLowerCase().includes(m))
        );
      }

      if (params.latitude !== undefined && params.longitude !== undefined) {
        const center = { latitude: params.latitude, longitude: params.longitude };
        const radius = params.radiusMeters || 10000;

        items = items
          .map((f) => {
            const dist = mapsService.calculateDistanceMeters(center, {
              latitude: f.latitude,
              longitude: f.longitude,
            });
            return { ...f, distanceMeters: dist };
          })
          .filter((f) => f.distanceMeters !== undefined && f.distanceMeters <= radius);

        items.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
      }

      return {
        items,
        lastVisible: result.lastVisible,
      };
    } catch (error) {
      console.error('Error in searchFacilities:', error);
      throw error;
    }
  }
}

export const facilityService = new FacilityServiceImpl(new FirestoreFacilityProvider());
