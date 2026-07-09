/**
 * Recycling Knowledge Module
 *
 * This module provides comprehensive information about waste materials, disposal methods,
 * recycling instructions, precautions, and eco-friendly tips.
 *
 * The knowledge base is structured to be easily searchable and extendable for future
 * waste categories and regional guidelines.
 */

import { WasteCategory } from '../constants/wasteCategories';

/**
 * Comprehensive knowledge about a waste material or category.
 */
export interface WasteKnowledge {
  /** The waste category. */
  category: WasteCategory;
  /** Human-readable display name. */
  displayName: string;
  /** Detailed description of what falls into this category. */
  description: string;
  /** How the material should be disposed of. */
  disposalMethod: string;
  /** Step-by-step recycling instructions. */
  recyclingInstructions: string[];
  /** Precautions for handlers and the environment. */
  precautions: string[];
  /** Eco-friendly tips and alternatives. */
  ecoTips: string[];
  /** Estimated decomposition time (if applicable). */
  decompositionTime?: string;
  /** Common examples of this waste type. */
  commonExamples: string[];
  /** Whether this material is recyclable. */
  recyclable: boolean;
  /** Where it typically ends up if not recycled. */
  landfillImpact: string;
  /** Percentage of this material that is typically recycled (global average). */
  typicalRecyclingRate?: number;
}

/**
 * Comprehensive knowledge base for all waste categories.
 */
