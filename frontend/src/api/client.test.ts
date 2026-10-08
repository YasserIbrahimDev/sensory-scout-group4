import { getPlace, getPlaces, getPopularPlaces, searchPlaces } from './client';
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
});
