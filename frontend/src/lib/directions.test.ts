import { directionsUrl } from './directions';

describe('directionsUrl', () => {
  it('TC-MAP-02: builds a directions link to the place coordinates', () => {
    expect(directionsUrl({ location: { lat: 33.2148, lng: -97.1331 }, address: '1 Main St' })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=33.2148,-97.1331',
    );
  });

  it('TC-API-12: uses the address when the map position is unknown', () => {
    expect(directionsUrl({ location: null, address: '502 Oakland St, Denton, TX' })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=502%20Oakland%20St%2C%20Denton%2C%20TX',
    );
  });
});
