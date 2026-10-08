import type { Place } from '../types/place';
import type { SearchFilters } from '../lib/searchFilters';
import { emptyFilters } from '../lib/searchFilters';
import { categoryLabels } from '../lib/sensoryLabels';
import { mockPlaces } from '../data/mockPlaces';

// All data loading goes through this file. Pages never import mock data directly.
// In "UI: Connect Sprint 1 pages to the API", only this file changes to call the
// FastAPI backend at import.meta.env.VITE_API_URL.

/** Places shown under "Popular near you" on the Home page. */
export async function getPopularPlaces(limit = 3): Promise<Place[]> {
  return mockPlaces.slice(0, limit);
}

/** One place by id, or null if it does not exist. */
export async function getPlace(placeId: string): Promise<Place | null> {
  return mockPlaces.find((place) => place.id === placeId) ?? null;
}

/** Every place, for the Map page. */
export async function getPlaces(): Promise<Place[]> {
  return searchPlaces(emptyFilters);
}

/**
 * Places that match the search text and filters.
 * Within a group (for example Noise Level) any selected level matches;
 * across groups every group must match.
 */
export async function searchPlaces(filters: SearchFilters): Promise<Place[]> {
  return mockPlaces.filter((place) => matchesFilters(place, filters));
}

// Mock-only. The backend will do this filtering once the API is connected.
function matchesFilters(place: Place, filters: SearchFilters): boolean {
  const q = filters.q.trim().toLowerCase();
  if (q) {
    const haystack = [place.name, categoryLabels[place.category], place.city, place.address]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (filters.noise.length && !filters.noise.includes(place.sensory.noise)) return false;
  if (filters.lighting.length && !filters.lighting.includes(place.sensory.lighting)) return false;
  if (filters.crowd.length && !filters.crowd.includes(place.sensory.crowd)) return false;
  if (filters.category && place.category !== filters.category) return false;
  if (filters.wheelchair && !place.accessibility.wheelchair) return false;
  if (filters.sensoryRoom && !place.accessibility.sensoryRoom) return false;
  return true;
}