const RECYCLING_KNOWLEDGE_BASE: Record<WasteCategory, WasteKnowledge> = {
  [WasteCategory.PLASTIC]: {
    category: WasteCategory.PLASTIC,
    displayName: 'Plastic',
    description:
      'Plastic materials including bottles, bags, containers, packaging, and other synthetic polymers. ' +
      'Includes PET (1), HDPE (2), PVC (3), LDPE (4), PP (5), and PS (6) plastics.',
    disposalMethod:
      'Sort by plastic type if your facility requires it. Place clean, rinsed plastics in the blue recycling bin. ' +
      'Do not include plastic bags unless your facility explicitly accepts them.',
    recyclingInstructions: [
      'Rinse containers to remove food residue',
      'Remove lids and caps if easy to separate',
      'Flatten bottles to save space in the bin',
      'Check the recycling symbol (1-7) and verify it is accepted locally',
      'Place in the blue recycling bin on collection day',
      'Keep plastic bags separate as they jam equipment',
    ],
    precautions: [
      'Do not include contaminated plastics or those with hazardous materials',
      'Avoid mixing plastic bags with other recyclables',
      'Never include medical or biohazard plastic waste',
      'Plastic wrap and film are not usually recyclable; compost or reuse',
    ],
    ecoTips: [
      'Use reusable shopping bags, water bottles, and containers',
      'Choose products with minimal or plastic-free packaging',
      'Refuse single-use plastics: bags, straws, cups, cutlery',
      'Buy in bulk to reduce packaging waste',
      'Support companies with sustainable packaging practices',
    ],
    commonExamples: [
      'Plastic bottles (soda, water, milk)',
      'Plastic bags and packaging',
      'Food containers and takeout boxes',
      'Plastic wrap and film',
      'Toys and household items',
    ],
    recyclable: true,
    landfillImpact:
      'Plastic takes 450-1000 years to decompose. In landfills, it does not biodegrade and can leach toxins ' +
      'into groundwater. Ocean plastic harms marine life and breaks into microplastics that enter the food chain.',
    decompositionTime: '450-1000 years',
    typicalRecyclingRate: 32,  // Typical global average is around 9-32%
  },

  [WasteCategory.PAPER]: {
    category: WasteCategory.PAPER,
    displayName: 'Paper & Cardboard',
    description:
      'Paper and cardboard materials including newspapers, magazines, office paper, cardboard boxes, ' +
      'paper bags, and packaging. Includes Cardboard which is a thicker form of paper.',
    disposalMethod:
      'Flatten cardboard boxes and break them down. Place paper and cardboard in the blue recycling bin. ' +
      'Keep dry and separate from contaminated paper.',
    recyclingInstructions: [
      'Flatten cardboard boxes to fit in the bin',
      'Remove or recycle any plastic windows from envelopes',
      'Tear up or cut very large pieces for easier handling',
      'Remove staples and tape if not too labor-intensive',
      'Ensure paper is dry (wet paper cannot be recycled)',
      'Place in the blue recycling bin on collection day',
    ],
    precautions: [
      'Do not include wet, greasy, or waxed paper',
      'Avoid paper with heavy plastic coatings or lamination',
      'Paper towels, tissues, and napkins should go to general waste',
      'Do not include paper with food residue (pizza boxes, greasy packaging)',
      'Shredded paper is difficult to recycle; compost if possible',
    ],
    ecoTips: [
      'Go digital: use electronic documents instead of printing',
      'Reuse paper by printing on the blank side',
      'Compost paper without ink or plastic coating',
      'Choose recycled paper products',
      'Opt out of junk mail and promotional materials',
    ],
    commonExamples: [
      'Newspapers and magazines',
      'Cardboard boxes and shipping materials',
      'Office paper and copy paper',
      'Paper bags and envelopes',
      'Cereal boxes and food packaging',
    ],
    recyclable: true,
    landfillImpact:
      'Paper decomposes in 2-6 weeks in the right conditions but can take much longer in anaerobic landfill conditions. ' +
      'Recycling paper saves trees and reduces water usage and chemical pollution from paper manufacturing.',
    decompositionTime: '2-6 weeks (optimal), years (landfill)',
    typicalRecyclingRate: 68,  // Paper/cardboard has higher recycling rates
  },

  [WasteCategory.GLASS]: {
    category: WasteCategory.GLASS,
    displayName: 'Glass',
    description:
      'Glass bottles, jars, and containers from beverages, food, and household products. ' +
      'Includes clear, brown, and green glass.',
    disposalMethod:
      'Rinse thoroughly and place in the green recycling bin. If broken, wrap in newspaper to protect handlers. ' +
      'Glass is infinitely recyclable without losing quality.',
    recyclingInstructions: [
      'Rinse bottles and jars to remove liquid and food residue',
      'Remove and recycle or compost lids and caps',
      'Wrap broken glass in newspaper or thick plastic to prevent cuts',
      'Place in the green recycling bin',
      'Keep glass separate from other recyclables if instructed',
      'Do not mix different colors of glass if your facility requires sorting',
    ],
    precautions: [
      'Do not include ceramics, pottery, or tempered glass',
      'Avoid breaking glass intentionally; whole bottles are safer to handle',
      'Wrap broken glass to prevent injuries to handlers and equipment',
      'Never include light bulbs, mirrors, or window panes',
      'Do not include dishes, plates, or cookware',
    ],
    ecoTips: [
      'Use reusable glass containers for food storage',
      'Buy beverages in glass bottles when available',
      'Reuse glass jars for storage, gifting, or crafts',
      'Support glass collection and recycling programs',
      'Choose products with glass packaging over plastic',
    ],
    commonExamples: [
      'Beverage bottles (beer, wine, juice, water)',
      'Food jars (pasta sauce, peanut butter, jam)',
      'Glass containers and storage jars',
      'Canned goods (tin, not glass)',
    ],
    recyclable: true,
    landfillImpact:
      'Glass takes 1 million years to decompose in nature. In landfills, it occupies space and does not break down. ' +
      'Recycled glass reduces the need to mine raw materials and saves energy in manufacturing.',
    decompositionTime: '1 million years',
    typicalRecyclingRate: 31,
  },

  [WasteCategory.METAL]: {
    category: WasteCategory.METAL,
    displayName: 'Metal',
    description:
      'Metal containers and items including aluminum cans, steel cans, metal foil, and other metal objects. ' +
      'Aluminum and steel are the most commonly recycled metals.',
    disposalMethod:
      'Rinse and place in the blue recycling bin. Crush cans to save space. Metal is highly recyclable and valuable.',
    recyclingInstructions: [
      'Rinse cans and containers to remove liquid and food residue',
      'Crush aluminum cans to save space in the bin',
      'Remove labels if instructed by your local facility',
      'Ensure sharp edges are not exposed to prevent cuts',
      'Place in the blue recycling bin on collection day',
      'Separate ferrous (steel) and non-ferrous (aluminum) metals if required',
    ],
    precautions: [
      'Do not include heavily rusted or corroded metals that cannot be identified',
      'Avoid aerosol cans unless completely empty and punctured safely',
      'Never include metal with hazardous contents (e.g., paint cans)',
      'Keep sharp edges away from handlers',
    ],
    ecoTips: [
      'Recycling aluminum saves 95% of the energy needed to produce new aluminum',
      'Choose products in aluminum cans (highly recyclable)',
      'Use refillable metal containers and bottles',
      'Support local metal scrap collection initiatives',
      'Donate or sell metal items instead of discarding',
    ],
    commonExamples: [
      'Aluminum beverage cans',
      'Steel food cans (vegetables, soups, beans)',
      'Aluminum foil and containers',
      'Metal lids and caps',
      'Metal household items',
    ],
    recyclable: true,
    landfillImpact:
      'Aluminum takes 80-200 years to decompose. Recycling aluminum saves significant energy and raw material extraction. ' +
      'Aluminum ore mining is environmentally intensive and produces toxic byproducts.',
    decompositionTime: '80-200 years',
    typicalRecyclingRate: 50,
  },

  [WasteCategory.ORGANIC]: {
    category: WasteCategory.ORGANIC,
    displayName: 'Organic & Food Waste',
    description:
      'Food scraps, vegetable and fruit waste, yard waste (leaves, grass), wood, and other biodegradable materials. ' +
      'These materials can be composted to create nutrient-rich soil.',
    disposalMethod:
      'Place in the brown composting bin or a home compost pile. Do not include meat, fish, or oils unless ' +
      'your facility explicitly accepts them.',
    recyclingInstructions: [
      'Collect fruit and vegetable scraps, coffee grounds, eggshells',
      'Add yard waste: leaves, grass clippings, small branches',
      'Layer green and brown materials for optimal composting',
      'Keep a balance: ~2 parts brown to 1 part green',
      'Maintain moisture (like a wrung-out sponge) and aeration',
      'Turn pile regularly or use a compost bin',
      'Use finished compost in gardens and potted plants',
    ],
    precautions: [
      'Do not include meat, fish, bones, or dairy in community compost',
      'Avoid oils, fats, and greasy foods',
      'Do not compost diseased plants or invasive weeds',
      'Exclude pet waste and cooked foods (unless home composting)',
      'Remove packaging and non-compostable items from food waste',
    ],
    ecoTips: [
      'Start a home compost bin to reduce landfill waste significantly',
      'Use compost to enrich garden soil naturally',
      'Composting reduces methane emissions from landfills',
      'Save money on soil amendments by making your own compost',
      'Share compost with neighbors or community gardens',
    ],
    commonExamples: [
      'Fruit and vegetable scraps',
      'Coffee grounds and tea bags',
      'Eggshells and nutshells',
      'Grass clippings and leaves',
      'Paper and cardboard (without ink)',
    ],
    recyclable: true,
    landfillImpact:
      'Organic waste in landfills decomposes anaerobically, producing methane (21-28x more potent than CO2). ' +
      'Composting reduces this impact by 50-60% and returns nutrients to soil naturally.',
    decompositionTime: '1-12 months (compost), years (landfill)',
    typicalRecyclingRate: 35,  // Composting/organic recovery rate
  },

  [WasteCategory.E_WASTE]: {
    category: WasteCategory.E_WASTE,
    displayName: 'E-Waste & Electronics',
    description:
      'Electronic devices and components including phones, laptops, batteries, circuit boards, and appliances. ' +
      'E-waste contains valuable materials and toxic substances requiring specialized handling.',
    disposalMethod:
      'Take to a certified e-waste recycling facility or participate in manufacturer take-back programs. ' +
      'Never throw electronics in regular trash or recycling bins.',
    recyclingInstructions: [
      'Collect old electronics (phones, laptops, tablets, etc.)',
      'Find a certified e-waste recycler using online directories',
      'Schedule pickup or drop-off at a certified facility',
      'Back up and securely erase personal data before recycling',
      'Keep batteries separated from other e-waste if possible',
      'Obtain a certificate of recycling for compliance documentation',
    ],
    precautions: [
      'Never dispose of electronics in regular waste or curbside recycling',
      'Remove personal data and SIM cards before recycling',
      'Handle devices carefully to avoid breaking internal components and releasing toxins',
      'Do not disassemble devices; leave it to certified recyclers',
      'Keep damaged batteries away from other materials',
    ],
    ecoTips: [
      'Donate working devices to schools, nonprofits, or low-income programs',
      'Repair devices instead of replacing them when possible',
      'Use protective cases and screen protectors to extend lifespan',
      'E-waste recycling recovers valuable metals like gold, copper, and platinum',
      'Support companies with trade-in and take-back programs',
    ],
    commonExamples: [
      'Smartphones and tablets',
      'Laptops and computers',
      'Batteries and power supplies',
      'Monitors and screens',
      'Appliances and small electronics',
    ],
    recyclable: true,
    landfillImpact:
      'E-waste contains toxic materials like lead, mercury, and cadmium that can leach into groundwater. ' +
      'Improper disposal pollutes soil and water. Responsible recycling recovers ~98% of valuable materials.',
    typicalRecyclingRate: 20,  // E-waste recovery is lower globally
  },

  [WasteCategory.UNKNOWN]: {
    category: WasteCategory.UNKNOWN,
    displayName: 'Unknown',
    description: 'Waste materials that could not be accurately identified or classified.',
    disposalMethod: 'When in doubt, place in general waste or contact your local waste management for guidance.',
    recyclingInstructions: [
      'Try to identify the primary material (plastic, paper, metal, or glass)',
      'Check the product packaging for material information',
      'Consult your local recycling guidelines',
      'Contact local waste management if still uncertain',
    ],
    precautions: [
      'Do not mix unidentified materials with known recyclables',
      'Be cautious with unknown composites that may contain hazardous materials',
    ],
    ecoTips: [
      'Improve waste sorting by taking clear photos for detection',
      'Read product labels to understand material composition',
      'Ask waste management staff for clarification on local guidelines',
    ],
    commonExamples: [
      'Mixed material products',
      'Laminated or composite materials',
      'Items without clear labeling',
    ],
    recyclable: false,
    landfillImpact: 'Misclassified waste may contaminate recycling streams or end up in landfills.',
  },
};

