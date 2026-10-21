import React, { useState, useEffect, useCallback } from 'react';

// ==========================================
// 1. Types from API_CONTRACT.md
// ==========================================

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

interface PlaceDetailsProps {
  placeId: number;
}

// Fallback base URL pointing to the local API
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  'http://localhost:8000/api/v1';

// ==========================================
// 2. Component Implementation
// ==========================================

export const PlaceDetails: React.FC<PlaceDetailsProps> = ({ placeId }) => {
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  const fetchPlaceDetails = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsNotFound(false);

    try {
      const response = await fetch(`${API_BASE_URL}/places/${placeId}`);

      if (response.status === 404) {
        setIsNotFound(true);
        setVenue(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`Request failed with status code ${response.status}`);
      }

      const data: VenueDetail = await response.json();
      setVenue(data);
    } catch (err) {
      setErrorMessage(
        'Unable to load venue information due to a network error. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    fetchPlaceDetails();
  }, [fetchPlaceDetails]);

  // Helper: Display null ratings as "Unknown" rather than 0
  const formatRating = (rating: number | null): string => {
    return rating !== null ? `${rating.toFixed(1)} / 5` : 'Unknown (No ratings yet)';
  };

  // --- State 1: Loading ---
  if (isLoading) {
    return (
      <div role="status" aria-live="polite" style={stateContainerStyle}>
        <p>Loading place details...</p>
      </div>
    );
  }

  // --- State 2: 404 Place Not Found ---
  if (isNotFound) {
    return (
      <div role="alert" style={stateContainerStyle}>
        <h2>Place Not Found</h2>
        <p>The place you are searching for does not exist or has been removed.</p>
      </div>
    );
  }

  // --- State 3: Error / Network Failure ---
  if (errorMessage || !venue) {
    return (
      <div role="alert" style={stateContainerStyle}>
        <h2>Error Loading Place</h2>
        <p>{errorMessage || 'An unexpected error occurred.'}</p>
        <button
          onClick={fetchPlaceDetails}
          style={retryButtonStyle}
          type="button"
        >
          Retry
        </button>
      </div>
    );
  }

  // --- State 4: Render Place Details ---
  const { sensory_summary, accessibility_summary } = venue;

  return (
    <article style={cardStyle} aria-labelledby="venue-title">
      {/* Sample Data Indicator */}
      {venue.is_sample && (
        <aside
          aria-label="Development Notice"
          style={sampleNoticeStyle}
        >
          Notice: This is fictional development data.
        </aside>
      )}

      {/* Venue Header & Image */}
      <header>
        <h1 id="venue-title" style={{ margin: '0 0 8px 0' }}>{venue.name}</h1>
        <p style={{ margin: '0 0 16px 0', color: '#4a5568' }}>
          <strong>Category:</strong> {venue.category} |{' '}
          <strong>Location:</strong> {venue.address}, {venue.city}
        </p>

        {venue.image_url ? (
          <img
            src={venue.image_url}
            alt={`Exterior or interior of ${venue.name}`}
            style={imageStyle}
          />
        ) : (
          <div
            role="img"
            aria-label="No image available for this venue"
            style={imagePlaceholderStyle}
          >
            No Image Provided
          </div>
        )}
      </header>

      {/* Description */}
      <section style={sectionStyle} aria-labelledby="desc-heading">
        <h2 id="desc-heading" style={headingStyle}>About this Venue</h2>
        <p>{venue.description || 'No description available.'}</p>
      </section>

      {/* Sensory Summary */}
      <section style={sectionStyle} aria-labelledby="sensory-heading">
        <h2 id="sensory-heading" style={headingStyle}>Sensory Environment</h2>
        <p style={{ fontSize: '0.9rem', color: '#555' }}>
          Ratings are reported on a scale of 1 (Quiet / Dim / Sparse) to 5 (Loud / Bright / Crowded).
        </p>
        <ul style={listStyle}>
          <li>
            <strong>Noise Level:</strong> {formatRating(sensory_summary.noise_rating)}
            {sensory_summary.noise_count > 0 && ` (${sensory_summary.noise_count} reports)`}
          </li>
          <li>
            <strong>Lighting Level:</strong> {formatRating(sensory_summary.light_rating)}
            {sensory_summary.light_count > 0 && ` (${sensory_summary.light_count} reports)`}
          </li>
          <li>
            <strong>Crowd Density:</strong> {formatRating(sensory_summary.crowd_rating)}
            {sensory_summary.crowd_count > 0 && ` (${sensory_summary.crowd_count} reports)`}
          </li>
        </ul>
      </section>

      {/* Accessibility Reports */}
      <section style={sectionStyle} aria-labelledby="accessibility-heading">
        <h2 id="accessibility-heading" style={headingStyle}>Accessibility Reports</h2>
        <p style={{ fontSize: '0.9rem', color: '#555' }}>
          Community feedback on physical and sensory accessibility:
        </p>
        <ul style={listStyle}>
          <li>Accessible reports: {accessibility_summary.accessible_reports}</li>
          <li>Inaccessible reports: {accessibility_summary.inaccessible_reports}</li>
          <li>Unknown/unspecified reports: {accessibility_summary.unknown_reports}</li>
        </ul>
      </section>

      {/* Metadata */}
      <footer style={footerStyle}>
        <small>Total Reviews: {venue.review_count}</small>
      </footer>
    </article>
  );
};

// ==========================================
// 3. Baseline Accessible Styling
// ==========================================

const cardStyle: React.CSSProperties = {
  maxWidth: '720px',
  margin: '24px auto',
  padding: '24px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  color: '#1f2937',
  lineHeight: 1.5,
};

const stateContainerStyle: React.CSSProperties = {
  maxWidth: '720px',
  margin: '40px auto',
  padding: '32px',
  textAlign: 'center',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const sampleNoticeStyle: React.CSSProperties = {
  backgroundColor: '#fef3c7',
  color: '#92400e',
  padding: '8px 12px',
  borderRadius: '4px',
  marginBottom: '16px',
  fontWeight: 600,
  fontSize: '0.875rem',
};

const sectionStyle: React.CSSProperties = {
  marginTop: '20px',
  borderTop: '1px solid #e5e7eb',
  paddingTop: '16px',
};

const headingStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  margin: '0 0 8px 0',
  color: '#111827',
};

const listStyle: React.CSSProperties = {
  listStyleType: 'disc',
  paddingLeft: '20px',
  margin: '8px 0',
};

const imageStyle: React.CSSProperties = {
  width: '100%',
  maxHeight: '360px',
  objectFit: 'cover',
  borderRadius: '6px',
};

const imagePlaceholderStyle: React.CSSProperties = {
  width: '100%',
  height: '180px',
  backgroundColor: '#e5e7eb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '6px',
  color: '#6b7280',
  fontWeight: 500,
};

const retryButtonStyle: React.CSSProperties = {
  marginTop: '16px',
  padding: '8px 16px',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 600,
};

const footerStyle: React.CSSProperties = {
  marginTop: '24px',
  borderTop: '1px solid #e5e7eb',
  paddingTop: '12px',
  color: '#6b7280',
};