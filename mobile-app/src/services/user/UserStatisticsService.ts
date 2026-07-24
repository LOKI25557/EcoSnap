import * as FileSystem from 'expo-file-system';
import { WasteCategory } from '../../constants/wasteCategories';
import { WasteItem } from '../../types/WasteItem';
import { analyticsService } from '../ai/analyticsService';

const STATS_FILE_PATH = FileSystem.documentDirectory + 'user_statistics.json';

export interface UserStatistics {
  totalScans: number;
  categoryDistribution: Record<WasteCategory, number>;
  totalCO2Saved: number;
  totalWasteDiverted: number;
  recyclingRate: number;
  sustainabilityScore: number;
  currentStreak: number;
  lastScanDate: string | null;
  averageConfidence: number;
  weeklyActivity: number[];
  monthlyActivity: number[];
}

const DEFAULT_STATS: UserStatistics = {
  totalScans: 0,
  categoryDistribution: {
    [WasteCategory.PLASTIC]: 0,
    [WasteCategory.PAPER]: 0,
    [WasteCategory.GLASS]: 0,
    [WasteCategory.METAL]: 0,
    [WasteCategory.ORGANIC]: 0,
    [WasteCategory.E_WASTE]: 0,
    [WasteCategory.UNKNOWN]: 0,
  },
  totalCO2Saved: 0,
  totalWasteDiverted: 0,
  recyclingRate: 0,
  sustainabilityScore: 0,
  currentStreak: 0,
  lastScanDate: null,
  averageConfidence: 0,
  weeklyActivity: new Array(7).fill(0),
  monthlyActivity: new Array(12).fill(0),
};

class UserStatisticsService {
  private statsCache: UserStatistics | null = null;

  async getStatistics(): Promise<UserStatistics> {
    if (this.statsCache) {
      return this.statsCache;
    }

    try {
      const info = await FileSystem.getInfoAsync(STATS_FILE_PATH);
      if (!info.exists) {
        this.statsCache = { ...DEFAULT_STATS };
        return this.statsCache;
      }

      const content = await FileSystem.readAsStringAsync(STATS_FILE_PATH);
      this.statsCache = JSON.parse(content) as UserStatistics;
      return this.statsCache;
    } catch (error) {
      console.error('Failed to read user statistics file', error);
      return { ...DEFAULT_STATS };
    }
  }

  async recordScan(item: WasteItem): Promise<UserStatistics> {
    try {
      const stats = await this.getStatistics();
      
      stats.totalScans += 1;
      
      // Update distribution
      if (stats.categoryDistribution[item.category] !== undefined) {
        stats.categoryDistribution[item.category] += 1;
      }
      
      // Update confidence
      const confidence = item.confidenceScore || 0;
      stats.averageConfidence = ((stats.averageConfidence * (stats.totalScans - 1)) + confidence) / stats.totalScans;
      
      // Update environmental impact
      stats.totalCO2Saved += analyticsService.calculateCO2Saved([item]);
      stats.totalWasteDiverted += analyticsService.calculateWasteDiverted([item]);
      
      // We would recalculate full recycling rate, but we can approximate:
      const isRecyclable = item.category !== WasteCategory.UNKNOWN; // simplified
      // better: use recommendationService, but for now just mock or use exact calc:
      
      // Update streak
      const today = new Date().toISOString().split('T')[0];
      if (stats.lastScanDate) {
        const lastScan = new Date(stats.lastScanDate);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (stats.lastScanDate === yesterdayStr) {
          stats.currentStreak += 1;
        } else if (stats.lastScanDate !== today) {
          stats.currentStreak = 1;
        }
      } else {
        stats.currentStreak = 1;
      }
      stats.lastScanDate = today;
      
      // Update weekly/monthly
      const dayOfWeek = new Date().getDay();
      stats.weeklyActivity[dayOfWeek] += 1;
      
      const month = new Date().getMonth();
      stats.monthlyActivity[month] += 1;

      // Update sustainability score 
      stats.sustainabilityScore = Math.min(100, stats.sustainabilityScore + (confidence > 0.7 ? 2 : 1));
      
      await FileSystem.writeAsStringAsync(STATS_FILE_PATH, JSON.stringify(stats));
      this.statsCache = stats;
      
      return stats;
    } catch (error) {
      console.error('Failed to record scan to statistics', error);
      throw error;
    }
  }
}

export const userStatisticsService = new UserStatisticsService();
