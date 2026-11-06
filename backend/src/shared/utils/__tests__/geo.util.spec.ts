import { describe, it, expect } from 'vitest';
import { haversineDistanceMeters } from '../geo.util.js';

describe('haversineDistanceMeters', () => {
  it('should return 0 meters for identical coordinates', () => {
    const lat = 27.7172;
    const lon = 85.324;
    expect(haversineDistanceMeters(lat, lon, lat, lon)).toBe(0);
  });

  it('should calculate approximate distance between Kathmandu locations accurately', () => {
    // Naxal (27.7172, 85.3240) to Maharajgunj (27.7360, 85.3308) ~ 2.2 km
    const distance = haversineDistanceMeters(27.7172, 85.324, 27.736, 85.3308);
    expect(distance).toBeGreaterThan(2000);
    expect(distance).toBeLessThan(2500);
  });

  it('should detect micro-movements under 10 meters', () => {
    // Very small GPS jitter
    const distance = haversineDistanceMeters(27.7172, 85.324, 27.71722, 85.32402);
    expect(distance).toBeLessThan(10);
  });
});
