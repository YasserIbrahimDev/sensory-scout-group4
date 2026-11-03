import { adaptVenue } from '../api/backendAdapter';
import { toPlace } from '../api/placeAdapter';
import { hasPreferences, recommendPlaces } from './recommendations';
import { noMatchPreferences, syntheticVenues } from '../test/syntheticVenues';

// Runs on the synthetic test dataset, converted the same way as real API data.
const places = syntheticVenues.map((v) => toPlace(adaptVenue(v)));

function names(preferences: Parameters<typeof recommendPlaces>[1]) {
  return recommendPlaces(places, preferences).map((r) => r.place.name);
}

describe('recommendations', () => {
  it('TC-REC-01: "No preference" everywhere means there is nothing to match', () => {
    const none = { noise: null, lighting: null, crowd: null };
    expect(hasPreferences(none)).toBe(false);
    expect(hasPreferences({ ...none, lighting: 'dim' })).toBe(true);
    expect(recommendPlaces(places, none)).toEqual([]);
  });

  it('TC-REC-02: ranks by exact matches, then fewest missing ratings, then fewest near misses', () => {
    expect(names({ noise: 'low', lighting: 'dim', crowd: 'low' })).toEqual([
      'Synthetic Hush Library', // 3 matches
      'Synthetic Lantern Tea House', // 2 matches, crowds not rated
      'Synthetic Mosaic Museum', // 1 match, fully rated, 2 near misses
      'Synthetic Pottery Studio', // 1 match, 2 not rated
    ]);
  });

  it('TC-REC-03: a place with the opposite of a preference is never suggested', () => {
    // Fern Garden is quiet with low crowds, but bright.
    expect(names({ noise: 'low', lighting: 'dim', crowd: 'low' })).not.toContain('Synthetic Fern Garden');
    expect(names({ noise: 'low', lighting: null, crowd: 'low' })).toContain('Synthetic Fern Garden');
  });

  it('TC-REC-04: missing ratings never count as a match', () => {
    // Corner Grocer has no ratings; Riverside Diner is only near misses plus a missing crowd rating.
    const result = names({ noise: 'low', lighting: 'dim', crowd: 'low' });
    expect(result).not.toContain('Synthetic Corner Grocer');
    expect(result).not.toContain('Synthetic Riverside Diner');
    expect(names({ noise: null, lighting: null, crowd: 'moderate' })).toEqual(['Synthetic Mosaic Museum']);
  });

  it('TC-REC-05: gives a short reason that names what matches and what is not reported', () => {
    const [library, teaHouse] = recommendPlaces(places, { noise: 'low', lighting: 'dim', crowd: 'low' });
    expect(library.reason).toBe('Quiet, dim light and low crowds, as you prefer.');
    expect(teaHouse.reason).toBe('Quiet and dim light, as you prefer. Crowds not reported yet.');
  });

  it('TC-REC-06: returns nothing when no place suits the preferences', () => {
    expect(recommendPlaces(places, noMatchPreferences)).toEqual([]);
  });
});
