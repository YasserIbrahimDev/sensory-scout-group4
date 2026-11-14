
import type { VenueDetail } from '../api/backendAdapter';
import { venue } from './fakeApi';

// TEST DATA ONLY: All venues and addresses in this file are fictional.
// Do not use this dataset as production or public-facing venue data.
//
// These records are shaped like GET /places results from PostgreSQL.
// Sensory scores are averages from 1–5:
// Noise/crowd: lower = quieter/less crowded.
// Lighting: lower = dimmer, higher = brighter.
// Null means that dimension has not been rated.

type SensoryScores = {
  noise: number | null;
  light: number | null;
  crowd: number | null;
};

type ReportCounts = {
  noise?: number;
  light?: number;
  crowd?: number;
};

function rated(
  id: number,
  name: string,
  category: string,
  scores: SensoryScores,
  reviewCount = 3,
  reportCounts: ReportCounts = {},
): VenueDetail {
  const count = (score: number | null, reports?: number) =>
    score === null ? 0 : reports ?? reviewCount;

  const anyScore =
    scores.noise !== null ||
    scores.light !== null ||
    scores.crowd !== null;

  return venue({
    id,
    name,
    category,
    slug: `synthetic-${id}`,
    description: 'Fictional test venue. Not a real place.',
    address: `${id} Synthetic Way (fictional address)`,
    city: 'Synthetic City',
    review_count: reviewCount,
    sensory_summary: {
      ratings_count: anyScore ? reviewCount : 0,
      noise_rating: scores.noise,
      light_rating: scores.light,
      crowd_rating: scores.crowd,
      noise_count: count(scores.noise, reportCounts.noise),
      light_count: count(scores.light, reportCounts.light),
      crowd_count: count(scores.crowd, reportCounts.crowd),
    },
  });
}

// ------------------------------------------------------------
// ORIGINAL NINE VENUES — preserved for existing test scenarios
// ------------------------------------------------------------

export const hushLibrary = rated(
  101, 'Hush Library', 'library',
  { noise: 1.2, light: 1.8, crowd: 1.5 },
);

export const lanternTeaHouse = rated(
  102, 'Lantern Tea House', 'cafe',
  { noise: 2, light: 1.5, crowd: null },
);

export const fernGarden = rated(
  103, 'Fern Garden', 'park',
  { noise: 1.8, light: 4.2, crowd: 1.4 },
);

export const mosaicMuseum = rated(
  104, 'Mosaic Museum', 'museum',
  { noise: 2.8, light: 2, crowd: 3 },
);

export const arcadeHall = rated(
  105, 'Arcade Hall', 'community',
  { noise: 4.8, light: 4.9, crowd: 4.6 },
);

export const nightMarket = rated(
  106, 'Night Market', 'market',
  { noise: 4, light: null, crowd: 4.5 },
);

export const cornerGrocer = rated(
  107, 'Corner Grocer', 'store',
  { noise: null, light: null, crowd: null },
  1,
);

export const riversideDiner = rated(
  108, 'Riverside Diner', 'restaurant',
  { noise: 3, light: 3, crowd: null },
);

export const potteryStudio = rated(
  109, 'Pottery Studio', 'Pottery Studio',
  { noise: 1.5, light: null, crowd: null },
  1,
);

// ------------------------------------------------------------
// ADDITIONAL VENUES — varied categories and sensory scenarios
// ------------------------------------------------------------

// Fully rated venues with different combinations.
export const botanicalCafe = rated(
  110, 'Botanical Cafe', 'cafe',
  { noise: 3.8, light: 4.2, crowd: 2.8 }, 8,
  { noise: 8, light: 6, crowd: 5 },
);

export const quietBookshop = rated(
  111, 'Quiet Bookshop', 'bookstore',
  { noise: 4.2, light: 2.1, crowd: 3.8 }, 6,
);

export const communityGym = rated(
  112, 'Community Gym', 'fitness',
  { noise: 4.5, light: 3.8, crowd: 3.9 }, 10,
);

export const lakesidePark = rated(
  113, 'Lakeside Park', 'park',
  { noise: 3.7, light: 4.5, crowd: 4.1 }, 7,
);

