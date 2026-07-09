import { WasteCategory } from '../constants/wasteCategories';
import { WasteItem } from '../types/WasteItem';

/**
 * A personalized sustainability suggestion with context and urgency.
 */
export interface SustainabilitySuggestion {
  /** Unique identifier for the suggestion. */
  id: string;
  /** The suggestion text. */
  text: string;
  /** Category that triggered this suggestion. */
  relatedCategory: WasteCategory;
  /** How many items in this category triggered this suggestion. */
  triggerCount: number;
  /** Urgency level: 'low', 'medium', 'high'. */
  urgency: 'low' | 'medium' | 'high';
  /** Optional external resource link. */
  resourceUrl?: string;
  /** Action type for UI routing (e.g., 'open_link', 'show_tips'). */
  actionType?: string;
}

/**
 * Personalized recommendation based on waste patterns.
 */
export interface PersonalizedRecommendation {
  /** Main suggestion text. */
  suggestion: string;
  /** Supporting details. */
  details: string;
  /** Related waste categories. */
  categories: WasteCategory[];
  /** Estimated impact of following this recommendation. */
  impact: {
    co2SavedKgPerYear?: number;
    wasteReduced?: string;
  };
  /** Actionable steps. */
  steps: string[];
}

/**
 * Recommendation patterns that trigger suggestions.
 *
 * Each pattern defines:
 * - A trigger condition (waste category frequency threshold)
 * - Associated suggestions and resources
 * - Impact metrics
 */
