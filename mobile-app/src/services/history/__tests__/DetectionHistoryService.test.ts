import { detectionHistoryService, HistoryItem } from '../DetectionHistoryService';
import * as FileSystem from 'expo-file-system';
import { WasteCategory } from '../../../constants/wasteCategories';

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/documents/',
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

describe('DetectionHistoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    detectionHistoryService.resetCache();
  });

  it('saves new detection at the beginning of the history array', async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });

    const mockResponse = {
      result: {
        primaryCategory: WasteCategory.GLASS,
        confidence: 0.92,
        confidencePercent: 92,
        topPredictions: [],
      },
      metadata: {
        inferenceTimeMs: 40,
        modelVersion: 'v1.0.0',
        timestamp: Date.now(),
      },
    };

    await detectionHistoryService.saveDetection(mockResponse, 'file:///glass.jpg');

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      expect.stringContaining('detection_history.json'),
      expect.stringContaining(WasteCategory.GLASS)
    );
  });

  it('filters history accurately by search query and category', () => {
    const history: HistoryItem[] = [
      {
        id: '1',
        timestamp: 1000,
        response: {
          result: { primaryCategory: WasteCategory.PLASTIC, confidence: 0.9, confidencePercent: 90, topPredictions: [] },
          metadata: { inferenceTimeMs: 10, modelVersion: 'v1', timestamp: 1000 },
        },
      },
      {
        id: '2',
        timestamp: 2000,
        response: {
          result: { primaryCategory: WasteCategory.METAL, confidence: 0.8, confidencePercent: 80, topPredictions: [] },
          metadata: { inferenceTimeMs: 10, modelVersion: 'v1', timestamp: 2000 },
        },
      },
    ];

    const plasticOnly = detectionHistoryService.filterHistory(history, undefined, WasteCategory.PLASTIC);
    expect(plasticOnly.length).toBe(1);
    expect(plasticOnly[0].id).toBe('1');

    const searchMetal = detectionHistoryService.filterHistory(history, 'met');
    expect(searchMetal.length).toBe(1);
    expect(searchMetal[0].id).toBe('2');
  });

  it('sorts history chronologically ascending and descending', () => {
    const history: HistoryItem[] = [
      { id: '1', timestamp: 100, response: {} as any },
      { id: '2', timestamp: 300, response: {} as any },
      { id: '3', timestamp: 200, response: {} as any },
    ];

    const desc = detectionHistoryService.sortHistory(history, false);
    expect(desc.map(h => h.id)).toEqual(['2', '3', '1']);

    const asc = detectionHistoryService.sortHistory(history, true);
    expect(asc.map(h => h.id)).toEqual(['1', '3', '2']);
  });
});
