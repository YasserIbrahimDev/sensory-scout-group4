import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Heart, MapPin, Navigation, Share2, Star } from 'lucide-react';
import type { Place } from '../types/place';
import type { PlaceLinkState } from '../components/PlaceCard';
import { getPlace, isFavorite, removeFavorite, saveFavorite } from '../api/client';
import { useAuth } from '../lib/auth';
import SignInPrompt from '../components/SignInPrompt';
import { categoryLabels, reviewCountLabel } from '../lib/sensoryLabels';
import { categoryIcons } from '../lib/sensoryIcons';
import { directionsUrl } from '../lib/directions';
import SensoryInfo from '../components/SensoryInfo';
import PlaceTabs from '../components/PlaceTabs';
import ReviewsTab from '../components/placeTabs/ReviewsTab';
import PhotosTab from '../components/placeTabs/PhotosTab';
import NearbyTab from '../components/placeTabs/NearbyTab';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; place: Place | null };

type Notice =
  | { kind: 'info'; text: string }
  | { kind: 'error'; text: string }
  | { kind: 'signIn' }
  | null;

export const COMING_SOON_MESSAGES = {
  share: 'Sharing is coming soon. For now, copy the page address from your browser to share this place.',
} as const;

export const SAVE_MESSAGES = {
  signIn: 'Sign in to save places to your Favorites.',
  saved: 'Saved to your Favorites.',
  removed: 'Removed from your Favorites.',
  saveFailed: "Couldn't save this place. Check your connection and try again.",
  removeFailed: "Couldn't remove this place from your Favorites. Check your connection and try again.",
} as const;

/** Whether the signed-in user has saved this place, and a way to change it. */
function useSavedPlace(placeId: string, setNotice: (notice: Notice) => void) {
  const { auth } = useAuth();
  const userId = auth.status === 'signedIn' ? auth.user.id : null;
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSaved(false);
    if (!userId) return;
    isFavorite(placeId)
      .then((value) => {
        if (!cancelled) setSaved(value);
      })
      .catch(() => {
        // Leave the button as "not saved"; pressing it will save the place.
      });
    return () => {
      cancelled = true;
    };
  }, [placeId, userId]);

  async function toggle() {
    if (!userId) {
      setNotice({ kind: 'signIn' });
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      if (saved) {
        await removeFavorite(placeId);
        setSaved(false);
        setNotice({ kind: 'info', text: SAVE_MESSAGES.removed });
      } else {
        await saveFavorite(placeId);
        setSaved(true);
        setNotice({ kind: 'info', text: SAVE_MESSAGES.saved });
      }
    } catch {
      setNotice({ kind: 'error', text: saved ? SAVE_MESSAGES.removeFailed : SAVE_MESSAGES.saveFailed });
    } finally {
      setBusy(false);
    }
  }

  return { saved, toggle };
}

function useBackLink(): { to: string; label: string } {
  const state = useLocation().state as PlaceLinkState | null;
  const from = state?.from;
  if (from && from.startsWith('/search')) return { to: from, label: 'Back to results' };
  if (from) return { to: from, label: 'Back' };
  return { to: '/search', label: 'Back to results' };
}

