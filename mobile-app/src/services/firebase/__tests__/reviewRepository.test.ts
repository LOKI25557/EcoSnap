import { reviewRepository } from '../reviewRepository';
import { authService } from '../authService';
import { calculateRatingSummary } from '../../../utils/reviewAggregationService';
import { Review } from '../../../types/Review';

// In-memory Firestore database mock
let mockDb: {
  facilities: Record<string, {
    reviews: Record<string, any>;
  }>;
} = { facilities: {} };

// Reset database and mocks before each test
beforeEach(() => {
  mockDb = { facilities: {} };
  jest.clearAllMocks();
  // Reset the mock authenticated user
  (authService.getCurrentUser as jest.Mock).mockReturnValue(null);
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
      const docPath = docRef.path;
      const parts = docPath.split('/');
      const facilityId = parts[1];
      const reviewId = parts[3];

      if (!mockDb.facilities[facilityId]) {
        mockDb.facilities[facilityId] = { reviews: {} };
      }

      const cleanData = { ...data };
      if (cleanData.createdAt && typeof cleanData.createdAt === 'function') {
        cleanData.createdAt = new Date();
      }
      if (cleanData.updatedAt && typeof cleanData.updatedAt === 'function') {
        cleanData.updatedAt = new Date();
      }

      if (options && options.merge) {
        mockDb.facilities[facilityId].reviews[reviewId] = {
          ...mockDb.facilities[facilityId].reviews[reviewId],
          ...cleanData,
        };
      } else {
        mockDb.facilities[facilityId].reviews[reviewId] = cleanData;
      }
    }),
    getDoc: jest.fn(async (docRef) => {
      const docPath = docRef.path;
      const parts = docPath.split('/');
      const facilityId = parts[1];
      const reviewId = parts[3];

      const data = mockDb.facilities[facilityId]?.reviews?.[reviewId];
      return {
        exists: () => !!data,
        id: reviewId,
        data: () => data,
      };
    }),
    deleteDoc: jest.fn(async (docRef) => {
      const docPath = docRef.path;
      const parts = docPath.split('/');
      const facilityId = parts[1];
      const reviewId = parts[3];

      if (mockDb.facilities[facilityId]?.reviews?.[reviewId]) {
        delete mockDb.facilities[facilityId].reviews[reviewId];
      }
    }),
    query: jest.fn((colRef, ...constraints) => {
      const colPath = colRef.path;
      return { colPath, constraints };
    }),
    orderBy: jest.fn((field, direction) => ({ type: 'orderBy', field, direction })),
    limit: jest.fn((val) => ({ type: 'limit', val })),
    startAfter: jest.fn((val) => ({ type: 'startAfter', val })),
    where: jest.fn((field, op, val) => ({ type: 'where', field, op, val })),
    getDocs: jest.fn(async (queryObj) => {
      const colPath = queryObj.colPath;
      const constraints = queryObj.constraints || [];
      
      const parts = colPath.split('/');
      const facilityId = parts[1];
      
      let records = Object.values(mockDb.facilities[facilityId]?.reviews || {});

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

      // Apply ordering (stable ordering by createdAt desc)
      constraints.forEach((c: any) => {
        if (c.type === 'orderBy') {
          records.sort((a, b) => {
            const aVal = a[c.field] instanceof Date ? a[c.field].getTime() : a[c.field];
            const bVal = b[c.field] instanceof Date ? b[c.field].getTime() : b[c.field];
            if (c.direction === 'desc') {
              return bVal - aVal;
            }
            return aVal - bVal;
          });
        }
      });

      // Apply startAfter cursor
      let startIndex = 0;
      constraints.forEach((c: any) => {
        if (c.type === 'startAfter') {
          const cursorId = typeof c.val === 'string' ? c.val : (c.val.id || c.val.userId);
          const index = records.findIndex(r => r.userId === cursorId || r.id === cursorId);
          if (index !== -1) {
            startIndex = index + 1;
          }
        }
      });
      records = records.slice(startIndex);

      // Apply limit
      constraints.forEach((c: any) => {
        if (c.type === 'limit') {
          records = records.slice(0, c.val);
        }
      });

      const docs = records.map(r => ({
        id: r.userId || r.id,
        data: () => r,
      }));

      return {
        docs,
        forEach: (callback: any) => docs.forEach(callback),
      };
    }),
    serverTimestamp: jest.fn(() => () => new Date()),
  };
});

// Mock firebaseConfig
jest.mock('../firebaseConfig', () => ({
  db: 'mockDbInstance',
}));

// Mock authService
jest.mock('../authService', () => {
  let currentUser: any = null;
  return {
    authService: {
      getCurrentUser: jest.fn(() => currentUser),
      setCurrentUser: (user: any) => { currentUser = user; },
    }
  };
});

// Mock firestoreService
jest.mock('../firestoreService', () => {
  return {
    firestoreService: {
      getUserProfile: jest.fn(async (uid: string) => {
        return {
          id: uid,
          displayName: `User ${uid}`,
          photoURL: `https://example.com/${uid}.jpg`,
        };
      })
    }
  };
});

