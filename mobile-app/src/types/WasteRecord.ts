import { WasteCategory } from '../constants/wasteCategories';

export interface WasteRecord {
  id: string;
  userId: string;
  wasteCategory: WasteCategory;
  material: string;
  confidence: number;
  disposalRecommendation: string;
  detectedAt: Date;
  createdAt: Date;
  imageUrl?: string;
  imagePath?: string; // Firebase storage path
  pointsAwarded?: number;
}
