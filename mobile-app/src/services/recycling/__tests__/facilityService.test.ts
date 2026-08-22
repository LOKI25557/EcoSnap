jest.mock('../../firebase/firebaseConfig', () => ({
  db: {},
  auth: {},
  storage: {},
}));

import { facilityService, LocalFacilityProvider, FirestoreFacilityProvider } from '../facilityService';
import { facilityRepository } from '../../firebase/facilityRepository';
import { firestoreService } from '../../firebase/firestoreService';
import { Facility } from '../../../types/Facility';
import { Review } from '../../../types/Review';

// Mock firestoreService reviews
jest.mock('../../firebase/firestoreService', () => {
  return {
    firestoreService: {
      getFacilityReviews: jest.fn(),
    },
  };
});

// Mock firebase/firestore
let mockDatabase: Record<string, any> = {};

jest.mock('firebase/firestore', () => {
  return {
    getFirestore: jest.fn(),
    collection: jest.fn(() => ({ id: 'facilities', path: 'facilities' })),
    doc: jest.fn((db, col, id) => {
      const actualId = id || Math.random().toString(36).substring(7);
      return { id: actualId, path: `facilities/${actualId}` };
    }),
    setDoc: jest.fn(async (docRef, data) => {
      mockDatabase[docRef.id] = { ...data, id: docRef.id };
    }),
    getDoc: jest.fn(async (docRef) => {
      const data = mockDatabase[docRef.id];
      return {
        exists: () => !!data,
        data: () => data,
        id: docRef.id,
      };
    }),
    updateDoc: jest.fn(async (docRef, data) => {
      if (!mockDatabase[docRef.id]) {
        throw new Error('Not found');
      }
      mockDatabase[docRef.id] = { ...mockDatabase[docRef.id], ...data };
    }),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    startAfter: jest.fn(),
    getDocs: jest.fn(async () => {
      const docs = Object.values(mockDatabase).map((data) => ({
        id: data.id,
        data: () => data,
      }));
      return {
        docs,
        forEach: (cb: any) => docs.forEach(cb),
      };
    }),
    serverTimestamp: jest.fn(() => new Date()),
  };
});

