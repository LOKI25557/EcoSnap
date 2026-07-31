import * as FileSystem from 'expo-file-system';
import { Badge } from '../../types/Badge';
import { HistoryItem } from '../history/DetectionHistoryService';
import { WasteCategory } from '../../constants/wasteCategories';
import { ecoPointsService } from '../points/EcoPointsService';
import { analyticsService } from '../ai/analyticsService';
import { WasteItem } from '../../types/WasteItem';
import { calculateScore } from '../../utils/calculateScore';

const BADGES_FILE_PATH = FileSystem.documentDirectory + 'badges.json';

const DEFAULT_BADGES: Badge[] = [
  { id: 'first-scan', title: 'First Scan', description: 'Complete your first scan', icon: '📸', isUnlocked: false },
  { id: 'plastic-hero', title: 'Plastic Hero', description: 'Recycle 50 plastic items', icon: '🥤', isUnlocked: false },
  { id: 'paper-master', title: 'Paper Master', description: 'Recycle 50 paper items', icon: '📄', isUnlocked: false },
  { id: 'glass-guardian', title: 'Glass Guardian', description: 'Recycle 25 glass items', icon: '🍾', isUnlocked: false },
  { id: 'metal-recycler', title: 'Metal Recycler', description: 'Recycle 25 metal items', icon: '🥫', isUnlocked: false },
  { id: 'eco-warrior', title: 'Eco Warrior', description: 'Reach 10,000 Eco Points', icon: '🦸', isUnlocked: false },
  { id: '100-scans', title: '100 Scans', description: 'Reach 100 total scans', icon: '💯', isUnlocked: false },
  { id: '1000kg-co2', title: 'Climate Saver', description: 'Save 1000kg of CO₂', icon: '🌍', isUnlocked: false },
];

class BadgeService {
  private cache: Badge[] | null = null;

  async getBadges(): Promise<Badge[]> {
    if (this.cache) return this.cache;
    try {
      const info = await FileSystem.getInfoAsync(BADGES_FILE_PATH);
      if (!info.exists) {
        this.cache = [...DEFAULT_BADGES];
        await this.saveBadges(this.cache);
        return this.cache;
      }
      const content = await FileSystem.readAsStringAsync(BADGES_FILE_PATH);
      this.cache = JSON.parse(content) as Badge[];
      return this.cache;
    } catch (error) {
      console.error('Failed to load badges', error);
      return [...DEFAULT_BADGES];
    }
  }

  private async saveBadges(badges: Badge[]): Promise<void> {
    try {
      await FileSystem.writeAsStringAsync(BADGES_FILE_PATH, JSON.stringify(badges));
      this.cache = badges;
    } catch (error) {
      console.error('Failed to save badges', error);
    }
  }

  async evaluateBadges(history: HistoryItem[]): Promise<Badge[]> {
    const badges = await this.getBadges();
    const points = await ecoPointsService.getPoints();
    let updated = false;

    const totalScans = history.length;
    const categoryCounts = history.reduce<Record<string, number>>((acc, item) => {
      const cat = item.response.result.primaryCategory;
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const mappedScans: WasteItem[] = history.map(item => ({
      id: item.id,
      userId: 'local',
      category: item.response.result.primaryCategory,
      confidenceScore: item.response.result.confidence,
      detectedAt: new Date(item.timestamp),
      pointsAwarded: calculateScore(item.response.result.primaryCategory),
    }));

    const co2Saved = analyticsService.calculateCO2Saved(mappedScans);

    for (const badge of badges) {
      if (badge.isUnlocked) continue;

      let meetsCondition = false;

      switch (badge.id) {
        case 'first-scan': meetsCondition = totalScans >= 1; break;
        case '100-scans': meetsCondition = totalScans >= 100; break;
        case 'plastic-hero': meetsCondition = (categoryCounts[WasteCategory.PLASTIC] || 0) >= 50; break;
        case 'paper-master': meetsCondition = (categoryCounts[WasteCategory.PAPER] || 0) >= 50; break;
        case 'glass-guardian': meetsCondition = (categoryCounts[WasteCategory.GLASS] || 0) >= 25; break;
        case 'metal-recycler': meetsCondition = (categoryCounts[WasteCategory.METAL] || 0) >= 25; break;
        case 'eco-warrior': meetsCondition = points.totalPoints >= 10000; break;
        case '1000kg-co2': meetsCondition = co2Saved >= 1000; break;
      }

      if (meetsCondition) {
        badge.isUnlocked = true;
        badge.unlockedAt = Date.now();
        updated = true;

        await ecoPointsService.addPoints({
          id: Date.now().toString(),
          source: 'badge',
          points: 100, // Flat reward for badges
          timestamp: Date.now(),
          description: `Unlocked Badge: ${badge.title}`
        });
      }
    }

    if (updated) {
      await this.saveBadges(badges);
    }

    return badges;
  }
}

export const badgeService = new BadgeService();
