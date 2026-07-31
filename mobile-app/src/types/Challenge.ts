import { WasteCategory } from '../constants/wasteCategories';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  rewardPoints: number;
  type: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  target: number;
  progress: number;
  category?: WasteCategory;
  isCompleted: boolean;
  deadline: number;
}
