import * as FileSystem from 'expo-file-system';
import { DetectionResponse } from '../../types/DetectionResult';
import { WasteCategory } from '../../constants/wasteCategories';

const HISTORY_FILE_PATH = FileSystem.documentDirectory + 'detection_history.json';

export interface HistoryItem {
  id: string;
  response: DetectionResponse;
  imageUri?: string;
  timestamp: number;
}

export interface GroupedHistory {
  title: string;
  data: HistoryItem[];
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
        timestamp: Date.now()
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

  /**
   * Group history by date (e.g., 'Today', 'Yesterday', 'Earlier')
   */
  groupHistoryByDate(history: HistoryItem[]): GroupedHistory[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { [key: string]: HistoryItem[] } = {
      'Today': [],
      'Yesterday': [],
      'Earlier': []
    };

    history.forEach(item => {
      const itemDate = new Date(item.timestamp || Date.now());
      itemDate.setHours(0, 0, 0, 0);

      if (itemDate.getTime() === today.getTime()) {
        groups['Today'].push(item);
      } else if (itemDate.getTime() === yesterday.getTime()) {
        groups['Yesterday'].push(item);
      } else {
        groups['Earlier'].push(item);
      }
    });

    return [
      { title: 'Today', data: groups['Today'] },
      { title: 'Yesterday', data: groups['Yesterday'] },
      { title: 'Earlier', data: groups['Earlier'] }
    ].filter(group => group.data.length > 0);
  }

  /**
   * Filter history by text search and/or category
   */
  filterHistory(
    history: HistoryItem[], 
    searchQuery?: string, 
    category?: WasteCategory
  ): HistoryItem[] {
    let filtered = history;
    
    if (category) {
      filtered = filtered.filter(item => item.response.result.primaryCategory === category);
    }
    
    if (searchQuery && searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.response.result.primaryCategory.toLowerCase().includes(lowerQuery)
      );
    }
    
    return filtered;
  }

  /**
   * Sort history by date
   */
  sortHistory(history: HistoryItem[], ascending: boolean = false): HistoryItem[] {
    return [...history].sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return ascending ? timeA - timeB : timeB - timeA;
    });
  }
}

export const detectionHistoryService = new DetectionHistoryService();
