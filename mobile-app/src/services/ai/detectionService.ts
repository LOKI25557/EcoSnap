import { DetectionResult } from '../../types/DetectionResult';
import { WasteCategory } from '../../constants/wasteCategories';
import { inferenceEngine } from './inferenceEngine';

// Confidence threshold below which we report as UNKNOWN
const MIN_CONFIDENCE_THRESHOLD = 0.3;

/**
 * detectionService provides inference capabilities for waste image classification.
 *
 * The service coordinates the AI layer:
 * - Load Model: handled by modelLoader.ts
 * - Preprocess: handled by imagePreprocessor.ts
 * - Inference: handled by inferenceEngine.ts
 */
export const detectionService = {
  /**
   * Detect waste in an image.
   *
   * @param imageUri URI to the image file to analyze
   * @returns A promise resolving to the detection result with waste category and confidence
   */
  detectWaste: async (imageUri: string): Promise<DetectionResult> => {
    try {
      // Run the actual TFLite inference pipeline
      const { category, confidence } = await inferenceEngine.runInference(imageUri);

      // Filter by confidence threshold
      if (confidence < MIN_CONFIDENCE_THRESHOLD) {
        return {
          category: WasteCategory.UNKNOWN,
          confidence,
        };
      }

      return {
        category,
        confidence,
      };
    } catch (error) {
      console.error('Detection service error:', error);
      // Fallback to unknown on error to prevent app crashes
      return {
        category: WasteCategory.UNKNOWN,
        confidence: 0,
      };
    }
  },

  /**
   * Get all supported waste categories.
   *
   * @returns Array of WasteCategory enum values supported by the model
   */
  getSupportedCategories: (): WasteCategory[] => {
    return Object.values(WasteCategory).filter(cat => cat !== WasteCategory.UNKNOWN);
  },
};
