export type StorageCategory = 'profile' | 'waste' | 'report';

export interface StorageUploadOptions {
  contentType?: string;
  cacheControl?: string;
  customMetadata?: Record<string, string>;
}

export interface StorageFile {
  path: string;
  fileName: string;
  contentType: string;
  size: number;
  downloadURL: string;
  createdAt: Date;
}

export interface StorageResult {
  path: string;
  downloadURL: string;
}
