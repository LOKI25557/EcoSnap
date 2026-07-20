import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';

class ModelLoader {
  private model: TensorflowModel | null = null;
  private initializationPromise: Promise<TensorflowModel> | null = null;

  /**
   * Returns the loaded TensorFlow Lite model.
   * Implements a singleton pattern to ensure the model is only loaded once.
   */
  async getModel(): Promise<TensorflowModel> {
    if (this.model) {
      return this.model;
    }
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        // Load the bundled TFLite model from assets.
        // If the file is missing during build, the bundler will warn, 
        // but this allows the app to cleanly resolve it.
        const loadedModel = await loadTensorflowModel(
          require('../../../assets/models/waste_classifier.tflite'),
          []
        );
        this.model = loadedModel;
        return loadedModel;
      } catch (error) {
        this.initializationPromise = null; // allow retrying if it failed
        console.error('Failed to load TFLite model', error);
        throw new Error('Model initialization failed: ' + (error instanceof Error ? error.message : String(error)));
      }
    })();

    return this.initializationPromise;
  }
}

export const modelLoader = new ModelLoader();
