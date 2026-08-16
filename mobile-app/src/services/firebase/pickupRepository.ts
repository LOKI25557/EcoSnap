import { collection, doc, setDoc, serverTimestamp, FieldValue, getDoc, query, orderBy, getDocs, limit, startAfter, QueryConstraint, where, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { authService } from './authService';
import { FIRESTORE_COLLECTIONS, PICKUP_QUERY_DEFAULTS } from '../../constants/firebase';
import { PickupRequest, PickupStatus, PickupTimeSlot, PickupRequestInput, PickupRequestUpdate } from '../../types/PickupRequest';

export const pickupRepository = {
  create: async (input: PickupRequestInput): Promise<string> => {
    // 1. Authenticated user validation
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    if (currentUser.uid !== input.userId) {
      throw new Error('Permission denied: Cannot create pickup request for another user');
    }

    // 2. Input validations
    if (!input.pickupAddress || input.pickupAddress.trim() === '') {
      throw new Error('Pickup address is required');
    }
    if (!input.preferredDate || !(input.preferredDate instanceof Date) || isNaN(input.preferredDate.getTime())) {
      throw new Error('Preferred date is required and must be a valid Date');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(input.preferredDate);
    checkDate.setHours(0, 0, 0, 0);
    if (checkDate < today) {
      throw new Error('Preferred date cannot be in the past');
    }
    const validTimeSlots: PickupTimeSlot[] = ['morning', 'afternoon', 'evening'];
    if (!input.preferredTimeSlot || !validTimeSlots.includes(input.preferredTimeSlot)) {
      throw new Error('Valid time slot is required (morning, afternoon, or evening)');
    }
    if (!input.quantity || input.quantity.trim() === '') {
      throw new Error('Quantity is required');
    }
    if (!input.wasteCategory) {
      throw new Error('Waste category is required');
    }

    // 3. Waste record ownership validation
    const wasteDocRef = doc(
      db,
      FIRESTORE_COLLECTIONS.USERS,
      input.userId,
      FIRESTORE_COLLECTIONS.WASTE_RECORDS,
      input.wasteRecordId
    );
    const wasteSnap = await getDoc(wasteDocRef);
    if (!wasteSnap.exists()) {
      throw new Error('Invalid wasteRecordId: Waste record not found or does not belong to the user');
    }

    // 4. Create request in Firestore
    try {
      const userPickupCol = collection(
        db,
        FIRESTORE_COLLECTIONS.USERS,
        input.userId,
        FIRESTORE_COLLECTIONS.PICKUP_REQUESTS
      );
      const docRef = doc(userPickupCol);
      
      const newRequest = {
        id: docRef.id,
        userId: input.userId,
        wasteRecordId: input.wasteRecordId,
        wasteCategory: input.wasteCategory,
        quantity: input.quantity,
        pickupAddress: input.pickupAddress,
        pickupLatitude: input.pickupLatitude || null,
        pickupLongitude: input.pickupLongitude || null,
        preferredDate: input.preferredDate,
        preferredTimeSlot: input.preferredTimeSlot,
        notes: input.notes || '',
        status: 'pending' as PickupStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, newRequest);
      return docRef.id;
    } catch (error: any) {
      console.error('Error creating pickup request in repository:', error);
      throw new Error(`Failed to create pickup request: ${error.message || error}`);
    }
  },

  get: async (userId: string, requestId: string): Promise<PickupRequest | null> => {
    // Stub for Commit 5
    return null;
  },

  list: async (params: {
    userId: string;
    status?: PickupStatus;
    startDate?: Date;
    endDate?: Date;
    category?: string;
    limit?: number;
    cursor?: any;
  }): Promise<{ items: PickupRequest[]; lastVisible: any | null }> => {
    // Stub for Commit 6 and 10
    return { items: [], lastVisible: null };
  },

  updateStatus: async (
    userId: string,
    requestId: string,
    newStatus: PickupStatus,
    adminOverride = false
  ): Promise<void> => {
    // Stub for Commit 7
  },

  cancel: async (userId: string, requestId: string): Promise<void> => {
    // Stub for Commit 8
  }
};
