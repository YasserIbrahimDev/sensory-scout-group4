import type {
  CrowdLevel,
  LightingLevel,
  NoiseLevel,
  PlaceCategory,
} from '../types/place';

// One source of truth for labels so cards, filters, and details always match.
export const noiseLabels: Record<NoiseLevel, string> = {
  low: 'Quiet',
  moderate: 'Moderate noise',
  high: 'Loud',
};

export const lightingLabels: Record<LightingLevel, string> = {
  dim: 'Dim light',
  normal: 'Normal light',
  bright: 'Bright light',
};

export const crowdLabels: Record<CrowdLevel, string> = {
  low: 'Low crowds',
  moderate: 'Moderate crowds',
  high: 'High crowds',
};

// Short labels for the filter buttons on the Search page.
export const noiseLevelLabels: Record<NoiseLevel, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
};

export const lightingLevelLabels: Record<LightingLevel, string> = {
  dim: 'Dim',
  normal: 'Normal',
  bright: 'Bright',
};

export const crowdLevelLabels: Record<CrowdLevel, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
};

// Names of each sensory attribute, used as captions on the Place Details tiles.
export const sensoryTypeLabels = {
  noise: 'Noise',
  lighting: 'Lighting',
  crowd: 'Crowds',
  temperature: 'Temperature',
  scents: 'Strong scents',
} as const;

export const notReportedLabel = 'Not reported yet';

export const categoryLabels: Record<PlaceCategory, string> = {
  library: 'Library',
  park: 'Park',
  cafe: 'Cafe',
  museum: 'Museum',
  restaurant: 'Restaurant',
  store: 'Store',
};