/**
 * recyclingKnowledgeBase provides comprehensive, searchable knowledge about waste materials,
 * recycling practices, and environmental impact.
 *
 * The knowledge base is:
 * - Comprehensive: covers all major waste categories
 * - Searchable: can be filtered by category or keyword
 * - Extendable: new materials and regional guidelines can be added
 * - Educational: includes decomposition times, recycling rates, and environmental impact
 */
export const recyclingKnowledgeBase = {
  /**
   * Get knowledge for a specific waste category.
   *
   * @param category The waste category
   * @returns Comprehensive knowledge about that category
   *
   * @example
   * const knowledge = recyclingKnowledgeBase.getKnowledge(WasteCategory.PLASTIC);
   * console.log(knowledge.disposalMethod);
   */
  getKnowledge: (category: WasteCategory): WasteKnowledge => {
    return RECYCLING_KNOWLEDGE_BASE[category] ?? RECYCLING_KNOWLEDGE_BASE[WasteCategory.UNKNOWN];
  },

  /**
   * Get all available knowledge entries.
   *
   * @returns Array of all waste knowledge entries
   */
  getAllKnowledge: (): WasteKnowledge[] => {
    return Object.values(RECYCLING_KNOWLEDGE_BASE);
  },

  /**
   * Search for knowledge by category display name or keyword.
   *
   * @param query Search term (e.g., 'plastic', 'compost', 'aluminum')
   * @returns Matching knowledge entries
   *
   * @example
   * const results = recyclingKnowledgeBase.search('compost');
   * results.forEach(k => console.log(k.displayName));
   */
  search: (query: string): WasteKnowledge[] => {
    const lowerQuery = query.toLowerCase();
    return Object.values(RECYCLING_KNOWLEDGE_BASE).filter(
      knowledge =>
        knowledge.displayName.toLowerCase().includes(lowerQuery) ||
        knowledge.description.toLowerCase().includes(lowerQuery) ||
        knowledge.commonExamples.some(example => example.toLowerCase().includes(lowerQuery)) ||
        knowledge.ecoTips.some(tip => tip.toLowerCase().includes(lowerQuery))
    );
  },

  /**
   * Get knowledge entries that are recyclable.
   *
   * @returns Array of recyclable waste categories
   */
  getRecyclableWaste: (): WasteKnowledge[] => {
    return Object.values(RECYCLING_KNOWLEDGE_BASE).filter(k => k.recyclable);
  },

  /**
   * Get decomposition times for all materials.
   *
   * @returns Map of category to decomposition time
   *
   * @example
   * const times = recyclingKnowledgeBase.getDecompositionTimes();
   * Object.entries(times).forEach(([cat, time]) => console.log(`${cat}: ${time}`));
   */
  getDecompositionTimes: (): Record<string, string | undefined> => {
    const times: Record<string, string | undefined> = {};
    Object.entries(RECYCLING_KNOWLEDGE_BASE).forEach(([category, knowledge]) => {
      times[category] = knowledge.decompositionTime;
    });
    return times;
  },

  /**
   * Add or update knowledge for a category (for customization/regional updates).
   *
   * @param category The waste category
   * @param knowledge Updated knowledge object
   *
   * @example
   * recyclingKnowledgeBase.updateKnowledge(WasteCategory.PLASTIC, customKnowledge);
   *
   * @internal
   */
  updateKnowledge: (category: WasteCategory, knowledge: WasteKnowledge): void => {
    RECYCLING_KNOWLEDGE_BASE[category] = knowledge;
  },
};
