import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { safeParse, safeAsyncStorageRead, safeFileSystemRead } from '../safeStorage';

jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

describe('safeStorage Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('safeParse', () => {
    it('parses valid JSON string correctly', () => {
      const result = safeParse('{"foo":"bar"}', { foo: 'default' });
      expect(result).toEqual({ foo: 'bar' });
    });

    it('returns fallback for null or empty string', () => {
      expect(safeParse(null, { val: 1 })).toEqual({ val: 1 });
      expect(safeParse('', { val: 2 })).toEqual({ val: 2 });
      expect(safeParse(undefined, { val: 3 })).toEqual({ val: 3 });
    });

    it('returns fallback for corrupted JSON syntax without throwing', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const result = safeParse('{"bad_json":', { fallback: true });
      expect(result).toEqual({ fallback: true });
      consoleSpy.mockRestore();
    });
  });

  describe('safeAsyncStorageRead', () => {
    it('returns parsed data from AsyncStorage when valid', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify({ score: 100 }));
      const result = await safeAsyncStorageRead('test_key', { score: 0 });
      expect(result).toEqual({ score: 100 });
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('test_key');
    });

    it('returns fallback when key does not exist in AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      const result = await safeAsyncStorageRead('missing_key', ['default']);
      expect(result).toEqual(['default']);
    });

    it('heals corrupted AsyncStorage content by resetting key to fallback JSON', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('{unclosed_corrupt_json');

      const fallback = { status: 'healed' };
      const result = await safeAsyncStorageRead('corrupt_key', fallback);

      expect(result).toEqual(fallback);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('corrupt_key', JSON.stringify(fallback));
      warnSpy.mockRestore();
    });

    it('returns fallback when AsyncStorage.getItem throws an exception', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Hardware read error'));

      const result = await safeAsyncStorageRead('faulty_key', 'safe_fallback');
      expect(result).toBe('safe_fallback');
      errorSpy.mockRestore();
    });
  });

  describe('safeFileSystemRead', () => {
    it('returns fallback when file does not exist on disk', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });
      const result = await safeFileSystemRead('path/to/missing.json', { exists: false });
      expect(result).toEqual({ exists: false });
    });

    it('returns parsed data when file contains valid JSON', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify([1, 2, 3]));

      const result = await safeFileSystemRead<number[]>('path/to/data.json', []);
      expect(result).toEqual([1, 2, 3]);
    });

    it('heals corrupted file on disk by resetting content to stringified fallback', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce('{"corrupted": true');

      const fallback = [{ id: 'restored' }];
      const result = await safeFileSystemRead('path/to/corrupt.json', fallback);

      expect(result).toEqual(fallback);
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        'path/to/corrupt.json',
        JSON.stringify(fallback)
      );
      warnSpy.mockRestore();
    });

    it('handles unexpected FileSystem read errors gracefully', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (FileSystem.getInfoAsync as jest.Mock).mockRejectedValueOnce(new Error('Permission denied'));

      const result = await safeFileSystemRead('path/to/restricted.json', 'fallback_val');
      expect(result).toBe('fallback_val');
      errorSpy.mockRestore();
    });
  });
});
