import { storage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL as firebaseGetDownloadURL, deleteObject } from 'firebase/storage';
import { StorageUploadOptions, StorageResult } from '../../types/storage';
import { getProfilePath, getWasteImagePath, getReportImagePath, sanitizeFileName } from '../../utils/storagePaths';
import { validateMedia } from '../../utils/storageValidation';

export const storageService = {
  /**
   * Uploads a file from a React Native file URI to Firebase Storage.
   * Leverages fetch + blob representation for Expo compatibility.
   */
  uploadFile: async (path: string, fileUri: string, options?: StorageUploadOptions): Promise<StorageResult> => {
    try {
      if (!path) throw new Error('Storage path is required');
      if (!fileUri) throw new Error('File URI is required');

      // Convert local URI to blob using fetch
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const storageRef = ref(storage, path);
      
      // Build metadata if options are provided
      const metadata: Record<string, any> = {};
      if (options?.contentType) {
        metadata.contentType = options.contentType;
      }
      if (options?.cacheControl) {
        metadata.cacheControl = options.cacheControl;
      }
      if (options?.customMetadata) {
        metadata.customMetadata = options.customMetadata;
      }

      // Upload blob
      await uploadBytes(storageRef, blob, Object.keys(metadata).length > 0 ? metadata : undefined);

      // Retrieve download URL
      const downloadURL = await firebaseGetDownloadURL(storageRef);

      return {
        path,
        downloadURL,
      };
    } catch (error: any) {
      console.error(`Error uploading file to ${path}:`, error);
      throw new Error(`Upload failed: ${error.message || error}`);
    }
  },

  /**
   * Uploads a profile image for a specific user.
   * Path: users/{uid}/profile/{filename}
   */
  uploadProfileImage: async (uid: string, fileUri: string): Promise<StorageResult> => {
    try {
      if (!uid) throw new Error('User ID is required');
      
      // Validate media before processing
      const { mimeType, filename } = await validateMedia(fileUri);
      
      const cleanFileName = sanitizeFileName(filename);
      const uniqueFileName = `${Date.now()}_${cleanFileName}`;
      const path = getProfilePath(uid, uniqueFileName);

      // Pass the detected mimeType as contentType and custom metadata
      return await storageService.uploadFile(path, fileUri, { 
        contentType: mimeType,
        customMetadata: {
          category: 'profile',
          uploadedBy: uid,
          source: 'ecosnap-mobile',
        }
      });
    } catch (error: any) {
      console.error(`Error uploading profile image for user ${uid}:`, error);
      throw error;
    }
  },

  /**
   * Uploads a waste image for a specific user and waste record.
   * Path: users/{uid}/waste/{recordId}/{filename}
   */
  uploadWasteImage: async (uid: string, recordId: string, fileUri: string): Promise<StorageResult> => {
    try {
      if (!uid) throw new Error('User ID is required');
      if (!recordId) throw new Error('Record ID is required');
      
      // Validate media before processing
      const { mimeType, filename } = await validateMedia(fileUri);

      const cleanFileName = sanitizeFileName(filename);
      const uniqueFileName = `${Date.now()}_${cleanFileName}`;
      const path = getWasteImagePath(uid, recordId, uniqueFileName);

      return await storageService.uploadFile(path, fileUri, { 
        contentType: mimeType,
        customMetadata: {
          category: 'waste',
          uploadedBy: uid,
          recordId: recordId,
          source: 'ecosnap-mobile',
        }
      });
    } catch (error: any) {
      console.error(`Error uploading waste image for user ${uid} and record ${recordId}:`, error);
      throw error;
    }
  },

  /**
   * Uploads a community report image for a specific user and report.
   * Path: users/{uid}/reports/{reportId}/{filename}
   */
  uploadReportImage: async (uid: string, reportId: string, fileUri: string): Promise<StorageResult> => {
    try {
      if (!uid) throw new Error('User ID is required');
      if (!reportId) throw new Error('Report ID is required');
      
      // Validate media before processing
      const { mimeType, filename } = await validateMedia(fileUri);

      const cleanFileName = sanitizeFileName(filename);
      const uniqueFileName = `${Date.now()}_${cleanFileName}`;
      const path = getReportImagePath(uid, reportId, uniqueFileName);

      return await storageService.uploadFile(path, fileUri, { 
        contentType: mimeType,
        customMetadata: {
          category: 'report',
          uploadedBy: uid,
          reportId: reportId,
          source: 'ecosnap-mobile',
        }
      });
    } catch (error: any) {
      console.error(`Error uploading report image for user ${uid} and report ${reportId}:`, error);
      throw error;
    }
  },

  /**
   * Retrieves the usable Firebase Storage download URL for a given path.
   */
  getDownloadURL: async (path: string): Promise<string> => {
    try {
      if (!path) throw new Error('Path is required to get download URL');
      const storageRef = ref(storage, path);
      return await firebaseGetDownloadURL(storageRef);
    } catch (error: any) {
      console.error(`Error getting download URL for path ${path}:`, error);
      // Map to application-friendly errors
      if (error.code === 'storage/object-not-found') {
        throw new Error('Requested media file does not exist');
      }
      if (error.code === 'storage/unauthorized') {
        throw new Error('You do not have permission to access this media file');
      }
      throw new Error(`Failed to retrieve download URL: ${error.message || error}`);
    }
  },

  /**
   * Deletes a file at the specified Storage path.
   */
  deleteFile: async (path: string): Promise<void> => {
    try {
      if (!path) throw new Error('Path is required for file deletion');
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error: any) {
      // Handle missing files safely by ignoring object-not-found
      if (error.code === 'storage/object-not-found') {
        console.warn(`File not found for deletion at path: ${path}`);
        return;
      }
      if (error.code === 'storage/unauthorized') {
        throw new Error('You do not have permission to delete this file');
      }
      console.error(`Error deleting file at path ${path}:`, error);
      throw new Error(`Failed to delete file: ${error.message || error}`);
    }
  },

  /**
   * Deletes a profile image.
   */
  deleteProfileImage: async (uid: string, fileName: string): Promise<void> => {
    const path = getProfilePath(uid, fileName);
    await storageService.deleteFile(path);
  },

  /**
   * Deletes a waste image.
   */
  deleteWasteImage: async (uid: string, recordId: string, fileName: string): Promise<void> => {
    const path = getWasteImagePath(uid, recordId, fileName);
    await storageService.deleteFile(path);
  },

  /**
   * Deletes a community report image.
   */
  deleteReportImage: async (uid: string, reportId: string, fileName: string): Promise<void> => {
    const path = getReportImagePath(uid, reportId, fileName);
    await storageService.deleteFile(path);
  },
};
