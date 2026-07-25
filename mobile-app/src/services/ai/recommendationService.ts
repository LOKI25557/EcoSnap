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
  
  // Milestone 3 additions
  /** Specific preparation steps before disposal */
  preparationSteps: string[];
  /** Detailed environmental impact */
  environmentalImpact: string;
  /** Safety warnings mapped from precautions or additional */
  safetyWarnings: string[];
  /** Estimated decomposition time in environment */
  decompositionTime: string;
  /** Carbon footprint reduction stats */
  carbonFootprintReduction: string;
  /** Interesting facts about recycling this material */
  sustainabilityFacts: string[];
}

/**
 * Bin-category mapping.
 */
const WASTE_TO_BIN_MAPPING: Record<WasteCategory, BinRecommendation> = {
  [WasteCategory.PLASTIC]: {
    bin: BinType.BLUE,
    instruction: 'Rinse and place in the blue recycling bin. Remove caps and lids if possible. Plastic bags should not be placed in the bin as they jam recycling equipment.',
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
    preparationSteps: [
      'Empty all contents completely.',
      'Rinse lightly to remove food residue.',
      'Remove non-plastic components (like metal handles).',
      'Crush bottles to save space.'
    ],
    environmentalImpact: 'Reduces ocean pollution and prevents microplastics from entering the food chain.',
    safetyWarnings: ['Do not include hazardous chemical containers.', 'Avoid burning plastic as it releases toxic fumes.'],
    decompositionTime: '20 to 500 years, depending on the structure and material.',
    carbonFootprintReduction: 'Recycling 1 ton of plastic saves about 2 tons of CO2 compared to creating new plastic.',
    sustainabilityFacts: [
      'Only about 9% of all plastic ever made has been recycled.',
      'Recycling a single plastic bottle saves enough energy to light a 60W bulb for 6 hours.'
    ]
  },

  [WasteCategory.PAPER]: {
    bin: BinType.BLUE,
    instruction: 'Flatten and place in the blue recycling bin. Remove plastic windows from envelopes if present. Wet paper or tissue cannot be recycled.',
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
    preparationSteps: [
      'Flatten cardboard boxes completely.',
      'Keep paper dry and clean.',
      'Remove staples and plastic wrap if possible (though some facilities accept staples).'
    ],
    environmentalImpact: 'Conserves forests and significantly reduces water and energy consumption in manufacturing.',
    safetyWarnings: ['Shred sensitive documents before disposal to protect privacy.', 'Ensure paper is not contaminated with hazardous chemicals.'],
    decompositionTime: '2 to 6 weeks in a landfill.',
    carbonFootprintReduction: 'Recycling 1 ton of paper saves about 17 mature trees and 3.3 cubic yards of landfill space.',
    sustainabilityFacts: [
      'Paper can be recycled 5 to 7 times before the fibers become too short.',
      'Recycling paper uses 60% less energy than manufacturing paper from virgin timber.'
    ]
  },

  [WasteCategory.GLASS]: {
    bin: BinType.GREEN,
    instruction: 'Rinse thoroughly and place in the green recycling bin. Keep glass separate if your facility requires it. Broken glass should be wrapped in newspaper.',
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
    preparationSteps: [
      'Rinse lightly to remove sticky residue.',
      'Sort by color if required by local guidelines (clear, green, brown).',
      'Remove metal or plastic caps.'
    ],
    environmentalImpact: 'Glass is 100% recyclable and can be endlessly recycled without loss in quality or purity.',
    safetyWarnings: ['Handle broken glass with extreme care.', 'Do not recycle light bulbs or window glass in standard bins.'],
    decompositionTime: '1 million years (essentially never decomposes).',
    carbonFootprintReduction: 'Every ton of glass recycled saves over a ton of natural resources and reduces CO2 emissions by 315 kg.',
    sustainabilityFacts: [
      'A glass bottle sent to a landfill can take up to a million years to break down.',
      'Energy saved from recycling one glass bottle can power a computer for 25 minutes.'
    ]
  },

  [WasteCategory.METAL]: {
    bin: BinType.BLUE,
    instruction: 'Rinse cans and place in the blue recycling bin. Aluminum and steel are highly recyclable. Crush cans to save space.',
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
    preparationSteps: [
      'Rinse out food or beverage residue.',
      'Crush aluminum cans to save space.',
      'Tuck sharp edges of tin cans inside to prevent injury.'
    ],
    environmentalImpact: 'Significantly reduces the destructive process of mining for raw ore.',
    safetyWarnings: ['Beware of sharp edges when rinsing and crushing cans.', 'Do not recycle aerosol cans unless they are completely empty.'],
    decompositionTime: '50 to 500 years for aluminum; 50 years for tin/steel cans.',
    carbonFootprintReduction: 'Recycling one ton of aluminum saves 14,000 kWh of energy and avoids 40 barrels of oil equivalent in emissions.',
    sustainabilityFacts: [
      'Aluminum can be recycled indefinitely without losing its properties.',
      'An aluminum can recycled today could be back on the shelf as a new can in just 60 days.'
    ]
  },

  [WasteCategory.ORGANIC]: {
    bin: BinType.BROWN,
    instruction: 'Place food scraps and yard waste in the brown composting bin. Suitable for composting programs. Cooked food should only be included if the facility accepts it.',
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
    preparationSteps: [
      'Separate organics from any plastic or non-biodegradable packaging.',
      'Cut larger pieces into smaller chunks to speed up composting.',
      'Keep dairy, meat, and oils out of basic home composts.'
    ],
    environmentalImpact: 'Prevents potent methane gas production in landfills and creates nutrient-rich soil.',
    safetyWarnings: ['Avoid adding pet waste to compost meant for food gardens.', 'Keep compost aerated to prevent bad odors and harmful bacteria.'],
    decompositionTime: '2 weeks to 6 months, depending on conditions and material.',
    carbonFootprintReduction: 'Composting food waste can reduce its carbon footprint by over 50% compared to landfill disposal.',
    sustainabilityFacts: [
      'Food waste in landfills generates methane, a greenhouse gas 25 times more potent than CO2.',
      'Compost acts like a sponge, helping soil retain water and reducing the need for irrigation.'
    ]
  },

  [WasteCategory.E_WASTE]: {
    bin: BinType.E_WASTE_CENTER,
    instruction: 'Take to a certified e-waste recycling center or an electronics retailer with a take-back program. Do not throw in regular trash or recycling bins.',
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
    preparationSteps: [
      'Wipe all personal data completely.',
      'Remove batteries if they are easily accessible.',
      'Gather all related cables and accessories to recycle together.'
    ],
    environmentalImpact: 'Prevents toxic heavy metals (lead, mercury) from leaching into groundwater and recovers precious metals.',
    safetyWarnings: ['Lithium-ion batteries can catch fire if punctured or crushed.', 'Broken screens may contain hazardous materials like mercury.'],
    decompositionTime: 'Does not readily decompose. Plastics take hundreds of years, metals persist indefinitely.',
    carbonFootprintReduction: 'Recycling one million laptops saves the energy equivalent to the electricity used by over 3,500 US homes in a year.',
    sustainabilityFacts: [
      'E-waste is the fastest-growing waste stream in the world.',
      'There is more gold in a ton of cell phones than in a ton of gold ore.'
    ]
  },

  [WasteCategory.UNKNOWN]: {
    bin: BinType.UNKNOWN,
    instruction: 'Uncertain category. When in doubt, place in general waste or consult your local waste guidelines.',
    recyclable: false,
    ecoTips: ['Try to identify the material for proper sorting. Contact local waste management for guidance.'],
    preparationSteps: ['Check for recycling symbols (triangles with numbers).', 'Separate multi-material items if possible.'],
    environmentalImpact: 'Improper disposal can contaminate recycling streams or unnecessarily increase landfill mass.',
    safetyWarnings: ['When in doubt, throw it out (in general waste) to avoid recycling contamination.'],
    decompositionTime: 'Varies wildly from weeks to millennia.',
    carbonFootprintReduction: 'Sorting correctly prevents contamination, which ensures other items can be recycled efficiently.',
    sustainabilityFacts: [
      'Contamination is one of the biggest challenges in recycling, often causing entire batches to go to landfills.'
    ]
  },
};

