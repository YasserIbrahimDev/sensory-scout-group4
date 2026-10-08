import { clearFilters, emptyFilters, filtersFromParams, filtersToParams, toggleLevel, NOISE_LEVELS } from './searchFilters';

describe('searchFilters', () => {
  it('TC-SEARCH-01: saves filters to the page address and reads them back', () => {
    const filters = {
      ...emptyFilters,
      q: 'cafe',
      noise: ['low' as const, 'moderate' as const],
      lighting: ['dim' as const],
      crowd: ['low' as const],
      category: 'cafe' as const,
      wheelchair: true,
      sensoryRoom: true,
    };
    const params = filtersToParams(filters);
    expect(params.toString()).toBe(
      'q=cafe&noise=low%2Cmoderate&lighting=dim&crowd=low&category=cafe&wheelchair=1&sensoryRoom=1',
    );
    expect(filtersFromParams(params)).toEqual(filters);
  });

  it('TC-SEARCH-02: ignores unknown values in the address', () => {
    const filters = filtersFromParams(new URLSearchParams('noise=loud,low&lighting=neon&category=zoo'));
    expect(filters.noise).toEqual(['low']);
    expect(filters.lighting).toEqual([]);
    expect(filters.category).toBe('');
  });

  it('TC-SEARCH-03: toggles a level on and off and keeps Low/Moderate/High order', () => {
    expect(toggleLevel(['high'], 'low', NOISE_LEVELS)).toEqual(['low', 'high']);
    expect(toggleLevel(['low', 'high'], 'low', NOISE_LEVELS)).toEqual(['high']);
  });

  it('TC-SEARCH-04: Clear all keeps the search text', () => {
    expect(clearFilters({ ...emptyFilters, q: 'park', noise: ['low'], wheelchair: true })).toEqual({
      ...emptyFilters,
      q: 'park',
    });
  });
});
