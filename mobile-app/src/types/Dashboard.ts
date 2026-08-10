export interface Insight {
  id: string;
  text: string;
  type: 'positive' | 'negative' | 'neutral' | 'info';
  timestamp: number;
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  itemsProcessed: number;
  pointsEarned: number;
  co2Saved: number;
}

export interface TrendData {
  dailyStats: DailyStat[];
  highestDay: DailyStat | null;
  lowestDay: DailyStat | null;
  currentStreak: number;
  longestStreak: number;
  averageItemsPerDay: number;
  weeklyGrowthPercentage: number;
  monthlyGrowthPercentage: number;
  yearlyGrowthPercentage: number;
}
