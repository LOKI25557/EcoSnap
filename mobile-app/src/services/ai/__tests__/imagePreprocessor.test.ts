import { imagePreprocessor } from '../imagePreprocessor';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as jpeg from 'jpeg-js';

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
  },
}));

jest.mock('jpeg-js', () => ({
  decode: jest.fn(),
}));

describe('imagePreprocessor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resizes image to 224x224 and normalizes RGBA buffer to [0.0, 1.0] Float32Array', async () => {
    const mockBase64 = 'AQIDBA=='; // Simple valid base64
    (manipulateAsync as jest.Mock).mockResolvedValue({
      base64: mockBase64,
      width: 224,
      height: 224,
      uri: 'file:///manipulated.jpg',
    });

    // Mock 2x2 test image for simplicity: 4 pixels, RGBA = 16 bytes
    // Pixel 0: [255, 0, 128, 255]
    // Pixel 1: [0, 255, 64, 255]
    const mockDecodedData = new Uint8Array([
      255, 0, 128, 255,
      0, 255, 64, 255,
      128, 128, 128, 255,
      50, 100, 150, 255
    ]);

    (jpeg.decode as jest.Mock).mockReturnValue({
      data: mockDecodedData,
      width: 2,
      height: 2,
    });

    const result = await imagePreprocessor.processImage('file:///input.jpg');

    expect(manipulateAsync).toHaveBeenCalledWith(
      'file:///input.jpg',
      [{ resize: { width: 224, height: 224 } }],
      { compress: 0.8, format: SaveFormat.JPEG, base64: true }
    );

    expect(result).toBeInstanceOf(Float32Array);
    expect(result.length).toBe(2 * 2 * 3); // 4 pixels * 3 RGB channels = 12 floats

    // Check normalization: pixel 0 R is 255/255 = 1.0
    expect(result[0]).toBeCloseTo(1.0);
    // pixel 0 G is 0/255 = 0.0
    expect(result[1]).toBeCloseTo(0.0);
    // pixel 0 B is 128/255 = 0.5019
    expect(result[2]).toBeCloseTo(128 / 255);
  });

  it('throws an error if manipulateAsync does not return base64', async () => {
    (manipulateAsync as jest.Mock).mockResolvedValue({
      width: 224,
      height: 224,
      uri: 'file:///no_base64.jpg',
    });

    await expect(imagePreprocessor.processImage('file:///input.jpg')).rejects.toThrow(
      'Failed to extract base64 from resized image'
    );
  });

  it('throws an error if image manipulation fails', async () => {
    (manipulateAsync as jest.Mock).mockRejectedValue(new Error('Out of memory'));

    await expect(imagePreprocessor.processImage('file:///bad.jpg')).rejects.toThrow(
      'Image preprocessing failed: Out of memory'
    );
  });
});
