import type { Place, PlaceCategory } from '../types/place';
import type { VenueView } from './backendAdapter';
import { fetchBackendPlace, fetchBackendPlaces, type PlaceSearchParams } from './backendClient';
import { categoryLabels } from '../lib/sensoryLabels';

// Turns Hamza's API results (VenueView) into the Place shape the pages use.
// Anything the API does not send stays empty, so the pages say "Not reported yet"
// instead of showing a made-up value.

const KNOWN_CATEGORIES = Object.keys(categoryLabels) as PlaceCategory[];

/** The API allows at most 100 places per page. */
const PAGE_SIZE = 100;
/** Safety limit so a broken API response can't loop forever. */
const MAX_PAGES = 50;

function toCategory(category: string): PlaceCategory {
  const value = category.trim().toLowerCase() as PlaceCategory;
  return KNOWN_CATEGORIES.includes(value) ? value : 'other';
}

export function toPlace(venue: VenueView): Place {
  return {
    id: venue.id,
    name: venue.name,
    category: toCategory(venue.category),
    city: venue.city,
    address: venue.address,
    description: venue.description,
    // Overall rating is calculated from the written review star scores.
    rating: venue.overallRating,
    reviewCount: venue.reviewCount,
    imageUrl: venue.imageUrl ?? undefined,
    location: venue.location,
    isSample: venue.isSample,
    sensory: {
      noise: venue.sensory.noise,
      lighting: venue.sensory.lighting,
      crowd: venue.sensory.crowd,
    },
    // The API counts visitor reports; it does not confirm access, so leave it unverified.
    accessibility: {},
  };
}

/** One place from GET /places/{id}, or null if it does not exist. */
export async function fetchPlace(placeId: string): Promise<Place | null> {
  const venue = await fetchBackendPlace(placeId);
  return venue ? toPlace(venue) : null;
}

/** Every place from GET /places, following the pages until the last one. */
async function loadPlaces(filters: Pick<PlaceSearchParams, 'q' | 'category'> = {}): Promise<Place[]> {
  const places: Place[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { items, pagination } = await fetchBackendPlaces({ ...filters, page, page_size: PAGE_SIZE });
    places.push(...items.map(toPlace));
    if (!pagination.has_next) break;
  }
  return places;
}

// Share in-flight loads across components and React development remounts.
// Briefly reuse completed results when navigating between pages.
const placeLoads = new Map<string, { promise: Promise<Place[]>; expires: number }>();
const CACHE_MS = 15_000;

export function fetchAllPlaces(filters: Pick<PlaceSearchParams, 'q' | 'category'> = {}): Promise<Place[]> {
  const key = JSON.stringify([import.meta.env.VITE_API_URL, filters.q ?? '', filters.category ?? '']);
  const cached = placeLoads.get(key);
  if (cached && cached.expires > Date.now()) return cached.promise;
  const entry = { promise: Promise.resolve([] as Place[]), expires: Infinity };
  entry.promise = loadPlaces(filters).then((places) => {
    entry.expires = Date.now() + CACHE_MS;
    return places;
  }).catch((error) => {
    if (placeLoads.get(key) === entry) placeLoads.delete(key);
    throw error;
  });
  placeLoads.set(key, entry);
  return entry.promise;
}

export function clearPlacesCache(): void {
  placeLoads.clear();
}
