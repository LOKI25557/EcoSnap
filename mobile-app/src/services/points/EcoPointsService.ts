import * as FileSystem from 'expo-file-system';
import { EcoPoints, EcoPointsHistoryEntry } from '../../types/EcoPoints';

const ECO_POINTS_FILE_PATH = FileSystem.documentDirectory + 'eco_points.json';

const DEFAULT_POINTS: EcoPoints = {
  totalPoints: 0,
  currentStreak: 0,
  history: [],
};

class EcoPointsService {
  private cache: EcoPoints | null = null;

  async getPoints(): Promise<EcoPoints> {
    if (this.cache) return this.cache;
    try {
      const info = await FileSystem.getInfoAsync(ECO_POINTS_FILE_PATH);
      if (!info.exists) {
        this.cache = { ...DEFAULT_POINTS };
        await this.savePoints(this.cache);
        return this.cache;
      }
      const content = await FileSystem.readAsStringAsync(ECO_POINTS_FILE_PATH);
      this.cache = JSON.parse(content) as EcoPoints;
      return this.cache;
    } catch (error) {
      console.error('Failed to load eco points', error);
      return { ...DEFAULT_POINTS };
    }
  }

  private async savePoints(points: EcoPoints): Promise<void> {
    try {
      await FileSystem.writeAsStringAsync(ECO_POINTS_FILE_PATH, JSON.stringify(points));
      this.cache = points;
    } catch (error) {
      console.error('Failed to save eco points', error);
    }
  }

  async addPoints(entry: EcoPointsHistoryEntry): Promise<void> {
    const current = await this.getPoints();
    const updatedHistory = [entry, ...current.history];
    const newTotal = current.totalPoints + entry.points;
    
    await this.savePoints({
      ...current,
      totalPoints: newTotal,
      history: updatedHistory
    });
  }

  async updateStreak(streak: number): Promise<void> {
    const current = await this.getPoints();
    if (streak > current.currentStreak) {
      // Award streak bonus
      const bonus = streak * 10; // e.g. 10 points per streak day
      await this.addPoints({
        id: Date.now().toString(),
        source: 'streak_bonus',
        points: bonus,
        timestamp: Date.now(),
        description: `${streak} Day Streak Bonus!`
      });
    }
    
    // Refresh cache to get latest totalPoints
    const refreshed = await this.getPoints();
    await this.savePoints({
      ...refreshed,
      currentStreak: streak
    });
  }
}

export const ecoPointsService = new EcoPointsService();
