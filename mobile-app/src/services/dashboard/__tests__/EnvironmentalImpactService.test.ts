import { environmentalImpactService } from '../EnvironmentalImpactService';
import { HistoryItem } from '../../history/DetectionHistoryService';
import { WasteCategory } from '../../../constants/wasteCategories';

describe('EnvironmentalImpactService Facade', () => {
  it('maps history items into WasteItems and delegates cleanly to analyticsService', () => {
    const mockHistory: HistoryItem[] = [
      {
        id: 'h1',
        timestamp: Date.now(),
        imageUri: 'file:///sample.jpg',
        response: {
          result: {
            primaryCategory: WasteCategory.PLASTIC,
            confidence: 0.9,
            confidencePercent: 90,
            topPredictions: [],
          },
          metadata: {
            inferenceTimeMs: 30,
            modelVersion: 'v1.0.0',
            timestamp: Date.now(),
          },
        },
      },
    ];

    const report = environmentalImpactService.getComprehensiveImpact(mockHistory);

    expect(report.totalItemsProcessed).toBe(1);
    expect(report.totalPointsEarned).toBe(10); // Plastic awards 10
    expect(report.co2SavedKg).toBeGreaterThan(0);
    expect(report.recyclingRate).toBe(100);
  });
});
