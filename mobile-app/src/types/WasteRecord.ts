import { WasteCategory } from '../constants/wasteCategories';

export interface WasteRecord {
  id: string;
  userId: string;
  category: WasteCategory;
  confidence: number;
  binRecommendation: string;
  disposalInstructions: string;
  imagePath?: string;
  imageUrl?: string;
  detectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

