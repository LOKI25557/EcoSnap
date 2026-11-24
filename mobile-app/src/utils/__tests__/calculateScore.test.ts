import { calculateScore } from '../calculateScore';
import { WasteCategory } from '../../constants/wasteCategories';

describe('calculateScore', () => {
  it('awards 10 points for Plastic', () => {
    expect(calculateScore(WasteCategory.PLASTIC)).toBe(10);
  });

  it('awards 5 points for Paper', () => {
    expect(calculateScore(WasteCategory.PAPER)).toBe(5);
  });

  it('awards 15 points for Glass', () => {
    expect(calculateScore(WasteCategory.GLASS)).toBe(15);
  });

  it('awards 20 points for Metal', () => {
    expect(calculateScore(WasteCategory.METAL)).toBe(20);
  });

  it('awards 5 points for Organic', () => {
    expect(calculateScore(WasteCategory.ORGANIC)).toBe(5);
  });

  it('awards 50 points for E-waste', () => {
    expect(calculateScore(WasteCategory.E_WASTE)).toBe(50);
  });

  it('awards 0 points for Unknown', () => {
    expect(calculateScore(WasteCategory.UNKNOWN)).toBe(0);
  });

  it('returns 0 for unmapped or undefined categories', () => {
    expect(calculateScore('NonExistent' as unknown as WasteCategory)).toBe(0);
  });
});
