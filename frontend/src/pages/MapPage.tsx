
import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Place } from '../types/place';
import { hasLocation } from '../types/place';
import type { PlaceLinkState } from '../components/PlaceCard';
import { getPlaces } from '../api/client';
import { categoryLabels } from '../lib/sensoryLabels';

const MapView = lazy(() => import('../components/MapView'));

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; places: Place[] };

export const MAP_LOAD_ERROR_MESSAGE =
  "We couldn't load places for the map. Check your internet connection, then select Try again.";

export function missingLocationMessage(count: number): string {
  return count === 1
    ? "1 place isn't on the map because its location isn't known yet."
    : `${count} places aren't on the map because their locations aren't known yet.`;
}

const linkState: PlaceLinkState = { from: '/map' };

export default function MapPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const loadPlaces = useCallback(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    getPlaces()
      .then((places) => {
        if (!cancelled) setState({ status: 'ready', places });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => loadPlaces(), [loadPlaces]);

  return (
    <div className="page page--wide">
      <header className="page__header">
        <h1 className="page__title">Map</h1>
        <p className="page__subtitle">
          See where places are located. Select a pin to see the place name and details.
        </p>
      </header>

      {state.status === 'loading' && (
        <p className="status-message" role="status">
          Loading places…
        </p>
      )}

      {state.status === 'error' && (
        <div className="status-message status-message--error" role="alert">
          <p>{MAP_LOAD_ERROR_MESSAGE}</p>
          <button
            type="button"
            className="button button--secondary"
            onClick={loadPlaces}
          >
            Try again
          </button>
        </div>
      )}

      {state.status === 'ready' && (
        <div className="map-layout">
          <Suspense
            fallback={
              <p className="status-message" role="status">
                Loading map…
              </p>
            }
          >
            <MapView places={state.places} />
          </Suspense>

          {/* The same places as a list, for screen reader users and anyone who prefers a list. */}
          <section aria-labelledby="map-list-heading" className="map-list">
            <h2 id="map-list-heading" className="section-title">
              Places on the map ({state.places.length})
            </h2>
            <ul className="map-list__items">
              {state.places.map((place) => (
                <li key={place.id} className="map-list__item">
                  <Link
                    to={`/places/${place.id}`}
                    state={linkState}
                    className="map-list__name"
                  >
                    {place.name}
                  </Link>
                  <p className="map-list__meta">
                    {categoryLabels[place.category]} • {place.city}
                  </p>
                  <p className="map-list__meta">{place.address}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
