import { WasteCategory } from '../../constants/wasteCategories';

/**
 * Bin type enumeration for waste disposal.
 */
export enum BinType {
  BLUE = 'Blue Bin',
  GREEN = 'Green Bin',
  BROWN = 'Brown Bin',
  HAZARDOUS = 'Hazardous Waste',
  E_WASTE_CENTER = 'E-Waste Collection Center',
  UNKNOWN = 'General Waste',
}

/**
 * Disposal instruction for a waste category.
 */
export interface BinRecommendation {
  /** The type of bin or disposal location. */
  bin: BinType;
  /** Specific disposal and preparation instructions. */
  instruction: string;
  /** Whether the waste is recyclable. */
  recyclable: boolean;
  /** Additional preparation steps or precautions. */
  precautions?: string[];
  /** Eco-friendly alternatives or best practices. */
  ecoTips?: string[];
}

/**
 * Bin-category mapping.
 *
 * Maps each WasteCategory to its disposal bin and handling instructions.
 *
 * Bin color scheme (real-world standard):
 * - Blue: Recyclable materials (plastic, paper, cardboard, metal)
 * - Green: Organic waste (food scraps, yard clippings)
 * - Brown: Organic compostables
 * - Hazardous: Batteries and toxic materials
 * - E-Waste: Electronic devices
 */
const WASTE_TO_BIN_MAPPING: Record<WasteCategory, BinRecommendation> = {
  [WasteCategory.PLASTIC]: {
    bin: BinType.BLUE,
    instruction:
      'Rinse and place in the blue recycling bin. Remove caps and lids if possible. ' +
      'Plastic bags should not be placed in the bin as they jam recycling equipment.',
    recyclable: true,
    precautions: [
      'Do not include contaminated plastics (e.g., with food residue).',
      'Avoid mixing plastic bags with other recyclables.',
    ],
    ecoTips: [
      'Use reusable shopping bags instead of single-use plastic.',
      'Choose products with minimal plastic packaging.',
      'Consider refilling containers instead of buying new ones.',
    ],
  },

  [WasteCategory.PAPER]: {
    bin: BinType.BLUE,
    instruction:
      'Flatten and place in the blue recycling bin. Remove plastic windows from envelopes ' +
      'if present. Wet paper or tissue cannot be recycled.',
    recyclable: true,
    precautions: [
      'Do not include wet, greasy, or waxed paper.',
      'Remove plastic or metal components from paper packaging.',
      'Paper towels and tissues should go to general waste.',
    ],
    ecoTips: [
      'Go digital: reduce paper usage by using electronic documents.',
      'Reuse paper for printing on the blank side.',
      'Compost paper without ink if possible.',
    ],
  },

  [WasteCategory.GLASS]: {
    bin: BinType.GREEN,
    instruction:
      'Rinse thoroughly and place in the green recycling bin. Keep glass separate if your ' +
      'facility requires it. Broken glass should be wrapped in newspaper.',
    recyclable: true,
    precautions: [
      'Wrap broken glass to prevent injuries to handlers.',
      'Remove labels if instructed by your recycling facility.',
      'Do not include ceramics, pottery, or tempered glass.',
      'Keep glass separate from other recyclables to prevent contamination.',
    ],
    ecoTips: [
      'Use reusable glass containers for food storage.',
      'Buy products in glass containers for easier recycling.',
      'Support glass collection programs in your community.',
    ],
  },

  [WasteCategory.METAL]: {
    bin: BinType.BLUE,
    instruction:
      'Rinse cans and place in the blue recycling bin. Aluminum and steel are highly recyclable. ' +
      'Crush cans to save space.',
    recyclable: true,
    precautions: [
      'Ensure cans are rinsed to remove food residue.',
      'Do not include heavily rusted or corroded metals.',
      'Keep sharp edges away from handlers.',
    ],
    ecoTips: [
      'Recycling aluminum saves 95% of the energy needed to produce new aluminum.',
      'Use refillable metal containers and bottles.',
      'Support local metal scrap collection initiatives.',
    ],
  },

  [WasteCategory.ORGANIC]: {
    bin: BinType.BROWN,
    instruction:
      'Place food scraps and yard waste in the brown composting bin. Suitable for composting programs. ' +
      'Cooked food should only be included if the facility accepts it.',
    recyclable: true,
    precautions: [
      'Do not include meat, fish, or oils in community compost.',
      'Avoid diseased plants and invasive weeds.',
      'Remove non-compostable packaging from food items.',
    ],
    ecoTips: [
      'Start a home compost bin to reduce landfill waste.',
      'Use homemade compost to enrich garden soil.',
      'Composting reduces methane emissions from landfills.',
    ],
  },

  [WasteCategory.E_WASTE]: {
    bin: BinType.E_WASTE_CENTER,
    instruction:
      'Take to a certified e-waste recycling center or an electronics retailer with a ' +
      'take-back program. Do not throw in regular trash or recycling bins.',
    recyclable: true,
    precautions: [
      'Never dispose of electronics in regular waste.',
      'Remove personal data before discarding devices.',
      'Keep batteries separate from other e-waste if possible.',
      'Handle devices carefully to avoid breaking internal components.',
    ],
    ecoTips: [
      'Donate working electronics to extend their lifespan.',
      'Repair devices instead of replacing them when possible.',
      'E-waste recycling recovers valuable metals like gold and copper.',
      'Secure erase data before recycling old devices.',
    ],
  },

  [WasteCategory.UNKNOWN]: {
    bin: BinType.UNKNOWN,
    instruction: 'Uncertain category. When in doubt, place in general waste or consult your local waste guidelines.',
    recyclable: false,
    ecoTips: ['Try to identify the material for proper sorting. Contact local waste management for guidance.'],
  },
};

