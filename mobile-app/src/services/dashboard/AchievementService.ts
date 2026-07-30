import * as FileSystem from 'expo-file-system';
import { Achievement } from '../../types/Achievement';
import { HistoryItem } from '../history/DetectionHistoryService';
import { WasteCategory } from '../../constants/wasteCategories';

const ACHIEVEMENTS_FILE_PATH = FileSystem.documentDirectory + 'achievements.json';

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'eco-beginner',
    title: 'Eco Beginner',
    description: 'Complete your first scan',
    icon: '🌱',
    isUnlocked: false,
    progress: 0,
    target: 1,
    rewardPoints: 50,
  },
  {
    id: '100-scans',
    title: 'Recycling Legend',
    description: 'Reach 100 total scans',
    icon: '👑',
    isUnlocked: false,
    progress: 0,
    target: 100,
    rewardPoints: 1000,
  },
  {
    id: 'plastic-hero',
    title: 'Plastic Hero',
    description: 'Recycle 50 plastic items',
    icon: '🥤',
    isUnlocked: false,
    progress: 0,
    target: 50,
    rewardPoints: 200,
  },
  {
    id: 'metal-master',
    title: 'Metal Master',
    description: 'Recycle 25 metal items',
    icon: '🥫',
    isUnlocked: false,
    progress: 0,
    target: 25,
    rewardPoints: 150,
  },
  {
    id: 'paper-champion',
    title: 'Paper Champion',
    description: 'Recycle 50 paper items',
    icon: '📄',
    isUnlocked: false,
    progress: 0,
    target: 50,
    rewardPoints: 200,
  }
];

class AchievementService {
  private cache: Achievement[] | null = null;

  async getAchievements(): Promise<Achievement[]> {
    if (this.cache) return this.cache;

    try {
      const info = await FileSystem.getInfoAsync(ACHIEVEMENTS_FILE_PATH);
      if (!info.exists) {
        this.cache = [...DEFAULT_ACHIEVEMENTS];
        await this.saveAchievements(this.cache);
        return this.cache;
      }
      const content = await FileSystem.readAsStringAsync(ACHIEVEMENTS_FILE_PATH);
      this.cache = JSON.parse(content) as Achievement[];
      return this.cache;
    } catch (error) {
      console.error('Failed to read achievements', error);
      return [...DEFAULT_ACHIEVEMENTS];
    }
  }

  async saveAchievements(achievements: Achievement[]): Promise<void> {
    try {
      await FileSystem.writeAsStringAsync(ACHIEVEMENTS_FILE_PATH, JSON.stringify(achievements));
      this.cache = achievements;
    } catch (error) {
      console.error('Failed to save achievements', error);
    }
  }

  async evaluateAchievements(history: HistoryItem[]): Promise<Achievement[]> {
    const achievements = await this.getAchievements();
    let updated = false;

    const totalScans = history.length;
    const categoryCounts = history.reduce<Record<string, number>>((acc, item) => {
      const cat = item.response.result.primaryCategory;
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    achievements.forEach(ach => {
      if (ach.isUnlocked) return;

      let current = 0;
      switch (ach.id) {
        case 'eco-beginner':
        case '100-scans':
          current = totalScans;
          break;
        case 'plastic-hero':
          current = categoryCounts[WasteCategory.PLASTIC] || 0;
          break;
        case 'metal-master':
          current = categoryCounts[WasteCategory.METAL] || 0;
          break;
        case 'paper-champion':
          current = categoryCounts[WasteCategory.PAPER] || 0;
          break;
      }

      if (current !== ach.progress) {
        ach.progress = current;
        updated = true;
      }

      if (ach.progress >= ach.target && !ach.isUnlocked) {
        ach.progress = ach.target;
        ach.isUnlocked = true;
        ach.unlockedAt = Date.now();
        updated = true;
      }
    });

    if (updated) {
      await this.saveAchievements(achievements);
    }

    return achievements;
  }
}

export const achievementService = new AchievementService();
