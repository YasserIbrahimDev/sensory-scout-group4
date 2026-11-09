import type { Place } from '../types/place';
import type { SensoryPreferences } from '../types/user';
import { CROWD_LEVELS, LIGHTING_LEVELS, NOISE_LEVELS } from './searchFilters';
import { crowdLabels, lightingLabels, noiseLabels, sensoryTypeLabels } from './sensoryLabels';

// Ranks places against a user's sensory preferences for "Recommended for you".
// This stands in for the backend recommendation endpoint until it exists; when it
// does, api/client.ts calls the endpoint instead and this file can go.

type PreferenceKey = keyof SensoryPreferences;

const PREFERENCE_KEYS: PreferenceKey[] = ['noise', 'lighting', 'crowd'];

/** Levels in order of intensity, so "one step away" can be measured. */
const LEVEL_ORDER: Record<PreferenceKey, readonly string[]> = {
  noise: NOISE_LEVELS,
  lighting: LIGHTING_LEVELS,
  crowd: CROWD_LEVELS,
};

const LEVEL_LABELS: Record<PreferenceKey, Record<string, string>> = {
  noise: noiseLabels,
  lighting: lightingLabels,
  crowd: crowdLabels,
};

export interface Recommendation {
  place: Place;
  /** One short sentence saying why the place was suggested. */
  reason: string;
}

/** True when the user has chosen at least one level; "No preference" everywhere means nothing to match. */
export function hasPreferences(preferences: SensoryPreferences): boolean {
  return PREFERENCE_KEYS.some((key) => preferences[key] !== null);
}

interface Fit {
  /** Preferences the place meets exactly. */
  matched: PreferenceKey[];
  /** Preferences the place misses by one level, for example Normal light for someone who prefers Dim. */
  close: PreferenceKey[];
  /** Preferences the place has no report for. */
  unknown: PreferenceKey[];
  /** True when any reported level is the opposite of the preference, for example Loud for someone who prefers Quiet. */
  conflicts: boolean;
}

function fitFor(place: Place, chosen: PreferenceKey[], preferences: SensoryPreferences): Fit {
  const fit: Fit = { matched: [], close: [], unknown: [], conflicts: false };
  for (const key of chosen) {
    const level = place.sensory[key];
    if (level === null) {
      fit.unknown.push(key);
      continue;
    }
    const order = LEVEL_ORDER[key];
    const distance = Math.abs(order.indexOf(level) - order.indexOf(preferences[key]!));
    if (distance === 0) fit.matched.push(key);
    else if (distance === 1) fit.close.push(key);
    else fit.conflicts = true;
  }
  return fit;
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function joinWithAnd(items: string[]): string {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function reasonFor(place: Place, fit: Fit): string {
  const matchedText = fit.matched.map((key) => LEVEL_LABELS[key][place.sensory[key]!]);
  let reason = `${joinWithAnd(matchedText.map((text, i) => (i === 0 ? text : lowerFirst(text))))}, as you prefer.`;
  if (fit.unknown.length) {
    reason += ` ${joinWithAnd(fit.unknown.map((key, i) => (i === 0 ? sensoryTypeLabels[key] : lowerFirst(sensoryTypeLabels[key]))))} not reported yet.`;
  }
  return reason;
}

/**
 * Places that suit the preferences, best first.
 *
 * A place is suggested only when it meets at least one preference exactly and none of
 * its reported levels is the opposite of what the user wants. A level nobody has
 * reported never counts as a match, so places with missing ratings rank below places
 * with the same matches and full reports, and a place with no reports is never suggested.
 */
export function recommendPlaces(places: Place[], preferences: SensoryPreferences): Recommendation[] {
  const chosen = PREFERENCE_KEYS.filter((key) => preferences[key] !== null);

  return places
    .map((place) => ({ place, fit: fitFor(place, chosen, preferences) }))
    .filter(({ fit }) => fit.matched.length > 0 && !fit.conflicts)
    .sort(
      (a, b) =>
        b.fit.matched.length - a.fit.matched.length ||
        a.fit.unknown.length - b.fit.unknown.length ||
        a.fit.close.length - b.fit.close.length ||
        a.place.name.localeCompare(b.place.name),
    )
    .map(({ place, fit }) => ({ place, reason: reasonFor(place, fit) }));
}
