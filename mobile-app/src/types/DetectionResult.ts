import { WasteCategory } from '../constants/wasteCategories';

export interface DetectionResult {
  category: WasteCategory;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
