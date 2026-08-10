import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

/**
 * Safely parse JSON from a string, returning a default value if it fails.
 */
export const safeParse = <T>(jsonString: string | null | undefined, fallback: T): T => {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Failed to parse JSON string:', error);
    return fallback;
  }
};

/**
 * Read from AsyncStorage safely, falling back to a default value and resetting the storage if corrupted.
 */
export const safeAsyncStorageRead = async <T>(key: string, fallback: T): Promise<T> => {
  try {
    const data = await AsyncStorage.getItem(key);
    if (!data) return fallback;
    try {
      return JSON.parse(data) as T;
    } catch (parseError) {
      console.warn(`Corrupted AsyncStorage key ${key}. Resetting to fallback.`);
      await AsyncStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
  } catch (error) {
    console.error(`Failed to read AsyncStorage key ${key}:`, error);
    return fallback;
  }
};

/**
 * Read from Expo FileSystem safely, falling back to a default value and resetting the file if corrupted.
 */
export const safeFileSystemRead = async <T>(path: string, fallback: T): Promise<T> => {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return fallback;

    const content = await FileSystem.readAsStringAsync(path);
    if (!content) return fallback;
    
    try {
      return JSON.parse(content) as T;
    } catch (parseError) {
      console.warn(`Corrupted file at ${path}. Resetting to fallback.`);
      await FileSystem.writeAsStringAsync(path, JSON.stringify(fallback));
      return fallback;
    }
  } catch (error) {
    console.error(`Failed to read from file ${path}:`, error);
    return fallback;
  }
};
