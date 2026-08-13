import { detectionService, DetectionError } from './detectionService';
import { detectionHistoryService } from '../history/DetectionHistoryService';
import { WasteItem } from '../../types/WasteItem';
import { calculateScore } from '../../utils/calculateScore';
import { DetectionResponse } from '../../types/DetectionResult';

/**
 * PipelineService handles the end-to-end integration of the AI pipeline.
 * It connects the Camera/UI with Detection, Recommendation, History, and Analytics.
 */
export const pipelineService = {
  /**
   * Processes a captured image through the full pipeline.
   * 
   * @param imageUri The local URI of the captured image
   * @param imageSize Optional image dimensions
   * @returns An object containing the detection response and the normalized WasteItem for the app context
   */
  processImage: async (imageUri: string, imageSize?: { width: number, height: number }): Promise<{ response: DetectionResponse, wasteItem: WasteItem }> => {
    try {
      // 1. TFLite inference via DetectionService
      const response = await detectionService.detectWaste(imageUri, imageSize);

      // 2. Save to local History (which also acts as the input to Analytics later)
      await detectionHistoryService.saveDetection(response, imageUri);

      // 3. Normalize into a WasteItem (to decouple UI logic)
      const wasteItem: WasteItem = {
        id: `scan-${Date.now()}`, // Consistent with previous mock behavior
        userId: 'demo-user',
        category: response.result.primaryCategory,
        confidenceScore: response.result.confidence,
        imageUrl: imageUri,
        detectedAt: new Date(response.metadata.timestamp),
        // Score logic is encapsulated here instead of the UI
        pointsAwarded: calculateScore(response.result.primaryCategory),
      };

      return { response, wasteItem };
    } catch (error) {
      console.error('PipelineService Error:', error);
      throw error; // Re-throw to be handled by the UI
    }
  }
};