function OverviewTab({ place }: { place: Place }) {
  return (
    <div className="overview">
      <div className="overview__row">
        <ul className="overview__facts">
          <li>
            <MapPin className="overview__icon" aria-hidden="true" />
            <span><span className="visually-hidden">Address: </span>{place.address}</span>
          </li>
          <li>
            <Clock className="overview__icon" aria-hidden="true" />
            <span><span className="visually-hidden">Hours: </span>{place.hours ?? 'Hours not available'}</span>
          </li>
        </ul>
        <a
          className="button button--primary overview__directions"
          href={directionsUrl(place)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Navigation className="button__icon" aria-hidden="true" />
          Get Directions
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      </div>
      <p className="overview__description">{place.description}</p>
    </div>
  );
}

export default function PlaceDetailsPage() {
  const { placeId = '' } = useParams();
  const back = useBackLink();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [notice, setNotice] = useState<Notice>(null);
  const save = useSavedPlace(placeId, setNotice);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    setNotice(null);
    getPlace(placeId)
      .then((place) => {
        if (!cancelled) setState({ status: 'ready', place });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [placeId]);

  const backLink = (
    <Link to={back.to} className="back-link">
      <ArrowLeft className="back-link__icon" aria-hidden="true" />
      {back.label}
    </Link>
  );

  if (state.status === 'loading') {
    return (
      <div className="page">
        <p className="status-message" role="status">Loading place…</p>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="page">
        {backLink}
        <h1 className="page__title">Couldn't load this place</h1>
        <p className="page__subtitle">
          Check your internet connection and reload the page, or <Link to="/">go back home</Link>.
        </p>
      </div>
    );
  }

  const { place } = state;
  if (!place) {
    return (
      <div className="page">
        {backLink}
        <h1 className="page__title">Place not found</h1>
        <p className="page__subtitle">
          This place may have been removed. <Link to="/">Go back home</Link> to find another one.
        </p>
      </div>
    );
  }

  const CategoryIcon = categoryIcons[place.category];

  return (
    <div className="page place-details">
      <div className="place-details__toolbar">
        {backLink}
        <div className="place-details__actions">
          <button type="button" className="action-button" aria-pressed={save.saved} onClick={save.toggle}>
            <Heart className="action-button__icon" aria-hidden="true" />
            Save
          </button>
          <button
            type="button"
            className="action-button"
            aria-disabled="true"
            onClick={() => setNotice({ kind: 'info', text: COMING_SOON_MESSAGES.share })}
          >
            <Share2 className="action-button__icon" aria-hidden="true" />
            Share
            <span className="soon-tag">Coming soon</span>
          </button>
        </div>
      </div>
      <div role="status" className={notice && notice.kind !== 'error' ? undefined : 'visually-hidden'}>
        {notice?.kind === 'info' && <p className="notice">{notice.text}</p>}
        {notice?.kind === 'signIn' && <SignInPrompt message={SAVE_MESSAGES.signIn} />}
      </div>
      {notice?.kind === 'error' && <p role="alert" className="notice notice--error">{notice.text}</p>}

      <header className="place-hero">
        {place.imageUrl ? (
          <img src={place.imageUrl} alt="" className="place-hero__image" />
        ) : (
          <div className={`place-hero__image place-card__placeholder place-card__placeholder--${place.category}`}>
            <CategoryIcon aria-hidden="true" />
          </div>
        )}
        <div className="place-hero__overlay">
          <div>
            <h1 className="place-hero__name">{place.name}</h1>
            <p className="place-hero__meta">{categoryLabels[place.category]} • {place.city}</p>
          </div>

          {place.reviewCount > 0 && place.rating !== null ? (
            <p className="place-hero__rating">
              <Star className="place-hero__star" aria-hidden="true" />
              <span>
                {place.rating.toFixed(1)} ({reviewCountLabel(place.reviewCount)})
              </span>
            </p>
          ) : place.reviewCount > 0 ? (
            <p className="place-hero__rating">{reviewCountLabel(place.reviewCount)}</p>
          ) : (
            <p className="place-hero__rating">No reviews yet</p>
          )}

        </div>
      </header>

      <SensoryInfo sensory={place.sensory} headingId="sensory-heading" />

      <PlaceTabs
        label="Place information"
        tabs={[
          { id: 'overview', label: 'Overview', content: <OverviewTab place={place} /> },
          { id: 'reviews', label: `Reviews (${place.reviewCount})`, content: <ReviewsTab place={place} /> },
          { id: 'photos', label: 'Photos', content: <PhotosTab place={place} /> },
          { id: 'nearby', label: 'Nearby', content: <NearbyTab place={place} /> },
        ]}
      />
    </div>
  );
}
