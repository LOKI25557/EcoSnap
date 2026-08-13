import { storage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL as firebaseGetDownloadURL } from 'firebase/storage';
import { StorageUploadOptions, StorageResult } from '../../types/storage';
import { getProfilePath, sanitizeFileName } from '../../utils/storagePaths';

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
      if (!fileUri) throw new Error('File URI is required');

      const originalFileName = fileUri.split('/').pop() || 'profile.jpg';
      const cleanFileName = sanitizeFileName(originalFileName);
      const uniqueFileName = `${Date.now()}_${cleanFileName}`;
      const path = getProfilePath(uid, uniqueFileName);

      return await storageService.uploadFile(path, fileUri);
    } catch (error: any) {
      console.error(`Error uploading profile image for user ${uid}:`, error);
      throw error;
    }
  },

  getDownloadURL: async (path: string): Promise<string> => {
    // Stub for now (will be implemented in Commit 7)
    return '';
  },

  deleteFile: async (path: string): Promise<void> => {
    // Stub for now (will be implemented in Commit 8)
  },
};
