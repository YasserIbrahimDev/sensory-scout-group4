import type { Place } from '../types/place';

/**
 * A link that opens turn-by-turn directions to the place in the user's maps app
 * (Google Maps on the web, or the Google Maps app on phones). No API key needed.
 */
export function directionsUrl(place: Pick<Place, 'location'>): string {
  const { lat, lng } = place.location;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
