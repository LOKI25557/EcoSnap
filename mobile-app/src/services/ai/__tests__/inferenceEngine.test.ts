import { inferenceEngine, InferenceError } from '../inferenceEngine';
import { modelLoader } from '../modelLoader';
import { labelLoader } from '../labelLoader';
import { imagePreprocessor } from '../imagePreprocessor';
import { WasteCategory } from '../../../constants/wasteCategories';

jest.mock('../modelLoader');
jest.mock('../labelLoader');
jest.mock('../imagePreprocessor');

describe('inferenceEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('successfully executes inference and returns top-3 sorted predictions with mapped categories', async () => {
    // 8 class probabilities: Battery is highest (0.85), Plastic (0.10), Paper (0.03), others lower
    const mockOutputArray = new Float32Array([0.10, 0.03, 0.01, 0.005, 0.003, 0.001, 0.85, 0.001]);
    const mockModel = {
      run: jest.fn().mockResolvedValue([mockOutputArray.buffer]),
    };

    (modelLoader.getModel as jest.Mock).mockResolvedValue(mockModel);
    (labelLoader.loadLabels as jest.Mock).mockResolvedValue(undefined);
    (labelLoader.getLabel as jest.Mock).mockImplementation((idx: number) => {
      const labels = ['Plastic', 'Paper', 'Glass', 'Metal', 'Cardboard', 'Organic', 'Battery', 'E-waste'];
      return labels[idx] || 'Unknown';
    });

    const mockTensor = new Float32Array(224 * 224 * 3);
    (imagePreprocessor.processImage as jest.Mock).mockResolvedValue(mockTensor);

    const result = await inferenceEngine.runInference('file:///test.jpg');

    expect(result.topPredictions.length).toBe(3);
    // Rank 1: Battery -> E_WASTE
    expect(result.topPredictions[0].category).toBe(WasteCategory.E_WASTE);
    expect(result.topPredictions[0].confidence).toBeCloseTo(0.85);
    expect(result.topPredictions[0].confidencePercent).toBe(85.0);

    // Rank 2: Plastic -> PLASTIC
    expect(result.topPredictions[1].category).toBe(WasteCategory.PLASTIC);
    expect(result.topPredictions[1].confidence).toBeCloseTo(0.10);

    // Rank 3: Paper -> PAPER
    expect(result.topPredictions[2].category).toBe(WasteCategory.PAPER);

    expect(result.inferenceTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.preprocessingTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('correctly maps cardboard to Paper waste category', async () => {
    const mockOutputArray = new Float32Array([0.01, 0.01, 0.01, 0.01, 0.95, 0.01, 0.0, 0.0]);
    const mockModel = {
      run: jest.fn().mockResolvedValue([mockOutputArray.buffer]),
    };

    (modelLoader.getModel as jest.Mock).mockResolvedValue(mockModel);
    (labelLoader.loadLabels as jest.Mock).mockResolvedValue(undefined);
    (labelLoader.getLabel as jest.Mock).mockReturnValue('Cardboard');
    (imagePreprocessor.processImage as jest.Mock).mockResolvedValue(new Float32Array(10));

    const result = await inferenceEngine.runInference('file:///box.jpg');

    expect(result.topPredictions[0].category).toBe(WasteCategory.PAPER);
    expect(result.topPredictions[0].confidence).toBeCloseTo(0.95);
  });

  it('throws InferenceError with MODEL_MISSING code if model fails to load', async () => {
    (modelLoader.getModel as jest.Mock).mockResolvedValue(null);
    (labelLoader.loadLabels as jest.Mock).mockResolvedValue(undefined);

    await expect(inferenceEngine.runInference('file:///test.jpg')).rejects.toThrow(InferenceError);
    await expect(inferenceEngine.runInference('file:///test.jpg')).rejects.toMatchObject({
      code: 'MODEL_MISSING',
    });
  });

  it('throws InferenceError with CORRUPTED_IMAGE code if preprocessor throws', async () => {
    (modelLoader.getModel as jest.Mock).mockResolvedValue({ run: jest.fn() });
    (labelLoader.loadLabels as jest.Mock).mockResolvedValue(undefined);
    (imagePreprocessor.processImage as jest.Mock).mockRejectedValue(new Error('Decode failed'));

    await expect(inferenceEngine.runInference('file:///corrupted.jpg')).rejects.toMatchObject({
      code: 'CORRUPTED_IMAGE',
    });
  });

  it('throws InferenceError with INFERENCE_TIMEOUT if model execution fails', async () => {
    const mockModel = {
      run: jest.fn().mockRejectedValue(new Error('TFLite execution crash')),
    };
    (modelLoader.getModel as jest.Mock).mockResolvedValue(mockModel);
    (labelLoader.loadLabels as jest.Mock).mockResolvedValue(undefined);
    (imagePreprocessor.processImage as jest.Mock).mockResolvedValue(new Float32Array(10));

    await expect(inferenceEngine.runInference('file:///test.jpg')).rejects.toMatchObject({
      code: 'INFERENCE_TIMEOUT',
    });
  });

  it('throws InferenceError with INVALID_OUTPUT_TENSOR if output tensor length is not 8', async () => {
    const badLengthOutput = new Float32Array([0.5, 0.5]); // Only 2 outputs instead of 8
    const mockModel = {
      run: jest.fn().mockResolvedValue([badLengthOutput.buffer]),
    };
    (modelLoader.getModel as jest.Mock).mockResolvedValue(mockModel);
    (labelLoader.loadLabels as jest.Mock).mockResolvedValue(undefined);
    (imagePreprocessor.processImage as jest.Mock).mockResolvedValue(new Float32Array(10));

    await expect(inferenceEngine.runInference('file:///test.jpg')).rejects.toMatchObject({
      code: 'INVALID_OUTPUT_TENSOR',
    });
  });

  it('throws InferenceError with INVALID_OUTPUT_VALUES if output tensor contains NaN or Infinity', async () => {
    const nonFiniteOutput = new Float32Array([NaN, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]);
    const mockModel = {
      run: jest.fn().mockResolvedValue([nonFiniteOutput.buffer]),
    };
    (modelLoader.getModel as jest.Mock).mockResolvedValue(mockModel);
    (labelLoader.loadLabels as jest.Mock).mockResolvedValue(undefined);
    (imagePreprocessor.processImage as jest.Mock).mockResolvedValue(new Float32Array(10));

    await expect(inferenceEngine.runInference('file:///test.jpg')).rejects.toMatchObject({
      code: 'INVALID_OUTPUT_VALUES',
    });
  });
});
