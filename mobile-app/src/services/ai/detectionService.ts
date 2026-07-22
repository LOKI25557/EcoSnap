import { DetectionResponse, DetectedWaste, PredictionResult } from '../../types/DetectionResult';
import { WasteCategory } from '../../constants/wasteCategories';
import { inferenceEngine, InferenceError } from './inferenceEngine';
import Constants from 'expo-constants';

// Confidence threshold below which we report as UNKNOWN
const MIN_CONFIDENCE_THRESHOLD = 0.3;

export class DetectionError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'DetectionError';
  }
}

/**
 * detectionService provides inference capabilities for waste image classification.
 */
export const detectionService = {
  /**
   * Detect waste in an image.
   *
   * @param imageUri URI to the image file to analyze
   * @returns A promise resolving to the complete detection response
   */
  detectWaste: async (imageUri: string, imageSize?: { width: number, height: number }): Promise<DetectionResponse> => {
    try {
      const overallStartTime = performance.now();
      // Run the actual TFLite inference pipeline
      const { topPredictions, inferenceTimeMs, preprocessingTimeMs } = await inferenceEngine.runInference(imageUri);

      let primaryPrediction = topPredictions[0];

      // Handle Unknown class or low confidence
      if (primaryPrediction.category === WasteCategory.UNKNOWN || primaryPrediction.confidence < MIN_CONFIDENCE_THRESHOLD) {
        primaryPrediction = {
          category: WasteCategory.UNKNOWN,
          confidence: primaryPrediction.confidence,
          confidencePercent: primaryPrediction.confidencePercent,
        };
      }

      const result: DetectedWaste = {
        primaryCategory: primaryPrediction.category,
        confidence: primaryPrediction.confidence,
        confidencePercent: primaryPrediction.confidencePercent,
        topPredictions: topPredictions,
      };

      const totalLatencyMs = performance.now() - overallStartTime;

      return {
        result,
        metadata: {
          inferenceTimeMs,
          preprocessingTimeMs,
          totalLatencyMs,
          modelVersion: 'v1.0.0', // Could be loaded from config
          imageSize,
          timestamp: Date.now(),
        }
      };
    } catch (error) {
      console.error('Detection service error:', error);
      
      const errorCode = error instanceof InferenceError ? error.code : 'UNKNOWN_DETECTION_ERROR';
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during detection';
      
      // We throw a typed error to be handled by the UI (e.g. show an alert)
      throw new DetectionError(errorMessage, errorCode);
    }
  },

  /**
   * Get all supported waste categories.
   */
  getSupportedCategories: (): WasteCategory[] => {
    return Object.values(WasteCategory).filter(cat => cat !== WasteCategory.UNKNOWN);
  },
};
