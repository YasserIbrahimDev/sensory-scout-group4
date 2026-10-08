import { directionsUrl } from './directions';

describe('directionsUrl', () => {
  it('TC-MAP-02: builds a directions link to the place coordinates', () => {
    expect(directionsUrl({ location: { lat: 33.2148, lng: -97.1331 } })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=33.2148,-97.1331',
    );
  });
});
