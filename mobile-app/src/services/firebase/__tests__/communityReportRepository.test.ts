import { communityReportRepository, validateCommunityReport } from '../communityReportRepository';
import { authService } from '../authService';
import { storageService } from '../storageService';
import { CommunityReport, CommunityReportType, CommunityReportStatus } from '../../../types/CommunityReport';

// In-memory Firestore database mock
let mockDb: Record<string, Record<string, Record<string, any>>> = {};

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
      const subCol = parts[2];
      const docId = parts[3];

      if (!mockDb[uid]) {
        mockDb[uid] = { communityReports: {} };
      }
      if (!mockDb[uid][subCol]) {
        mockDb[uid][subCol] = {};
      }

      const cleanData = { ...data };
      if (cleanData.createdAt && typeof cleanData.createdAt === 'function') {
        cleanData.createdAt = new Date();
      }
      if (cleanData.updatedAt && typeof cleanData.updatedAt === 'function') {
        cleanData.updatedAt = new Date();
      }
      if (cleanData.resolvedAt && typeof cleanData.resolvedAt === 'function') {
        cleanData.resolvedAt = new Date();
      }
      if (cleanData.rejectedAt && typeof cleanData.rejectedAt === 'function') {
        cleanData.rejectedAt = new Date();
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
      
      let records = Object.values(mockDb[uid]?.[subCol] || {});

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
        const index = records.findIndex(r => r.id === cursorDoc || r.createdAt === cursorDoc);
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

// Mock firebaseConfig
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
    uploadReportImage: jest.fn(),
    deleteFile: jest.fn(async () => Promise.resolve()),
  },
}));

// Mock notificationEventService
jest.mock('../notificationEventService', () => ({
  notificationEventService: {
    triggerPickupEvent: jest.fn().mockResolvedValue('mock-notif-id'),
    triggerReportEvent: jest.fn().mockResolvedValue('mock-notif-id'),
  },
}));

