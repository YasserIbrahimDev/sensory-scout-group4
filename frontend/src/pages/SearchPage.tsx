import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Place } from '../types/place';
import type { SearchFilters } from '../lib/searchFilters';
import { filtersFromParams, filtersToParams } from '../lib/searchFilters';
import { searchPlaces } from '../api/client';
import FilterPanel from '../components/FilterPanel';
import PlaceCard from '../components/PlaceCard';
import SearchBar from '../components/SearchBar';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; places: Place[] };

export const SEARCH_ERROR_MESSAGE =
  "We couldn't load places. Check your internet connection, then select Try again.";
export const NO_RESULTS_MESSAGE =
  'No places match your search and filters. Try removing a filter, selecting Clear all, or searching for something else.';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = filtersFromParams(searchParams);
  const paramsKey = searchParams.toString();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    searchPlaces(filtersFromParams(new URLSearchParams(paramsKey)))
      .then((places) => {
        if (!cancelled) setState({ status: 'ready', places });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey, attempt]);

  // Filters apply right away. "replace" keeps the Back button for leaving the page,
  // not for undoing each filter click.
  function updateFilters(next: SearchFilters) {
    setSearchParams(filtersToParams(next), { replace: true });
  }

  function showResults() {
    resultsHeadingRef.current?.focus();
    resultsHeadingRef.current?.scrollIntoView?.({ block: 'start' });
  }

  const resultCount = state.status === 'ready' ? state.places.length : null;

  return (
    <div className="page page--wide">
      <header className="page__header">
        <h1 className="page__title">Search places</h1>
        <p className="page__subtitle">Narrow results by the sensory conditions that matter to you.</p>
      </header>

      <SearchBar
        key={filters.q}
        initialQuery={filters.q}
        allowEmpty
        onSearch={(q) => updateFilters({ ...filters, q })}
      />

      <div className="search-layout">
        <FilterPanel
          filters={filters}
          onChange={updateFilters}
          resultCount={resultCount}
          onShowResults={showResults}
        />

        <section aria-labelledby="results-heading" className="search-results">
          <h2 id="results-heading" className="section-title" ref={resultsHeadingRef} tabIndex={-1}>
            Results{resultCount !== null && ` (${resultCount})`}
          </h2>

          {/* Announces the new count to screen reader users when filters change. */}
          <p className="visually-hidden" role="status">
            {resultCount === null ? '' : `${resultCount} ${resultCount === 1 ? 'place matches' : 'places match'}`}
          </p>

          {state.status === 'loading' && <p className="status-message">Loading places…</p>}

          {state.status === 'error' && (
            <div className="status-message status-message--error" role="alert">
              <p>{SEARCH_ERROR_MESSAGE}</p>
              <button type="button" className="button button--secondary" onClick={() => setAttempt((n) => n + 1)}>
                Try again
              </button>
            </div>
          )}

          {state.status === 'ready' && state.places.length === 0 && (
            <p className="status-message">{NO_RESULTS_MESSAGE}</p>
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
    </div>
  );
}
