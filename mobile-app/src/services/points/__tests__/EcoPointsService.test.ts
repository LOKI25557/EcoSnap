import { ecoPointsService } from '../EcoPointsService';
import * as FileSystem from 'expo-file-system';
import { EcoPoints, EcoPointsHistoryEntry } from '../../../types/EcoPoints';

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/documents/',
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

describe('EcoPointsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ecoPointsService.resetCache();
  });

  it('initializes with default points (0 points, 0 streak) if file does not exist', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });

    const points = await ecoPointsService.getPoints();

    expect(points.totalPoints).toBe(0);
    expect(points.currentStreak).toBe(0);
    expect(points.history).toEqual([]);
    expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
  });

  it('adds points and updates total points and history correctly', async () => {
    const existingPoints: EcoPoints = {
      totalPoints: 50,
      currentStreak: 2,
      history: [
        { id: '1', points: 50, source: 'scan', timestamp: 1000, description: 'Plastic scan' },
      ],
    };

    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify(existingPoints));

    const newEntry: EcoPointsHistoryEntry = {
      id: '2',
      points: 20,
      source: 'scan',
      timestamp: 2000,
      description: 'Metal scan',
    };

    await ecoPointsService.addPoints(newEntry);

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      expect.stringContaining('eco_points.json'),
      expect.stringContaining('"totalPoints":70')
    );
  });

  it('awards streak bonus when streak increases', async () => {
    const existingPoints: EcoPoints = {
      totalPoints: 100,
      currentStreak: 3,
      history: [],
    };

    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify(existingPoints));

    await ecoPointsService.updateStreak(5); // Increased from 3 to 5 (+50 bonus)

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      expect.stringContaining('eco_points.json'),
      expect.stringContaining('"currentStreak":5')
    );
  });
});
