import { WasteCategory } from '../constants/wasteCategories';

// TODO: Implement actual scoring logic based on waste type and condition
export const calculateScore = (category: WasteCategory): number => {
  const baseScores: Record<string, number> = {
    [WasteCategory.PLASTIC]: 10,
    [WasteCategory.PAPER]: 5,
    [WasteCategory.GLASS]: 15,
    [WasteCategory.METAL]: 20,
    [WasteCategory.ORGANIC]: 5,
    [WasteCategory.E_WASTE]: 50,
    [WasteCategory.UNKNOWN]: 0,
  };
  return baseScores[category] || 0;
};