/**
 * recommendationService provides disposal guidance for waste materials.
 */
export const recommendationService = {
  getBinRecommendation: (category: WasteCategory): BinRecommendation => {
    return WASTE_TO_BIN_MAPPING[category] || WASTE_TO_BIN_MAPPING[WasteCategory.UNKNOWN];
  },

  getEcoTips: (category: WasteCategory): string[] => {
    const recommendation = WASTE_TO_BIN_MAPPING[category];
    return recommendation?.ecoTips ?? WASTE_TO_BIN_MAPPING[WasteCategory.UNKNOWN].ecoTips ?? [];
  },

  getPrecautions: (category: WasteCategory): string[] => {
    const recommendation = WASTE_TO_BIN_MAPPING[category];
    return recommendation?.precautions ?? [];
  },

  isRecyclable: (category: WasteCategory): boolean => {
    const recommendation = WASTE_TO_BIN_MAPPING[category];
    return recommendation?.recyclable ?? false;
  },

  getTips: (userId: string, recentCategories: WasteCategory[] = []): string[] => {
    const tips: string[] = [];
    if (!recentCategories || recentCategories.length === 0) {
      return [
        'Remember to rinse containers before recycling.',
        'Compost your organic waste to reduce landfill usage.',
        'Use reusable bags and containers whenever possible.',
        'Donate working electronics instead of discarding them.',
      ];
    }
    const categoryCount: Record<string, number> = {};
    recentCategories.forEach(category => {
      categoryCount[category] = (categoryCount[category] ?? 0) + 1;
    });
    if ((categoryCount[WasteCategory.PLASTIC] ?? 0) > recentCategories.length * 0.3) {
      tips.push('You have been detecting a lot of plastic. Try using reusable shopping bags and water bottles.');
      tips.push('Avoid single-use plastics by choosing products with minimal packaging.');
    }
    if ((categoryCount[WasteCategory.ORGANIC] ?? 0) > recentCategories.length * 0.2) {
      tips.push('Consider starting a compost bin at home to reduce organic waste.');
      tips.push('Composted waste enriches soil and reduces landfill methane emissions.');
    }
    tips.push('Your waste sorting is helping the environment. Keep up the good work!');
    return tips;
  },

  getAllBinTypes: (): BinType[] => {
    return Object.values(BinType);
  },

  getAllRecommendations: (): Record<WasteCategory, BinRecommendation> => {
    return WASTE_TO_BIN_MAPPING;
  },
};
