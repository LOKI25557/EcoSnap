import { WasteCategory } from '../constants/wasteCategories';

export interface PredictionResult {
  category: WasteCategory;
  confidence: number;       // 0 to 1
  confidencePercent: number; // 0 to 100
}

export interface DetectedWaste {
  primaryCategory: WasteCategory;
  confidence: number;
  confidencePercent: number;
  topPredictions: PredictionResult[];
}

export interface InferenceMetadata {
  inferenceTimeMs: number;
  preprocessingTimeMs?: number;
  totalLatencyMs?: number;
  modelVersion: string;
  imageSize?: { width: number; height: number };
  timestamp: number;
}

export interface DetectionResponse {
  result: DetectedWaste;
  metadata: InferenceMetadata;
}
