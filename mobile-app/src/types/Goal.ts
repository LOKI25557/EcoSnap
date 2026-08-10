import { WasteCategory } from '../constants/wasteCategories';

export interface Goal {
  id: string;
  title: string;
  description: string;
  target: number;
  currentProgress: number;
  type: 'daily' | 'weekly' | 'monthly' | 'lifetime';
  category?: WasteCategory;
  isCompleted: boolean;
  rewardPoints: number;
  completedAt?: number;
}

export interface UserGoals {
  activeGoals: Goal[];
  completedGoals: Goal[];
  lastUpdated: number;
}
