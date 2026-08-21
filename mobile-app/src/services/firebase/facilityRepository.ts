import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Facility, FacilityType } from '../../types/Facility';
import { FIRESTORE_COLLECTIONS } from '../../constants/firebase';

const toDate = (ts: any): Date => {
  if (!ts) return new Date();
  return ts.toDate ? ts.toDate() : new Date(ts);
};

// Map document helper to standard Facility
const mapDocToFacility = (docSnap: any): Facility => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    type: data.type,
    description: data.description,
    latitude: data.latitude,
    longitude: data.longitude,
    address: data.address,
    city: data.city,
    state: data.state,
    postalCode: data.postalCode,
    country: data.country,
    phone: data.phone,
    email: data.email,
    website: data.website,
    openingHours: data.openingHours,
    acceptedMaterials: data.acceptedMaterials,
    verified: data.verified,
    isActive: data.isActive,
    status: data.status,
    rating: data.rating,
    reviewCount: data.reviewCount,
    source: data.source,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    imageUrl: data.imageUrl,
    directionsUrl: data.directionsUrl,
  };
};

export const facilityRepository = {
  create: async (input: Omit<Facility, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const colRef = collection(db, FIRESTORE_COLLECTIONS.FACILITIES);
      const newDocRef = doc(colRef);
      const docId = newDocRef.id;

      const facilityData: any = {
        ...input,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(newDocRef, facilityData);
      return docId;
    } catch (error: any) {
      console.error('Error creating facility in repository:', error);
      throw error;
    }
  },

  get: async (id: string): Promise<Facility | null> => {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('Invalid facility ID: must be a non-empty string');
    }
    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.FACILITIES, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      return mapDocToFacility(docSnap);
    } catch (error: any) {
      console.error(`Error getting facility ${id} from repository:`, error);
      throw error;
    }
  },

  update: async (id: string, updates: Partial<Facility>): Promise<void> => {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('Invalid facility ID: must be a non-empty string');
    }
    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.FACILITIES, id);
      const dataToUpdate: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };
      // Do not allow updating id or createdAt
      delete dataToUpdate.id;
      delete dataToUpdate.createdAt;

      await setDoc(docRef, dataToUpdate, { merge: true });
    } catch (error: any) {
      console.error(`Error updating facility ${id} in repository:`, error);
      throw error;
    }
  },

  deactivate: async (id: string): Promise<void> => {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('Invalid facility ID: must be a non-empty string');
    }
    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.FACILITIES, id);
      await setDoc(docRef, {
        isActive: false,
        status: 'inactive',
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error: any) {
      console.error(`Error deactivating facility ${id} in repository:`, error);
      throw error;
    }
  },

  list: async (filters?: {
    type?: FacilityType;
    activeOnly?: boolean;
    verifiedOnly?: boolean;
    limit?: number;
    cursor?: any;
  }): Promise<{ items: Facility[]; lastVisible: any | null }> => {
    try {
      const colRef = collection(db, FIRESTORE_COLLECTIONS.FACILITIES);
      const constraints: any[] = [];

      if (filters?.type) {
        constraints.push(where('type', '==', filters.type));
      }
      if (filters?.activeOnly) {
        constraints.push(where('isActive', '==', true));
      }
      if (filters?.verifiedOnly) {
        constraints.push(where('verified', '==', true));
      }

      // Default sorting: stable by name asc
      constraints.push(orderBy('name', 'asc'));

      const limitVal = filters?.limit && filters.limit > 0 && filters.limit <= 50
        ? filters.limit
        : 10;
      constraints.push(limit(limitVal));

      if (filters?.cursor) {
        constraints.push(startAfter(filters.cursor));
      }

      const q = query(colRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const items: Facility[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push(mapDocToFacility(docSnap));
      });

      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      return { items, lastVisible };
    } catch (error: any) {
      console.error('Error listing facilities in repository:', error);
      throw error;
    }
  }
};
