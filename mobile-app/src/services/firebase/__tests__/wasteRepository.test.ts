import { wasteRepository } from '../wasteRepository';
import { authService } from '../authService';
import { storageService } from '../storageService';
import { WasteCategory } from '../../../constants/wasteCategories';
import { WasteRecord } from '../../../types/WasteRecord';

// In-memory Firestore database mock
let mockDb: Record<string, Record<string, any>> = {};

// Reset db before each test
beforeEach(() => {
  mockDb = {};
  jest.clearAllMocks();
});

// Mock firebase/firestore
jest.mock('firebase/firestore', () => {
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
      const recordId = parts[3];

      if (!mockDb[uid]) {
        mockDb[uid] = {};
      }

      const cleanData = { ...data };
      if (cleanData.createdAt && typeof cleanData.createdAt === 'function') {
        cleanData.createdAt = new Date();
      }
      if (cleanData.updatedAt && typeof cleanData.updatedAt === 'function') {
        cleanData.updatedAt = new Date();
      }

      if (options && options.merge) {
        mockDb[uid][recordId] = {
          ...mockDb[uid][recordId],
          ...cleanData,
        };
      } else {
        mockDb[uid][recordId] = cleanData;
      }
    }),
    getDoc: jest.fn(async (docRef) => {
      const docPath = typeof docRef === 'string' ? docRef : docRef.path;
      const parts = docPath.split('/');
      const uid = parts[1];
      const recordId = parts[3];

      const data = mockDb[uid]?.[recordId];
      return {
        exists: () => !!data,
        id: recordId,
        data: () => data,
      };
    }),
    deleteDoc: jest.fn(async (docRef) => {
      const docPath = typeof docRef === 'string' ? docRef : docRef.path;
      const parts = docPath.split('/');
      const uid = parts[1];
      const recordId = parts[3];
      if (mockDb[uid]) {
        delete mockDb[uid][recordId];
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
      
      let records = Object.values(mockDb[uid] || {});

      // Apply where filters
      constraints.forEach((c: any) => {
        if (c.type === 'where') {
          records = records.filter(r => {
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
        records.sort((a, b) => {
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
        const cursorDoc = startConstraint.val;
        const index = records.findIndex(r => r.id === cursorDoc || r.detectedAt === cursorDoc);
        if (index !== -1) {
          records = records.slice(index + 1);
        }
      }

      // Apply limit
      const limitConstraint = constraints.find((c: any) => c.type === 'limit');
      if (limitConstraint) {
        records = records.slice(0, limitConstraint.val);
      }

      const docs = records.map(r => ({
        id: r.id,
        data: () => r
      }));

      return {
        docs,
        forEach: (callback: any) => docs.forEach(callback)
      };
    }),
    serverTimestamp: jest.fn(() => new Date()),
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

// Mock storageService
jest.mock('../storageService', () => ({
  storageService: {
    deleteFile: jest.fn(async () => Promise.resolve()),
  },
}));

describe('Waste Record Repository', () => {
  const testUserId = 'test_user_123';
  const otherUserId = 'other_user_456';

  beforeEach(() => {
    (authService.getCurrentUser as jest.Mock).mockReturnValue({ uid: testUserId });
  });

  describe('create', () => {
    it('successfully creates a valid waste record', async () => {
      const recordInput = {
        userId: testUserId,
        category: WasteCategory.PLASTIC,
        confidence: 0.95,
        binRecommendation: 'Recycle Bin',
        disposalInstructions: 'Rinse and dry the plastic bottle before throwing it in.',
        imagePath: 'users/test_user_123/waste/some_id/image.jpg',
        imageUrl: 'https://storage.googleapis.com/test/image.jpg',
        detectedAt: new Date('2026-08-14T10:00:00Z'),
      };

      const recordId = await wasteRepository.create(recordInput);
      expect(recordId).toBeDefined();
      expect(typeof recordId).toBe('string');

      const stored = mockDb[testUserId][recordId];
      expect(stored).toBeDefined();
      expect(stored.userId).toBe(testUserId);
      expect(stored.category).toBe(WasteCategory.PLASTIC);
      expect(stored.confidence).toBe(0.95);
      expect(stored.binRecommendation).toBe('Recycle Bin');
      expect(stored.imagePath).toBe(recordInput.imagePath);
      expect(stored.imageUrl).toBe(recordInput.imageUrl);
      expect(stored.detectedAt).toBe(recordInput.detectedAt);
    });

    it('rejects creation if userId does not match authenticated user', async () => {
      const recordInput = {
        userId: otherUserId,
        category: WasteCategory.GLASS,
        confidence: 0.85,
        binRecommendation: 'Glass Bin',
        disposalInstructions: 'Place in green box.',
        detectedAt: new Date(),
      };

      await expect(wasteRepository.create(recordInput)).rejects.toThrow(
        /Permission denied: Cannot create record for another user/
      );
    });

    it('rejects confidence scores outside 0 to 1 range', async () => {
      const recordInput = {
        userId: testUserId,
        category: WasteCategory.PLASTIC,
        confidence: 1.5,
        binRecommendation: 'Recycle Bin',
        disposalInstructions: 'Rinse.',
        detectedAt: new Date(),
      };

      await expect(wasteRepository.create(recordInput)).rejects.toThrow(
        /Confidence must be a number between 0 and 1/
      );
    });

    it('rejects missing required fields', async () => {
      const recordInput = {
        userId: testUserId,
        category: WasteCategory.PLASTIC,
        confidence: 0.9,
        binRecommendation: '',
        disposalInstructions: 'Rinse.',
        detectedAt: new Date(),
      };

      await expect(wasteRepository.create(recordInput)).rejects.toThrow(
        /Invalid binRecommendation: must be a non-empty string/
      );
    });
  });

  describe('get', () => {
    it('successfully retrieves a record belonging to the authenticated user', async () => {
      const recordId = 'rec_111';
      const seedRecord = {
        id: recordId,
        userId: testUserId,
        category: WasteCategory.METAL,
        confidence: 0.9,
        binRecommendation: 'Metal Bin',
        disposalInstructions: 'Flatten can.',
        detectedAt: new Date('2026-08-14T09:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb[testUserId] = { [recordId]: seedRecord };

      const retrieved = await wasteRepository.get(testUserId, recordId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(recordId);
      expect(retrieved?.category).toBe(WasteCategory.METAL);
    });

    it('returns null for non-existent records', async () => {
      const retrieved = await wasteRepository.get(testUserId, 'non_existent');
      expect(retrieved).toBeNull();
    });

    it('rejects retrieval if authenticated user does not match requested userId', async () => {
      await expect(wasteRepository.get(otherUserId, 'rec_111')).rejects.toThrow(
        /Permission denied: Cannot access another user's records/
      );
    });
  });

  describe('list (user history queries, pagination, filtering)', () => {
    beforeEach(() => {
      mockDb[testUserId] = {
        rec_1: {
          id: 'rec_1',
          userId: testUserId,
          category: WasteCategory.PLASTIC,
          confidence: 0.9,
          binRecommendation: 'Bin',
          disposalInstructions: 'Inst.',
          detectedAt: new Date('2026-08-14T08:00:00Z'),
        },
        rec_2: {
          id: 'rec_2',
          userId: testUserId,
          category: WasteCategory.PAPER,
          confidence: 0.8,
          binRecommendation: 'Bin',
          disposalInstructions: 'Inst.',
          detectedAt: new Date('2026-08-14T09:00:00Z'),
        },
        rec_3: {
          id: 'rec_3',
          userId: testUserId,
          category: WasteCategory.PLASTIC,
          confidence: 0.95,
          binRecommendation: 'Bin',
          disposalInstructions: 'Inst.',
          detectedAt: new Date('2026-08-14T07:00:00Z'),
        },
      };
    });

    it('retrieves all user waste records ordered by detectedAt descending', async () => {
      const result = await wasteRepository.list({ userId: testUserId });
      expect(result.items).toHaveLength(3);
      expect(result.items[0].id).toBe('rec_2');
      expect(result.items[1].id).toBe('rec_1');
      expect(result.items[2].id).toBe('rec_3');
    });

    it('handles empty history safely', async () => {
      (authService.getCurrentUser as jest.Mock).mockReturnValue({ uid: 'empty_user' });
      const emptyResult = await wasteRepository.list({ userId: 'empty_user' });
      expect(emptyResult.items).toHaveLength(0);
      expect(emptyResult.lastVisible).toBeNull();
    });

    it('supports pagination limit', async () => {
      const result = await wasteRepository.list({ userId: testUserId, limit: 2 });
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('rec_2');
      expect(result.items[1].id).toBe('rec_1');
    });

    it('supports pagination cursor (startAfter)', async () => {
      const page1 = await wasteRepository.list({ userId: testUserId, limit: 1 });
      expect(page1.items).toHaveLength(1);
      expect(page1.items[0].id).toBe('rec_2');

      const page2 = await wasteRepository.list({
        userId: testUserId,
        limit: 2,
        cursor: 'rec_2',
      });
      expect(page2.items).toHaveLength(2);
      expect(page2.items[0].id).toBe('rec_1');
      expect(page2.items[1].id).toBe('rec_3');
    });

    it('filters by waste category', async () => {
      const result = await wasteRepository.list({
        userId: testUserId,
        category: WasteCategory.PLASTIC,
      });
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('rec_1');
      expect(result.items[1].id).toBe('rec_3');
    });

    it('filters by date range', async () => {
      const startDate = new Date('2026-08-14T07:30:00Z');
      const endDate = new Date('2026-08-14T08:30:00Z');

      const result = await wasteRepository.list({
        userId: testUserId,
        startDate,
        endDate,
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('rec_1');
    });
  });

  describe('storage and deletion', () => {
    it('deletes associated storage image when deleting record', async () => {
      const recordId = 'rec_delete_1';
      const seedRecord = {
        id: recordId,
        userId: testUserId,
        category: WasteCategory.METAL,
        confidence: 0.9,
        binRecommendation: 'Metal Bin',
        disposalInstructions: 'Flatten can.',
        imagePath: 'users/test_user_123/waste/rec_delete_1/image.jpg',
        detectedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb[testUserId] = { [recordId]: seedRecord };

      await wasteRepository.delete(testUserId, recordId);

      expect(storageService.deleteFile).toHaveBeenCalledWith(seedRecord.imagePath);

      const retrieved = await wasteRepository.get(testUserId, recordId);
      expect(retrieved).toBeNull();
    });
  });
});
