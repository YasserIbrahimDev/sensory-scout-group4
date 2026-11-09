import { getNearbyPlaces, getPlace, getPlaces, getPopularPlaces, getReviews, searchPlaces, usingMockData } from './client';
import { emptyFilters } from '../lib/searchFilters';
import { allVenues, lounge, mockApi, readingRoom, useApiData, venue } from '../test/fakeApi';

const names = (places: { name: string }[]) => places.map((p) => p.name);

beforeEach(() => {
  useApiData();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api client (live API)', () => {
  it('TC-API-01: uses the API unless VITE_USE_MOCK_DATA is "true"', () => {
    expect(usingMockData()).toBe(false);
    vi.stubEnv('VITE_USE_MOCK_DATA', 'true');
    expect(usingMockData()).toBe(true);
  });

  it('TC-API-02: loads places from GET /places at VITE_API_URL', async () => {
    const fetcher = mockApi();
    expect(names(await getPlaces())).toEqual([
      'Sample Busy Food Hall',
      'Sample Community Lounge',
      'Sample Willow Reading Room',
    ]);
    expect(String(fetcher.mock.calls[0][0])).toBe('http://api.test/api/v1/places?page=1&page_size=100');
  });

  it('TC-API-03: follows every page of results', async () => {
    const many = Array.from({ length: 150 }, (_, i) => venue({ id: i + 1, name: `Place ${String(i + 1).padStart(3, '0')}` }));
    const fetcher = mockApi(many);
    expect(await getPlaces()).toHaveLength(150);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('TC-API-04: turns API values into place fields, keeping unknowns unknown', async () => {
    mockApi();
    const room = await getPlace('1');
    expect(room).toMatchObject({
      id: '1',
      name: 'Sample Willow Reading Room',
      category: 'library',
      rating: null,
      reviewCount: 2,
      isSample: true,
      location: { lat: 33.21, lng: -97.13 },
      sensory: { noise: 'low', lighting: 'dim', crowd: 'low' },
      accessibility: {},
    });
    const unrated = await getPlace(String(lounge.id));
    expect(unrated).toMatchObject({
      category: 'community',
      location: null,
      sensory: { noise: null, lighting: null, crowd: null },
    });
  });

  it('TC-API-05: unknown categories become "other" instead of breaking the page', async () => {
    mockApi([venue({ id: 9, name: 'Sample Bowling Alley', category: 'bowling' })]);
    expect((await getPlace('9'))?.category).toBe('other');
  });

  it('TC-API-06: a missing place, or an old mock id, is "not found" rather than an error', async () => {
    mockApi();
    expect(await getPlace('999')).toBeNull();
    expect(await getPlace('harmony-coffee')).toBeNull();
  });

  it('TC-API-07: a server error or no connection rejects, so pages can show their error message', async () => {
    mockApi(allVenues, () => ({ status: 500 }));
    await expect(getPlaces()).rejects.toThrow();
    await expect(getPlace('1')).rejects.toThrow();
    mockApi(allVenues, () => 'offline');
    await expect(getPopularPlaces()).rejects.toThrow();
  });

  it('TC-API-08: searches and filters the API places; unrated places never match a selected level', async () => {
    mockApi();
    expect(names(await searchPlaces({ ...emptyFilters, q: 'lounge' }))).toEqual(['Sample Community Lounge']);
    expect(names(await searchPlaces({ ...emptyFilters, noise: ['low'] }))).toEqual(['Sample Willow Reading Room']);
    expect(names(await searchPlaces({ ...emptyFilters, noise: ['low', 'moderate', 'high'] })))
      .not.toContain('Sample Community Lounge');
    expect(names(await searchPlaces({ ...emptyFilters, category: 'community' }))).toEqual(['Sample Community Lounge']);
  });

  it('TC-API-09: nearby places skip places with no map position', async () => {
    mockApi();
    const nearby = await getNearbyPlaces(String(readingRoom.id));
    expect(nearby.map((n) => n.place.name)).toEqual(['Sample Busy Food Hall']);
    expect(await getNearbyPlaces(String(lounge.id))).toEqual([]);
  });

  it('TC-API-10: review text is empty because the API does not send it yet', async () => {
    const fetcher = mockApi();
    expect(await getReviews('1')).toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
