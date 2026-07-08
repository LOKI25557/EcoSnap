import { WasteCategory } from '../constants/wasteCategories';
import { WasteItem } from '../types/WasteItem';

/**
 * Category statistics for waste analytics.
 */
export interface CategoryAnalytics {
  category: WasteCategory;
  count: number;
  percentage: number;
  totalConfidence: number;
  averageConfidence: number;
}

/**
 * Monthly trend data for waste analytics.
 */
export interface MonthlyTrend {
  month: string;
  year: number;
  itemCount: number;
  categories: Record<WasteCategory, number>;
  averageConfidence: number;
}

/**
 * Comprehensive waste analytics report.
 */
export interface WasteAnalyticsReport {
  /** Total items in the report. */
  totalItems: number;
  /** Date range of the report. */
  dateRange: {
    start: Date;
    end: Date;
  };
  /** Composition by waste category. */
  composition: CategoryAnalytics[];
  /** Most common waste category. */
  mostCommonCategory: WasteCategory;
  /** Least common waste category. */
  leastCommonCategory: WasteCategory;
  /** Average detection confidence across all items. */
  averageConfidence: number;
  /** Monthly trends over time. */
  monthlyTrends: MonthlyTrend[];
  /** Recycling frequency (average detections per week). */
  recyclingFrequency: number;
  /** Generated timestamp. */
  generatedAt: Date;
}

/**
 * wasteAnalytics generates statistical reports on waste detection and sorting patterns.
 *
 * The module provides:
 * - Waste composition analysis (percentage per category)
 * - Recycling frequency tracking
 * - Monthly trend analysis
 * - Most/least common waste identification
 * - Average confidence score trends
 *
 * This is useful for user dashboards, progress tracking, and environmental impact
 * visualization.
 */
