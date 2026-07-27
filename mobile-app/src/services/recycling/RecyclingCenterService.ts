import { RecyclingCenter } from './types';
import centersData from '../../../assets/data/recycling_centers.json';

class RecyclingCenterServiceImpl {
  private centers: RecyclingCenter[] = [];

  constructor() {
    this.loadCenters();
  }

  /**
   * Simulates loading centers from a local dataset.
   * This is designed to be easily replaced by an API or Firebase call later.
   */
  private loadCenters() {
    try {
      this.centers = centersData as RecyclingCenter[];
    } catch (error) {
      console.error('Failed to load recycling centers', error);
      this.centers = [];
    }
  }

  /**
   * Retrieves all available recycling centers.
   */
  async getAllCenters(): Promise<RecyclingCenter[]> {
    // Return a promise to simulate network delay/future API structure
    return Promise.resolve([...this.centers]);
  }
}

export const RecyclingCenterService = new RecyclingCenterServiceImpl();
