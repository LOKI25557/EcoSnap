import { RecyclingCenter } from './types';

export class CenterFilter {
  /**
   * Filters centers by a specific accepted material.
   */
  static byMaterial(centers: RecyclingCenter[], material: string): RecyclingCenter[] {
    if (!material) return centers;
    const lowerMaterial = material.toLowerCase();
    
    return centers.filter(center => 
      center.acceptedMaterials.some(m => m.toLowerCase().includes(lowerMaterial))
    );
  }

  /**
   * Filters centers with a rating greater than or equal to the minimum rating.
   */
  static byMinimumRating(centers: RecyclingCenter[], minRating: number): RecyclingCenter[] {
    return centers.filter(center => center.rating >= minRating);
  }
}
