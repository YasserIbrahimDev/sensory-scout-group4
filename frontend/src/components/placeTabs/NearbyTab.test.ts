import { formatDistance } from './NearbyTab';

describe('formatDistance', () => {
  it('TC-DETAILS-22: shows distance in miles with one decimal place', () => {
    expect(formatDistance(0.04)).toBe('Less than 0.1 mi away');
    expect(formatDistance(1.26)).toBe('1.3 mi away');
  });
});
