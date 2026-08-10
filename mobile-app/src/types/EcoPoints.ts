export interface EcoPointsHistoryEntry {
  id: string;
  source: 'scan' | 'challenge' | 'achievement' | 'streak_bonus' | 'badge';
  points: number;
  timestamp: number;
  description: string;
}

export interface EcoPoints {
  totalPoints: number;
  currentStreak: number;
  history: EcoPointsHistoryEntry[];
}
