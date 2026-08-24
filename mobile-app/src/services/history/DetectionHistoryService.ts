import * as FileSystem from 'expo-file-system';
import { DetectionResponse } from '../../types/DetectionResult';
import { WasteCategory } from '../../constants/wasteCategories';
import { safeFileSystemRead } from '../../utils/safeStorage';
import { authService } from '../firebase/authService';
import { wasteRepository } from '../firebase/wasteRepository';
import { recyclingKnowledgeBase } from '../../utils/recyclingKnowledgeBase';
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

    this.historyCache = await safeFileSystemRead<HistoryItem[]>(HISTORY_FILE_PATH, []);
    return this.historyCache;
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

      // Firestore sync if authenticated
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        try {
          const knowledge = recyclingKnowledgeBase.getKnowledge(response.result.primaryCategory);
          const fileName = imageUri ? imageUri.split('/').pop() || '' : '';
          
          await wasteRepository.create({
            userId: currentUser.uid,
            category: response.result.primaryCategory,
            confidence: response.result.confidence,
            binRecommendation: knowledge.disposalMethod || 'General Recyclable',
            disposalInstructions: knowledge.recyclingInstructions && knowledge.recyclingInstructions.length > 0
              ? knowledge.recyclingInstructions.join('\n')
              : 'Please prepare and recycle this item.',
            imagePath: fileName ? `users/${currentUser.uid}/waste/${fileName}` : '',
            imageUrl: imageUri || '',
            detectedAt: new Date(response.metadata.timestamp || Date.now())
          });
        } catch (firestoreError) {
          console.error('Failed to save waste record to Firestore', firestoreError);
          // Graceful degradation: do not fail local save if Firestore write fails
        }
      }
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
