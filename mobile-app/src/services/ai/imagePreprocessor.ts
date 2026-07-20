import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as jpeg from 'jpeg-js';
import { toByteArray } from 'base64-js';

// The TFLite model input size. Adjust if your specific model requires a different size.
const INPUT_SIZE = 224;

export const imagePreprocessor = {
  /**
   * Preprocess the captured image URI for TFLite inference.
   * 1. Resizes to 224x224
   * 2. Extracts Base64
   * 3. Decodes JPEG into raw pixels
   * 4. Converts to Float32Array (normalized)
   * 
   * Note: We assume the model expects a normalized Float32 array [0, 1].
   * If your model is quantized and expects UInt8, you can return a Uint8Array.
   */
  async processImage(imageUri: string): Promise<Float32Array> {
    try {
      // 1. Resize the image to model input size and extract base64
      const manipulated = await manipulateAsync(
        imageUri,
        [{ resize: { width: INPUT_SIZE, height: INPUT_SIZE } }],
        { compress: 0.8, format: SaveFormat.JPEG, base64: true }
      );

      if (!manipulated.base64) {
        throw new Error('Failed to extract base64 from resized image');
      }

      // 2. Decode Base64 to binary byte array
      const jpegBytes = toByteArray(manipulated.base64);

      // 3. Decode JPEG to RGBA pixels using pure JS decoder
      // This is fast enough for static images of size 224x224.
      const decoded = jpeg.decode(jpegBytes, { useTArray: true });
      const { data, width, height } = decoded;

      // 4. Convert RGBA to RGB and normalize to [0, 1]
      const numPixels = width * height;
      const rgbArray = new Float32Array(numPixels * 3);

      for (let i = 0; i < numPixels; i++) {
        // data contains [R, G, B, A, R, G, B, A, ...]
        rgbArray[i * 3] = data[i * 4] / 255.0;         // R
        rgbArray[i * 3 + 1] = data[i * 4 + 1] / 255.0; // G
        rgbArray[i * 3 + 2] = data[i * 4 + 2] / 255.0; // B
      }

      return rgbArray;
    } catch (error) {
      console.error('Image preprocessing failed', error);
      throw new Error('Image preprocessing failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
};
