export type NoiseLevel = 'low' | 'moderate' | 'high';
export type LightingLevel = 'dim' | 'normal' | 'bright';
export type CrowdLevel = 'low' | 'moderate' | 'high';

export type PlaceCategory =
  | 'library'
  | 'park'
  | 'cafe'
  | 'museum'
  | 'restaurant'
  | 'store'
  | 'community'
  | 'market'
  /** Any category the backend sends that the app does not know yet. */
  | 'other';

/** Null means nobody has reported this yet. Never show a guess in its place. */
export interface SensoryInfo {
  noise: NoiseLevel | null;
  lighting: LightingLevel | null;
  crowd: CrowdLevel | null;
  /** Optional until the team confirms the backend will store these. */
  temperature?: string;
  scents?: string;
}

export interface PlacePhoto {
  url: string;
  alt: string;
}

export interface Review {
  id: string;
  placeId: string;
  /** First name and last initial only. */
  author: string;
  /** Whole stars, 1 to 5. */
  rating: number;
  /** ISO date, for example 2026-09-28. */
  date: string;
  text: string;
}

export interface NearbyPlace {
  place: Place;
  distanceMiles: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  city: string;
  address: string;
  description: string;
  /** Average star rating, or null when the data source has no star ratings (the API does not yet). */
  rating: number | null;
  reviewCount: number;
  hours?: string;
  /** Main photo for cards and the Place Details header (decorative there; alt is empty). */
  imageUrl?: string;
  /** Photos for the Photos tab, each with a description for screen readers. */
  photos?: PlacePhoto[];
  /** Map position, used by the Map page, Nearby, and Get Directions. Null when unknown. */
  location: LatLng | null;
  /** True for made-up development data, so it can be labelled. */
  isSample?: boolean;
  sensory: SensoryInfo;

  accessibility: {
    /** Unknown means the feature has not been verified. */
    wheelchair?: boolean;
    sensoryRoom?: boolean;
  };

}

/** A place that has a map position, so it can be shown on the map. */
export type LocatedPlace = Place & { location: LatLng };

export function hasLocation(place: Place): place is LocatedPlace {
  return place.location !== null;
}
