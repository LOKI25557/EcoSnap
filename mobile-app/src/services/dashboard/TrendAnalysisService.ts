import { DailyStat, TrendData } from '../../types/Dashboard';
import { HistoryItem } from '../history/DetectionHistoryService';
import { analyticsService } from '../ai/analyticsService';
import { WasteItem } from '../../types/WasteItem';
import { calculateScore } from '../../utils/calculateScore';

class TrendAnalysisService {
  private cache: { data: TrendData; historyLength: number } | null = null;

  analyzeTrends(history: HistoryItem[]): TrendData {
    if (this.cache && this.cache.historyLength === history.length) {
      return this.cache.data;
    }

    const dailyMap = new Map<string, DailyStat>();
    
    // We also need weekly/monthly/yearly aggregations
    let thisWeek = 0; let lastWeek = 0;
    let thisMonth = 0; let lastMonth = 0;
    let thisYear = 0; let lastYear = 0;
    
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    const oneYear = 365 * 24 * 60 * 60 * 1000;

    history.forEach(item => {
      const date = new Date(item.timestamp);
      const dateString = date.toISOString().split('T')[0];
      
      if (!dailyMap.has(dateString)) {
        dailyMap.set(dateString, {
          date: dateString,
          itemsProcessed: 0,
          pointsEarned: 0,
          co2Saved: 0,
        });
      }

      const stat = dailyMap.get(dateString)!;
      stat.itemsProcessed += 1;
      stat.pointsEarned += calculateScore(item.response.result.primaryCategory);
      
      const dummyWasteItem: WasteItem = {
        id: 'temp',
        userId: 'temp',
        category: item.response.result.primaryCategory,
        confidenceScore: item.response.result.confidence,
        detectedAt: new Date(),
        pointsAwarded: 0,
      };
      
      stat.co2Saved += analyticsService.calculateCO2Saved([dummyWasteItem]);
      
      const diff = now - item.timestamp;
      if (diff <= oneWeek) thisWeek++;
      else if (diff <= oneWeek * 2) lastWeek++;
      
      if (diff <= oneMonth) thisMonth++;
      else if (diff <= oneMonth * 2) lastMonth++;
      
      if (diff <= oneYear) thisYear++;
      else if (diff <= oneYear * 2) lastYear++;
    });

    const dailyStats = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    let highestDay: DailyStat | null = null;
    let lowestDay: DailyStat | null = null;
    let totalItems = 0;

    dailyStats.forEach(stat => {
      totalItems += stat.itemsProcessed;
      if (!highestDay || stat.itemsProcessed > highestDay.itemsProcessed) {
        highestDay = stat;
      }
      if (!lowestDay || stat.itemsProcessed < lowestDay.itemsProcessed) {
        lowestDay = stat;
      }
    });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    if (dailyStats.length > 0) {
        let prevDate = new Date(dailyStats[0].date);
        tempStreak = 1;
        longestStreak = 1;

        for (let i = 1; i < dailyStats.length; i++) {
            const currDate = new Date(dailyStats[i].date);
            const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            if (diffDays === 1) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 1;
            }
            prevDate = currDate;
        }

        const today = new Date();
        const lastEntryDate = new Date(dailyStats[dailyStats.length - 1].date);
        const daysFromToday = Math.ceil(Math.abs(today.getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysFromToday <= 1) {
            currentStreak = tempStreak;
        }
    }

    const averageItemsPerDay = dailyStats.length > 0 ? totalItems / dailyStats.length : 0;
    
    const calcGrowth = (current: number, previous: number) => previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0);

    const data: TrendData = {
      dailyStats,
      highestDay,
      lowestDay,
      currentStreak,
      longestStreak,
      averageItemsPerDay,
      weeklyGrowthPercentage: calcGrowth(thisWeek, lastWeek),
      monthlyGrowthPercentage: calcGrowth(thisMonth, lastMonth),
      yearlyGrowthPercentage: calcGrowth(thisYear, lastYear),
    };
    
    this.cache = { data, historyLength: history.length };
    
    return data;
  }
}

export const trendAnalysisService = new TrendAnalysisService();
