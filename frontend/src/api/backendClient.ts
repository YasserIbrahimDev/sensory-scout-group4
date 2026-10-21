/**
 * Hamza: real HTTP client for Yasser's FastAPI contract.
 * Import from UI only after coordinating the UI model and loading/error states.
 * Listing and search require Robert's and Soma's endpoints to be merged.
 */
import { adaptVenue, type PaginatedVenues, type VenueDetail, type VenueView } from './backendAdapter';

export interface PlaceSearchParams {
  page?: number;
  page_size?: number;
  q?: string;
  category?: string;
  city?: string;
  max_noise?: number;
  min_light?: number;
  max_light?: number;
  max_crowd?: number;
}

export class ApiRequestError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

const DEFAULT_API_URL = 'http://localhost:8000/api/v1';

function apiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();
  return (configured || DEFAULT_API_URL).replace(/\/+$/, '');
}

async function requestJson<T>(path: string, fetcher: typeof fetch = fetch): Promise<T> {
  let response: Response;
  try {
    response = await fetcher(`${apiBaseUrl()}${path}`, { headers: { Accept: 'application/json' } });
  } catch {
    throw new ApiRequestError(0, 'Unable to reach the Sensory Scout API. Please try again.');
  }
  if (!response.ok) {
    throw new ApiRequestError(response.status, response.status === 404
      ? 'Place not found.'
      : 'Unable to load Sensory Scout data. Please try again.');
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiRequestError(response.status, 'The API returned an invalid response.');
  }
}

export function parsePlaceId(placeId: string): number | null {
  if (!/^[1-9]\d*$/.test(placeId)) return null;
  const parsed = Number(placeId);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

/** Implemented endpoint: GET /places/{place_id}. */
export async function fetchBackendPlace(placeId: string, fetcher?: typeof fetch): Promise<VenueView | null> {
  const id = parsePlaceId(placeId);
  if (id === null) return null;
  try {
    return adaptVenue(await requestJson<VenueDetail>(`/places/${id}`, fetcher));
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}

/** Planned endpoint: requires Robert's listing route and Soma's filters. */
export async function fetchBackendPlaces(
  params: PlaceSearchParams = {},
  fetcher?: typeof fetch,
): Promise<{ items: VenueView[]; pagination: Omit<PaginatedVenues, 'items'> }> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  }
  const suffix = query.size ? `?${query.toString()}` : '';
  const data = await requestJson<PaginatedVenues>(`/places${suffix}`, fetcher);
  const { items, ...pagination } = data;
  return { items: items.map(adaptVenue), pagination };
}
