import { storageService } from '../storageService';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { validateMedia } from '../../../utils/storageValidation';

// Mock firebase/storage
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
}));

// Mock storageValidation
jest.mock('../../../utils/storageValidation', () => ({
  validateMedia: jest.fn(),
}));

// Mock firebaseConfig to bypass ES module initialization checks
jest.mock('../firebaseConfig', () => ({
  storage: 'mockStorageInstance',
}));

describe('storageService Tests', () => {
  const mockFileUri = 'file://path/to/test.jpg';
  const mockPath = 'users/user_123/waste/rec_456/test.jpg';
  const mockDownloadUrl = 'https://firebasestorage.googleapis.com/...';
  const mockBlob = { size: 12345, type: 'image/jpeg' };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock global fetch for blob conversion
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(mockBlob),
    }) as any;

    (ref as jest.Mock).mockReturnValue({ path: mockPath });
    (uploadBytes as jest.Mock).mockResolvedValue({});
    (getDownloadURL as jest.Mock).mockResolvedValue(mockDownloadUrl);
    (deleteObject as jest.Mock).mockResolvedValue(undefined);
  });

  describe('uploadFile', () => {
    it('should upload a file and return the path and download URL', async () => {
      const result = await storageService.uploadFile(mockPath, mockFileUri, {
        contentType: 'image/jpeg',
      });

      expect(global.fetch).toHaveBeenCalledWith(mockFileUri);
      expect(ref).toHaveBeenCalledWith('mockStorageInstance', mockPath);
      expect(uploadBytes).toHaveBeenCalledWith({ path: mockPath }, mockBlob, { contentType: 'image/jpeg' });
      expect(getDownloadURL).toHaveBeenCalledWith({ path: mockPath });
      expect(result).toEqual({
        path: mockPath,
        downloadURL: mockDownloadUrl,
      });
    });

    it('should throw an error if path is missing', async () => {
      await expect(storageService.uploadFile('', mockFileUri)).rejects.toThrow('Storage path is required');
    });

    it('should throw an error if fileUri is missing', async () => {
      await expect(storageService.uploadFile(mockPath, '')).rejects.toThrow('File URI is required');
    });

    it('should fail gracefully and throw if fetch fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      await expect(storageService.uploadFile(mockPath, mockFileUri)).rejects.toThrow(/Upload failed: Network error/);
    });
  });

  describe('uploadProfileImage', () => {
    it('should upload profile image to users/{uid}/profile/ directory', async () => {
      (validateMedia as jest.Mock).mockResolvedValue({
        mimeType: 'image/png',
        filename: 'avatar.png',
      });

      const result = await storageService.uploadProfileImage('user_123', mockFileUri);
      
      expect(validateMedia).toHaveBeenCalledWith(mockFileUri);
      expect(result.downloadURL).toBe(mockDownloadUrl);
      expect(result.path).toContain('users/user_123/profile/');
      expect(result.path).toContain('avatar.png');
    });
  });

  describe('uploadWasteImage', () => {
    it('should upload waste image to users/{uid}/waste/{recordId}/ directory', async () => {
      (validateMedia as jest.Mock).mockResolvedValue({
        mimeType: 'image/jpeg',
        filename: 'plastic.jpg',
      });

      const result = await storageService.uploadWasteImage('user_123', 'rec_456', mockFileUri);
      
      expect(validateMedia).toHaveBeenCalledWith(mockFileUri);
      expect(result.downloadURL).toBe(mockDownloadUrl);
      expect(result.path).toContain('users/user_123/waste/rec_456/');
      expect(result.path).toContain('plastic.jpg');
    });
  });

  describe('uploadReportImage', () => {
    it('should upload community report image to users/{uid}/reports/{reportId}/ directory', async () => {
      (validateMedia as jest.Mock).mockResolvedValue({
        mimeType: 'image/jpeg',
        filename: 'dumping.jpg',
      });

      const result = await storageService.uploadReportImage('user_123', 'rep_789', mockFileUri);
      
      expect(validateMedia).toHaveBeenCalledWith(mockFileUri);
      expect(result.downloadURL).toBe(mockDownloadUrl);
      expect(result.path).toContain('users/user_123/reports/rep_789/');
      expect(result.path).toContain('dumping.jpg');
    });
  });

  describe('getDownloadURL', () => {
    it('should retrieve a download URL successfully', async () => {
      const url = await storageService.getDownloadURL(mockPath);
      expect(ref).toHaveBeenCalledWith('mockStorageInstance', mockPath);
      expect(getDownloadURL).toHaveBeenCalledWith({ path: mockPath });
      expect(url).toBe(mockDownloadUrl);
    });

    it('should map object-not-found storage error correctly', async () => {
      const error: any = new Error('Object not found');
      error.code = 'storage/object-not-found';
      (getDownloadURL as jest.Mock).mockRejectedValue(error);

      await expect(storageService.getDownloadURL(mockPath)).rejects.toThrow('Requested media file does not exist');
    });

    it('should map unauthorized storage error correctly', async () => {
      const error: any = new Error('Unauthorized access');
      error.code = 'storage/unauthorized';
      (getDownloadURL as jest.Mock).mockRejectedValue(error);

      await expect(storageService.getDownloadURL(mockPath)).rejects.toThrow('You do not have permission to access this media file');
    });
  });

  describe('deleteFile', () => {
    it('should successfully delete a file', async () => {
      await expect(storageService.deleteFile(mockPath)).resolves.not.toThrow();
      expect(ref).toHaveBeenCalledWith('mockStorageInstance', mockPath);
      expect(deleteObject).toHaveBeenCalledWith({ path: mockPath });
    });

    it('should ignore object-not-found error when deleting a file', async () => {
      const error: any = new Error('Object not found');
      error.code = 'storage/object-not-found';
      (deleteObject as jest.Mock).mockRejectedValue(error);

      await expect(storageService.deleteFile(mockPath)).resolves.not.toThrow();
    });

    it('should throw unauthorized error when deleting a file', async () => {
      const error: any = new Error('Unauthorized');
      error.code = 'storage/unauthorized';
      (deleteObject as jest.Mock).mockRejectedValue(error);

      await expect(storageService.deleteFile(mockPath)).rejects.toThrow('You do not have permission to delete this file');
    });
  });
});
