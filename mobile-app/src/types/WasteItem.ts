import { WasteCategory } from '../constants/wasteCategories';

export interface WasteItem {
  id: string;
  userId: string;
  category: WasteCategory;
  confidenceScore: number;
  imageUrl?: string;
  detectedAt: Date;
  pointsAwarded: number;
}