/**
 * recommendationService provides disposal guidance for waste materials.
 *
 * The service:
 * - Maps detected waste categories to disposal bins
 * - Provides step-by-step disposal instructions
 * - Offers precautions to protect handlers and facilities
 * - Suggests eco-friendly alternatives and best practices
 *
 * This service is used by the app to guide users on proper waste segregation
 * and to promote sustainable disposal practices.
 */
export const recommendationService = {
  /**
   * Get bin recommendation for a waste category.
   *
   * @param category The detected waste category
   * @returns Bin recommendation with disposal instructions and tips
   *
   * @example
   * const recommendation = recommendationService.getBinRecommendation(WasteCategory.PLASTIC);
   * console.log(`Dispose in ${recommendation.bin}`);
   * console.log(recommendation.instruction);
   */
  getBinRecommendation: (category: WasteCategory): BinRecommendation => {
    return WASTE_TO_BIN_MAPPING[category] || WASTE_TO_BIN_MAPPING[WasteCategory.UNKNOWN];
  },

  /**
   * Get disposal tips for a waste category.
   *
   * @param category The detected waste category
   * @returns Array of eco-friendly tips and best practices
   */
  getEcoTips: (category: WasteCategory): string[] => {
    const recommendation = WASTE_TO_BIN_MAPPING[category];
    return recommendation?.ecoTips ?? WASTE_TO_BIN_MAPPING[WasteCategory.UNKNOWN].ecoTips ?? [];
  },

  /**
   * Get precautions for handling a waste category.
   *
   * @param category The detected waste category
   * @returns Array of safety and environmental precautions
   */
  getPrecautions: (category: WasteCategory): string[] => {
    const recommendation = WASTE_TO_BIN_MAPPING[category];
    return recommendation?.precautions ?? [];
  },

  /**
   * Check if a waste category is recyclable.
   *
   * @param category The waste category to check
   * @returns True if the waste is recyclable, false otherwise
   */
  isRecyclable: (category: WasteCategory): boolean => {
    const recommendation = WASTE_TO_BIN_MAPPING[category];
    return recommendation?.recyclable ?? false;
  },

  /**
   * Get personalized recommendations based on detected waste history.
   *
   * This function can be extended to:
   * - Track user detection history
   * - Identify patterns (e.g., high plastic consumption)
   * - Suggest targeted eco-friendly alternatives
   * - Gamify waste reduction challenges
   *
   * @param userId User identifier
   * @param recentCategories Array of recently detected waste categories
   * @returns Array of personalized recommendation strings
   *
   * @example
   * const tips = await recommendationService.getTips('user123', [
   *   WasteCategory.PLASTIC,
   *   WasteCategory.PLASTIC,
   *   WasteCategory.ORGANIC,
   * ]);
   */
  getTips: (userId: string, recentCategories: WasteCategory[] = []): string[] => {
    // TODO: Extend with persistent user tracking:
    // 1. Fetch user's waste history from database
    // 2. Compute category frequency and trends
    // 3. Generate personalized recommendations based on high-frequency categories
    // 4. Consider user preferences and previous engagement

    const tips: string[] = [];

    // If no history, provide general tips
    if (!recentCategories || recentCategories.length === 0) {
      return [
        'Remember to rinse containers before recycling.',
        'Compost your organic waste to reduce landfill usage.',
        'Use reusable bags and containers whenever possible.',
        'Donate working electronics instead of discarding them.',
      ];
    }

    // Count category frequencies
    const categoryCount: Record<string, number> = {};
    recentCategories.forEach(category => {
      categoryCount[category] = (categoryCount[category] ?? 0) + 1;
    });

    // If high plastic usage, suggest plastic reduction
    if ((categoryCount[WasteCategory.PLASTIC] ?? 0) > recentCategories.length * 0.3) {
      tips.push('You have been detecting a lot of plastic. Try using reusable shopping bags and water bottles.');
      tips.push('Avoid single-use plastics by choosing products with minimal packaging.');
    }

    // If high organic waste, suggest composting
    if ((categoryCount[WasteCategory.ORGANIC] ?? 0) > recentCategories.length * 0.2) {
      tips.push('Consider starting a compost bin at home to reduce organic waste.');
      tips.push('Composted waste enriches soil and reduces landfill methane emissions.');
    }

    // General sustainability reminder
    tips.push('Your waste sorting is helping the environment. Keep up the good work!');

    return tips;
  },

  /**
   * Get all available bin types.
   *
   * @returns Array of all BinType enum values
   *
   * @internal
   */
  getAllBinTypes: (): BinType[] => {
    return Object.values(BinType);
  },

  /**
   * Get all waste categories and their recommendations.
   *
   * @returns Object mapping WasteCategory to BinRecommendation
   *
   * @internal
   */
  getAllRecommendations: (): Record<WasteCategory, BinRecommendation> => {
    return WASTE_TO_BIN_MAPPING;
  },
};
