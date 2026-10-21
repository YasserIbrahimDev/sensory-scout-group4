/**
 * Hamza: API contract adapter.
 * This is intentionally independent of the mock-only Place UI model.
 * The backend does not supply an overall star rating, review text, hours,
 * or guaranteed coordinates. Unknown values must remain unknown.
 */
export interface SensorySummary {
  ratings_count: number;
  noise_rating: number | null;
  light_rating: number | null;
  crowd_rating: number | null;
  noise_count: number;
  light_count: number;
  crowd_count: number;
}

export interface AccessibilitySummary {
  accessible_reports: number;
  inaccessible_reports: number;
  unknown_reports: number;
}

export interface VenueDetail {
  id: number;
  name: string;
  category: string;
  address: string;
  city: string;
  image_url: string | null;
  is_sample: boolean;
  slug: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  external_map_provider: string | null;
  external_map_id: string | null;
  created_at: string;
  updated_at: string;
  review_count: number;
  sensory_summary: SensorySummary;
  accessibility_summary: AccessibilitySummary;
}

export interface PaginatedVenues {
  items: VenueDetail[];
  total_items: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_previous: boolean;
  has_next: boolean;
}

export type Intensity = 'low' | 'moderate' | 'high';
export type LightIntensity = 'dim' | 'normal' | 'bright';

export interface VenueView {
  id: string;
  name: string;
  category: string;
  city: string;
  address: string;
  description: string;
  imageUrl: string | null;
  isSample: boolean;
  reviewCount: number;
  /** The API does not provide an overall star rating. */
  overallRating: null;
  location: { lat: number; lng: number } | null;
  sensory: {
    noise: Intensity | null;
    lighting: LightIntensity | null;
    crowd: Intensity | null;
  };
  accessibility: {
    accessibleReports: number;
    inaccessibleReports: number;
    unknownReports: number;
    /** Reports are not a certification of accessibility. */
    verifiedWheelchairAccess: null;
  };
}

export function intensityFromScore(score: number | null): Intensity | null {
  if (score === null || !Number.isFinite(score) || score < 1 || score > 5) return null;
  if (score < 2.5) return 'low';
  if (score < 3.5) return 'moderate';
  return 'high';
}

export function lightFromScore(score: number | null): LightIntensity | null {
  const level = intensityFromScore(score);
  return level === 'low' ? 'dim' : level === 'moderate' ? 'normal' : level === 'high' ? 'bright' : null;
}

export function adaptVenue(venue: VenueDetail): VenueView {
  const hasCoordinates = venue.latitude !== null && venue.longitude !== null
    && Number.isFinite(venue.latitude) && Number.isFinite(venue.longitude)
    && Math.abs(venue.latitude) <= 90 && Math.abs(venue.longitude) <= 180;
  return {
    id: String(venue.id),
    name: venue.name,
    category: venue.category,
    city: venue.city,
    address: venue.address,
    description: venue.description,
    imageUrl: venue.image_url,
    isSample: venue.is_sample,
    reviewCount: venue.review_count,
    overallRating: null,
    location: hasCoordinates ? { lat: venue.latitude!, lng: venue.longitude! } : null,
    sensory: {
      noise: intensityFromScore(venue.sensory_summary.noise_rating),
      lighting: lightFromScore(venue.sensory_summary.light_rating),
      crowd: intensityFromScore(venue.sensory_summary.crowd_rating),
    },
    accessibility: {
      accessibleReports: venue.accessibility_summary.accessible_reports,
      inaccessibleReports: venue.accessibility_summary.inaccessible_reports,
      unknownReports: venue.accessibility_summary.unknown_reports,
      verifiedWheelchairAccess: null,
    },
  };
}