describe('Community Report Repository (Milestone 14 QA Regression Verified)', () => {
  const testUserId = 'test_user_123';
  const otherUserId = 'other_user_456';

  beforeEach(() => {
    (authService.getCurrentUser as jest.Mock).mockReturnValue({ uid: testUserId });
  });

  describe('create', () => {
    it('creates a report successfully with default pending status', async () => {
      const input = {
        userId: testUserId,
        type: 'illegal_dumping' as CommunityReportType,
        description: 'Large pile of tires dumped in the park.',
        address: 'Central Park',
        latitude: 40.785091,
        longitude: -73.968285,
      };

      const reportId = await communityReportRepository.create(input);
      expect(reportId).toBeDefined();
      expect(typeof reportId).toBe('string');

      const stored = mockDb[testUserId]['communityReports'][reportId];
      expect(stored).toBeDefined();
      expect(stored.userId).toBe(testUserId);
      expect(stored.type).toBe('illegal_dumping');
      expect(stored.description).toBe(input.description);
      expect(stored.status).toBe('pending');
      expect(stored.createdAt).toBeInstanceOf(Date);
      expect(stored.updatedAt).toBeInstanceOf(Date);
    });

    it('rejects creation if userId does not match authenticated user', async () => {
      const input = {
        userId: otherUserId,
        type: 'overflowing_bin' as CommunityReportType,
        description: 'Trash is overflowing here.',
      };

      await expect(communityReportRepository.create(input)).rejects.toThrow(
        /Permission denied: Cannot create community report for another user/
      );
    });
  });

  describe('get', () => {
    it('successfully retrieves a report belonging to the user', async () => {
      const reportId = 'rep_111';
      const seedReport = {
        id: reportId,
        userId: testUserId,
        type: 'damaged_bin' as CommunityReportType,
        description: 'Lid is broken.',
        status: 'pending' as CommunityReportStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb[testUserId] = {
        communityReports: {
          [reportId]: seedReport
        }
      };

      const retrieved = await communityReportRepository.get(testUserId, reportId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(reportId);
      expect(retrieved?.type).toBe('damaged_bin');
    });

    it('returns null for non-existent report', async () => {
      const retrieved = await communityReportRepository.get(testUserId, 'non_existent');
      expect(retrieved).toBeNull();
    });

    it('rejects retrieval if authenticated user does not match the userId parameter', async () => {
      await expect(communityReportRepository.get(otherUserId, 'rep_111')).rejects.toThrow(
        /Permission denied: Cannot access another user's community reports/
      );
    });
  });

  describe('list (user report history, pagination, filtering)', () => {
    beforeEach(() => {
      mockDb[testUserId] = {
        communityReports: {
          rep_1: {
            id: 'rep_1',
            userId: testUserId,
            type: 'illegal_dumping' as CommunityReportType,
            description: 'Tires in park.',
            status: 'pending' as CommunityReportStatus,
            createdAt: new Date('2026-08-15T08:00:00Z'),
            updatedAt: new Date('2026-08-15T08:00:00Z'),
          },
          rep_2: {
            id: 'rep_2',
            userId: testUserId,
            type: 'overflowing_bin' as CommunityReportType,
            description: 'Trash can overflowing.',
            status: 'under_review' as CommunityReportStatus,
            createdAt: new Date('2026-08-15T09:00:00Z'),
            updatedAt: new Date('2026-08-15T09:00:00Z'),
          },
          rep_3: {
            id: 'rep_3',
            userId: testUserId,
            type: 'illegal_dumping' as CommunityReportType,
            description: 'Furniture on curb.',
            status: 'resolved' as CommunityReportStatus,
            createdAt: new Date('2026-08-15T07:00:00Z'),
            updatedAt: new Date('2026-08-15T07:00:00Z'),
          },
        }
      };
    });

    it('retrieves user report history ordered by newest first', async () => {
      const result = await communityReportRepository.list({ userId: testUserId });
      expect(result.items).toHaveLength(3);
      expect(result.items[0].id).toBe('rep_2');
      expect(result.items[1].id).toBe('rep_1');
      expect(result.items[2].id).toBe('rep_3');
    });

    it('filters by status', async () => {
      const result = await communityReportRepository.list({
        userId: testUserId,
        status: 'under_review'
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('rep_2');
    });

    it('filters by type', async () => {
      const result = await communityReportRepository.list({
        userId: testUserId,
        type: 'illegal_dumping'
      });
      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe('rep_1');
      expect(result.items[1].id).toBe('rep_3');
    });

    it('filters by date range', async () => {
      const startDate = new Date('2026-08-15T07:30:00Z');
      const endDate = new Date('2026-08-15T08:30:00Z');
      const result = await communityReportRepository.list({
        userId: testUserId,
        startDate,
        endDate
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('rep_1');
    });

    it('paginates with limit and cursor', async () => {
      const page1 = await communityReportRepository.list({
        userId: testUserId,
        limit: 1
      });
      expect(page1.items).toHaveLength(1);
      expect(page1.items[0].id).toBe('rep_2');

      const page2 = await communityReportRepository.list({
        userId: testUserId,
        limit: 2,
        cursor: 'rep_2'
      });
      expect(page2.items).toHaveLength(2);
      expect(page2.items[0].id).toBe('rep_1');
      expect(page2.items[1].id).toBe('rep_3');
    });
  });

  describe('input validation rules', () => {
    it('throws error for invalid report types', () => {
      const invalidInput = {
        userId: testUserId,
        type: 'invalid_type' as any,
        description: 'valid desc'
      };
      expect(() => validateCommunityReport(invalidInput, false)).toThrow(/Invalid report type/);
    });

    it('throws error for empty description', () => {
      const invalidInput = {
        userId: testUserId,
        type: 'illegal_dumping' as CommunityReportType,
        description: ''
      };
      expect(() => validateCommunityReport(invalidInput, false)).toThrow(/Description is required/);
    });

    it('throws error for overly long description', () => {
      const invalidInput = {
        userId: testUserId,
        type: 'illegal_dumping' as CommunityReportType,
        description: 'a'.repeat(1001)
      };
      expect(() => validateCommunityReport(invalidInput, false)).toThrow(/Description cannot exceed/);
    });

    it('throws error if only one coordinate is provided', () => {
      const invalidInput = {
        userId: testUserId,
        type: 'illegal_dumping' as CommunityReportType,
        description: 'valid desc',
        latitude: 10
      };
      expect(() => validateCommunityReport(invalidInput, false)).toThrow(/Both latitude and longitude must be provided together/);
    });

    it('throws error for out-of-bounds coordinates', () => {
      const invalidInput1 = {
        userId: testUserId,
        type: 'illegal_dumping' as CommunityReportType,
        description: 'valid desc',
        latitude: 95,
        longitude: 10
      };
      expect(() => validateCommunityReport(invalidInput1, false)).toThrow(/Latitude must be/);

      const invalidInput2 = {
        userId: testUserId,
        type: 'illegal_dumping' as CommunityReportType,
        description: 'valid desc',
        latitude: 10,
        longitude: -200
      };
      expect(() => validateCommunityReport(invalidInput2, false)).toThrow(/Longitude must be/);
    });
  });

  describe('status transitions and permissions', () => {
    it('allows valid transitions with adminOverride', async () => {
      const reportId = 'rep_trans_1';
      const seedReport = {
        id: reportId,
        userId: testUserId,
        type: 'illegal_dumping' as CommunityReportType,
        description: 'Tires in park.',
        status: 'pending' as CommunityReportStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb[testUserId] = { communityReports: { [reportId]: seedReport } };

      // pending -> under_review
      await communityReportRepository.updateStatus(testUserId, reportId, 'under_review', true);
      expect(mockDb[testUserId]['communityReports'][reportId].status).toBe('under_review');
      expect(mockDb[testUserId]['communityReports'][reportId].updatedAt).toBeInstanceOf(Date);

      // under_review -> verified
      await communityReportRepository.updateStatus(testUserId, reportId, 'verified', true);
      expect(mockDb[testUserId]['communityReports'][reportId].status).toBe('verified');

      // verified -> resolved
      await communityReportRepository.updateStatus(testUserId, reportId, 'resolved', true);
      expect(mockDb[testUserId]['communityReports'][reportId].status).toBe('resolved');
      expect(mockDb[testUserId]['communityReports'][reportId].resolvedAt).toBeInstanceOf(Date);
    });

    it('allows transitioning from under_review to rejected with adminOverride', async () => {
      const reportId = 'rep_trans_2';
      const seedReport = {
        id: reportId,
        userId: testUserId,
        type: 'illegal_dumping' as CommunityReportType,
        description: 'Tires in park.',
        status: 'under_review' as CommunityReportStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb[testUserId] = { communityReports: { [reportId]: seedReport } };

      await communityReportRepository.updateStatus(testUserId, reportId, 'rejected', true);
      expect(mockDb[testUserId]['communityReports'][reportId].status).toBe('rejected');
      expect(mockDb[testUserId]['communityReports'][reportId].rejectedAt).toBeInstanceOf(Date);
    });

    it('blocks arbitrary status transitions', async () => {
      const reportId = 'rep_trans_3';
      const seedReport = {
        id: reportId,
        userId: testUserId,
        type: 'illegal_dumping' as CommunityReportType,
        description: 'Tires in park.',
        status: 'resolved' as CommunityReportStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb[testUserId] = { communityReports: { [reportId]: seedReport } };

      // resolved -> pending
      await expect(
        communityReportRepository.updateStatus(testUserId, reportId, 'pending', true)
      ).rejects.toThrow(/Invalid status transition/);
    });

    it('prevents ordinary users from changing status without adminOverride', async () => {
      const reportId = 'rep_trans_4';
      const seedReport = {
        id: reportId,
        userId: testUserId,
        type: 'illegal_dumping' as CommunityReportType,
        description: 'Tires in park.',
        status: 'pending' as CommunityReportStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb[testUserId] = { communityReports: { [reportId]: seedReport } };

      await expect(
        communityReportRepository.updateStatus(testUserId, reportId, 'under_review', false)
      ).rejects.toThrow(/Ordinary users cannot change report status/);
    });
  });

  describe('photo upload and delete behavior', () => {
    it('uploads photo successfully through repository wrapper', async () => {
      const mockResult = {
        downloadURL: 'https://storage.googleapis.com/report_img.jpg',
        path: 'users/test_user_123/reports/rep_photo_1/image.jpg'
      };
      (storageService.uploadReportImage as jest.Mock).mockResolvedValue(mockResult);

      const uploadResult = await communityReportRepository.uploadPhoto(testUserId, 'rep_photo_1', 'file://path/image.jpg');
      expect(uploadResult.downloadURL).toBe(mockResult.downloadURL);
      expect(uploadResult.path).toBe(mockResult.path);
      expect(storageService.uploadReportImage).toHaveBeenCalledWith(testUserId, 'rep_photo_1', 'file://path/image.jpg');
    });

    it('deletes report along with its storage photo', async () => {
      const reportId = 'rep_del_1';
      const seedReport = {
        id: reportId,
        userId: testUserId,
        type: 'illegal_dumping' as CommunityReportType,
        description: 'Tires in park.',
        status: 'pending' as CommunityReportStatus,
        photoPath: 'users/test_user_123/reports/rep_del_1/image.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb[testUserId] = { communityReports: { [reportId]: seedReport } };

      await communityReportRepository.delete(testUserId, reportId);

      expect(storageService.deleteFile).toHaveBeenCalledWith(seedReport.photoPath);
      expect(mockDb[testUserId]['communityReports'][reportId]).toBeUndefined();
    });
  });
});
