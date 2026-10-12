import { Link } from 'react-router-dom';
import type { Place } from '../../types/place';
import type { PlaceLinkState } from '../PlaceCard';
import { getNearbyPlaces } from '../../api/client';
import { useLoad } from '../../lib/useLoad';
import { categoryLabels } from '../../lib/sensoryLabels';
import SensoryBadge from '../SensoryBadge';
import TabStatus from './TabStatus';

export function formatDistance(miles: number): string {
  return miles < 0.1 ? 'Less than 0.1 mi away' : `${miles.toFixed(1)} mi away`;
}

export default function NearbyTab({ place }: { place: Place }) {
  const { state, retry } = useLoad(() => getNearbyPlaces(place.id), place.id);
  const linkState: PlaceLinkState = { from: `/places/${place.id}` };

  if (state.status !== 'ready') {
    return <TabStatus what="nearby places" status={state.status} onRetry={retry} />;
  }
  if (state.data.length === 0) {
    return <p className="status-message">No nearby places found.</p>;
  }

  return (
    <ul className="nearby-list">
      {state.data.map(({ place: nearby, distanceMiles }) => (
        <li key={nearby.id} className="nearby">
          {nearby.imageUrl && <img src={nearby.imageUrl} alt="" className="nearby__image" loading="lazy" />}
          <div className="nearby__body">
            <Link to={`/places/${nearby.id}`} state={linkState} className="nearby__name">
              {nearby.name}
            </Link>
            <p className="nearby__meta">
              {categoryLabels[nearby.category]} • {formatDistance(distanceMiles)}
            </p>
            <ul className="nearby__badges" aria-label={`Sensory conditions at ${nearby.name}`}>
              <li><SensoryBadge type="noise" level={nearby.sensory.noise} /></li>
              <li><SensoryBadge type="lighting" level={nearby.sensory.lighting} /></li>
              <li><SensoryBadge type="crowd" level={nearby.sensory.crowd} /></li>
            </ul>
          </div>
        </li>
      ))}
    </ul>
  );
}
