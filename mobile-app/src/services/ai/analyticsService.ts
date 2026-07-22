import { WasteCategory } from '../../constants/wasteCategories';
import { WasteItem } from '../../types/WasteItem';
import { recommendationService } from './recommendationService';

/**
 * Environmental impact coefficients (configurable per category).
 *
 * These values represent estimated environmental impact reduction per unit of waste
 * properly disposed or recycled, based on life-cycle assessment studies.
 *
 * Formulas are simplified for mobile app use but can be refined with regional data.
 */
const IMPACT_COEFFICIENTS = {
  // CO2 savings in kg per item (rough averages)
  [WasteCategory.PLASTIC]: {
    co2Saved: 0.15,          // ~150g CO2 saved per plastic item recycled vs. landfill
    weightKg: 0.025,         // ~25g average plastic item
    landfillMethaneFactor: 1.0,
  },
  [WasteCategory.PAPER]: {
    co2Saved: 0.08,          // ~80g CO2 saved per paper item
    weightKg: 0.010,         // ~10g average paper item
    landfillMethaneFactor: 0.8,
  },
  [WasteCategory.GLASS]: {
    co2Saved: 0.05,          // ~50g CO2 saved per glass item (mostly avoided manufacturing)
    weightKg: 0.400,         // ~400g average glass item
    landfillMethaneFactor: 0.0,  // Glass does not degrade in landfill
  },
  [WasteCategory.METAL]: {
    co2Saved: 0.12,          // ~120g CO2 saved (aluminum recycling saves 95% energy)
    weightKg: 0.010,         // ~10g average metal can
    landfillMethaneFactor: 0.5,
  },
  [WasteCategory.ORGANIC]: {
    co2Saved: 0.20,          // ~200g CO2 saved by composting vs. landfill methane
    weightKg: 0.150,         // ~150g average food waste
    landfillMethaneFactor: 2.5,  // High methane production in landfills
  },
  [WasteCategory.E_WASTE]: {
    co2Saved: 0.50,          // ~500g CO2 saved by proper e-waste handling
    weightKg: 0.200,         // ~200g average e-waste item
    landfillMethaneFactor: 1.5,  // Potential toxic leachate prevention
  },
  [WasteCategory.UNKNOWN]: {
    co2Saved: 0.05,
    weightKg: 0.050,
    landfillMethaneFactor: 1.0,
  },
};

/**
 * Gamification score multipliers.
 *
 * Different waste types earn different points based on environmental impact and
 * rarity of proper disposal (e.g., e-waste is harder to dispose properly).
 */
const SCORE_MULTIPLIERS: Record<WasteCategory, number> = {
  [WasteCategory.PLASTIC]: 10,      // Common, moderate impact
  [WasteCategory.PAPER]: 5,         // Common, low impact
  [WasteCategory.GLASS]: 8,         // Heavy but low environmental impact
  [WasteCategory.METAL]: 12,        // High recyclability value
  [WasteCategory.ORGANIC]: 15,      // Reduces landfill methane
  [WasteCategory.E_WASTE]: 50,      // Rare proper disposal, high impact
  [WasteCategory.UNKNOWN]: 1,       // Low confidence, minimal points
};

/**
 * User impact report with aggregated environmental metrics.
 */
export interface UserImpactReport {
  /** Total waste items detected and sorted. */
  totalItemsProcessed: number;
  /** Total waste diverted from landfill (kg). */
  wasteDivertedKg: number;
  /** Estimated CO2 equivalent saved (kg). */
  co2SavedKg: number;
  /** Total points earned from waste sorting. */
  totalPointsEarned: number;
  /** Percentage of recyclable waste sorted. */
  recyclingRate: number;
  /** Overall sustainability score (0-100). */
  sustainabilityScore: number;
  /** Breakdown by category. */
  categoryBreakdown: Record<WasteCategory, CategoryStats>;
  /** Estimated landfill methane prevented (kg CO2e). */
  methanePrevented: number;
  /** Equivalent trees planted (for CO2 offset). */
  treesPlantedEquivalent: number;
  /** Recommended next actions. */
  recommendations: string[];
}

/**
 * Per-category statistics in the user impact report.
 */
