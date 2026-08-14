import { pipelineService } from '../pipelineService';
import { detectionService } from '../detectionService';
import { detectionHistoryService } from '../../history/DetectionHistoryService';
import { WasteCategory } from '../../../constants/wasteCategories';

jest.mock('react-native-fast-tflite', () => ({
  loadTensorflowModel: jest.fn(),
}));

jest.mock('../detectionService');
jest.mock('../../history/DetectionHistoryService');

describe('Pipeline Service Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('processes high confidence detection correctly', async () => {
    const mockResponse = {
      result: {
        primaryCategory: WasteCategory.PLASTIC,
        confidence: 0.95,
        confidencePercent: 95,
        topPredictions: []
      },
      metadata: {
        inferenceTimeMs: 100,
        modelVersion: 'v1.0.0',
        timestamp: Date.now()
      }
    };

    (detectionService.detectWaste as jest.Mock).mockResolvedValue(mockResponse);

    const { response, wasteItem } = await pipelineService.processImage('test_uri');

    expect(response).toEqual(mockResponse);
    expect(wasteItem.category).toBe(WasteCategory.PLASTIC);
    expect(wasteItem.confidenceScore).toBe(0.95);
    expect(detectionHistoryService.saveDetection).toHaveBeenCalledWith(mockResponse, 'test_uri');
  });

  it('handles unknown or low confidence detection', async () => {
    const mockResponse = {
      result: {
        primaryCategory: WasteCategory.UNKNOWN,
        confidence: 0.2,
        confidencePercent: 20,
        topPredictions: []
      },
      metadata: {
        inferenceTimeMs: 100,
        modelVersion: 'v1.0.0',
        timestamp: Date.now()
      }
    };

    (detectionService.detectWaste as jest.Mock).mockResolvedValue(mockResponse);

    const { response, wasteItem } = await pipelineService.processImage('test_uri');

    expect(response).toEqual(mockResponse);
    expect(wasteItem.category).toBe(WasteCategory.UNKNOWN);
    expect(wasteItem.confidenceScore).toBe(0.2);
    expect(detectionHistoryService.saveDetection).toHaveBeenCalledWith(mockResponse, 'test_uri');
  });
});
