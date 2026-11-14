
import { adaptVenue } from '../api/backendAdapter';
import { toPlace } from '../api/placeAdapter';
import { hasPreferences, recommendPlaces } from './recommendations';
import {
  noMatchPreferences,
  noMatchVenues,
  originalSyntheticVenues,
  syntheticVenues,
} from '../test/syntheticVenues';

const places = originalSyntheticVenues.map((v) => toPlace(adaptVenue(v)));
const expandedPlaces = syntheticVenues.map((v) => toPlace(adaptVenue(v)));
const noMatchPlaces = noMatchVenues.map((v) => toPlace(adaptVenue(v)));

function names(
  dataset: typeof places,
  preferences: Parameters<typeof recommendPlaces>[1],
) {
  return recommendPlaces(dataset, preferences).map((r) => r.place.name);
}

describe('recommendations', () => {
  it('TC-REC-01: "No preference" everywhere means there is nothing to match', () => {
    expect(hasPreferences({ noise: null, lighting: null, crowd: null })).toBe(false);
    expect(names(places, { noise: null, lighting: null, crowd: null })).toEqual([]);
  });

  it('TC-REC-02: ranks by exact matches, then fewest missing ratings, then fewest near misses', () => {
    expect(
      names(places, { noise: 'low', lighting: 'dim', crowd: 'low' }),
    ).toEqual([
      'Hush Library',
      'Lantern Tea House',
      'Mosaic Museum',
      'Pottery Studio',
    ]);
  });

  it('TC-REC-03: a place with the opposite of a preference is never suggested', () => {
    const results = names(places, {
      noise: 'low',
      lighting: null,
      crowd: 'low',
    });

    expect(results).toContain('Fern Garden');
    expect(results).not.toContain('Arcade Hall');
  });

  it('TC-REC-04: missing ratings never count as a match', () => {
    expect(
      names(places, { noise: null, lighting: null, crowd: 'moderate' }),
    ).toEqual(['Mosaic Museum']);
  });

  it('TC-REC-05: gives a short reason that names what matches and what is not reported', () => {
    const results = recommendPlaces(places, {
      noise: 'low',
      lighting: 'dim',
      crowd: 'low',
    });

    const teaHouse = results.find(
      (r) => r.place.name === 'Lantern Tea House',
    );

    expect(teaHouse).toBeDefined();
    expect(teaHouse?.reason).toContain('Quiet');
    expect(teaHouse?.reason).toContain('dim light');
    expect(teaHouse?.reason).toContain('Crowds not reported yet.');
  });

  it('TC-REC-06: returns nothing when no place suits the preferences', () => {
    expect(names(noMatchPlaces, noMatchPreferences)).toEqual([]);
  });
});

describe('expanded synthetic recommendation dataset', () => {
  it('TC-REC-07: contains 30 uniquely identified venues with clean display names', () => {
    expect(syntheticVenues).toHaveLength(30);
    expect(new Set(syntheticVenues.map((v) => v.id)).size).toBe(30);
    expect(
      syntheticVenues.every((v) => !v.name.startsWith('Synthetic')),
    ).toBe(true);
  });

  it('TC-REC-08: covers at least 10 venue categories', () => {
    const categories = new Set(syntheticVenues.map((v) => v.category));
    expect(categories.size).toBeGreaterThanOrEqual(10);
  });

  it('TC-REC-09: includes complete, partial, and entirely missing sensory records', () => {
    const summaries = syntheticVenues.map((v) => v.sensory_summary);

    const complete = summaries.some(
      (s) =>
        s?.noise_rating !== null &&
        s?.light_rating !== null &&
        s?.crowd_rating !== null,
    );

    const partial = summaries.some(
      (s) =>
        [s?.noise_rating, s?.light_rating, s?.crowd_rating].filter(
          (rating) => rating !== null,
        ).length === 1,
    );

    const missing = summaries.some(
      (s) =>
        s?.noise_rating === null &&
        s?.light_rating === null &&
        s?.crowd_rating === null,
    );

    expect(complete).toBe(true);
    expect(partial).toBe(true);
    expect(missing).toBe(true);
  });

  it('TC-REC-10: venues with no sensory reports are not recommended', () => {
    const results = names(expandedPlaces, {
      noise: 'low',
      lighting: 'dim',
      crowd: 'low',
    });

    expect(results).not.toContain('Corner Grocer');
  });

  it('TC-REC-11: missing sensory dimensions do not prevent a genuine match on another dimension', () => {
    const results = names(expandedPlaces, {
      noise: 'low',
      lighting: null,
      crowd: null,
    });

    expect(results).toContain('Small Bookshop');
  });

  it('TC-REC-12: the expanded dataset produces recommendations for suitable preferences', () => {
    const results = recommendPlaces(expandedPlaces, {
      noise: 'low',
      lighting: 'dim',
      crowd: 'low',
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.reason.length > 0)).toBe(true);
  });
});
