import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

class LabelLoader {
  private labels: string[] = [];
  private loadPromise: Promise<void> | null = null;

  /**
   * Load and parse labels from assets/models/labels.txt
   * Uses caching to only load once.
   */
  async loadLabels(): Promise<void> {
    if (this.labels.length > 0) {
      return;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      try {
        const asset = Asset.fromModule(require('../../../assets/models/labels.txt'));
        await asset.downloadAsync();
        
        const fileUri = asset.localUri || asset.uri;
        if (!fileUri) {
          throw new Error('Could not resolve labels.txt URI');
        }

        const fileContent = await FileSystem.readAsStringAsync(fileUri);
        
        this.labels = fileContent
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
          
      } catch (error) {
        this.loadPromise = null;
        console.error('Failed to load labels.txt', error);
        throw new Error('Failed to load model labels');
      }
    })();

    return this.loadPromise;
  }

  /**
   * Get label by its class index
   */
  getLabel(index: number): string {
    if (index >= 0 && index < this.labels.length) {
      return this.labels[index];
    }
    return 'Unknown';
  }

  /**
   * Get all loaded labels
   */
  getAllLabels(): string[] {
    return [...this.labels];
  }
}

export const labelLoader = new LabelLoader();
