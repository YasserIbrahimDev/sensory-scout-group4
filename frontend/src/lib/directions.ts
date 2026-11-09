import type { Place } from '../types/place';

/**
 * A link that opens turn-by-turn directions to the place in the user's maps app
 * (Google Maps on the web, or the Google Maps app on phones). No API key needed.
 */
export function directionsUrl(place: Pick<Place, 'location' | 'address'>): string {
  // Without a map position, the address still gets the user there.
  const destination = place.location
    ? `${place.location.lat},${place.location.lng}`
    : encodeURIComponent(place.address);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}
