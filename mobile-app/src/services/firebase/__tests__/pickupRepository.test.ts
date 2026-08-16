import { pickupRepository } from '../pickupRepository';
import { authService } from '../authService';
import { WasteCategory } from '../../../constants/wasteCategories';
import { PickupRequest, PickupStatus, PickupTimeSlot } from '../../../types/PickupRequest';

// In-memory Firestore database mock
let mockDb: Record<string, Record<string, Record<string, any>>> = {};

// Reset db before each test
beforeEach(() => {
  mockDb = {};
  jest.clearAllMocks();
});

// Mock firebase/firestore
jest.mock('firebase/firestore', () => {
  let mockTime = Date.now();
  return {
    getFirestore: jest.fn(),
    collection: jest.fn((...args) => {
      const parts = args.filter(a => typeof a === 'string' && a !== 'mockDbInstance');
      return {
        path: parts.join('/')
      };
    }),
    doc: jest.fn((...args) => {
      const parts: string[] = [];
      args.forEach(a => {
        if (typeof a === 'string') {
          if (a !== 'mockDbInstance') {
            parts.push(a);
          }
        } else if (a && typeof a === 'object' && a.path) {
          parts.push(a.path);
        }
      });
      
      const fullPath = parts.join('/');
      const segments = fullPath.split('/');
      
      let id = '';
      if (segments.length % 2 === 1) {
        id = Math.random().toString(36).substr(2, 9);
        segments.push(id);
      } else {
        id = segments[segments.length - 1];
      }
      
      return {
        id,
        path: segments.join('/')
      };
    }),
    setDoc: jest.fn(async (docRef, data, options) => {
      const docPath = typeof docRef === 'string' ? docRef : docRef.path;
      const parts = docPath.split('/');
      const uid = parts[1];
      const subCol = parts[2];
      const docId = parts[3];

      if (!mockDb[uid]) {
        mockDb[uid] = { wasteRecords: {}, pickupRequests: {} };
      }

      const cleanData = { ...data };
      if (cleanData.createdAt && typeof cleanData.createdAt === 'function') {
        cleanData.createdAt = new Date();
      }
      if (cleanData.updatedAt && typeof cleanData.updatedAt === 'function') {
        cleanData.updatedAt = new Date();
      }
      if (cleanData.scheduledAt && typeof cleanData.scheduledAt === 'function') {
        cleanData.scheduledAt = new Date();
      }
      if (cleanData.completedAt && typeof cleanData.completedAt === 'function') {
        cleanData.completedAt = new Date();
      }
      if (cleanData.cancelledAt && typeof cleanData.cancelledAt === 'function') {
        cleanData.cancelledAt = new Date();
      }

      if (options && options.merge) {
        mockDb[uid][subCol][docId] = {
          ...mockDb[uid][subCol][docId],
          ...cleanData,
        };
      } else {
        mockDb[uid][subCol][docId] = cleanData;
      }
    }),
    getDoc: jest.fn(async (docRef) => {
      const docPath = typeof docRef === 'string' ? docRef : docRef.path;
      const parts = docPath.split('/');
      const uid = parts[1];
      const subCol = parts[2];
      const docId = parts[3];

      const data = mockDb[uid]?.[subCol]?.[docId];
      return {
        exists: () => !!data,
        id: docId,
        data: () => data,
      };
    }),
    deleteDoc: jest.fn(async (docRef) => {
      const docPath = typeof docRef === 'string' ? docRef : docRef.path;
      const parts = docPath.split('/');
      const uid = parts[1];
      const subCol = parts[2];
      const docId = parts[3];
      if (mockDb[uid]?.[subCol]) {
        delete mockDb[uid][subCol][docId];
      }
    }),
    query: jest.fn((colRef, ...constraints) => {
      const colPath = typeof colRef === 'string' ? colRef : colRef.path;
      return { colPath, constraints };
    }),
    orderBy: jest.fn((field, direction) => ({ type: 'orderBy', field, direction })),
    limit: jest.fn((val) => ({ type: 'limit', val })),
    startAfter: jest.fn((val) => ({ type: 'startAfter', val })),
    where: jest.fn((field, op, val) => ({ type: 'where', field, op, val })),
    getDocs: jest.fn(async (queryObj) => {
      const colPath = typeof queryObj === 'string' ? queryObj : queryObj.colPath;
      const constraints = typeof queryObj === 'string' ? [] : queryObj.constraints || [];
      
      const parts = colPath.split('/');
      const uid = parts[1];
      const subCol = parts[2];
      
      let records = Object.values(mockDb[uid]?.[subCol] || {}) as any[];

      // Apply where filters
      constraints.forEach((c: any) => {
        if (c.type === 'where') {
          records = records.filter((r: any) => {
            if (c.op === '==') return r[c.field] === c.val;
            if (c.op === '>=') {
              const rVal = r[c.field] instanceof Date ? r[c.field].getTime() : r[c.field];
              const cVal = c.val instanceof Date ? c.val.getTime() : c.val;
              return rVal >= cVal;
            }
            if (c.op === '<=') {
              const rVal = r[c.field] instanceof Date ? r[c.field].getTime() : r[c.field];
              const cVal = c.val instanceof Date ? c.val.getTime() : c.val;
              return rVal <= cVal;
            }
            return true;
          });
        }
      });

      // Apply sorting
      const sortConstraint = constraints.find((c: any) => c.type === 'orderBy');
      if (sortConstraint) {
        const { field, direction } = sortConstraint;
        records.sort((a: any, b: any) => {
          let valA = a[field];
          let valB = b[field];
          if (valA instanceof Date) valA = valA.getTime();
          if (valB instanceof Date) valB = valB.getTime();
          if (direction === 'desc') {
            return valA < valB ? 1 : valA > valB ? -1 : 0;
          }
          return valA > valB ? 1 : valA < valB ? -1 : 0;
        });
      }

      // Apply pagination cursor (startAfter)
      const startConstraint = constraints.find((c: any) => c.type === 'startAfter');
      if (startConstraint) {
        const cursorVal = startConstraint.val;
        const cursorId = (cursorVal && typeof cursorVal === 'object' && 'id' in cursorVal) ? cursorVal.id : cursorVal;
        const index = records.findIndex((r: any) => r.id === cursorId);
        if (index !== -1) {
          records = records.slice(index + 1);
        }
      }

      // Apply limit
      const limitConstraint = constraints.find((c: any) => c.type === 'limit');
      if (limitConstraint) {
        records = records.slice(0, limitConstraint.val);
      }

      const docs = records.map((r: any) => ({
        id: r.id,
        data: () => r
      }));

      return {
        docs,
        forEach: (callback: any) => docs.forEach(callback)
      };
    }),
    serverTimestamp: jest.fn(() => {
      mockTime += 1000;
      return new Date(mockTime);
    }),
    FieldValue: jest.fn(),
  };
});

