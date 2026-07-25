import * as FileSystem from 'expo-file-system';
import { UserStatistics } from './UserStatisticsService';

const ACHIEVEMENTS_FILE_PATH = FileSystem.documentDirectory + 'user_achievements.json';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_scan', title: 'First Scan', description: 'Complete your first waste classification scan.', iconName: 'camera', unlocked: false },
  { id: '10_scans', title: '10 Scans', description: 'Complete 10 waste classification scans.', iconName: 'star', unlocked: false },
  { id: 'plastic_hero', title: 'Plastic Hero', description: 'Correctly classify 5 plastic items.', iconName: 'recycle', unlocked: false },
  { id: 'recycling_expert', title: 'Recycling Expert', description: 'Achieve a 90% recycling rate with at least 20 scans.', iconName: 'leaf', unlocked: false },
  { id: 'eco_warrior', title: 'Eco Warrior', description: 'Save 1kg of CO2 equivalent.', iconName: 'globe', unlocked: false },
  { id: 'zero_waste_champion', title: 'Zero Waste Champion', description: 'Reach a sustainability score of 100.', iconName: 'trophy', unlocked: false },
];

class AchievementService {
  private achievementsCache: Achievement[] | null = null;

  async getAchievements(): Promise<Achievement[]> {
    if (this.achievementsCache) {
      return this.achievementsCache;
    }

    try {
      const info = await FileSystem.getInfoAsync(ACHIEVEMENTS_FILE_PATH);
      if (!info.exists) {
        this.achievementsCache = [...DEFAULT_ACHIEVEMENTS];
        return this.achievementsCache;
      }

      const content = await FileSystem.readAsStringAsync(ACHIEVEMENTS_FILE_PATH);
      const savedAchievements = JSON.parse(content) as Achievement[];
      
      // Merge with defaults in case of new achievements added in an update
      this.achievementsCache = DEFAULT_ACHIEVEMENTS.map(defaultAch => {
        const saved = savedAchievements.find(a => a.id === defaultAch.id);
        return saved ? { ...defaultAch, unlocked: saved.unlocked, unlockedAt: saved.unlockedAt } : defaultAch;
      });
      
      return this.achievementsCache;
    } catch (error) {
      console.error('Failed to read achievements file', error);
      return [...DEFAULT_ACHIEVEMENTS];
    }
  }

  async checkAchievements(stats: UserStatistics): Promise<Achievement[]> {
    try {
      const achievements = await this.getAchievements();
      const newlyUnlocked: Achievement[] = [];
      const now = new Date().toISOString();

      const unlock = (id: string) => {
        const ach = achievements.find(a => a.id === id);
        if (ach && !ach.unlocked) {
          ach.unlocked = true;
          ach.unlockedAt = now;
          newlyUnlocked.push(ach);
        }
      };

      if (stats.totalScans >= 1) unlock('first_scan');
      if (stats.totalScans >= 10) unlock('10_scans');
      
      // Assuming plastic is 'Plastic' from WasteCategory enum
      if (stats.categoryDistribution['Plastic'] >= 5) unlock('plastic_hero');
      
      if (stats.totalScans >= 20 && stats.recyclingRate >= 90) unlock('recycling_expert');
      if (stats.totalCO2Saved >= 1) unlock('eco_warrior');
      if (stats.sustainabilityScore >= 100) unlock('zero_waste_champion');

      if (newlyUnlocked.length > 0) {
        await FileSystem.writeAsStringAsync(ACHIEVEMENTS_FILE_PATH, JSON.stringify(achievements));
        this.achievementsCache = achievements;
      }

      return newlyUnlocked;
    } catch (error) {
      console.error('Failed to check achievements', error);
      return [];
    }
  }
}

export const achievementService = new AchievementService();
