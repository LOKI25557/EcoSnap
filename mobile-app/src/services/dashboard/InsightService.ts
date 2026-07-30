import { Insight } from '../../types/Dashboard';
import { HistoryItem } from '../history/DetectionHistoryService';
import { WasteCategory } from '../../constants/wasteCategories';

class InsightService {
  generateInsights(history: HistoryItem[]): Insight[] {
    const insights: Insight[] = [];
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = oneWeekAgo - 7 * 24 * 60 * 60 * 1000;

    const thisWeekHistory = history.filter(h => h.timestamp >= oneWeekAgo);
    const lastWeekHistory = history.filter(h => h.timestamp >= twoWeeksAgo && h.timestamp < oneWeekAgo);

    if (thisWeekHistory.length === 0 && lastWeekHistory.length === 0) {
      return [{
        id: 'no-data',
        text: 'Start scanning to generate environmental insights.',
        type: 'info',
        timestamp: now,
      }];
    }

    if (thisWeekHistory.length > lastWeekHistory.length) {
      const diff = thisWeekHistory.length - lastWeekHistory.length;
      insights.push({
        id: 'growth-1',
        text: `Great job! You recycled ${diff} more items this week compared to last week.`,
        type: 'positive',
        timestamp: now,
      });
    } else if (thisWeekHistory.length < lastWeekHistory.length && lastWeekHistory.length > 0) {
      insights.push({
        id: 'drop-1',
        text: `Your recycling activity is lower this week. Let's aim for a stronger finish!`,
        type: 'info',
        timestamp: now,
      });
    }

    const thisWeekPlastic = thisWeekHistory.filter(h => h.response.result.primaryCategory === WasteCategory.PLASTIC).length;
    const lastWeekPlastic = lastWeekHistory.filter(h => h.response.result.primaryCategory === WasteCategory.PLASTIC).length;

    if (thisWeekPlastic > lastWeekPlastic && lastWeekPlastic > 0) {
      const percentage = Math.round(((thisWeekPlastic - lastWeekPlastic) / lastWeekPlastic) * 100);
      insights.push({
        id: 'plastic-insight',
        text: `You scanned ${percentage}% more plastic this week. Try reducing single-use plastics!`,
        type: 'info',
        timestamp: now,
      });
    }

    if (thisWeekHistory.length > 10) {
      insights.push({
        id: 'consistency-insight',
        text: `Excellent recycling consistency this week!`,
        type: 'positive',
        timestamp: now,
      });
    }

    // Return the most relevant/recent 3 insights
    return insights.slice(0, 3);
  }
}

export const insightService = new InsightService();
