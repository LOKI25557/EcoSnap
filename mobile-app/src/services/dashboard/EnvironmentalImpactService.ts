import { UserImpactReport, analyticsService } from '../ai/analyticsService';
import { HistoryItem } from '../history/DetectionHistoryService';
import { WasteItem } from '../../types/WasteItem';
import { calculateScore } from '../../utils/calculateScore';

class EnvironmentalImpactService {
  getComprehensiveImpact(history: HistoryItem[]): UserImpactReport {
    // We map HistoryItem back to WasteItem to reuse analyticsService logic seamlessly
    const mappedScans: WasteItem[] = history.map(item => ({
      id: item.id,
      userId: 'local-user', // Offline first
      category: item.response.result.primaryCategory,
      confidenceScore: item.response.result.confidence,
      imageUrl: item.imageUri,
      detectedAt: new Date(item.timestamp),
      pointsAwarded: calculateScore(item.response.result.primaryCategory),
    }));

    // The existing analytics service is quite robust, we delegate to it
    // but this service acts as the Facade for the dashboard
    return analyticsService.getUserImpact('local-user', mappedScans);
  }
}

export const environmentalImpactService = new EnvironmentalImpactService();