interface CategoryStats {
  count: number;
  weight: number;
  co2Saved: number;
  points: number;
  percentage: number;
}

/**
 * analyticsService tracks and reports on environmental impact of waste sorting.
 *
 * The service:
 * - Aggregates waste item history into environmental metrics
 * - Calculates CO2 savings based on recycling/composting vs. landfill
 * - Provides gamified sustainability scores
 * - Generates user impact reports and recommendations
 *
 * All calculations use configurable coefficients that can be updated with
 * regional environmental data or new research findings.
 */
export const analyticsService = {
  /**
   * Calculate total CO2 saved for a list of waste items.
   *
   * @param items Array of detected waste items
   * @returns Estimated CO2 savings in kilograms
   *
   * @example
   * const co2 = analyticsService.calculateCO2Saved(wasteItems);
   * console.log(`You've saved ${co2.toFixed(2)} kg of CO2!`);
   */
  calculateCO2Saved: (items: WasteItem[]): number => {
    return items.reduce((total, item) => {
      const coeff = IMPACT_COEFFICIENTS[item.category];
      return total + coeff.co2Saved * (item.confidenceScore > 0 ? item.confidenceScore : 1.0);
    }, 0);
  },

  /**
   * Calculate total waste diverted from landfill.
   *
   * @param items Array of detected waste items
   * @returns Total waste weight in kilograms
   *
   * @example
   * const waste = analyticsService.calculateWasteDiverted(wasteItems);
   * console.log(`${waste.toFixed(2)} kg of waste diverted from landfill`);
   */
  calculateWasteDiverted: (items: WasteItem[]): number => {
    return items.reduce((total, item) => {
      const coeff = IMPACT_COEFFICIENTS[item.category];
      return total + coeff.weightKg;
    }, 0);
  },

  /**
   * Calculate a gamified sustainability score (0-100).
   *
   * The score is based on:
   * - Frequency of waste sorting (more items = higher score)
   * - Diversity of categories handled
   * - Detection confidence (higher confidence = more points)
   * - Environmental impact (high-impact items like e-waste earn more points)
   *
   * @param items Array of detected waste items
   * @returns Sustainability score from 0 to 100
   *
   * @example
   * const score = analyticsService.calculateSustainabilityScore(wasteItems);
   * console.log(`Sustainability score: ${score}/100`);
   */
  calculateSustainabilityScore: (items: WasteItem[]): number => {
    if (items.length === 0) return 0;

    // Base score from total items (max 30 points for 30+ items)
    const frequencyScore = Math.min(items.length * 1.0, 30);

    // Bonus for category diversity (max 20 points)
    const uniqueCategories = new Set(items.map(item => item.category)).size;
    const diversityBonus = Math.min(uniqueCategories * 3.33, 20);

    // Points from actual waste sorting (max 50 points)
    const wastePoints = items.reduce((total, item) => {
      const multiplier = SCORE_MULTIPLIERS[item.category] ?? 1;
      const confidence = item.confidenceScore > 0 ? item.confidenceScore : 1.0;
      return total + multiplier * confidence;
    }, 0);

    // Normalize waste points (assuming ~100 optimal for 10 items average)
    const normalizedWastePoints = Math.min((wastePoints / (items.length * 5)) * 50, 50);

    // Combine scores
    const totalScore = frequencyScore + diversityBonus + normalizedWastePoints;
    return Math.min(Math.round(totalScore), 100);
  },

  /**
   * Calculate the recycling rate.
   *
   * @param items Array of detected waste items
   * @returns Percentage of recyclable items (0-100)
   *
   * @example
   * const rate = analyticsService.calculateRecyclingRate(wasteItems);
   * console.log(`Recycling rate: ${rate}%`);
   */
  calculateRecyclingRate: (items: WasteItem[]): number => {
    if (items.length === 0) return 0;

    const recyclableCount = items.filter(item => recommendationService.isRecyclable(item.category)).length;
    return Math.round((recyclableCount / items.length) * 100);
  },

  /**
   * Generate a comprehensive user impact report.
   *
   * @param userId User identifier
   * @param items Array of all detected waste items for the user
   * @returns Structured impact report with all metrics and recommendations
   *
   * @example
   * const report = await analyticsService.getUserImpact('user123', items);
   * console.log(`Total impact: ${report.co2SavedKg} kg CO2, ${report.totalPointsEarned} points`);
   */
  getUserImpact: (userId: string, items: WasteItem[] = []): UserImpactReport => {
    const co2Saved = analyticsService.calculateCO2Saved(items);
    const wasteDiverted = analyticsService.calculateWasteDiverted(items);
    const sustainabilityScore = analyticsService.calculateSustainabilityScore(items);
    const recyclingRate = analyticsService.calculateRecyclingRate(items);

    // Calculate methane prevented (approximate: 1 kg landfill waste = 0.25 kg CH4 equivalent over 100 years)
    const methaneFactor = 0.25;
    const ch4ToCO2e = 28;  // 1 kg CH4 = 28 kg CO2e over 100-year horizon
    const methanePrevented = wasteDiverted * methaneFactor * ch4ToCO2e;

    // Trees planted equivalent: ~21 kg CO2 per tree per year
    const treesEquivalent = co2Saved / 21;

    // Build category breakdown
    const categoryBreakdown: Record<WasteCategory, CategoryStats> = {} as Record<WasteCategory, CategoryStats>;
    const categoryTotals = {} as Record<WasteCategory, { count: number; weight: number; co2: number; points: number }>;

    items.forEach(item => {
      const coeff = IMPACT_COEFFICIENTS[item.category];
      const category = item.category;
      if (!categoryTotals[category]) {
        categoryTotals[category] = { count: 0, weight: 0, co2: 0, points: 0 };
      }
      categoryTotals[category].count += 1;
      categoryTotals[category].weight += coeff.weightKg;
      categoryTotals[category].co2 += coeff.co2Saved * (item.confidenceScore > 0 ? item.confidenceScore : 1.0);
      categoryTotals[category].points += SCORE_MULTIPLIERS[category] * (item.confidenceScore > 0 ? item.confidenceScore : 1.0);
    });

    // Convert to category breakdown with percentages
    Object.entries(categoryTotals).forEach(([category, stats]) => {
      categoryBreakdown[category as WasteCategory] = {
        count: stats.count,
        weight: Math.round(stats.weight * 100) / 100,
        co2Saved: Math.round(stats.co2 * 100) / 100,
        points: Math.round(stats.points),
        percentage: items.length > 0 ? Math.round((stats.count / items.length) * 100) : 0,
      };
    });

    // Generate recommendations
    const recommendations: string[] = [];
    if (sustainabilityScore < 30) {
      recommendations.push('Start sorting waste items regularly to build your sustainability score.');
    } else if (sustainabilityScore < 60) {
      recommendations.push('Continue sorting! Try detecting more diverse waste categories.');
    } else {
      recommendations.push('Great job! You\'re making a real environmental impact.');
    }

    if (recyclingRate < 50) {
      recommendations.push('Focus on recyclable items to increase your recycling rate.');
    }

    // Identify high-frequency categories and suggest reduction
    if (items.length > 10) {
      const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b.count - a.count)[0]?.[0];
      if (topCategory === WasteCategory.PLASTIC) {
        recommendations.push('You detect a lot of plastic. Try using reusable alternatives.');
      }
    }

    return {
      totalItemsProcessed: items.length,
      wasteDivertedKg: Math.round(wasteDiverted * 1000) / 1000,
      co2SavedKg: Math.round(co2Saved * 1000) / 1000,
      totalPointsEarned: items.reduce((total, item) => total + item.pointsAwarded, 0),
      recyclingRate,
      sustainabilityScore,
      categoryBreakdown,
      methanePrevented: Math.round(methanePrevented * 1000) / 1000,
      treesPlantedEquivalent: Math.round(treesEquivalent * 100) / 100,
      recommendations,
    };
  },

  /**
   * Get all impact coefficients (for debugging and customization).
   *
   * @returns Object containing all environmental impact coefficients
   *
   * @internal
   */
  getImpactCoefficients: () => IMPACT_COEFFICIENTS,

  /**
   * Get all score multipliers (for debugging and customization).
   *
   * @returns Object containing all gamification score multipliers
   *
   * @internal
   */
  getScoreMultipliers: () => SCORE_MULTIPLIERS,
};
