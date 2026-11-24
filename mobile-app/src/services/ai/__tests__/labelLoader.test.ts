import { labelLoader } from '../labelLoader';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn(),
  },
}));

jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
}));

describe('labelLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    labelLoader.resetCache();
  });

  it('loads and parses 8 waste classification labels cleanly', async () => {
    const mockLabelsContent = 'Plastic\nPaper\nGlass\nMetal\nCardboard\nOrganic\nBattery\nE-waste';
    const mockAsset = {
      downloadAsync: jest.fn().mockResolvedValue(true),
      localUri: 'file:///path/to/labels.txt',
    };
    (Asset.fromModule as jest.Mock).mockReturnValue(mockAsset);
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(mockLabelsContent);

    await labelLoader.loadLabels();

    expect(labelLoader.getLabel(0)).toBe('Plastic');
    expect(labelLoader.getLabel(1)).toBe('Paper');
    expect(labelLoader.getLabel(2)).toBe('Glass');
    expect(labelLoader.getLabel(3)).toBe('Metal');
    expect(labelLoader.getLabel(4)).toBe('Cardboard');
    expect(labelLoader.getLabel(5)).toBe('Organic');
    expect(labelLoader.getLabel(6)).toBe('Battery');
    expect(labelLoader.getLabel(7)).toBe('E-waste');
  });

  it('returns Unknown for out of bounds indices', () => {
    expect(labelLoader.getLabel(-1)).toBe('Unknown');
    expect(labelLoader.getLabel(999)).toBe('Unknown');
  });

  it('strips UTF-8 BOM if present in raw file content', async () => {
    const bomContent = '\ufeffPlastic\nPaper\nGlass\nMetal\nCardboard\nOrganic\nBattery\nE-waste';
    const mockAsset = {
      downloadAsync: jest.fn().mockResolvedValue(true),
      localUri: 'file:///path/to/labels.txt',
    };
    (Asset.fromModule as jest.Mock).mockReturnValue(mockAsset);
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(bomContent);

    await labelLoader.loadLabels();

    expect(labelLoader.getLabel(0)).not.toContain('\ufeff');
    expect(labelLoader.getLabel(0)).toBe('Plastic');
  });

  it('getAllLabels returns defensive clone of labels array', async () => {
    const mockLabelsContent = 'Plastic\nPaper';
    const mockAsset = {
      downloadAsync: jest.fn().mockResolvedValue(true),
      localUri: 'file:///path/to/labels.txt',
    };
    (Asset.fromModule as jest.Mock).mockReturnValue(mockAsset);
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(mockLabelsContent);

    await labelLoader.loadLabels();
    const all = labelLoader.getAllLabels();
    expect(Array.isArray(all)).toBe(true);
    expect(all).toEqual(['Plastic', 'Paper']);
  });
});
