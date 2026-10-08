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
  imageUrl?: string;
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
