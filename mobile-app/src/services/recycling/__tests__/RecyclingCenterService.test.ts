import { CenterFilter } from '../CenterFilter';
import { CenterSearch } from '../CenterSearch';
import { RecyclingCenter } from '../types';

describe('RecyclingCenter Services', () => {
  const mockCenters: RecyclingCenter[] = [
    {
      id: 'c1',
      name: 'EcoGreen Recycling Depot',
      address: '123 Pine St, Cityville',
      coordinate: { latitude: 37.7749, longitude: -122.4194 },
      acceptedMaterials: ['Plastic', 'Paper', 'Glass'],
      rating: 4.8,
      contactNumber: '555-0199',
      openingHours: '08:00 - 17:00',
    },
    {
      id: 'c2',
      name: 'Metro Scrap & Metal Yard',
      address: '456 Industrial Way, Cityville',
      coordinate: { latitude: 37.7849, longitude: -122.4094 },
      acceptedMaterials: ['Metal', 'E-waste', 'Battery'],
      rating: 3.9,
      contactNumber: '555-0200',
      openingHours: '09:00 - 18:00',
    },
  ];

  describe('CenterFilter', () => {
    it('filters centers by accepted material case-insensitively', () => {
      const plasticCenters = CenterFilter.byMaterial(mockCenters, 'plastic');
      expect(plasticCenters.length).toBe(1);
      expect(plasticCenters[0].id).toBe('c1');

      const metalCenters = CenterFilter.byMaterial(mockCenters, 'METAL');
      expect(metalCenters.length).toBe(1);
      expect(metalCenters[0].id).toBe('c2');
    });

    it('filters centers by minimum rating', () => {
      const topRated = CenterFilter.byMinimumRating(mockCenters, 4.0);
      expect(topRated.length).toBe(1);
      expect(topRated[0].id).toBe('c1');
    });
  });

  describe('CenterSearch', () => {
    it('sorts centers by nearest distance to user coordinates', () => {
      const userLoc = { latitude: 37.7750, longitude: -122.4190 };
      const sorted = CenterSearch.sortByNearest(mockCenters, userLoc);

      expect(sorted[0].id).toBe('c1');
      expect(sorted[0].distanceKm).toBeLessThan(sorted[1].distanceKm);
    });

    it('searches centers by name or address keywords', () => {
      const searchByName = CenterSearch.searchByKeyword(mockCenters, 'Scrap');
      expect(searchByName.length).toBe(1);
      expect(searchByName[0].id).toBe('c2');

      const searchByAddress = CenterSearch.searchByKeyword(mockCenters, 'Pine St');
      expect(searchByAddress.length).toBe(1);
      expect(searchByAddress[0].id).toBe('c1');
    });
  });
});
