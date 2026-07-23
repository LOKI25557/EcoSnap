import * as FileSystem from 'expo-file-system';
import { DetectionResponse } from '../../types/DetectionResult';

const HISTORY_FILE_PATH = FileSystem.documentDirectory + 'detection_history.json';

export interface HistoryItem {
  id: string;
  response: DetectionResponse;
  imageUri?: string;
}

class DetectionHistoryService {
  private historyCache: HistoryItem[] | null = null;

  /**
   * Get the full detection history
   */
  async getHistory(): Promise<HistoryItem[]> {
    if (this.historyCache) {
      return this.historyCache;
    }

    try {
      const info = await FileSystem.getInfoAsync(HISTORY_FILE_PATH);
      if (!info.exists) {
        this.historyCache = [];
        return this.historyCache;
      }

      const content = await FileSystem.readAsStringAsync(HISTORY_FILE_PATH);
      this.historyCache = JSON.parse(content) as HistoryItem[];
      return this.historyCache;
    } catch (error) {
      console.error('Failed to read history file', error);
      return [];
    }
  }

  /**
   * Save a new detection to history
   */
  async saveDetection(response: DetectionResponse, imageUri?: string): Promise<void> {
    try {
      const history = await this.getHistory();
      
      const newItem: HistoryItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        response,
        imageUri,
      };

      // Add to beginning of array
      const updatedHistory = [newItem, ...history];
      
      await FileSystem.writeAsStringAsync(HISTORY_FILE_PATH, JSON.stringify(updatedHistory));
      this.historyCache = updatedHistory;
    } catch (error) {
      console.error('Failed to save detection to history', error);
    }
  }

  /**
   * Delete a specific item from history
   */
  async deleteHistory(id: string): Promise<void> {
    try {
      const history = await this.getHistory();
      const updatedHistory = history.filter(item => item.id !== id);
      
      await FileSystem.writeAsStringAsync(HISTORY_FILE_PATH, JSON.stringify(updatedHistory));
      this.historyCache = updatedHistory;
    } catch (error) {
      console.error('Failed to delete history item', error);
    }
  }

  /**
   * Clear all history
   */
  async clearHistory(): Promise<void> {
    try {
      await FileSystem.deleteAsync(HISTORY_FILE_PATH, { idempotent: true });
      this.historyCache = [];
    } catch (error) {
      console.error('Failed to clear history', error);
    }
  }
}

export const detectionHistoryService = new DetectionHistoryService();
