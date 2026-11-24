import { goalService } from '../GoalService';
import * as FileSystem from 'expo-file-system';
import { WasteCategory } from '../../../constants/wasteCategories';
import { HistoryItem } from '../../history/DetectionHistoryService';

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/documents/',
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

describe('GoalService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    goalService.resetCache();
  });

  it('loads default goals when storage file is absent', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });

    const goals = await goalService.getGoals();

    expect(goals.length).toBe(3);
    expect(goals.find(g => g.id === 'recycle-10-bottles')).toBeDefined();
    expect(goals.find(g => g.id === 'weekly-divert-5')).toBeDefined();
  });

  it('evaluates progress on goals based on history and completes goal when target reached', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });

    // 10 plastic detections
    const mockHistory: HistoryItem[] = Array.from({ length: 10 }).map((_, i) => ({
      id: `scan-${i}`,
      timestamp: Date.now(),
      response: {
        result: {
          primaryCategory: WasteCategory.PLASTIC,
          confidence: 0.9,
          confidencePercent: 90,
          topPredictions: [],
        },
        metadata: {
          inferenceTimeMs: 10,
          modelVersion: 'v1.0.0',
          timestamp: Date.now(),
        },
      },
    }));

    const evaluated = await goalService.evaluateGoals(mockHistory);
    const bottleGoal = evaluated.find(g => g.id === 'recycle-10-bottles');

    expect(bottleGoal?.currentProgress).toBe(10);
    expect(bottleGoal?.isCompleted).toBe(true);
    expect(bottleGoal?.completedAt).toBeDefined();
  });
});
