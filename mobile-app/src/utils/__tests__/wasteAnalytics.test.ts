import { wasteAnalytics } from '../wasteAnalytics';
import { WasteCategory } from '../../constants/wasteCategories';
import { WasteItem } from '../../types/WasteItem';

describe('wasteAnalytics', () => {
  it('handles empty input gracefully', () => {
    const report = wasteAnalytics.generateReport([]);
    expect(report.totalItems).toBe(0);
    expect(report.composition).toEqual([]);
    expect(report.mostCommonCategory).toBe(WasteCategory.UNKNOWN);
  });

  it('correctly calculates composition and most common category', () => {
    const items: WasteItem[] = [
      { id: '1', userId: 'user-1', pointsAwarded: 10, category: WasteCategory.PLASTIC, confidenceScore: 0.9, detectedAt: new Date() },
      { id: '2', userId: 'user-1', pointsAwarded: 10, category: WasteCategory.PLASTIC, confidenceScore: 0.8, detectedAt: new Date() },
      { id: '3', userId: 'user-1', pointsAwarded: 5, category: WasteCategory.PAPER, confidenceScore: 0.9, detectedAt: new Date() },
    ];
    const report = wasteAnalytics.generateReport(items);
    
    expect(report.totalItems).toBe(3);
    expect(report.mostCommonCategory).toBe(WasteCategory.PLASTIC);
    expect(report.composition.find(c => c.category === WasteCategory.PLASTIC)?.count).toBe(2);
    expect(report.composition.find(c => c.category === WasteCategory.PAPER)?.count).toBe(1);
  });
});