// Mock firebase config db
jest.mock('../firebaseConfig', () => ({
  db: 'mockDbInstance',
}));

// Mock authService
jest.mock('../authService', () => ({
  authService: {
    getCurrentUser: jest.fn(),
  },
}));

describe('pickupRepository Tests', () => {
  const testUserId = 'user_123';
  const testWasteId = 'waste_456';
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  beforeEach(() => {
    // Mock user being logged in by default
    (authService.getCurrentUser as jest.Mock).mockReturnValue({
      uid: testUserId,
      email: 'test@example.com'
    });

    // Populate mockDb with a valid waste record
    mockDb[testUserId] = {
      wasteRecords: {
        [testWasteId]: {
          id: testWasteId,
          userId: testUserId,
          category: WasteCategory.PLASTIC,
          confidence: 0.9,
          binRecommendation: 'Recycle',
          disposalInstructions: 'Rinse first',
          detectedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      pickupRequests: {}
    };
  });

  const validPickupInput = {
    userId: testUserId,
    wasteRecordId: testWasteId,
    wasteCategory: WasteCategory.PLASTIC,
    quantity: '2 bags',
    pickupAddress: '123 Green St, EcoTown',
    pickupLatitude: 12.34,
    pickupLongitude: 56.78,
    preferredDate: tomorrow,
    preferredTimeSlot: 'morning' as PickupTimeSlot,
    notes: 'Near the recycling bins'
  };

  test('1. & 2. Create pickup request with initial status pending', async () => {
    const requestId = await pickupRepository.create(validPickupInput);
    expect(requestId).toBeDefined();
    expect(typeof requestId).toBe('string');

    // Retrieve and verify
    const request = await pickupRepository.get(testUserId, requestId);
    expect(request).not.toBeNull();
    expect(request?.status).toBe('pending');
    expect(request?.wasteRecordId).toBe(testWasteId);
    expect(request?.pickupAddress).toBe(validPickupInput.pickupAddress);
  });

  test('3. Retrieve pickup request', async () => {
    const requestId = await pickupRepository.create(validPickupInput);
    const retrieved = await pickupRepository.get(testUserId, requestId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(requestId);
  });

  test('4. User history retrieval', async () => {
    // Add two pickup requests
    await pickupRepository.create(validPickupInput);
    await pickupRepository.create({
      ...validPickupInput,
      quantity: '5 items'
    });

    const result = await pickupRepository.list({ userId: testUserId });
    expect(result.items.length).toBe(2);
    expect(result.items[0].quantity).toBe('5 items'); // Newest first ordering
  });

  test('5. Pagination', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      // Small pause to guarantee different createdAt dates in mockDb
      const id = await pickupRepository.create({
        ...validPickupInput,
        quantity: `bag ${i}`
      });
      ids.push(id);
    }

    const page1 = await pickupRepository.list({ userId: testUserId, limit: 2 });
    expect(page1.items.length).toBe(2);
    expect(page1.lastVisible).not.toBeNull();

    const page2 = await pickupRepository.list({
      userId: testUserId,
      limit: 2,
      cursor: page1.lastVisible
    });
    expect(page2.items.length).toBe(2);
  });

  test('6. & 7. Status transition validation', async () => {
    const id = await pickupRepository.create(validPickupInput);

    // pending -> scheduled (requires adminOverride = true)
    await pickupRepository.updateStatus(testUserId, id, 'scheduled', true);
    let request = await pickupRepository.get(testUserId, id);
    expect(request?.status).toBe('scheduled');

    // scheduled -> assigned
    await pickupRepository.updateStatus(testUserId, id, 'assigned', true);
    request = await pickupRepository.get(testUserId, id);
    expect(request?.status).toBe('assigned');

    // assigned -> picked_up
    await pickupRepository.updateStatus(testUserId, id, 'picked_up', true);
    request = await pickupRepository.get(testUserId, id);
    expect(request?.status).toBe('picked_up');

    // picked_up -> completed
    await pickupRepository.updateStatus(testUserId, id, 'completed', true);
    request = await pickupRepository.get(testUserId, id);
    expect(request?.status).toBe('completed');
  });

  test('7. Invalid status transition', async () => {
    const id = await pickupRepository.create(validPickupInput);
    
    // completed -> pending (invalid transition)
    await expect(
      pickupRepository.updateStatus(testUserId, id, 'completed', true)
    ).rejects.toThrow('Invalid status transition');
  });

  test('8. Cancellation', async () => {
    const id = await pickupRepository.create(validPickupInput);
    
    // cancel from pending (allowed for clients)
    await pickupRepository.cancel(testUserId, id);
    let request = await pickupRepository.get(testUserId, id);
    expect(request?.status).toBe('cancelled');
    expect(request?.cancelledAt).toBeDefined();

    // Try to cancel a completed one (should fail)
    const completedId = await pickupRepository.create(validPickupInput);
    await pickupRepository.updateStatus(testUserId, completedId, 'scheduled', true);
    await pickupRepository.updateStatus(testUserId, completedId, 'assigned', true);
    await pickupRepository.updateStatus(testUserId, completedId, 'picked_up', true);
    await pickupRepository.updateStatus(testUserId, completedId, 'completed', true);

    await expect(
      pickupRepository.cancel(testUserId, completedId)
    ).rejects.toThrow('Invalid status transition');
  });

  test('9. Invalid date', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const invalidInput = {
      ...validPickupInput,
      preferredDate: yesterday
    };

    await expect(
      pickupRepository.create(invalidInput)
    ).rejects.toThrow('Preferred date cannot be in the past');
  });

  test('10. Invalid time slot', async () => {
    const invalidInput = {
      ...validPickupInput,
      preferredTimeSlot: 'midnight' as any
    };

    await expect(
      pickupRepository.create(invalidInput)
    ).rejects.toThrow('Valid time slot is required');
  });

  test('11. Missing required fields', async () => {
    const invalidInput = {
      ...validPickupInput,
      pickupAddress: ''
    };

    await expect(
      pickupRepository.create(invalidInput)
    ).rejects.toThrow('Pickup address is required');
  });

  test('12. Ownership behavior', async () => {
    const id = await pickupRepository.create(validPickupInput);

    // Try to access with another user ID
    await expect(
      pickupRepository.get('other_user', id)
    ).rejects.toThrow('Permission denied');

    await expect(
      pickupRepository.list({ userId: 'other_user' })
    ).rejects.toThrow('Permission denied');
  });

  test('13. Filtering', async () => {
    await pickupRepository.create(validPickupInput);
    
    // Create another request under E-Waste
    const eWasteId = 'waste_ewaste';
    mockDb[testUserId].wasteRecords[eWasteId] = {
      id: eWasteId,
      userId: testUserId,
      category: WasteCategory.E_WASTE,
      detectedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await pickupRepository.create({
      ...validPickupInput,
      wasteRecordId: eWasteId,
      wasteCategory: WasteCategory.E_WASTE,
      quantity: '1 monitor'
    });

    const result = await pickupRepository.list({
      userId: testUserId,
      category: WasteCategory.E_WASTE
    });
    expect(result.items.length).toBe(1);
    expect(result.items[0].wasteCategory).toBe(WasteCategory.E_WASTE);
  });
});
