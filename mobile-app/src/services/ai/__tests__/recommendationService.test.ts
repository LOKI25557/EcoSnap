import { recommendationService, BinType } from '../recommendationService';
import { WasteCategory } from '../../../constants/wasteCategories';

describe('recommendationService', () => {
  describe('getBinRecommendation', () => {
    it('returns Blue Bin and recycling true for Plastic', () => {
      const rec = recommendationService.getBinRecommendation(WasteCategory.PLASTIC);
      expect(rec.bin).toBe(BinType.BLUE);
      expect(rec.recyclable).toBe(true);
      expect(rec.preparationSteps.length).toBeGreaterThan(0);
      expect(rec.environmentalImpact).toBeDefined();
    });

    it('returns Blue Bin and box-flattening instructions for Paper', () => {
      const rec = recommendationService.getBinRecommendation(WasteCategory.PAPER);
      expect(rec.bin).toBe(BinType.BLUE);
      expect(rec.recyclable).toBe(true);
      expect(rec.preparationSteps).toContain('Flatten cardboard boxes completely.');
    });

    it('returns Green Bin and glass handling precautions for Glass', () => {
      const rec = recommendationService.getBinRecommendation(WasteCategory.GLASS);
      expect(rec.bin).toBe(BinType.GREEN);
      expect(rec.recyclable).toBe(true);
      expect(rec.safetyWarnings).toContain('Handle broken glass with extreme care.');
    });

    it('returns Blue Bin for Metal', () => {
      const rec = recommendationService.getBinRecommendation(WasteCategory.METAL);
      expect(rec.bin).toBe(BinType.BLUE);
      expect(rec.recyclable).toBe(true);
    });

    it('returns Brown Bin for Organic composting', () => {
      const rec = recommendationService.getBinRecommendation(WasteCategory.ORGANIC);
      expect(rec.bin).toBe(BinType.BROWN);
      expect(rec.recyclable).toBe(true);
    });

    it('returns E-Waste Collection Center and battery fire warnings for E_WASTE', () => {
      const rec = recommendationService.getBinRecommendation(WasteCategory.E_WASTE);
      expect(rec.bin).toBe(BinType.E_WASTE_CENTER);
      expect(rec.recyclable).toBe(true);
      expect(rec.safetyWarnings).toContain('Lithium-ion batteries can catch fire if punctured or crushed.');
    });

    it('returns General Waste and non-recyclable for UNKNOWN', () => {
      const rec = recommendationService.getBinRecommendation(WasteCategory.UNKNOWN);
      expect(rec.bin).toBe(BinType.UNKNOWN);
      expect(rec.recyclable).toBe(false);
    });
  });

  describe('isRecyclable', () => {
    it('returns true for plastic, paper, glass, metal, organic, e-waste', () => {
      expect(recommendationService.isRecyclable(WasteCategory.PLASTIC)).toBe(true);
      expect(recommendationService.isRecyclable(WasteCategory.PAPER)).toBe(true);
      expect(recommendationService.isRecyclable(WasteCategory.GLASS)).toBe(true);
      expect(recommendationService.isRecyclable(WasteCategory.METAL)).toBe(true);
      expect(recommendationService.isRecyclable(WasteCategory.ORGANIC)).toBe(true);
      expect(recommendationService.isRecyclable(WasteCategory.E_WASTE)).toBe(true);
    });

    it('returns false for unknown waste category', () => {
      expect(recommendationService.isRecyclable(WasteCategory.UNKNOWN)).toBe(false);
    });
  });

  describe('getTips', () => {
    it('returns generic sustainability tips when no recent categories are provided', () => {
      const tips = recommendationService.getTips('user-1', []);
      expect(tips.length).toBeGreaterThanOrEqual(4);
      expect(tips[0]).toContain('rinse');
    });

    it('provides tailored advice when plastic scans exceed 30%', () => {
      const scans = [
        WasteCategory.PLASTIC,
        WasteCategory.PLASTIC,
        WasteCategory.PLASTIC,
        WasteCategory.PLASTIC,
        WasteCategory.PAPER,
      ];
      const tips = recommendationService.getTips('user-1', scans);
      expect(tips.some(t => t.includes('plastic'))).toBe(true);
    });
  });

  describe('getAllBinTypes', () => {
    it('returns all 6 bin types', () => {
      const bins = recommendationService.getAllBinTypes();
      expect(bins.length).toBe(6);
      expect(bins).toContain(BinType.BLUE);
      expect(bins).toContain(BinType.GREEN);
      expect(bins).toContain(BinType.BROWN);
      expect(bins).toContain(BinType.E_WASTE_CENTER);
      expect(bins).toContain(BinType.UNKNOWN);
    });
  });
});