const RECOMMENDATION_PATTERNS: Record<WasteCategory, PersonalizedRecommendation> = {
  [WasteCategory.PLASTIC]: {
    suggestion: 'Reduce plastic consumption',
    details:
      'High plastic waste detected. Switching to reusable containers and bags can significantly reduce plastic consumption.',
    categories: [WasteCategory.PLASTIC],
    impact: {
      co2SavedKgPerYear: 5.5,  // Avoiding 25 kg of plastic per year
      wasteReduced: '25 kg of plastic annually',
    },
    steps: [
      'Switch to reusable shopping bags (keep them in your car/bag)',
      'Use refillable water bottles instead of disposable plastic bottles',
      'Buy products with plastic-free or minimal packaging',
      'Use glass or stainless steel containers for food storage',
      'Decline plastic straws and use metal or bamboo alternatives',
    ],
  },

  [WasteCategory.PAPER]: {
    suggestion: 'Go digital to reduce paper usage',
    details:
      'Consider reducing paper usage by switching to digital documents, cloud storage, and e-receipts.',
    categories: [WasteCategory.PAPER],
    impact: {
      co2SavedKgPerYear: 2.0,  // Avoiding ~10 kg of paper per year
      wasteReduced: '10 kg of paper annually',
    },
    steps: [
      'Go paperless: opt for e-receipts instead of printed ones',
      'Store documents digitally using cloud services',
      'Reuse one-sided printed paper for notes and drafts',
      'Compost paper without ink or plastic coating',
      'Support businesses with digital alternatives',
    ],
  },

  [WasteCategory.GLASS]: {
    suggestion: 'Buy products in glass containers',
    details: 'Glass is infinitely recyclable and can reduce reliance on new raw materials.',
    categories: [WasteCategory.GLASS],
    impact: {
      co2SavedKgPerYear: 1.5,  // Manufacturing new glass from recycled material
      wasteReduced: 'Reduced virgin glass production',
    },
    steps: [
      'Choose beverages in glass bottles when available',
      'Store leftovers in glass containers instead of plastic wrap',
      'Support local businesses that use glass packaging',
      'Return glass bottles to collection points for deposits/rewards',
      'Reuse glass jars for storage and crafts',
    ],
  },

  [WasteCategory.METAL]: {
    suggestion: 'Choose refillable or metal containers',
    details:
      'Metal containers can be used repeatedly or recycled infinitely without losing quality.',
    categories: [WasteCategory.METAL],
    impact: {
      co2SavedKgPerYear: 3.0,  // ~95% energy saved by recycling vs. virgin aluminum
      wasteReduced: '15 kg of metal waste annually',
    },
    steps: [
      'Use refillable metal water bottles and coffee cups',
      'Buy beverages in aluminum cans (highly recyclable)',
      'Choose products with minimal metal packaging',
      'Collect and recycle metal items (cans, aluminum foil)',
      'Support the aluminum recycling industry by proper disposal',
    ],
  },

  [WasteCategory.ORGANIC]: {
    suggestion: 'Start composting to reduce landfill waste',
    details:
      'Food and yard waste produce methane in landfills. Composting reduces emissions and creates nutrients for soil.',
    categories: [WasteCategory.ORGANIC],
    impact: {
      co2SavedKgPerYear: 8.0,  // Methane prevented from decomposing in landfills
      wasteReduced: 'Average 30 kg of organic waste annually',
    },
    steps: [
      'Start a home compost bin (kitchen counter, backyard, or vermicompost)',
      'Compost food scraps: fruits, vegetables, coffee grounds, eggshells',
      'Add dry materials: leaves, cardboard, paper',
      'Use finished compost in gardens, potted plants, or donate to community gardens',
      'Check local composting programs if home composting isn\'t feasible',
    ],
  },

  [WasteCategory.E_WASTE]: {
    suggestion: 'Extend device lifespan and recycle responsibly',
    details:
      'E-waste contains valuable materials and toxic substances. Proper recycling recovers resources while preventing pollution.',
    categories: [WasteCategory.E_WASTE],
    impact: {
      co2SavedKgPerYear: 12.0,  // High impact from e-waste recycling
      wasteReduced: 'Recovery of precious metals and prevention of toxic leachate',
    },
    steps: [
      'Keep devices working longer: repair instead of replace',
      'Use protective cases and screen protectors to extend lifespan',
      'Donate working devices to schools, nonprofits, or friends',
      'Use certified e-waste recyclers (e-Stewards, R2 certified)',
      'Securely erase personal data before recycling',
      'Participate in manufacturer take-back programs',
    ],
  },

  [WasteCategory.UNKNOWN]: {
    suggestion: 'Improve waste sorting accuracy',
    details: 'Better waste identification helps you divert materials to the correct disposal stream.',
    categories: [WasteCategory.UNKNOWN],
    impact: {},
    steps: [
      'Review the waste category guidelines in the app',
      'Take clear photos of waste items for better detection',
      'Check local waste management guidelines for your area',
      'Ask questions when unsure about a material\'s composition',
    ],
  },
};

/**
 * Thresholds for triggering recommendations.
 * If a category exceeds this percentage of total waste, a suggestion is generated.
 */
const RECOMMENDATION_THRESHOLDS: Record<WasteCategory, number> = {
  [WasteCategory.PLASTIC]: 0.25,    // 25% or more
  [WasteCategory.PAPER]: 0.20,     // 20% or more
  [WasteCategory.GLASS]: 0.15,     // 15% or more
  [WasteCategory.METAL]: 0.15,     // 15% or more
  [WasteCategory.ORGANIC]: 0.20,   // 20% or more
  [WasteCategory.E_WASTE]: 0.05,   // 5% or more (rare, high impact)
  [WasteCategory.UNKNOWN]: 0.10,   // 10% or more
};

/**
 * aiRecommendationEngine generates personalized sustainability suggestions based on
 * detected waste patterns.
 *
 * The engine:
 * - Analyzes waste history to identify high-frequency categories
 * - Generates category-specific recommendations
 * - Provides actionable steps and impact metrics
 * - Prioritizes suggestions by urgency and relevance
 *
 * This is used by the app to guide users toward sustainable lifestyle changes
 * tailored to their specific waste patterns.
 */
