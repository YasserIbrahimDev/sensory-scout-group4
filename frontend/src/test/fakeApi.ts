import type { VenueDetail } from '../api/backendAdapter';

// A stand-in for the FastAPI backend, shaped like backend/API_CONTRACT.md,
// so tests can check the API path without a running server.

export function venue(overrides: Partial<VenueDetail> & Pick<VenueDetail, 'id' | 'name'>): VenueDetail {
  return {
    category: 'library',
    address: `${overrides.id} Example Lane (fictional address)`,
    city: 'Sample City',
    image_url: null,
    is_sample: true,
    slug: `venue-${overrides.id}`,
    description: 'Fictional venue for testing Sensory Scout.',
    latitude: null,
    longitude: null,
    external_map_provider: null,
    external_map_id: null,
    created_at: '2026-10-14T14:00:00Z',
    updated_at: '2026-10-14T14:00:00Z',
    review_count: 0,
    sensory_summary: {
      ratings_count: 0, noise_rating: null, light_rating: null, crowd_rating: null,
      noise_count: 0, light_count: 0, crowd_count: 0,
    },
    accessibility_summary: { accessible_reports: 0, inaccessible_reports: 0, unknown_reports: 0 },
    ...overrides,
  };
}

/** Rated, on the map: quiet, dim, low crowds. */
export const readingRoom = venue({
  id: 1,
  name: 'Sample Willow Reading Room',
  latitude: 33.21,
  longitude: -97.13,
  review_count: 2,
  sensory_summary: {
    ratings_count: 2, noise_rating: 1.5, light_rating: 1, crowd_rating: 2,
    noise_count: 2, light_count: 2, crowd_count: 2,
  },
});

/** Rated, on the map: loud, bright, crowded. */
export const foodHall = venue({
  id: 2,
  name: 'Sample Busy Food Hall',
  category: 'restaurant',
  latitude: 33.22,
  longitude: -97.14,
  review_count: 1,
  sensory_summary: {
    ratings_count: 1, noise_rating: 5, light_rating: 5, crowd_rating: 5,
    noise_count: 1, light_count: 1, crowd_count: 1,
  },
});

/** Nobody has rated it, it has no map position, and its category is new to the app. */
export const lounge = venue({ id: 3, name: 'Sample Community Lounge', category: 'Community' });

export const allVenues = [foodHall, lounge, readingRoom];

/** What the fake server does for each request. */
export type FakeResponse = { status: number; body?: unknown } | 'offline';

/**
 * Replaces fetch with a fake backend. By default it serves `venues` from
 * GET /places (paged) and GET /places/{id}. `override` can answer any request first.
 */
export function mockApi(venues = allVenues, override?: (url: URL) => FakeResponse | undefined) {
  const fetcher = vi.fn(async (input: string | URL | Request) => {
    const url = new URL(String(input));
    const answer = override?.(url) ?? defaultAnswer(url, venues);
    if (answer === 'offline') throw new TypeError('Failed to fetch');
    return {
      ok: answer.status >= 200 && answer.status < 300,
      status: answer.status,
      json: async () => answer.body,
    } as Response;
  });
  vi.stubGlobal('fetch', fetcher);
  return fetcher;
}

function defaultAnswer(url: URL, venues: VenueDetail[]): FakeResponse {
  const detail = url.pathname.match(/\/api\/v1\/places\/(\d+)$/);
  if (detail) {
    const found = venues.find((v) => v.id === Number(detail[1]));
    return found ? { status: 200, body: found } : { status: 404, body: { detail: 'Place not found' } };
  }
  if (url.pathname.endsWith('/api/v1/places')) {
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('page_size') ?? 12);
    const sorted = [...venues].sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
    const totalPages = Math.ceil(sorted.length / pageSize);
    return {
      status: 200,
      body: {
        items: sorted.slice((page - 1) * pageSize, page * pageSize),
        total_items: sorted.length,
        page,
        page_size: pageSize,
        total_pages: totalPages,
        has_previous: page > 1,
        has_next: page < totalPages,
      },
    };
  }
  return { status: 404, body: { detail: 'Not Found' } };
}

/** Switches the app from mock places to the (fake) API for one test. */
export function useApiData() {
  vi.stubEnv('VITE_USE_MOCK_DATA', 'false');
  vi.stubEnv('VITE_API_URL', 'http://api.test/api/v1');
}
