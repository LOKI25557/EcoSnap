import { recyclingKnowledgeBase } from '../recyclingKnowledgeBase';
import { WasteCategory } from '../../constants/wasteCategories';

describe('recyclingKnowledgeBase', () => {
  it('returns comprehensive knowledge for Plastic', () => {
    const knowledge = recyclingKnowledgeBase.getKnowledge(WasteCategory.PLASTIC);
    expect(knowledge.displayName).toBe('Plastic');
    expect(knowledge.recyclable).toBe(true);
    expect(knowledge.recyclingInstructions.length).toBeGreaterThan(0);
    expect(knowledge.precautions.length).toBeGreaterThan(0);
    expect(knowledge.ecoTips.length).toBeGreaterThan(0);
    expect(knowledge.decompositionTime).toBeDefined();
  });

  it('returns comprehensive knowledge for Paper & Cardboard', () => {
    const knowledge = recyclingKnowledgeBase.getKnowledge(WasteCategory.PAPER);
    expect(knowledge.displayName).toContain('Paper');
    expect(knowledge.recyclable).toBe(true);
    expect(knowledge.description).toContain('Cardboard');
  });

  it('returns non-recyclable entry for Unknown', () => {
    const knowledge = recyclingKnowledgeBase.getKnowledge(WasteCategory.UNKNOWN);
    expect(knowledge.recyclable).toBe(false);
    expect(knowledge.disposalMethod).toContain('general waste');
  });

  it('searches knowledge base accurately by keyword', () => {
    const compostResults = recyclingKnowledgeBase.search('compost');
    expect(compostResults.length).toBeGreaterThan(0);
    expect(compostResults.some(r => r.category === WasteCategory.ORGANIC)).toBe(true);

    const bottleResults = recyclingKnowledgeBase.search('bottle');
    expect(bottleResults.length).toBeGreaterThan(0);
  });

  it('getRecyclableWaste returns all recyclable categories and excludes Unknown', () => {
    const recyclable = recyclingKnowledgeBase.getRecyclableWaste();
    expect(recyclable.length).toBe(6);
    expect(recyclable.every(k => k.recyclable)).toBe(true);
    expect(recyclable.some(k => k.category === WasteCategory.UNKNOWN)).toBe(false);
  });

  it('getDecompositionTimes returns mapped times for materials', () => {
    const times = recyclingKnowledgeBase.getDecompositionTimes();
    expect(times[WasteCategory.PLASTIC]).toBeDefined();
    expect(times[WasteCategory.GLASS]).toBe('1 million years');
  });
});
