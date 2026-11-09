import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartOff } from 'lucide-react';
import type { Place } from '../types/place';
import { getFavorites, removeFavorite } from '../api/client';
import { useAuth } from '../lib/auth';
import { useLoad } from '../lib/useLoad';
import PlaceCard from '../components/PlaceCard';
import SignInPrompt from '../components/SignInPrompt';

export const FAVORITES_MESSAGES = {
  signIn: 'Sign in to see the places you have saved.',
  loadFailed: "Couldn't load your saved places. Check your connection and try again.",
  empty: "You haven't saved any places yet. Use the Save button on a place's page to add it here.",
  removeFailed: "Couldn't remove this place. Check your connection and try again.",
} as const;

function SavedPlaces({ userId }: { userId: string }) {
  const { state, retry } = useLoad(getFavorites, userId);
  const [places, setPlaces] = useState<Place[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (state.status === 'ready') setPlaces(state.data);
  }, [state]);

  async function handleRemove(place: Place) {
    if (removingId) return;
    setRemovingId(place.id);
    setMessage('');
    setError('');
    try {
      await removeFavorite(place.id);
      setPlaces((current) => current.filter((p) => p.id !== place.id));
      setMessage(`Removed ${place.name} from your Favorites.`);
      // The button that had focus is gone, so move focus somewhere predictable.
      headingRef.current?.focus();
    } catch {
      setError(FAVORITES_MESSAGES.removeFailed);
    } finally {
      setRemovingId(null);
    }
  }

  if (state.status === 'loading') {
    return <p className="status-message" role="status">Loading your saved places…</p>;
  }

  if (state.status === 'error') {
    return (
      <div className="status-message status-message--error" role="alert">
        <p>{FAVORITES_MESSAGES.loadFailed}</p>
        <button type="button" className="button button--secondary" onClick={retry}>
          Try again
        </button>
      </div>
    );
  }

  const count = places.length;

  return (
    <section aria-labelledby="saved-heading">
      <h2 id="saved-heading" className="section-title" ref={headingRef} tabIndex={-1}>
        {count === 1 ? '1 saved place' : `${count} saved places`}
      </h2>
      <p role="status" className={message ? 'notice favorites__notice' : 'visually-hidden'}>{message}</p>
      {error && <p role="alert" className="notice notice--error favorites__notice">{error}</p>}

      {count === 0 ? (
        <p className="status-message">
          {FAVORITES_MESSAGES.empty} <Link to="/search">Find places to save</Link>
        </p>
      ) : (
        <ul className="place-grid favorites__list">
          {places.map((place) => (
            <li key={place.id} className="favorites__item">
              <PlaceCard place={place} />
              <button
                type="button"
                className="action-button favorites__remove"
                onClick={() => handleRemove(place)}
                aria-busy={removingId === place.id}
              >
                <HeartOff className="action-button__icon" aria-hidden="true" />
                Remove<span className="visually-hidden"> {place.name} from Favorites</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function FavoritesPage() {
  const { auth } = useAuth();

  return (
    <div className="page favorites">
      <header className="page__header">
        <h1 className="page__title">Favorites</h1>
        <p className="page__subtitle">Places you have saved, so you can find them again quickly.</p>
      </header>

      {auth.status === 'loading' && <p className="status-message" role="status">Loading…</p>}
      {auth.status === 'signedOut' && <SignInPrompt message={FAVORITES_MESSAGES.signIn} />}
      {auth.status === 'signedIn' && <SavedPlaces userId={auth.user.id} />}
    </div>
  );
}
