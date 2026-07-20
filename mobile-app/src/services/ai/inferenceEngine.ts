import { modelLoader } from './modelLoader';
import { imagePreprocessor } from './imagePreprocessor';
import { WasteCategory } from '../../constants/wasteCategories';

const MODEL_CLASS_TO_WASTE_CATEGORY: Record<number, WasteCategory> = {
  0: WasteCategory.PLASTIC,
  1: WasteCategory.PAPER,
  2: WasteCategory.GLASS,
  3: WasteCategory.METAL,
  4: WasteCategory.PAPER, // Cardboard
  5: WasteCategory.ORGANIC,
  6: WasteCategory.E_WASTE, // Battery
  7: WasteCategory.E_WASTE, // E-waste
};

export const inferenceEngine = {
  /**
   * Run the end-to-end inference pipeline:
   * 1. Load model
   * 2. Preprocess image
   * 3. Run inference
   * 4. Post-process to find the best category
   */
  async runInference(imageUri: string): Promise<{ category: WasteCategory, confidence: number, inferenceTimeMs: number }> {
    // 1. Ensure Model is Loaded
    const model = await modelLoader.getModel();

    // 2. Preprocess the Image
    const inputTensor = await imagePreprocessor.processImage(imageUri);

    // 3. Execute Inference
    const inferenceStartTime = performance.now();
    // react-native-fast-tflite requires an array of input ArrayBuffers
    const outputs = await model.run([inputTensor.buffer as ArrayBuffer]);
    const inferenceTimeMs = performance.now() - inferenceStartTime;

    if (!outputs || outputs.length === 0) {
      throw new Error('Model returned no output');
    }

    // 4. Parse Outputs
    // outputs[0] is ArrayBuffer
    const confidences = new Float32Array(outputs[0] as ArrayBufferLike);

    
    let maxConfidence = 0;
    let bestClassIndex = 0;

    for (let i = 0; i < confidences.length; i++) {
      const conf = confidences[i];
      if (conf > maxConfidence) {
        maxConfidence = conf;
        bestClassIndex = i;
      }
    }

    // 5. Map to App Category
    const category = MODEL_CLASS_TO_WASTE_CATEGORY[bestClassIndex] ?? WasteCategory.UNKNOWN;

    return {
      category,
      confidence: maxConfidence,
      inferenceTimeMs
    };
  }
};
