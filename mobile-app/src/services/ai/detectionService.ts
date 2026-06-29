import { DetectionResult } from '../../types/DetectionResult';
import { WasteCategory } from '../../constants/wasteCategories';

// TODO: Implement actual AI detection using TensorFlow Lite / Expo Camera
export const detectionService = {
  detectWaste: async (imageUri: string): Promise<DetectionResult> => {
    // Placeholder implementation
    return {
      category: WasteCategory.PLASTIC,
      confidence: 0.95,
    };
  },
};
