import type { Place, PlaceCategory } from '../types/place';
import type { VenueView } from './backendAdapter';
import { fetchBackendPlace, fetchBackendPlaces } from './backendClient';
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
    // The API has review counts but no star ratings yet.
    rating: null,
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
export async function fetchAllPlaces(): Promise<Place[]> {
  const places: Place[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { items, pagination } = await fetchBackendPlaces({ page, page_size: PAGE_SIZE });
    places.push(...items.map(toPlace));
    if (!pagination.has_next) break;
  }
  return places;
}
