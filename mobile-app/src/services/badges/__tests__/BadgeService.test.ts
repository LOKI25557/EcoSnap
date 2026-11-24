import { badgeService } from '../BadgeService';
import * as FileSystem from 'expo-file-system';
import { ecoPointsService } from '../../points/EcoPointsService';
import { WasteCategory } from '../../../constants/wasteCategories';
import { HistoryItem } from '../../history/DetectionHistoryService';

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/documents/',
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

jest.mock('../../points/EcoPointsService', () => ({
  ecoPointsService: {
    getPoints: jest.fn(),
    addPoints: jest.fn(),
  },
}));

describe('BadgeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    badgeService.resetCache();
  });

  it('loads all 8 default badges if storage file is absent', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });

    const badges = await badgeService.getBadges();

    expect(badges.length).toBe(8);
    expect(badges.find(b => b.id === 'first-scan')).toBeDefined();
    expect(badges.find(b => b.id === 'plastic-hero')).toBeDefined();
    expect(badges.every(b => !b.isUnlocked)).toBe(true);
  });

  it('unlocks first-scan badge on first successful detection scan and awards bonus points', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(
      JSON.stringify([
        { id: 'first-scan', title: 'First Scan', description: 'Complete your first scan', icon: '📸', isUnlocked: false },
      ])
    );

    (ecoPointsService.getPoints as jest.Mock).mockResolvedValue({ totalPoints: 10, currentStreak: 1 });

    const history: HistoryItem[] = [
      {
        id: 'scan-1',
        timestamp: Date.now(),
        response: {
          result: {
            primaryCategory: WasteCategory.PLASTIC,
            confidence: 0.9,
            confidencePercent: 90,
            topPredictions: [],
          },
          metadata: {
            inferenceTimeMs: 50,
            modelVersion: 'v1.0.0',
            timestamp: Date.now(),
          },
        },
      },
    ];

    const evaluated = await badgeService.evaluateBadges(history);
    const firstScanBadge = evaluated.find(b => b.id === 'first-scan');

    expect(firstScanBadge?.isUnlocked).toBe(true);
    expect(firstScanBadge?.unlockedAt).toBeDefined();
    expect(ecoPointsService.addPoints).toHaveBeenCalledWith(
      expect.objectContaining({
        points: 100,
        source: 'badge',
      })
    );
  });
});
