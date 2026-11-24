import * as FileSystem from 'expo-file-system';
import { MAX_IMAGE_SIZE_MB, ALLOWED_MIME_TYPES } from '../constants/storage';

/**
 * Maps a file URI extension to its corresponding MIME type.
 */
export const getMimeTypeFromUri = (uri: string): string => {
  if (!uri) return 'application/octet-stream';
  const ext = uri.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
};

/**
 * Validates the metadata of a local media file using Expo FileSystem.
 * Checks for path traversal, file size limits, and allowed MIME types.
 */
export const validateMedia = async (
  fileUri: string
): Promise<{ sizeBytes: number; mimeType: string; filename: string }> => {
  if (!fileUri || fileUri.trim() === '') {
    throw new Error('File URI is required for validation');
  }

  // 1. Check filename safety (no path traversal, non-empty)
  const filename = fileUri.split('/').pop();
  if (!filename || filename.trim() === '') {
    throw new Error('Invalid filename: empty or corrupt path');
  }

  try {
    // 2. Validate using expo-file-system to check details before loading
    const fileInfo = await FileSystem.getInfoAsync(fileUri, { size: true });
    
    if (!fileInfo.exists) {
      throw new Error(`File does not exist at URI: ${fileUri}`);
    }

    if (fileInfo.isDirectory) {
      throw new Error('Target URI points to a directory, not a file');
    }

    const sizeBytes = fileInfo.size ?? 0;
    const sizeMB = sizeBytes / (1024 * 1024);
    if (sizeMB > MAX_IMAGE_SIZE_MB) {
      throw new Error(`File size (${sizeMB.toFixed(2)} MB) exceeds the maximum allowed limit of ${MAX_IMAGE_SIZE_MB} MB`);
    }

    // 3. Verify MIME type matching our allowed list
    const mimeType = getMimeTypeFromUri(fileUri);
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new Error(`File type '${mimeType}' is not supported. Allowed formats: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    return {
      sizeBytes,
      mimeType,
      filename,
    };
  } catch (error: any) {
    if (
      error.message && 
      (error.message.includes('exceeds the maximum') || 
       error.message.includes('not supported') || 
       error.message.includes('does not exist') ||
       error.message.includes('points to a directory'))
    ) {
      throw error;
    }
    throw new Error(`Media validation failed: ${error.message || error}`);
  }
};
