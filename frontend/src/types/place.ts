export type NoiseLevel = 'low' | 'moderate' | 'high';
export type LightingLevel = 'dim' | 'normal' | 'bright';
export type CrowdLevel = 'low' | 'moderate' | 'high';

export type PlaceCategory =
  | 'library'
  | 'park'
  | 'cafe'
  | 'museum'
  | 'restaurant'
  | 'store';

export interface SensoryInfo {
  noise: NoiseLevel;
  lighting: LightingLevel;
  crowd: CrowdLevel;
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

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  city: string;
  address: string;
  description: string;
  rating: number;
  reviewCount: number;
  hours?: string;
  /** Main photo for cards and the Place Details header (decorative there; alt is empty). */
  imageUrl?: string;
  /** Photos for the Photos tab, each with a description for screen readers. */
  photos?: PlacePhoto[];
  /** Map position, used by the Map page and Get Directions. */
  location: {
    lat: number;
    lng: number;
  };
  sensory: SensoryInfo;
  accessibility: {
    wheelchair: boolean;
    sensoryRoom: boolean;
  };
}
