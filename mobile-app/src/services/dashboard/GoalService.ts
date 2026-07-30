import * as FileSystem from 'expo-file-system';
import { Goal } from '../../types/Goal';
import { HistoryItem } from '../history/DetectionHistoryService';
import { WasteCategory } from '../../constants/wasteCategories';

const GOALS_FILE_PATH = FileSystem.documentDirectory + 'goals.json';

const DEFAULT_GOALS: Goal[] = [
  {
    id: 'recycle-10-bottles',
    title: 'Plastic Hero',
    description: 'Recycle 10 plastic bottles',
    target: 10,
    currentProgress: 0,
    type: 'lifetime',
    category: WasteCategory.PLASTIC,
    isCompleted: false,
    rewardPoints: 100,
  },
  {
    id: 'recycle-20-papers',
    title: 'Paper Saver',
    description: 'Recycle 20 pieces of paper',
    target: 20,
    currentProgress: 0,
    type: 'lifetime',
    category: WasteCategory.PAPER,
    isCompleted: false,
    rewardPoints: 150,
  },
  {
    id: 'weekly-divert-5',
    title: 'Weekly Starter',
    description: 'Scan 5 items this week',
    target: 5,
    currentProgress: 0,
    type: 'weekly',
    isCompleted: false,
    rewardPoints: 50,
  }
];

class GoalService {
  private goalsCache: Goal[] | null = null;

  async getGoals(): Promise<Goal[]> {
    if (this.goalsCache) return this.goalsCache;

    try {
      const info = await FileSystem.getInfoAsync(GOALS_FILE_PATH);
      if (!info.exists) {
        this.goalsCache = [...DEFAULT_GOALS];
        await this.saveGoals(this.goalsCache);
        return this.goalsCache;
      }
      const content = await FileSystem.readAsStringAsync(GOALS_FILE_PATH);
      this.goalsCache = JSON.parse(content) as Goal[];
      return this.goalsCache;
    } catch (error) {
      console.error('Failed to read goals', error);
      return [...DEFAULT_GOALS];
    }
  }

  async saveGoals(goals: Goal[]): Promise<void> {
    try {
      await FileSystem.writeAsStringAsync(GOALS_FILE_PATH, JSON.stringify(goals));
      this.goalsCache = goals;
    } catch (error) {
      console.error('Failed to save goals', error);
    }
  }

  async evaluateGoals(history: HistoryItem[]): Promise<Goal[]> {
    const goals = await this.getGoals();
    let updated = false;

    // A simplified evaluation: lifetime goals check total history
    // weekly goals ideally would filter history by this week.
    // For MVP dashboard, we will calculate based on all history or specific category counts.

    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    goals.forEach(goal => {
      if (goal.isCompleted) return;

      let relevantHistory = history;
      if (goal.type === 'weekly') {
        relevantHistory = history.filter(h => h.timestamp >= oneWeekAgo);
      } else if (goal.type === 'monthly') {
        relevantHistory = history.filter(h => h.timestamp >= oneMonthAgo);
      }

      const categoryCounts = relevantHistory.reduce<Record<string, number>>((acc, item) => {
        const cat = item.response.result.primaryCategory;
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

      const totalScans = relevantHistory.length;

      let current = 0;
      if (goal.category) {
        current = categoryCounts[goal.category] || 0;
      } else {
        current = totalScans;
      }

      if (current !== goal.currentProgress) {
        goal.currentProgress = current;
        updated = true;
      }

      if (goal.currentProgress >= goal.target && !goal.isCompleted) {
        goal.currentProgress = goal.target;
        goal.isCompleted = true;
        goal.completedAt = Date.now();
        updated = true;
      }
    });

    if (updated) {
      await this.saveGoals(goals);
    }

    return goals;
  }
}

export const goalService = new GoalService();
