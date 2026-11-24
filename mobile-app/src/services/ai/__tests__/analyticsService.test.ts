import { analyticsService } from '../analyticsService';
import { WasteCategory } from '../../../constants/wasteCategories';
import { WasteItem } from '../../../types/WasteItem';

describe('analyticsService', () => {
  const sampleItems: WasteItem[] = [
    { id: '1', userId: 'u1', category: WasteCategory.PLASTIC, confidenceScore: 0.9, detectedAt: new Date(), pointsAwarded: 10 },
    { id: '2', userId: 'u1', category: WasteCategory.PAPER, confidenceScore: 0.95, detectedAt: new Date(), pointsAwarded: 5 },
    { id: '3', userId: 'u1', category: WasteCategory.METAL, confidenceScore: 0.8, detectedAt: new Date(), pointsAwarded: 20 },
    { id: '4', userId: 'u1', category: WasteCategory.E_WASTE, confidenceScore: 0.99, detectedAt: new Date(), pointsAwarded: 50 },
  ];

  it('calculateCO2Saved calculates correct environmental carbon offset', () => {
    const co2 = analyticsService.calculateCO2Saved(sampleItems);
    expect(co2).toBeGreaterThan(0);
    // Plastic (0.15 * 0.9) + Paper (0.08 * 0.95) + Metal (0.12 * 0.8) + E-waste (0.50 * 0.99)
    const expected = (0.15 * 0.9) + (0.08 * 0.95) + (0.12 * 0.8) + (0.50 * 0.99);
    expect(co2).toBeCloseTo(expected, 3);
  });

  it('calculateWasteDiverted sums estimated item weights correctly', () => {
    const weight = analyticsService.calculateWasteDiverted(sampleItems);
    // 0.025 + 0.010 + 0.010 + 0.200 = 0.245 kg
    expect(weight).toBeCloseTo(0.245, 3);
  });

  it('calculateSustainabilityScore returns 0 for empty list and between 1-100 for populated list', () => {
    expect(analyticsService.calculateSustainabilityScore([])).toBe(0);

    const score = analyticsService.calculateSustainabilityScore(sampleItems);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('calculateRecyclingRate calculates 100% when all items are recyclable', () => {
    const rate = analyticsService.calculateRecyclingRate(sampleItems);
    expect(rate).toBe(100);

    const mixedItems: WasteItem[] = [
      ...sampleItems,
      { id: '5', userId: 'u1', category: WasteCategory.UNKNOWN, confidenceScore: 0.1, detectedAt: new Date(), pointsAwarded: 0 },
    ];
    const mixedRate = analyticsService.calculateRecyclingRate(mixedItems);
    expect(mixedRate).toBe(80); // 4 / 5 = 80%
  });

  it('getUserImpact generates a complete structured report with recommendations', () => {
    const report = analyticsService.getUserImpact('u1', sampleItems);

    expect(report.totalItemsProcessed).toBe(4);
    expect(report.totalPointsEarned).toBe(85);
    expect(report.co2SavedKg).toBeGreaterThan(0);
    expect(report.wasteDivertedKg).toBeGreaterThan(0);
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.categoryBreakdown[WasteCategory.PLASTIC]).toBeDefined();
    expect(report.categoryBreakdown[WasteCategory.PLASTIC].count).toBe(1);
  });
});