describe('EcoSnap Review Repository & Services (Milestone 14 QA Regression Verified)', () => {
  const mockUser = { uid: 'user_123' };
  const mockFacilityId = 'facility_abc';

  describe('1. Create Review', () => {
    it('should successfully create a review when authenticated', async () => {
      (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);

      const reviewId = await reviewRepository.create({
        facilityId: mockFacilityId,
        rating: 5,
        comment: 'Excellent service!',
      });

      expect(reviewId).toBe(mockUser.uid);
      expect(mockDb.facilities[mockFacilityId]?.reviews[mockUser.uid]).toBeDefined();
      expect(mockDb.facilities[mockFacilityId].reviews[mockUser.uid].comment).toBe('Excellent service!');
      expect(mockDb.facilities[mockFacilityId].reviews[mockUser.uid].rating).toBe(5);
    });

    it('should throw an error if user is unauthenticated', async () => {
      (authService.getCurrentUser as jest.Mock).mockReturnValue(null);

      await expect(
        reviewRepository.create({
          facilityId: mockFacilityId,
          rating: 4,
        })
      ).rejects.toThrow('Unauthenticated: User must be logged in');
    });
  });

  describe('2. Rating Validation', () => {
    beforeEach(() => {
      (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    });

    it('should reject ratings less than 1', async () => {
      await expect(
        reviewRepository.create({
          facilityId: mockFacilityId,
          rating: 0 as any,
        })
      ).rejects.toThrow('Rating must be an integer between 1 and 5');
    });

    it('should reject ratings greater than 5', async () => {
      await expect(
        reviewRepository.create({
          facilityId: mockFacilityId,
          rating: 6 as any,
        })
      ).rejects.toThrow('Rating must be an integer between 1 and 5');
    });

    it('should reject non-integer ratings', async () => {
      await expect(
        reviewRepository.create({
          facilityId: mockFacilityId,
          rating: 4.5 as any,
        })
      ).rejects.toThrow('Rating must be an integer between 1 and 5');
    });
  });

  describe('3. Comment Validation', () => {
    beforeEach(() => {
      (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
    });

    it('should reject comments that exceed MAX_REVIEW_LENGTH', async () => {
      const longComment = 'a'.repeat(501);
      await expect(
        reviewRepository.create({
          facilityId: mockFacilityId,
          rating: 3,
          comment: longComment,
        })
      ).rejects.toThrow('Comment cannot exceed 500 characters');
    });

    it('should reject empty comment strings containing only whitespace', async () => {
      await expect(
        reviewRepository.create({
          facilityId: mockFacilityId,
          rating: 3,
          comment: '   ',
        })
      ).rejects.toThrow('Comment cannot be empty or only whitespace');
    });
  });

  describe('4. Retrieve Review', () => {
    it('should successfully get a review by facilityId and reviewId', async () => {
      (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);

      await reviewRepository.create({
        facilityId: mockFacilityId,
        rating: 4,
        comment: 'Nice place',
      });

      const review = await reviewRepository.get(mockFacilityId, mockUser.uid);
      expect(review).not.toBeNull();
      expect(review?.comment).toBe('Nice place');
      expect(review?.rating).toBe(4);
    });

    it('should return null for non-existent reviews', async () => {
      const review = await reviewRepository.get(mockFacilityId, 'non_existent_user');
      expect(review).toBeNull();
    });
  });

  describe('5. Retrieve Facility Reviews', () => {
    it('should retrieve list of reviews scoped to a facility', async () => {
      (authService.getCurrentUser as jest.Mock).mockReturnValue({ uid: 'user_A' });
      await reviewRepository.create({ facilityId: mockFacilityId, rating: 5, comment: 'Rev A' });

      (authService.getCurrentUser as jest.Mock).mockReturnValue({ uid: 'user_B' });
      await reviewRepository.create({ facilityId: mockFacilityId, rating: 3, comment: 'Rev B' });

      const result = await reviewRepository.getFacilityReviews(mockFacilityId);
      expect(result.items.length).toBe(2);
    });
  });

  describe('6 & 7. Edit Review & Prevent unauthorized edits', () => {
    it('should allow review owners to edit rating and comment', async () => {
      (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
      await reviewRepository.create({ facilityId: mockFacilityId, rating: 4, comment: 'Original' });

      await reviewRepository.update(mockFacilityId, mockUser.uid, {
        rating: 5,
        comment: 'Edited comment',
      });

      const review = await reviewRepository.get(mockFacilityId, mockUser.uid);
      expect(review?.rating).toBe(5);
      expect(review?.comment).toBe('Edited comment');
    });

    it('should prevent editing another user\'s review', async () => {
      (authService.getCurrentUser as jest.Mock).mockReturnValue({ uid: 'user_A' });
      await reviewRepository.create({ facilityId: mockFacilityId, rating: 4, comment: 'Original' });

      // Try editing as user_B
      (authService.getCurrentUser as jest.Mock).mockReturnValue({ uid: 'user_B' });
      await expect(
        reviewRepository.update(mockFacilityId, 'user_A', {
          rating: 2,
          comment: 'Hacked',
        })
      ).rejects.toThrow('Permission denied: Cannot edit another user\'s review');
    });
  });

  describe('8 & 9. Delete Review & Prevent unauthorized deletion', () => {
    it('should allow review owners to delete their review', async () => {
      (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);
      await reviewRepository.create({ facilityId: mockFacilityId, rating: 4 });

      await reviewRepository.delete(mockFacilityId, mockUser.uid);
      const review = await reviewRepository.get(mockFacilityId, mockUser.uid);
      expect(review).toBeNull();
    });

    it('should prevent deleting another user\'s review', async () => {
      (authService.getCurrentUser as jest.Mock).mockReturnValue({ uid: 'user_A' });
      await reviewRepository.create({ facilityId: mockFacilityId, rating: 4 });

      // Try deleting as user_B
      (authService.getCurrentUser as jest.Mock).mockReturnValue({ uid: 'user_B' });
      await expect(
        reviewRepository.delete(mockFacilityId, 'user_A')
      ).rejects.toThrow('Permission denied: Cannot delete another user\'s review');
    });
  });

  describe('10, 11 & 12. Rating Aggregation & Distribution', () => {
    const buildReviewMock = (rating: 1 | 2 | 3 | 4 | 5): Review => ({
      id: Math.random().toString(),
      facilityId: mockFacilityId,
      userId: 'user',
      rating,
      comment: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('should correctly aggregate a list of reviews', () => {
      const reviews = [
        buildReviewMock(5),
        buildReviewMock(5),
        buildReviewMock(4),
        buildReviewMock(3),
        buildReviewMock(2),
        buildReviewMock(5),
      ];

      const summary = calculateRatingSummary(reviews);
      expect(summary.ratingCount).toBe(6);
      // Sum = 5 + 5 + 4 + 3 + 2 + 5 = 24. Avg = 24 / 6 = 4.0
      expect(summary.averageRating).toBe(4.0);
      expect(summary.distribution[5]).toBe(3);
      expect(summary.distribution[4]).toBe(1);
      expect(summary.distribution[3]).toBe(1);
      expect(summary.distribution[2]).toBe(1);
      expect(summary.distribution[1]).toBe(0);
    });

    it('should return default summary if reviews list is empty', () => {
      const summary = calculateRatingSummary([]);
      expect(summary.ratingCount).toBe(0);
      expect(summary.averageRating).toBe(0);
      expect(summary.distribution[1]).toBe(0);
      expect(summary.distribution[5]).toBe(0);
    });
  });

  describe('13 & 14. Pagination and Filtering', () => {
    it('should support pagination limits and cursors', async () => {
      (authService.getCurrentUser as jest.Mock).mockReturnValue({ uid: 'user_A' });
      await reviewRepository.create({ facilityId: mockFacilityId, rating: 5, comment: 'Rev A' });

      (authService.getCurrentUser as jest.Mock).mockReturnValue({ uid: 'user_B' });
      await reviewRepository.create({ facilityId: mockFacilityId, rating: 4, comment: 'Rev B' });

      (authService.getCurrentUser as jest.Mock).mockReturnValue({ uid: 'user_C' });
      await reviewRepository.create({ facilityId: mockFacilityId, rating: 3, comment: 'Rev C' });

      // Fetch page 1 with limit 2
      const page1 = await reviewRepository.getFacilityReviews(mockFacilityId, { limit: 2 });
      expect(page1.items.length).toBe(2);
      expect(page1.lastVisible).not.toBeNull();

      // Fetch page 2 starting after the last visible cursor
      const page2 = await reviewRepository.getFacilityReviews(mockFacilityId, {
        limit: 2,
        cursor: page1.lastVisible,
      });
      expect(page2.items.length).toBe(1);
    });

    it('should filter reviews by rating', async () => {
      (authService.getCurrentUser as jest.Mock).mockReturnValue({ uid: 'user_A' });
      await reviewRepository.create({ facilityId: mockFacilityId, rating: 5 });

      (authService.getCurrentUser as jest.Mock).mockReturnValue({ uid: 'user_B' });
      await reviewRepository.create({ facilityId: mockFacilityId, rating: 3 });

      const filtered = await reviewRepository.getFacilityReviews(mockFacilityId, { rating: 5 });
      expect(filtered.items.length).toBe(1);
      expect(filtered.items[0].rating).toBe(5);
    });
  });

  describe('15. Duplicate Review Prevention', () => {
    it('should throw duplicate review error if user tries to submit second review', async () => {
      (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);

      await reviewRepository.create({ facilityId: mockFacilityId, rating: 4 });

      await expect(
        reviewRepository.create({ facilityId: mockFacilityId, rating: 5 })
      ).rejects.toThrow('Duplicate review: User has already reviewed this facility');
    });
  });
});
