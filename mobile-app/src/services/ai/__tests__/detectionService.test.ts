import { detectionService, DetectionError } from '../detectionService';
import { inferenceEngine } from '../inferenceEngine';
import { WasteCategory } from '../../../constants/wasteCategories';

jest.mock('../inferenceEngine');

describe('detectionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns high-confidence prediction without overriding category', async () => {
    const mockEngineOutput = {
      topPredictions: [
        { category: WasteCategory.PLASTIC, confidence: 0.88, confidencePercent: 88.0 },
        { category: WasteCategory.GLASS, confidence: 0.08, confidencePercent: 8.0 },
        { category: WasteCategory.METAL, confidence: 0.04, confidencePercent: 4.0 },
      ],
      inferenceTimeMs: 45,
      preprocessingTimeMs: 25,
    };

    (inferenceEngine.runInference as jest.Mock).mockResolvedValue(mockEngineOutput);

    const response = await detectionService.detectWaste('file:///bottle.jpg', { width: 1080, height: 1920 });

    expect(response.result.primaryCategory).toBe(WasteCategory.PLASTIC);
    expect(response.result.confidence).toBe(0.88);
    expect(response.result.confidencePercent).toBe(88.0);
    expect(response.metadata.modelVersion).toBe('v1.0.0');
    expect(response.metadata.inferenceTimeMs).toBe(45);
    expect(response.metadata.imageSize).toEqual({ width: 1080, height: 1920 });
  });

  it('falls back to UNKNOWN when prediction confidence is below MIN_CONFIDENCE_THRESHOLD (0.3)', async () => {
    const mockEngineOutput = {
      topPredictions: [
        { category: WasteCategory.GLASS, confidence: 0.25, confidencePercent: 25.0 },
        { category: WasteCategory.METAL, confidence: 0.22, confidencePercent: 22.0 },
        { category: WasteCategory.PLASTIC, confidence: 0.20, confidencePercent: 20.0 },
      ],
      inferenceTimeMs: 50,
      preprocessingTimeMs: 30,
    };

    (inferenceEngine.runInference as jest.Mock).mockResolvedValue(mockEngineOutput);

    const response = await detectionService.detectWaste('file:///blurry.jpg');

    expect(response.result.primaryCategory).toBe(WasteCategory.UNKNOWN);
    expect(response.result.confidence).toBe(0.25);
  });

  it('preserves UNKNOWN if the engine directly predicts UNKNOWN category', async () => {
    const mockEngineOutput = {
      topPredictions: [
        { category: WasteCategory.UNKNOWN, confidence: 0.95, confidencePercent: 95.0 },
      ],
      inferenceTimeMs: 30,
      preprocessingTimeMs: 20,
    };

    (inferenceEngine.runInference as jest.Mock).mockResolvedValue(mockEngineOutput);

    const response = await detectionService.detectWaste('file:///strange_item.jpg');

    expect(response.result.primaryCategory).toBe(WasteCategory.UNKNOWN);
  });

  it('getSupportedCategories returns all 6 recyclable/segregable categories excluding UNKNOWN', () => {
    const categories = detectionService.getSupportedCategories();

    expect(categories).toContain(WasteCategory.PLASTIC);
    expect(categories).toContain(WasteCategory.PAPER);
    expect(categories).toContain(WasteCategory.GLASS);
    expect(categories).toContain(WasteCategory.METAL);
    expect(categories).toContain(WasteCategory.ORGANIC);
    expect(categories).toContain(WasteCategory.E_WASTE);
    expect(categories).not.toContain(WasteCategory.UNKNOWN);
  });

  it('wraps unhandled errors into typed DetectionError', async () => {
    (inferenceEngine.runInference as jest.Mock).mockRejectedValue(new Error('Hardware sensor fault'));

    await expect(detectionService.detectWaste('file:///test.jpg')).rejects.toThrow(DetectionError);
    await expect(detectionService.detectWaste('file:///test.jpg')).rejects.toMatchObject({
      code: 'UNKNOWN_DETECTION_ERROR',
    });
  });
});
