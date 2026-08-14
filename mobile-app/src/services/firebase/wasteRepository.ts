import { collection, doc, setDoc, serverTimestamp, FieldValue, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { authService } from './authService';
import { FIRESTORE_COLLECTIONS } from '../../constants/firebase';
import { WasteRecord } from '../../types/WasteRecord';
import { WasteCategory } from '../../constants/wasteCategories';

export interface ListWasteRecordsParams {
  userId: string;
  category?: WasteCategory;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  cursor?: any;
}

export const wasteRepository = {
  create: async (record: Omit<WasteRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    // Validate required fields
    if (!record.userId) throw new Error('Missing required field: userId');
    if (!record.category) throw new Error('Missing required field: category');
    if (record.confidence === undefined || record.confidence === null) {
      throw new Error('Missing required field: confidence');
    }
    if (record.confidence < 0 || record.confidence > 1) {
      throw new Error('Confidence must be between 0 and 1');
    }
    if (!record.binRecommendation) throw new Error('Missing required field: binRecommendation');
    if (!record.disposalInstructions) throw new Error('Missing required field: disposalInstructions');
    if (!record.detectedAt) throw new Error('Missing required field: detectedAt');

    // Check auth user ownership
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.uid !== record.userId) {
      throw new Error('Permission denied: Cannot create record for another user');
    }

    try {
      const userWasteCol = collection(
        db,
        FIRESTORE_COLLECTIONS.USERS,
        record.userId,
        FIRESTORE_COLLECTIONS.WASTE_RECORDS
      );
      const docRef = doc(userWasteCol);
      
      const newRecord: Omit<WasteRecord, 'createdAt' | 'updatedAt'> & {
        createdAt: FieldValue;
        updatedAt: FieldValue;
      } = {
        id: docRef.id,
        userId: record.userId,
        category: record.category,
        confidence: record.confidence,
        binRecommendation: record.binRecommendation,
        disposalInstructions: record.disposalInstructions,
        imagePath: record.imagePath || '',
        imageUrl: record.imageUrl || '',
        detectedAt: record.detectedAt,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, newRecord);
      return docRef.id;
    } catch (error) {
      console.error('Error creating waste record in repository:', error);
      throw error;
    }
  },

  get: async (userId: string, recordId: string): Promise<WasteRecord | null> => {
    if (!userId) throw new Error('User ID is required');
    if (!recordId) throw new Error('Record ID is required');

    // Local ownership check
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.uid !== userId) {
      throw new Error('Permission denied: Cannot access another user\'s records');
    }

    try {
      const docRef = doc(
        db,
        FIRESTORE_COLLECTIONS.USERS,
        userId,
        FIRESTORE_COLLECTIONS.WASTE_RECORDS,
        recordId
      );

      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        category: data.category,
        confidence: data.confidence,
        binRecommendation: data.binRecommendation,
        disposalInstructions: data.disposalInstructions,
        imagePath: data.imagePath || '',
        imageUrl: data.imageUrl || '',
        detectedAt: data.detectedAt?.toDate ? data.detectedAt.toDate() : new Date(data.detectedAt || Date.now()),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now())
      } as WasteRecord;
    } catch (error: any) {
      console.error(`Error retrieving waste record ${recordId} for user ${userId}:`, error);
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied: You do not have access to this waste record');
      }
      throw new Error(`Failed to retrieve waste record: ${error.message || error}`);
    }
  },


  list: async (params: ListWasteRecordsParams): Promise<{ items: WasteRecord[]; lastVisible: any | null }> => {
    throw new Error('Not implemented');
  },

  update: async (userId: string, recordId: string, data: Partial<WasteRecord>): Promise<void> => {
    throw new Error('Not implemented');
  },

  delete: async (userId: string, recordId: string): Promise<void> => {
    throw new Error('Not implemented');
  }
};
