import type { VenueDetail } from '../api/backendAdapter';
import { venue } from './fakeApi';

// SYNTHETIC TEST DATA: AI-generated and fictional, approved for testing only.
// Every venue is made up, is marked is_sample, has "Synthetic" in its name, and
// uses fictional addresses. Never show this data in the demo or seed it as real.
//
// Shaped like GET /places results from PostgreSQL (backend/API_CONTRACT.md), so
// tests run it through the same adapter as real data. Scores are 1–5 averages:
// under 2.5 is low/dim, 2.5 to 3.4 is moderate/normal, 3.5 and up is high/bright.
// It covers varied categories, full and partial ratings, a place with no ratings,
// an unknown category, and preferences that no place matches.

function rated(
  id: number,
  name: string,
  category: string,
  scores: { noise: number | null; light: number | null; crowd: number | null },
  reviewCount = 3,
): VenueDetail {
  const count = (score: number | null) => (score === null ? 0 : reviewCount);
  const anyScore = scores.noise !== null || scores.light !== null || scores.crowd !== null;
  return venue({
    id,
    name,
    category,
    slug: `synthetic-${id}`,
    description: 'Synthetic test venue generated for Sensory Scout tests. Not a real place.',
    address: `${id} Synthetic Way (fictional address)`,
    city: 'Synthetic City',
    review_count: reviewCount,
    sensory_summary: {
      ratings_count: anyScore ? reviewCount : 0,
      noise_rating: scores.noise,
      light_rating: scores.light,
      crowd_rating: scores.crowd,
      noise_count: count(scores.noise),
      light_count: count(scores.light),
      crowd_count: count(scores.crowd),
    },
  });
}

/** Quiet, dim, low crowds: fully rated. */
export const hushLibrary = rated(101, 'Synthetic Hush Library', 'library', { noise: 1.2, light: 1.8, crowd: 1.5 });
/** Quiet and dim, but nobody has rated crowds. */
export const lanternTeaHouse = rated(102, 'Synthetic Lantern Tea House', 'cafe', { noise: 2, light: 1.5, crowd: null });
/** Quiet with low crowds, but bright. */
export const fernGarden = rated(103, 'Synthetic Fern Garden', 'park', { noise: 1.8, light: 4.2, crowd: 1.4 });
/** Moderate noise, dim, moderate crowds. */
export const mosaicMuseum = rated(104, 'Synthetic Mosaic Museum', 'museum', { noise: 2.8, light: 2, crowd: 3 });
/** Loud, bright, crowded. */
export const arcadeHall = rated(105, 'Synthetic Arcade Hall', 'community', { noise: 4.8, light: 4.9, crowd: 4.6 });
/** Loud and crowded; lighting not rated. */
export const nightMarket = rated(106, 'Synthetic Night Market', 'market', { noise: 4, light: null, crowd: 4.5 });
/** Has a review but no sensory ratings at all. */
export const cornerGrocer = rated(107, 'Synthetic Corner Grocer', 'store', { noise: null, light: null, crowd: null }, 1);
/** Moderate noise and normal light; crowds not rated. */
export const riversideDiner = rated(108, 'Synthetic Riverside Diner', 'restaurant', { noise: 3, light: 3, crowd: null });
/** A category the app doesn't know, with only a noise rating. */
export const potteryStudio = rated(109, 'Synthetic Pottery Studio', 'Pottery Studio', { noise: 1.5, light: null, crowd: null }, 1);

export const syntheticVenues: VenueDetail[] = [
  hushLibrary,
  lanternTeaHouse,
  fernGarden,
  mosaicMuseum,
  arcadeHall,
  nightMarket,
  cornerGrocer,
  riversideDiner,
  potteryStudio,
];

/** Loud but uncrowded: no synthetic venue suits this, for the "no matches" case. */
export const noMatchPreferences = { noise: 'high', lighting: null, crowd: 'low' } as const;