describe('FacilityService Tests', () => {
  beforeEach(() => {
    mockDatabase = {};
    jest.clearAllMocks();
    facilityService.setProvider(new FirestoreFacilityProvider());
  });

  const validFacilityInput = {
    name: 'Test Center',
    type: 'recycling_center' as const,
    address: '123 Green Rd',
    latitude: 37.7749,
    longitude: -122.4194,
    description: 'A test center',
    phone: '555-0199',
    website: 'https://test.com',
    acceptedMaterials: ['plastic', 'glass'],
    openingHours: {
      is24Hours: false,
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '10:00', close: '14:00' },
      sunday: null,
    },
  };

  describe('Facility Creation & Validation', () => {
    test('should create a valid facility with default status pending', async () => {
      const id = await facilityService.createFacility(validFacilityInput);
      expect(id).toBeDefined();

      const created = await facilityService.getFacilityById(id);
      expect(created).toBeDefined();
      expect(created?.name).toBe('Test Center');
      expect(created?.status).toBe('pending');
      expect(created?.verified).toBe(false);
    });

    test('should reject invalid coordinates', async () => {
      const invalid = { ...validFacilityInput, latitude: 120 };
      await expect(facilityService.createFacility(invalid)).rejects.toThrow();
    });

    test('should reject non-admin users setting privileged fields', async () => {
      const invalid = { ...validFacilityInput, verified: true };
      await expect(facilityService.createFacility(invalid)).rejects.toThrow();

      const invalidRating = { ...validFacilityInput, rating: 4.5 };
      await expect(facilityService.createFacility(invalidRating)).rejects.toThrow();
    });

    test('should allow admin overriding privileged fields', async () => {
      const input = { ...validFacilityInput, verified: true, status: 'active' as const };
      const id = await facilityService.createFacility(input, true);
      const created = await facilityService.getFacilityById(id);
      expect(created?.verified).toBe(true);
      expect(created?.status).toBe('active');
    });
  });

  describe('Facility Updates & Transition Rules', () => {
    test('should update non-privileged fields', async () => {
      const id = await facilityService.createFacility(validFacilityInput);
      await facilityService.updateFacility(id, { name: 'Updated Name', address: '456 Eco Way' });

      const updated = await facilityService.getFacilityById(id);
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.address).toBe('456 Eco Way');
    });

    test('should prevent ordinary user setting status other than pending', async () => {
      const id = await facilityService.createFacility(validFacilityInput);
      await expect(facilityService.updateFacility(id, { status: 'active' })).rejects.toThrow();
    });

    test('should allow transition from pending to review', async () => {
      const id = await facilityService.createFacility(validFacilityInput);
      await facilityService.updateFacility(id, { status: 'review' }, true);
      const updated = await facilityService.getFacilityById(id);
      expect(updated?.status).toBe('review');
    });

    test('should prevent invalid status transition', async () => {
      const id = await facilityService.createFacility(validFacilityInput);
      await expect(facilityService.updateFacility(id, { status: 'active' }, true)).rejects.toThrow(
        'Invalid status transition from pending to active'
      );
    });
  });

  describe('isFacilityOpen Helper', () => {
    test('should return true for 24 hours facility', () => {
      const fac = {
        ...validFacilityInput,
        id: '1',
        openingHours: { is24Hours: true },
      } as Facility;
      expect(facilityService.isFacilityOpen(fac)).toBe(true);
    });

    test('should return false if closed on day of week', () => {
      const fac = {
        ...validFacilityInput,
        id: '1',
      } as Facility;
      const sunday = new Date('2026-08-23T12:00:00Z');
      expect(facilityService.isFacilityOpen(fac, sunday)).toBe(false);
    });

    test('should return true if current time is within open and close window', () => {
      const fac = {
        ...validFacilityInput,
        id: '1',
      } as Facility;
      const mondayNoon = new Date('2026-08-17T12:00:00');
      expect(facilityService.isFacilityOpen(fac, mondayNoon)).toBe(true);
    });

    test('should return false if current time is outside open and close window', () => {
      const fac = {
        ...validFacilityInput,
        id: '1',
      } as Facility;
      const mondayNight = new Date('2026-08-17T22:00:00');
      expect(facilityService.isFacilityOpen(fac, mondayNight)).toBe(false);
    });
  });

  describe('Duplicate Detection', () => {
    test('should detect duplicate when facility with same name and location exists', async () => {
      await facilityService.createFacility(validFacilityInput);
      
      const duplicate = await facilityService.checkDuplicate(
        'Test Center',
        37.7749,
        -122.4194
      );
      expect(duplicate).toBeDefined();
      expect(duplicate?.name).toBe('Test Center');
    });

    test('should detect duplicate when another facility exists within 100m proximity', async () => {
      await facilityService.createFacility(validFacilityInput);

      const duplicate = await facilityService.checkDuplicate(
        'Different Name But Close',
        37.77492,
        -122.4192
      );
      expect(duplicate).toBeDefined();
    });

    test('should return null when name is different and location is distant', async () => {
      await facilityService.createFacility(validFacilityInput);

      const duplicate = await facilityService.checkDuplicate(
        'Unique Center',
        37.8,
        -122.4
      );
      expect(duplicate).toBeNull();
    });
  });

  describe('Facility Search & Filtering', () => {
    test('should search and filter facilities by name, material, and type', async () => {
      await facilityService.createFacility({
        ...validFacilityInput,
        name: 'Metal Recyclers',
        type: 'recycling_center' as const,
        acceptedMaterials: ['metal'],
      });

      await facilityService.createFacility({
        ...validFacilityInput,
        name: 'E-Waste Depot',
        type: 'ewaste_facility' as const,
        acceptedMaterials: ['battery', 'computer'],
      });

      const searchName = await facilityService.searchFacilities({ query: 'depot' });
      expect(searchName.items.length).toBe(1);
      expect(searchName.items[0].name).toBe('E-Waste Depot');

      const searchMaterial = await facilityService.searchFacilities({ material: 'metal' });
      expect(searchMaterial.items.length).toBe(1);
      expect(searchMaterial.items[0].name).toBe('Metal Recyclers');
    });
  });

  describe('Facility Ratings & Reviews Integration', () => {
    test('should return stored rating if present', async () => {
      const input = { ...validFacilityInput, rating: 4.8, reviewCount: 15 };
      const id = await facilityService.createFacility(input, true);

      const summary = await facilityService.getFacilityRating(id);
      expect(summary.averageRating).toBe(4.8);
      expect(summary.reviewCount).toBe(15);
    });

    test('should calculate ratings dynamically from reviews if stored rating is undefined', async () => {
      const id = await facilityService.createFacility(validFacilityInput);
      
      const mockReviews: Review[] = [
        { id: '1', userId: 'u1', userName: 'User A', rating: 4, comment: 'Good', createdAt: new Date() } as unknown as Review,
        { id: '2', userId: 'u2', userName: 'User B', rating: 5, comment: 'Great', createdAt: new Date() } as unknown as Review,
      ];

      (firestoreService.getFacilityReviews as jest.Mock).mockResolvedValue({
        items: mockReviews,
        lastVisible: null,
      });

      const summary = await facilityService.getFacilityRating(id);
      expect(summary.averageRating).toBe(4.5);
      expect(summary.reviewCount).toBe(2);
    });
  });
});
