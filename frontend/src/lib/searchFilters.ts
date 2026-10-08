import type { CrowdLevel, LightingLevel, NoiseLevel, PlaceCategory } from '../types/place';
import { categoryLabels } from './sensoryLabels';

export interface SearchFilters {
  /** Free-text search by name, category, or location. */
  q: string;
  noise: NoiseLevel[];
  lighting: LightingLevel[];
  crowd: CrowdLevel[];
  /** Empty string means "All categories". */
  category: PlaceCategory | '';
  wheelchair: boolean;
  sensoryRoom: boolean;
}

export const NOISE_LEVELS: NoiseLevel[] = ['low', 'moderate', 'high'];
export const LIGHTING_LEVELS: LightingLevel[] = ['dim', 'normal', 'bright'];
export const CROWD_LEVELS: CrowdLevel[] = ['low', 'moderate', 'high'];
export const CATEGORIES = Object.keys(categoryLabels) as PlaceCategory[];

export const emptyFilters: SearchFilters = {
  q: '',
  noise: [],
  lighting: [],
  crowd: [],
  category: '',
  wheelchair: false,
  sensoryRoom: false,
};

function readList<T extends string>(params: URLSearchParams, key: string, allowed: T[]): T[] {
  const raw = params.get(key);
  if (!raw) return [];
  return raw.split(',').filter((value): value is T => allowed.includes(value as T));
}

// Filters live in the page address (for example /search?noise=low&crowd=low)
// so they stay applied after going back from Place Details, and can be bookmarked.
export function filtersFromParams(params: URLSearchParams): SearchFilters {
  const category = params.get('category') ?? '';
  return {
    q: params.get('q') ?? '',
    noise: readList(params, 'noise', NOISE_LEVELS),
    lighting: readList(params, 'lighting', LIGHTING_LEVELS),
    crowd: readList(params, 'crowd', CROWD_LEVELS),
    category: CATEGORIES.includes(category as PlaceCategory) ? (category as PlaceCategory) : '',
    wheelchair: params.get('wheelchair') === '1',
    sensoryRoom: params.get('sensoryRoom') === '1',
  };
}

export function filtersToParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.noise.length) params.set('noise', filters.noise.join(','));
  if (filters.lighting.length) params.set('lighting', filters.lighting.join(','));
  if (filters.crowd.length) params.set('crowd', filters.crowd.join(','));
  if (filters.category) params.set('category', filters.category);
  if (filters.wheelchair) params.set('wheelchair', '1');
  if (filters.sensoryRoom) params.set('sensoryRoom', '1');
  return params;
}

/** Turns a level on if it is off, or off if it is on. */
export function toggleLevel<T extends string>(levels: T[], level: T, order: T[]): T[] {
  const next = levels.includes(level) ? levels.filter((l) => l !== level) : [...levels, level];
  return order.filter((l) => next.includes(l));
}

/** Clears the sensory, type, and accessibility filters but keeps the search text. */
export function clearFilters(filters: SearchFilters): SearchFilters {
  return { ...emptyFilters, q: filters.q };
}
