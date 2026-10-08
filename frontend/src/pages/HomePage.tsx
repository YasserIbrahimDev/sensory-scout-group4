import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Place } from '../types/place';
import { getPopularPlaces } from '../api/client';
import PlaceCard from '../components/PlaceCard';
import SearchBar from '../components/SearchBar';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; places: Place[] };

export const LOAD_ERROR_MESSAGE =
  "We couldn't load popular places. Check your internet connection, then select Try again.";

export default function HomePage() {
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const loadPlaces = useCallback(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    getPopularPlaces()
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

  function handleSearch(query: string) {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="page">
      <div className="home-hero">
        <header className="page__header">
          <h1 className="page__title home-hero__title">Find sensory-friendly places</h1>
          <p className="page__subtitle">Discover. Compare. Decide.</p>
        </header>

        <SearchBar onSearch={handleSearch} />
      </div>

      <section aria-labelledby="popular-heading" className="home__popular">
        <div className="section-header">
          <h2 id="popular-heading" className="section-title">Popular near you</h2>
          <Link to="/search" className="section-header__link">
            See all<span className="visually-hidden"> places</span>
          </Link>
        </div>

        {state.status === 'loading' && (
          <p className="status-message" role="status">Loading places…</p>
        )}

        {state.status === 'error' && (
          <div className="status-message status-message--error" role="alert">
            <p>{LOAD_ERROR_MESSAGE}</p>
            <button type="button" className="button button--secondary" onClick={loadPlaces}>
              Try again
            </button>
          </div>
        )}

        {state.status === 'ready' && state.places.length === 0 && (
          <p className="status-message">
            No places to show yet. Try searching by name, category, or location.
          </p>
        )}

        {state.status === 'ready' && state.places.length > 0 && (
          <div className="place-grid">
            {state.places.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
