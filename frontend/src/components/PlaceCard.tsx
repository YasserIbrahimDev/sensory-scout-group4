import { Link, useLocation } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Place } from '../types/place';
import { categoryLabels, reviewCountLabel } from '../lib/sensoryLabels';
import { categoryIcons } from '../lib/sensoryIcons';
import SensoryBadge from './SensoryBadge';

/** Router state passed to Place Details so "Back to results" returns to the same filters. */
export interface PlaceLinkState {
  from: string;
}

interface PlaceCardProps {
  place: Place;
}

export default function PlaceCard({ place }: PlaceCardProps) {
  const CategoryIcon = categoryIcons[place.category];
  const location = useLocation();
  const linkState: PlaceLinkState = { from: location.pathname + location.search };

  return (
    <article className="place-card">
      <div className="place-card__media">
        {place.imageUrl ? (
          <img src={place.imageUrl} alt="" className="place-card__image" loading="lazy" />
        ) : (
          <div className={`place-card__placeholder place-card__placeholder--${place.category}`}>
            <span className="place-card__placeholder-icon">
              <CategoryIcon aria-hidden="true" />
            </span>
          </div>
        )}
      </div>

      <div className="place-card__body">
        <h3 className="place-card__title">
          {/* The whole card is clickable through this link's ::after overlay. */}
          <Link to={`/places/${place.id}`} state={linkState} className="place-card__link">
            {place.name}
          </Link>
        </h3>
        <p className="place-card__meta">
          {categoryLabels[place.category]} • {place.city}
        </p>

        {place.reviewCount > 0 && place.rating !== null ? (
          <p className="place-card__rating">
            <Star className="place-card__star" aria-hidden="true" />
            <span>
              <strong>{place.rating.toFixed(1)}</strong>{' '}
              <span className="place-card__reviews">
                ({reviewCountLabel(place.reviewCount)})
              </span>
            </span>
          </p>
        ) : place.reviewCount > 0 ? (
          <p className="place-card__rating">{reviewCountLabel(place.reviewCount)}</p>
        ) : (
          <p className="place-card__rating">No reviews yet</p>
        )}


        <ul className="place-card__badges" aria-label="Sensory conditions">
          <li><SensoryBadge type="noise" level={place.sensory.noise} /></li>
          <li><SensoryBadge type="lighting" level={place.sensory.lighting} /></li>
          <li><SensoryBadge type="crowd" level={place.sensory.crowd} /></li>
        </ul>
      </div>
    </article>
  );
}