export const artGallery = rated(
  114, 'Art Gallery', 'museum',
  { noise: 3.5, light: 2.2, crowd: 4.2 }, 5,
);

export const familyRestaurant = rated(
  115, 'Family Restaurant', 'restaurant',
  { noise: 4.4, light: 3.2, crowd: 4.6 }, 12,
);

// Partial records: one or two dimensions are not reported.
export const musicCafe = rated(
  116, 'Music Cafe', 'cafe',
  { noise: 4.8, light: null, crowd: 3.9 }, 5,
);

export const dimCinema = rated(
  117, 'Dim Cinema', 'entertainment',
  { noise: 3.8, light: 1.2, crowd: null }, 4,
);

export const outdoorMarket = rated(
  118, 'Outdoor Market', 'market',
  { noise: null, light: 4.4, crowd: 4.1 }, 6,
);

export const wellnessCenter = rated(
  119, 'Wellness Center', 'health',
  { noise: 2.8, light: null, crowd: 2.5 }, 5,
);

export const sportsArena = rated(
  120, 'Sports Arena', 'sports',
  { noise: 4.9, light: 4.7, crowd: null }, 9,
);

// Very limited reporting: only one sensory dimension is available.
export const smallBookshop = rated(
  121, 'Small Bookshop', 'bookstore',
  { noise: 1.7, light: null, crowd: null }, 1,
);

export const gardenRestaurant = rated(
  122, 'Garden Restaurant', 'restaurant',
  { noise: null, light: 4.1, crowd: null }, 2,
);

export const indoorPlayground = rated(
  123, 'Indoor Playground', 'entertainment',
  { noise: null, light: null, crowd: 4.8 }, 3,
);

// Different levels of evidence for the same dimensions.
export const popularLibrary = rated(
  124, 'Popular Library', 'library',
  { noise: 2.1, light: 2.8, crowd: 3.2 }, 20,
  { noise: 18, light: 12, crowd: 16 },
);

export const newTeaRoom = rated(
  125, 'New Tea Room', 'cafe',
  { noise: 2.1, light: 2.8, crowd: 3.2 }, 1,
  { noise: 1, light: 1, crowd: 1 },
);

export const busyShoppingCenter = rated(
  126, 'Busy Shopping Center', 'shopping',
  { noise: 4.7, light: 4.6, crowd: 4.9 }, 15,
);

export const smallMuseum = rated(
  127, 'Small Museum', 'museum',
  { noise: 2.4, light: 2.3, crowd: null }, 2,
);

// Mixed and conflicting ratings.
export const brightQuietStudio = rated(
  128, 'Bright Quiet Studio', 'arts',
  { noise: 1.4, light: 4.8, crowd: 3.2 }, 7,
);

export const quietBusyCafe = rated(
  129, 'Quiet Busy Cafe', 'cafe',
  { noise: 1.5, light: 3.1, crowd: 4.8 }, 9,
);

export const dimBusyRestaurant = rated(
  130, 'Dim Busy Restaurant', 'restaurant',
  { noise: 4.2, light: 1.5, crowd: 4.7 }, 8,
);

// ------------------------------------------------------------
// COMPLETE TEST DATASET
// ------------------------------------------------------------

export const originalSyntheticVenues: VenueDetail[] = [
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

// Dedicated no-match fixture: the only venue is quiet, while the
// test preferences require high noise and low crowds.
export const noMatchVenues: VenueDetail[] = [
  hushLibrary,
];

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
  botanicalCafe,
  quietBookshop,
  communityGym,
  lakesidePark,
  artGallery,
  familyRestaurant,
  musicCafe,
  dimCinema,
  outdoorMarket,
  wellnessCenter,
  sportsArena,
  smallBookshop,
  gardenRestaurant,
  indoorPlayground,
  popularLibrary,
  newTeaRoom,
  busyShoppingCenter,
  smallMuseum,
  brightQuietStudio,
  quietBusyCafe,
  dimBusyRestaurant,
];

/** Loud noise plus low crowds: no synthetic venue meets both preferences. */
export const noMatchPreferences = {
  noise: 'high',
  lighting: null,
  crowd: 'low',
} as const;
