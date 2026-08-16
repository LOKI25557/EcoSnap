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
    if (!userId) throw new Error('User ID is required');
    if (!requestId) throw new Error('Request ID is required');

    // Local ownership check
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    if (currentUser.uid !== userId) {
      throw new Error('Permission denied: Cannot access another user\'s pickup requests');
    }

    try {
      const docRef = doc(
        db,
        FIRESTORE_COLLECTIONS.USERS,
        userId,
        FIRESTORE_COLLECTIONS.PICKUP_REQUESTS,
        requestId
      );
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      
      const toDate = (ts: any): Date | undefined => {
        if (!ts) return undefined;
        return ts.toDate ? ts.toDate() : new Date(ts);
      };

      return {
        id: docSnap.id,
        userId: data.userId,
        wasteRecordId: data.wasteRecordId,
        wasteCategory: data.wasteCategory,
        quantity: data.quantity,
        pickupAddress: data.pickupAddress,
        pickupLatitude: data.pickupLatitude,
        pickupLongitude: data.pickupLongitude,
        preferredDate: toDate(data.preferredDate)!,
        preferredTimeSlot: data.preferredTimeSlot,
        notes: data.notes,
        status: data.status,
        createdAt: toDate(data.createdAt)!,
        updatedAt: toDate(data.updatedAt)!,
        scheduledAt: toDate(data.scheduledAt),
        completedAt: toDate(data.completedAt),
        cancelledAt: toDate(data.cancelledAt),
      } as PickupRequest;
    } catch (error: any) {
      console.error(`Error retrieving pickup request ${requestId} for user ${userId}:`, error);
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied: You do not have access to this pickup request');
      }
      throw new Error(`Failed to retrieve pickup request: ${error.message || error}`);
    }
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
    const { userId } = params;
    if (!userId) throw new Error('User ID is required');

    // Local ownership check
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthenticated: User must be logged in');
    }
    if (currentUser.uid !== userId) {
      throw new Error('Permission denied: Cannot access another user\'s pickup requests');
    }

    try {
      const userPickupCol = collection(
        db,
        FIRESTORE_COLLECTIONS.USERS,
        userId,
        FIRESTORE_COLLECTIONS.PICKUP_REQUESTS
      );

      const constraints: QueryConstraint[] = [];

      // Default sorting: newest first (ordered by createdAt descending)
      constraints.push(orderBy('createdAt', 'desc'));

      // Limit setup
      const limitVal = params.limit !== undefined && params.limit > 0
        ? Math.min(params.limit, PICKUP_QUERY_DEFAULTS.MAX_LIMIT)
        : PICKUP_QUERY_DEFAULTS.DEFAULT_LIMIT;
      constraints.push(limit(limitVal));

      if (params.cursor) {
        constraints.push(startAfter(params.cursor));
      }

      const q = query(userPickupCol, ...constraints);
      const querySnapshot = await getDocs(q);

      const toDate = (ts: any): Date | undefined => {
        if (!ts) return undefined;
        return ts.toDate ? ts.toDate() : new Date(ts);
      };

      const items: PickupRequest[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.userId,
          wasteRecordId: data.wasteRecordId,
          wasteCategory: data.wasteCategory,
          quantity: data.quantity,
          pickupAddress: data.pickupAddress,
          pickupLatitude: data.pickupLatitude,
          pickupLongitude: data.pickupLongitude,
          preferredDate: toDate(data.preferredDate)!,
          preferredTimeSlot: data.preferredTimeSlot,
          notes: data.notes,
          status: data.status,
          createdAt: toDate(data.createdAt)!,
          updatedAt: toDate(data.updatedAt)!,
          scheduledAt: toDate(data.scheduledAt),
          completedAt: toDate(data.completedAt),
          cancelledAt: toDate(data.cancelledAt),
        } as PickupRequest);
      });

      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      return { items, lastVisible };
    } catch (error: any) {
      console.error(`Error listing pickup requests for user ${userId}:`, error);
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied: You do not have access to these pickup requests');
      }
      throw new Error(`Failed to list pickup requests: ${error.message || error}`);
    }
  },

  updateStatus: async (
    userId: string,
    requestId: string,
    newStatus: PickupStatus,
    adminOverride = false
  ): Promise<void> => {
    if (!userId) throw new Error('User ID is required');
    if (!requestId) throw new Error('Request ID is required');

    // Local authentication/ownership check (unless adminOverride is true)
    const currentUser = authService.getCurrentUser();
    if (!adminOverride) {
      if (!currentUser) {
        throw new Error('Unauthenticated: User must be logged in');
      }
      if (currentUser.uid !== userId) {
        throw new Error('Permission denied: Cannot update status of another user\'s request');
      }
    }

    try {
      const docRef = doc(
        db,
        FIRESTORE_COLLECTIONS.USERS,
        userId,
        FIRESTORE_COLLECTIONS.PICKUP_REQUESTS,
        requestId
      );
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Pickup request not found');
      }

      const data = docSnap.data();
      const currentStatus = data.status as PickupStatus;

      // 1. Check if transition is valid
      const VALID_TRANSITIONS: Record<PickupStatus, PickupStatus[]> = {
        pending: ['scheduled', 'cancelled'],
        scheduled: ['assigned', 'cancelled'],
        assigned: ['picked_up'],
        picked_up: ['completed'],
        completed: [],
        cancelled: [],
      };

      if (!VALID_TRANSITIONS[currentStatus].includes(newStatus)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
      }

      // 2. Enforce client-side status restrictions
      if (!adminOverride && newStatus !== 'cancelled') {
        throw new Error('Permission denied: Ordinary clients can only cancel pickup requests');
      }

      // 3. Prepare updates
      const updates: Record<string, any> = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      if (newStatus === 'scheduled') {
        updates.scheduledAt = serverTimestamp();
      } else if (newStatus === 'completed') {
        updates.completedAt = serverTimestamp();
      } else if (newStatus === 'cancelled') {
        updates.cancelledAt = serverTimestamp();
      }

      await setDoc(docRef, updates, { merge: true });
    } catch (error: any) {
      console.error(`Error updating status for pickup request ${requestId}:`, error);
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied: You do not have permission to update this request');
      }
      throw new Error(`Failed to update pickup request status: ${error.message || error}`);
    }
  },

  cancel: async (userId: string, requestId: string): Promise<void> => {
    // Stub for Commit 8
  }
};
