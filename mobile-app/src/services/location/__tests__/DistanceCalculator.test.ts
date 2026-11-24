import { DistanceCalculator } from '../DistanceCalculator';

describe('DistanceCalculator', () => {
  it('calculates straight-line Haversine distance accurately in kilometers', () => {
    // San Francisco to San Jose (~67-70 km)
    const sf = { latitude: 37.7749, longitude: -122.4194 };
    const sj = { latitude: 37.3382, longitude: -121.8863 };

    const distance = DistanceCalculator.calculateDistance(sf, sj);
    expect(distance).toBeGreaterThan(65);
    expect(distance).toBeLessThan(75);
  });

  it('returns 0 for identical coordinates', () => {
    const loc = { latitude: 40.7128, longitude: -74.0060 };
    expect(DistanceCalculator.calculateDistance(loc, loc)).toBe(0);
  });

  it('estimates walking and driving time reasonably based on distance', () => {
    // 5 km at 5 km/h = 60 minutes walking
    expect(DistanceCalculator.estimateWalkingTime(5)).toBe(60);

    // 15 km at 30 km/h = 30 minutes driving
    expect(DistanceCalculator.estimateDrivingTime(15)).toBe(30);
  });

  it('formats distance nicely into meters (< 1km) or kilometers (>= 1km)', () => {
    expect(DistanceCalculator.formatDistance(0.45)).toBe('450 m');
    expect(DistanceCalculator.formatDistance(1.23)).toBe('1.2 km');
  });
});