export const aiRecommendationEngine = {
  /**
   * Generate personalized suggestions based on waste history.
   *
   * @param items Array of recently detected waste items
   * @param limit Maximum number of suggestions to return
   * @returns Array of personalized suggestions, sorted by urgency
   *
   * @example
   * const suggestions = aiRecommendationEngine.generateSuggestions(wasteItems, 3);
   * suggestions.forEach(s => console.log(`[${s.urgency}] ${s.text}`));
   */
  generateSuggestions: (items: WasteItem[], limit: number = 5): SustainabilitySuggestion[] => {
    if (items.length === 0) {
      return [];
    }

    // Count items per category
    const categoryCounts: Record<WasteCategory, number> = {} as Record<WasteCategory, number>;
    items.forEach(item => {
      categoryCounts[item.category] = (categoryCounts[item.category] ?? 0) + 1;
    });

    const suggestions: SustainabilitySuggestion[] = [];
    let suggestionId = 1;

    // Check each category against its threshold
    Object.entries(categoryCounts).forEach(([category, count]) => {
      const categoryEnum = category as WasteCategory;
      const percentage = count / items.length;
      const threshold = RECOMMENDATION_THRESHOLDS[categoryEnum] ?? 0.20;

      if (percentage >= threshold) {
        const pattern = RECOMMENDATION_PATTERNS[categoryEnum];
        if (pattern) {
          // Determine urgency based on how much the category exceeds its threshold
          let urgency: 'low' | 'medium' | 'high' = 'low';
          if (percentage >= threshold * 1.5) {
            urgency = 'high';
          } else if (percentage >= threshold * 1.2) {
            urgency = 'medium';
          }

          suggestions.push({
            id: `rec_${suggestionId++}`,
            text: pattern.suggestion,
            relatedCategory: categoryEnum,
            triggerCount: count,
            urgency,
            actionType: 'show_recommendation',
          });
        }
      }
    });

    // Sort by urgency (high > medium > low) and trigger count
    suggestions.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.triggerCount - a.triggerCount;
    });

    return suggestions.slice(0, limit);
  },

  /**
   * Get detailed recommendation for a specific category.
   *
   * @param category The waste category
   * @returns Detailed personalized recommendation
   *
   * @example
   * const rec = aiRecommendationEngine.getDetailedRecommendation(WasteCategory.PLASTIC);
   * console.log(`${rec.suggestion}\n${rec.details}`);
   * rec.steps.forEach((step, i) => console.log(`${i + 1}. ${step}`));
   */
  getDetailedRecommendation: (category: WasteCategory): PersonalizedRecommendation => {
    return RECOMMENDATION_PATTERNS[category] ?? RECOMMENDATION_PATTERNS[WasteCategory.UNKNOWN];
  },

  /**
   * Get impact estimate for following a recommendation.
   *
   * @param category The waste category
   * @returns Impact metrics (CO2 saved, waste reduced, etc.)
   *
   * @example
   * const impact = aiRecommendationEngine.getRecommendationImpact(WasteCategory.PLASTIC);
   * console.log(`Potential savings: ${impact.co2SavedKgPerYear} kg CO2/year`);
   */
  getRecommendationImpact: (
    category: WasteCategory
  ): {
    co2SavedKgPerYear?: number;
    wasteReduced?: string;
  } => {
    const recommendation = RECOMMENDATION_PATTERNS[category];
    return recommendation?.impact ?? {};
  },

  /**
   * Get all available recommendations.
   *
   * @returns Array of all personalized recommendations
   *
   * @internal
   */
  getAllRecommendations: (): PersonalizedRecommendation[] => {
    return Object.values(RECOMMENDATION_PATTERNS);
  },

  /**
   * Update a recommendation threshold (for customization).
   *
   * @param category The waste category
   * @param newThreshold New percentage threshold (0.0-1.0)
   *
   * @example
   * aiRecommendationEngine.setRecommendationThreshold(WasteCategory.PLASTIC, 0.30);
   *
   * @internal
   */
  setRecommendationThreshold: (category: WasteCategory, newThreshold: number): void => {
    if (newThreshold >= 0 && newThreshold <= 1) {
      RECOMMENDATION_THRESHOLDS[category] = newThreshold;
    }
  },
};
