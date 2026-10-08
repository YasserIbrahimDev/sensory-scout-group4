import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Heart, MapPin, Navigation, Share2, Star } from 'lucide-react';
import type { Place } from '../types/place';
import type { PlaceLinkState } from '../components/PlaceCard';
import { getPlace } from '../api/client';
import { categoryLabels } from '../lib/sensoryLabels';
import { categoryIcons } from '../lib/sensoryIcons';
import { directionsUrl } from '../lib/directions';
import SensoryInfo from '../components/SensoryInfo';
import PlaceTabs from '../components/PlaceTabs';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; place: Place | null };

export const COMING_SOON_MESSAGES = {
  save: 'Saving places is coming soon. You will be able to save places once sign-in is available.',
  share: 'Sharing is coming soon. For now, copy the page address from your browser to share this place.',
} as const;

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

function ComingSoonTab({ message }: { message: string }) {
  return <p className="coming-soon-panel">{message}</p>;
}

export default function PlaceDetailsPage() {
  const { placeId = '' } = useParams();
  const back = useBackLink();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    setNotice('');
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
          <button type="button" className="action-button" aria-disabled="true" onClick={() => setNotice(COMING_SOON_MESSAGES.save)}>
            <Heart className="action-button__icon" aria-hidden="true" />
            Save
            <span className="soon-tag">Coming soon</span>
          </button>
          <button type="button" className="action-button" aria-disabled="true" onClick={() => setNotice(COMING_SOON_MESSAGES.share)}>
            <Share2 className="action-button__icon" aria-hidden="true" />
            Share
            <span className="soon-tag">Coming soon</span>
          </button>
        </div>
      </div>
      <p role="status" className={notice ? 'notice' : 'visually-hidden'}>{notice}</p>

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
          <p className="place-hero__rating">
            <Star className="place-hero__star" aria-hidden="true" />
            <span aria-hidden="true">{place.rating.toFixed(1)} ({place.reviewCount} reviews)</span>
            <span className="visually-hidden">
              Rated {place.rating.toFixed(1)} out of 5 from {place.reviewCount} reviews
            </span>
          </p>
        </div>
      </header>

      <SensoryInfo sensory={place.sensory} headingId="sensory-heading" />

      <PlaceTabs
        label="Place information"
        tabs={[
          { id: 'overview', label: 'Overview', content: <OverviewTab place={place} /> },
          {
            id: 'reviews',
            label: `Reviews (${place.reviewCount})`,
            content: <ComingSoonTab message="Reading and writing reviews is coming soon." />,
          },
          { id: 'photos', label: 'Photos', content: <ComingSoonTab message="Photos are coming soon." /> },
          { id: 'nearby', label: 'Nearby', content: <ComingSoonTab message="Nearby places are coming soon." /> },
        ]}
      />
    </div>
  );
}
