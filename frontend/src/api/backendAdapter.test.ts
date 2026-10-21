import { describe, expect, it, vi } from 'vitest';
import { adaptVenue, intensityFromScore, lightFromScore, type VenueDetail } from './backendAdapter';
import { ApiRequestError, fetchBackendPlace, fetchBackendPlaces, parsePlaceId } from './backendClient';

const venue: VenueDetail = {
  id: 1, name: 'Sample Reading Room', category: 'library', address: 'Example Lane',
  city: 'Sample City', image_url: null, is_sample: true, slug: 'reading-room',
  description: 'Fictional venue', latitude: null, longitude: null,
  external_map_provider: null, external_map_id: null,
  created_at: '2026-10-14T14:00:00Z', updated_at: '2026-10-14T14:00:00Z',
  review_count: 2,
  sensory_summary: { ratings_count: 2, noise_rating: 1.5, light_rating: 2.5,
    crowd_rating: null, noise_count: 2, light_count: 2, crowd_count: 0 },
  accessibility_summary: { accessible_reports: 2, inaccessible_reports: 0, unknown_reports: 0 },
};

describe('Hamza: backend API adapter', () => {
  it('maps valid 1–5 scores with explicit thresholds', () => {
    expect(intensityFromScore(1)).toBe('low');
    expect(intensityFromScore(2.5)).toBe('moderate');
    expect(intensityFromScore(3.5)).toBe('high');
    expect(lightFromScore(1.5)).toBe('dim');
    expect(lightFromScore(3)).toBe('normal');
    expect(lightFromScore(5)).toBe('bright');
  });
  it('preserves unknown and invalid sensory values instead of inventing values', () => {
    expect(intensityFromScore(null)).toBeNull();
    expect(intensityFromScore(0)).toBeNull();
    expect(intensityFromScore(6)).toBeNull();
    expect(intensityFromScore(NaN)).toBeNull();
    expect(lightFromScore(null)).toBeNull();
  });
  it('converts integer IDs and keeps unavailable coordinates and ratings unknown', () => {
    const result = adaptVenue(venue);
    expect(result.id).toBe('1');
    expect(result.location).toBeNull();
    expect(result.overallRating).toBeNull();
    expect(result.sensory.crowd).toBeNull();
    expect(result.sensory.noise).toBe('low');
    expect(result.accessibility.verifiedWheelchairAccess).toBeNull();
    expect(result.isSample).toBe(true);
  });
  it('only includes a map position when both coordinates are valid', () => {
    expect(adaptVenue({ ...venue, latitude: 33.2, longitude: -97.1 }).location)
      .toEqual({ lat: 33.2, lng: -97.1 });
    expect(adaptVenue({ ...venue, latitude: 33.2, longitude: null }).location).toBeNull();
    expect(adaptVenue({ ...venue, latitude: 91, longitude: -97.1 }).location).toBeNull();
  });
});

describe('Hamza: backend HTTP client', () => {
  it('validates positive integer route IDs', () => {
    expect(parsePlaceId('1')).toBe(1);
    expect(parsePlaceId('0')).toBeNull();
    expect(parsePlaceId('abc')).toBeNull();
    expect(parsePlaceId('1.2')).toBeNull();
  });
  it('requests real detail endpoint and adapts its response', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => venue });
    const result = await fetchBackendPlace('1', fetcher as unknown as typeof fetch);
    expect(result?.id).toBe('1');
    expect(fetcher.mock.calls[0][0]).toMatch(/\/api\/v1\/places\/1$/);
  });
  it('returns null for 404 without masking network errors', async () => {
    const missing = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    expect(await fetchBackendPlace('1', missing as unknown as typeof fetch)).toBeNull();
    const offline = vi.fn().mockRejectedValue(new Error('offline'));
    await expect(fetchBackendPlace('1', offline as unknown as typeof fetch))
      .rejects.toMatchObject({ status: 0 });
  });
  it('encodes listing query and preserves pagination', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({
      items: [venue], total_items: 1, page: 1, page_size: 12, total_pages: 1,
      has_previous: false, has_next: false,
    }) });
    const result = await fetchBackendPlaces({ q: 'quiet & calm', max_noise: 2 }, fetcher as unknown as typeof fetch);
    expect(fetcher.mock.calls[0][0]).toContain('q=quiet+%26+calm');
    expect(fetcher.mock.calls[0][0]).toContain('max_noise=2');
    expect(result.items[0].id).toBe('1');
    expect(result.pagination.total_items).toBe(1);
  });
  it('reports API errors without assuming a JSON error body', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(fetchBackendPlaces({}, fetcher as unknown as typeof fetch))
      .rejects.toBeInstanceOf(ApiRequestError);
  });
});
