import { getNearbyPlaces, getPlace, getPlaces, getPopularPlaces, getReviews, searchPlaces } from './client';
import { emptyFilters } from '../lib/searchFilters';

const names = (places: { name: string }[]) => places.map((p) => p.name);

describe('api client (mock data)', () => {
  it('TC-HOME-28: returns three popular places by default', async () => {
    expect(names(await getPopularPlaces())).toEqual([
      'Denton Public Library',
      'North Lakes Park',
      'Harmony Coffee',
    ]);
  });

  it('TC-HOME-29: finds a place by id and returns null for unknown ids', async () => {
    expect((await getPlace('harmony-coffee'))?.name).toBe('Harmony Coffee');
    expect(await getPlace('missing')).toBeNull();
  });

  it('TC-SEARCH-05: searches by name, category, or location, ignoring case', async () => {
    expect(names(await searchPlaces({ ...emptyFilters, q: 'harmony' }))).toEqual(['Harmony Coffee']);
    expect(names(await searchPlaces({ ...emptyFilters, q: 'LIBRARY' }))).toEqual(['Denton Public Library']);
    expect(names(await searchPlaces({ ...emptyFilters, q: 'Hickory St' }))).toEqual(['Square Burger Co.']);
  });

  it('TC-SEARCH-06: any selected level in a group matches; every group must match', async () => {
    const quietOrModerate = await searchPlaces({ ...emptyFilters, noise: ['low', 'moderate'] });
    expect(quietOrModerate).toHaveLength(5);
    const quietAndDim = await searchPlaces({ ...emptyFilters, noise: ['low'], lighting: ['dim'] });
    expect(names(quietAndDim)).toEqual(['Denton Public Library', 'UNT Art Gallery']);
  });

  it('TC-SEARCH-07: filters by place type, crowd level, and accessibility', async () => {
    expect(names(await searchPlaces({ ...emptyFilters, category: 'park' }))).toEqual(['North Lakes Park']);
    expect(names(await searchPlaces({ ...emptyFilters, crowd: ['high'] }))).toEqual(['Square Burger Co.']);
    expect(names(await searchPlaces({ ...emptyFilters, sensoryRoom: true }))).toEqual([
      'Denton Public Library',
      'Calm Corner Books',
    ]);
    expect(await searchPlaces({ ...emptyFilters, wheelchair: true })).toHaveLength(5);
  });

  it('TC-MAP-01: returns every place for the map', async () => {
    expect(await getPlaces()).toHaveLength(6);
  });

  it('TC-DETAILS-20: returns reviews for one place, newest first', async () => {
    const reviews = await getReviews('north-lakes-park');
    expect(reviews).toHaveLength(9);
    expect(reviews[0].date).toBe('2026-10-02');
    expect(reviews.map((r) => r.date)).toEqual([...reviews.map((r) => r.date)].sort().reverse());
    expect(await getReviews('missing')).toEqual([]);
  });

  it('TC-DETAILS-21: returns the nearest other places, closest first', async () => {
    const nearby = await getNearbyPlaces('denton-public-library', 2);
    expect(nearby).toHaveLength(2);
    expect(nearby.map((n) => n.place.id)).not.toContain('denton-public-library');
    expect(nearby[0].distanceMiles).toBeLessThanOrEqual(nearby[1].distanceMiles);
    expect(nearby[0].distanceMiles).toBeGreaterThan(0);
    expect(await getNearbyPlaces('missing')).toEqual([]);
  });

  it('TC-DETAILS-24: each place rating and review count match its reviews', async () => {
    for (const place of await getPlaces()) {
      const reviews = await getReviews(place.id);
      const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      expect(place.reviewCount).toBe(reviews.length);
      expect(place.rating).toBe(Math.round(average * 10) / 10);
    }
  });
});
