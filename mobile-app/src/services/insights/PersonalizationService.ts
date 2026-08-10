import { HistoryItem } from '../history/DetectionHistoryService';
import { trendAnalysisService } from '../dashboard/TrendAnalysisService';
import { ecoPointsService } from '../points/EcoPointsService';
import { WasteCategory } from '../../constants/wasteCategories';

export interface PersonalizedInsight {
  dailyTip: string;
  weeklyRecommendation: string;
  habitAnalysis: string;
  strength: string;
  improvementArea: string;
  yearlyImpactEstimate: string;
}

class PersonalizationService {
  async generateInsights(history: HistoryItem[]): Promise<PersonalizedInsight> {
    const trends = trendAnalysisService.analyzeTrends(history);
    const points = await ecoPointsService.getPoints();

    // Habit Analysis & Strength/Improvement
    const categoryCounts = history.reduce<Record<string, number>>((acc, item) => {
      const cat = item.response.result.primaryCategory;
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    let highestCat = '';
    let highestCount = -1;
    let lowestCat = '';
    let lowestCount = Infinity;

    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count > highestCount) {
        highestCount = count;
        highestCat = cat;
      }
      if (count < lowestCount && count > 0) {
        lowestCount = count;
        lowestCat = cat;
      }
    });

    const strength = highestCat ? `You excel at recycling ${highestCat} (${highestCount} items)` : 'Start scanning to discover your strengths!';
    const improvementArea = lowestCat ? `Try to focus more on recycling ${lowestCat} items` : 'Consistency is key!';
    
    let habitAnalysis = 'Keep up the good work!';
    if (trends.currentStreak >= 3) {
      habitAnalysis = `You have a strong habit forming with a ${trends.currentStreak}-day streak!`;
    } else if (history.length > 20 && trends.averageItemsPerDay < 1) {
      habitAnalysis = `You scan items in batches. Try to make it a daily habit!`;
    }

    // Yearly Impact Estimate
    // Naive estimate: (Total CO2 / total days) * 365
    // We can pull co2 directly from the trends if we aggregated it, or recalculate.
    // Let's use averageItemsPerDay * 365 as an item estimate
    const yearlyItems = Math.round(trends.averageItemsPerDay * 365);
    const yearlyImpactEstimate = history.length > 0 ? `At your current rate, you'll recycle ~${yearlyItems} items this year!` : 'Scan your first item to see your yearly projection.';

    const dailyTip = this.getRandomTip();
    
    let weeklyRecommendation = 'Try to increase your scanning frequency this week.';
    if (trends.weeklyGrowthPercentage < 0) {
      weeklyRecommendation = 'Your activity dropped this week. Let\'s bounce back!';
    } else if (trends.weeklyGrowthPercentage > 0) {
      weeklyRecommendation = 'Great growth this week! Maintain this momentum.';
    }

    return {
      dailyTip,
      weeklyRecommendation,
      habitAnalysis,
      strength,
      improvementArea,
      yearlyImpactEstimate
    };
  }

  private getRandomTip(): string {
    const tips = [
      "Rinse containers before recycling to avoid contamination.",
      "Not all plastics are recyclable. Check the number on the bottom!",
      "Flatten cardboard boxes to save space in the bin.",
      "Consider composting your organic waste.",
      "E-waste should never go in the regular bin. Find a local drop-off.",
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }
}

export const personalizationService = new PersonalizationService();
