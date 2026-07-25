import { modelLoader } from './modelLoader';
import { imagePreprocessor } from './imagePreprocessor';
import { WasteCategory } from '../../constants/wasteCategories';
import { labelLoader } from './labelLoader';

export class InferenceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'InferenceError';
  }
}

function mapLabelToWasteCategory(label: string): WasteCategory {
  if (!label) return WasteCategory.UNKNOWN;
  
  const normalized = label.toLowerCase().replace(/[\s_]/g, '');

  switch (normalized) {
    case 'plastic':
    case 'plasticbottle':
    case 'pet':
      return WasteCategory.PLASTIC;
    case 'paper':
    case 'cardboard':
      return WasteCategory.PAPER;
    case 'glass':
      return WasteCategory.GLASS;
    case 'metal':
      return WasteCategory.METAL;
    case 'organic':
    case 'food':
      return WasteCategory.ORGANIC;
    case 'ewaste':
    case 'electronic':
    case 'battery':
    case 'hazardous':
      return WasteCategory.E_WASTE;
    default:
      return WasteCategory.UNKNOWN;
  }
}

export interface RawInferenceResult {
  category: WasteCategory;
  confidence: number;
  confidencePercent: number;
}

export const inferenceEngine = {
  /**
   * Run the end-to-end inference pipeline
   */
  async runInference(imageUri: string): Promise<{
    topPredictions: RawInferenceResult[],
    inferenceTimeMs: number,
    preprocessingTimeMs: number
  }> {
    try {
      // 1. Ensure Model and Labels are Loaded
      const [model] = await Promise.all([
        modelLoader.getModel(),
        labelLoader.loadLabels()
      ]);

      if (!model) {
        throw new InferenceError('Model not available', 'MODEL_MISSING');
      }

      // 2. Preprocess the Image
      let inputTensor;
      const preprocessStartTime = performance.now();
      try {
        inputTensor = await imagePreprocessor.processImage(imageUri);
      } catch (e) {
        throw new InferenceError('Failed to preprocess image', 'CORRUPTED_IMAGE');
      }
      
      if (!inputTensor || !inputTensor.buffer) {
        throw new InferenceError('Invalid tensor generated', 'INVALID_TENSOR_SIZE');
      }
      
      const preprocessingTimeMs = performance.now() - preprocessStartTime;

      // 3. Execute Inference
      const inferenceStartTime = performance.now();
      let outputs;
      try {
        outputs = await model.run([inputTensor.buffer as ArrayBuffer]);
      } catch (e) {
        throw new InferenceError('Inference execution failed or timed out', 'INFERENCE_TIMEOUT');
      }
      
      const inferenceTimeMs = performance.now() - inferenceStartTime;

      if (!outputs || outputs.length === 0) {
        throw new InferenceError('Model returned no output', 'NO_OUTPUT');
      }

      // 4. Parse Outputs
      const confidences = new Float32Array(outputs[0] as ArrayBufferLike);
      
      // Build array of all predictions
      const predictions: { classIndex: number; confidence: number }[] = [];
      for (let i = 0; i < confidences.length; i++) {
        predictions.push({ classIndex: i, confidence: confidences[i] });
      }
      
      // Sort by confidence descending
      predictions.sort((a, b) => b.confidence - a.confidence);
      
      // 5. Map to App Category and Top-3
      const top3 = predictions.slice(0, 3);
      
      const topPredictions: RawInferenceResult[] = top3.map(p => {
        const labelString = labelLoader.getLabel(p.classIndex);
        const category = mapLabelToWasteCategory(labelString);
        const confidencePercent = parseFloat((p.confidence * 100).toFixed(1));
        return {
          category,
          confidence: p.confidence,
          confidencePercent
        };
      });

      return {
        topPredictions,
        inferenceTimeMs,
        preprocessingTimeMs
      };
    } catch (error) {
      if (error instanceof InferenceError) {
        throw error;
      }
      throw new InferenceError(
        error instanceof Error ? error.message : 'Unknown inference error', 
        'UNKNOWN_ERROR'
      );
    }
  }
};
