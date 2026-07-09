import { DetectionResult } from '../../types/DetectionResult';
import { WasteCategory } from '../../constants/wasteCategories';

/**
 * Mapping from AI model class indices to app WasteCategory.
 *
 * Model classes (in order):
 * 0: Plastic
 * 1: Paper
 * 2: Glass
 * 3: Metal
 * 4: Cardboard
 * 5: Organic
 * 6: Battery
 * 7: E-waste
 *
 * App categories:
 * - Plastic -> Plastic
 * - Paper -> Paper (includes Cardboard)
 * - Glass -> Glass
 * - Metal -> Metal
 * - Organic -> Organic
 * - E-Waste (includes Battery and E-waste)
 */
const MODEL_CLASS_NAMES = [
  'Plastic',
  'Paper',
  'Glass',
  'Metal',
  'Cardboard',
  'Organic',
  'Battery',
  'E-waste',
];

const MODEL_CLASS_TO_WASTE_CATEGORY: Record<number, WasteCategory> = {
  0: WasteCategory.PLASTIC,    // Plastic
  1: WasteCategory.PAPER,      // Paper
  2: WasteCategory.GLASS,      // Glass
  3: WasteCategory.METAL,      // Metal
  4: WasteCategory.PAPER,      // Cardboard -> Paper
  5: WasteCategory.ORGANIC,    // Organic
  6: WasteCategory.E_WASTE,    // Battery -> E-Waste
  7: WasteCategory.E_WASTE,    // E-waste
};

// Confidence threshold below which we report as UNKNOWN
const MIN_CONFIDENCE_THRESHOLD = 0.3;

/**
 * detectionService provides inference capabilities for waste image classification.
 *
 * The service:
 * - Loads the TensorFlow Lite model from assets
 * - Preprocesses camera images (resize, normalize)
 * - Performs inference using the TFLite model
 * - Maps model predictions to app waste categories
 * - Returns structured detection results with confidence scores
 *
 * This is a placeholder implementation that can be extended to:
 * - Use actual TFLite model loading when the model file is embedded
 * - Handle real camera input from Expo Camera
 * - Cache the model for faster inference on subsequent calls
 * - Support batched inference for multiple images
 */
export const detectionService = {
  /**
   * Detect waste in an image.
   *
   * @param imageUri URI to the image file to analyze
   * @returns A promise resolving to the detection result with waste category and confidence
   *
   * @example
   * const result = await detectionService.detectWaste('file://path/to/image.jpg');
   * console.log(`Detected: ${result.category} with ${result.confidence}% confidence`);
   */
  detectWaste: async (imageUri: string): Promise<DetectionResult> => {
    try {
      // TODO: Implement actual TensorFlow Lite inference using:
      // 1. Load TFLite model from assets (waste_classifier.tflite)
      // 2. Preprocess image: load, resize to 224x224, normalize to [0, 1]
      // 3. Run inference: model.predict(preprocessedImage)
      // 4. Extract confidence scores from output logits
      // 5. Map class index to WasteCategory using MODEL_CLASS_TO_WASTE_CATEGORY
      // 6. Return DetectionResult with category and confidence

      // Implementation reference for React Native with TensorFlow Lite:
      //
      // import * as tf from '@tensorflow/tfjs';
      // import '@tensorflow/tfjs-react-native';
      // import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
      //
      // const model = await tf.loadGraphModel(
      //   bundleResourceIO(
      //     require('../../../assets/models/waste_classifier.tflite'),
      //     require('../../../assets/models/waste_classifier.json')
      //   )
      // );
      //
      // const imageData = await getImageAsNormalizedTensor(imageUri);
      // const predictions = model.predict(imageData) as tf.Tensor;
      // const confidences = await predictions.data();
      // const classIndex = Array.from(confidences).indexOf(Math.max(...confidences));
      // const confidence = confidences[classIndex];
      //
      // return {
      //   category: mapModelClassToCategory(classIndex, confidence),
      //   confidence: Math.round(confidence * 100),
      // };

      // Current placeholder: return UNKNOWN until TFLite is integrated
      return {
        category: WasteCategory.UNKNOWN,
        confidence: 0,
      };
    } catch (error) {
      console.error('Detection service error:', error);
      return {
        category: WasteCategory.UNKNOWN,
        confidence: 0,
      };
    }
  },

  /**
   * Get all supported waste categories.
   *
   * @returns Array of WasteCategory enum values supported by the model
   */
  getSupportedCategories: (): WasteCategory[] => {
    return Object.values(WasteCategory).filter(cat => cat !== WasteCategory.UNKNOWN);
  },

  /**
   * Get the model class names in order.
   *
   * @returns Array of class names from the trained model
   *
   * @internal
   */
  getModelClassNames: (): string[] => {
    return MODEL_CLASS_NAMES;
  },

  /**
   * Map a model class index to a WasteCategory with confidence filtering.
   *
   * @param classIndex Index from the model output
   * @param confidence Raw confidence score from [0, 1]
   * @returns WasteCategory, or UNKNOWN if confidence is too low
   *
   * @internal
   */
  mapClassToCategory: (classIndex: number, confidence: number): WasteCategory => {
    if (confidence < MIN_CONFIDENCE_THRESHOLD) {
      return WasteCategory.UNKNOWN;
    }
    return MODEL_CLASS_TO_WASTE_CATEGORY[classIndex] ?? WasteCategory.UNKNOWN;
  },
};