export const wasteAnalytics = {
  /**
   * Generate a comprehensive waste analytics report.
   *
   * @param items Array of waste items to analyze
   * @returns Comprehensive analytics report with composition, trends, and statistics
   *
   * @example
   * const report = wasteAnalytics.generateReport(wasteItems);
   * console.log(`Most common: ${report.mostCommonCategory}`);
   * console.log(`Average confidence: ${(report.averageConfidence * 100).toFixed(1)}%`);
   */
  generateReport: (items: WasteItem[]): WasteAnalyticsReport => {
    if (items.length === 0) {
      return {
        totalItems: 0,
        dateRange: {
          start: new Date(),
          end: new Date(),
        },
        composition: [],
        mostCommonCategory: WasteCategory.UNKNOWN,
        leastCommonCategory: WasteCategory.UNKNOWN,
        averageConfidence: 0,
        monthlyTrends: [],
        recyclingFrequency: 0,
        generatedAt: new Date(),
      };
    }

    const composition = wasteAnalytics.analyzeComposition(items);
    const monthlyTrends = wasteAnalytics.computeMonthlyTrends(items);
    const confidenceStats = wasteAnalytics.computeConfidenceStats(items);
    const dateRange = wasteAnalytics.getDateRange(items);
    const recyclingFrequency = wasteAnalytics.calculateRecyclingFrequency(items);

    // Find most and least common
    const sorted = [...composition].sort((a, b) => b.count - a.count);
    const mostCommon = sorted[0]?.category ?? WasteCategory.UNKNOWN;
    const leastCommon = sorted[sorted.length - 1]?.category ?? WasteCategory.UNKNOWN;

    return {
      totalItems: items.length,
      dateRange,
      composition,
      mostCommonCategory: mostCommon,
      leastCommonCategory: leastCommon,
      averageConfidence: confidenceStats.average,
      monthlyTrends,
      recyclingFrequency,
      generatedAt: new Date(),
    };
  },

  /**
   * Analyze waste composition by category.
   *
   * @param items Array of waste items to analyze
   * @returns Array of category statistics sorted by frequency
   *
   * @example
   * const composition = wasteAnalytics.analyzeComposition(items);
   * composition.forEach(cat => {
   *   console.log(`${cat.category}: ${cat.percentage.toFixed(1)}%`);
   * });
   */
  analyzeComposition: (items: WasteItem[]): CategoryAnalytics[] => {
    if (items.length === 0) return [];

    const categoryMap: Record<WasteCategory, { count: number; totalConfidence: number }> = {};

    items.forEach(item => {
      if (!categoryMap[item.category]) {
        categoryMap[item.category] = { count: 0, totalConfidence: 0 };
      }
      categoryMap[item.category].count += 1;
      categoryMap[item.category].totalConfidence += item.confidenceScore;
    });

    const analytics: CategoryAnalytics[] = Object.entries(categoryMap).map(([category, data]) => ({
      category: category as WasteCategory,
      count: data.count,
      percentage: (data.count / items.length) * 100,
      totalConfidence: Math.round(data.totalConfidence * 100) / 100,
      averageConfidence: Math.round((data.totalConfidence / data.count) * 100) / 100,
    }));

    return analytics.sort((a, b) => b.count - a.count);
  },

  /**
   * Compute monthly trend data.
   *
   * @param items Array of waste items
   * @returns Array of monthly trend objects
   *
   * @example
   * const trends = wasteAnalytics.computeMonthlyTrends(items);
   * trends.forEach(trend => {
   *   console.log(`${trend.month} ${trend.year}: ${trend.itemCount} items`);
   * });
   */
  computeMonthlyTrends: (items: WasteItem[]): MonthlyTrend[] => {
    const monthlyMap: Map<string, { items: WasteItem[] }> = new Map();

    items.forEach(item => {
      const date = new Date(item.detectedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { items: [] });
      }
      monthlyMap.get(monthKey)!.items.push(item);
    });

    const trends = Array.from(monthlyMap.entries())
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, data]) => {
        const [year, month] = key.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', {
          month: 'short',
        });

        const categoryCount: Record<WasteCategory, number> = {} as Record<WasteCategory, number>;
        data.items.forEach(item => {
          categoryCount[item.category] = (categoryCount[item.category] ?? 0) + 1;
        });

        const avgConfidence =
          data.items.length > 0
            ? Math.round((data.items.reduce((sum, item) => sum + item.confidenceScore, 0) / data.items.length) * 100) / 100
            : 0;

        return {
          month: monthName,
          year: parseInt(year),
          itemCount: data.items.length,
          categories: categoryCount,
          averageConfidence: avgConfidence,
        };
      });

    return trends;
  },

  /**
   * Compute confidence statistics.
   *
   * @param items Array of waste items
   * @returns Object with min, max, and average confidence scores
   *
   * @internal
   */
  computeConfidenceStats: (
    items: WasteItem[]
  ): { min: number; max: number; average: number } => {
    if (items.length === 0) return { min: 0, max: 0, average: 0 };

    const scores = items.map(item => item.confidenceScore);
    return {
      min: Math.min(...scores),
      max: Math.max(...scores),
      average: Math.round((scores.reduce((a, b) => a + b) / scores.length) * 100) / 100,
    };
  },

  /**
   * Get the date range of waste items.
   *
   * @param items Array of waste items
   * @returns Start and end dates
   *
   * @internal
   */
  getDateRange: (items: WasteItem[]): { start: Date; end: Date } => {
    if (items.length === 0) {
      const now = new Date();
      return { start: now, end: now };
    }

    const dates = items.map(item => new Date(item.detectedAt));
    const start = new Date(Math.min(...dates.map(d => d.getTime())));
    const end = new Date(Math.max(...dates.map(d => d.getTime())));
    return { start, end };
  },

  /**
   * Calculate recycling frequency (items per week).
   *
   * @param items Array of waste items
   * @returns Average items detected per week
   *
   * @example
   * const freq = wasteAnalytics.calculateRecyclingFrequency(items);
   * console.log(`Recycling ${freq.toFixed(1)} items per week`);
   */
  calculateRecyclingFrequency: (items: WasteItem[]): number => {
    if (items.length === 0) return 0;

    const dateRange = wasteAnalytics.getDateRange(items);
    const daysDiff = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
    const weeks = Math.max(daysDiff / 7, 1); // At least 1 week
    return Math.round((items.length / weeks) * 100) / 100;
  },

  /**
   * Get waste composition as a percentage breakdown (suitable for pie charts).
   *
   * @param items Array of waste items
   * @returns Array of objects with category and percentage
   *
   * @example
   * const data = wasteAnalytics.getCompositionPercentages(items);
   * // Use with chart library
   */
  getCompositionPercentages: (items: WasteItem[]): Array<{ category: WasteCategory; percentage: number }> => {
    const composition = wasteAnalytics.analyzeComposition(items);
    return composition.map(cat => ({
      category: cat.category,
      percentage: Math.round(cat.percentage * 10) / 10,
    }));
  },

  /**
   * Get the most common waste category.
   *
   * @param items Array of waste items
   * @returns Most frequently detected category
   *
   * @example
   * const top = wasteAnalytics.getMostCommonCategory(items);
   * console.log(`Most common: ${top}`);
   */
  getMostCommonCategory: (items: WasteItem[]): WasteCategory => {
    const composition = wasteAnalytics.analyzeComposition(items);
    return composition[0]?.category ?? WasteCategory.UNKNOWN;
  },

  /**
   * Filter items by date range.
   *
   * @param items Array of waste items
   * @param startDate Start of the date range
   * @param endDate End of the date range
   * @returns Filtered items within the date range
   *
   * @example
   * const lastMonth = wasteAnalytics.filterByDateRange(items, oneMonthAgo, today);
   */
  filterByDateRange: (items: WasteItem[], startDate: Date, endDate: Date): WasteItem[] => {
    return items.filter(item => {
      const itemDate = new Date(item.detectedAt);
      return itemDate >= startDate && itemDate <= endDate;
    });
  },
};
