export enum WasteCategory {
  PLASTIC = 'Plastic',
  PAPER = 'Paper',
  GLASS = 'Glass',
  METAL = 'Metal',
  ORGANIC = 'Organic',
  E_WASTE = 'E-Waste',
  UNKNOWN = 'Unknown',
}

export const WASTE_CATEGORIES_INFO = {
  [WasteCategory.PLASTIC]: { color: '#FFD700', description: 'Recyclable plastics' },
  [WasteCategory.PAPER]: { color: '#87CEEB', description: 'Paper and cardboard' },
  [WasteCategory.GLASS]: { color: '#90EE90', description: 'Glass bottles and jars' },
  [WasteCategory.METAL]: { color: '#C0C0C0', description: 'Aluminum and steel cans' },
  [WasteCategory.ORGANIC]: { color: '#8B4513', description: 'Food waste and compostables' },
  [WasteCategory.E_WASTE]: { color: '#FF6347', description: 'Electronic devices and batteries' },
  [WasteCategory.UNKNOWN]: { color: '#808080', description: 'Unidentified waste' },
};
