import type { DemoSensoryPreferences, PreferenceScore } from '../types/user';
import { adaptVenue } from './backendAdapter';
import type { VenueDetail } from './backendAdapter';
import type { Place, PlaceCategory } from '../types/place';

interface DemoPreferencesResponse {
  demo_user: string;
  preferences: DemoSensoryPreferences;
}

interface DemoRecommendationsResponse {
  demo_user: string;
  items: Array<{ venue: VenueDetail; score: number; reason: string }>;
}

export class DemoApiError extends Error {
  constructor(message: string, public readonly status = 0) {
    super(message);
    this.name = 'DemoApiError';
  }
}

function baseUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:8000/api/v1';
  return configured.replace(/\/+$/, '');
}

async function request<T>(path: string, init: RequestInit = {}, fetcher: typeof fetch = fetch): Promise<T> {
  let response: Response;
  try {
    response = await fetcher(`${baseUrl()}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
    });
  } catch {
    throw new DemoApiError('Cannot reach the Sensory Scout demo API. Make sure the backend is running.');
  }
  if (!response.ok) {
    const message = response.status === 404
      ? 'The demo API is unavailable. Check that demo mode is enabled in the backend.'
      : response.status === 409
        ? 'The configured demo identity conflicts with an existing account.'
        : 'The demo API could not complete the request. Please try again.';
    throw new DemoApiError(message, response.status);
  }
  try {
    return await response.json() as T;
  } catch {
    throw new DemoApiError('The demo API returned an invalid response.', response.status);
  }
}

export async function fetchDemoPreferences(fetcher?: typeof fetch): Promise<DemoPreferencesResponse> {
  return request<DemoPreferencesResponse>('/demo/preferences', {}, fetcher);
}

export async function saveDemoPreferences(
  preferences: DemoSensoryPreferences,
  fetcher?: typeof fetch,
): Promise<DemoSensoryPreferences> {
  const response = await request<DemoPreferencesResponse>('/demo/preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences),
  }, fetcher);
  return response.preferences;
}

function category(value: string): PlaceCategory {
  const allowed: PlaceCategory[] = ['library', 'park', 'cafe', 'museum', 'restaurant', 'store', 'community', 'market', 'other'];
  return allowed.includes(value as PlaceCategory) ? value as PlaceCategory : 'other';
}

function toPlace(venue: VenueDetail): Place {
  const adapted = adaptVenue(venue);
  return {
    id: adapted.id,
    name: adapted.name,
    category: category(adapted.category),
    city: adapted.city,
    address: adapted.address,
    description: adapted.description,
    rating: null,
    reviewCount: adapted.reviewCount,
    imageUrl: adapted.imageUrl ?? undefined,
    location: adapted.location,
    isSample: adapted.isSample,
    sensory: adapted.sensory,
    accessibility: {},
  };
}

export interface DemoRecommendation {
  place: Place;
  reason: string;
  score: number;
}

export async function fetchDemoRecommendations(limit = 3, fetcher?: typeof fetch): Promise<DemoRecommendation[]> {
  const response = await request<DemoRecommendationsResponse>(`/demo/recommendations?limit=${encodeURIComponent(limit)}`, {}, fetcher);
  return response.items.map((item) => ({ place: toPlace(item.venue), reason: item.reason, score: item.score }));
}

export function isPreferenceScore(value: unknown): value is PreferenceScore {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}
