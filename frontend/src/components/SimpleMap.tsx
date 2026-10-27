import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import type { LocatedPlace } from '../types/place';
import type { PlaceLinkState } from './PlaceCard';
import { categoryLabels } from '../lib/sensoryLabels';
import SensoryBadge from './SensoryBadge';

interface SimpleMapProps {
  places: LocatedPlace[];
  /** Short message shown under the map, for example why the detailed map isn't showing. */
  note?: string;
}

const linkState: PlaceLinkState = { from: '/map' };

/** Space kept around the outer pins, as a fraction of the map size. */
const PADDING = 0.12;

/**
 * Turns latitude and longitude into a position inside the map box (0 to 100 percent).
 * The box is fitted to the places, so they always fill the map.
 */
export function projectPlaces(places: LocatedPlace[]): Map<string, { x: number; y: number }> {
  const lats = places.map((p) => p.location.lat);
  const lngs = places.map((p) => p.location.lng);
  const [minLat, maxLat] = [Math.min(...lats), Math.max(...lats)];
  const [minLng, maxLng] = [Math.min(...lngs), Math.max(...lngs)];
  const latSpan = maxLat - minLat || 1;
  const lngSpan = maxLng - minLng || 1;
  const usable = 1 - PADDING * 2;

  return new Map(
    places.map((p) => [
      p.id,
      {
        x: (PADDING + ((p.location.lng - minLng) / lngSpan) * usable) * 100,
        // North is up, so higher latitude means closer to the top.
        y: (PADDING + ((maxLat - p.location.lat) / latSpan) * usable) * 100,
      },
    ]),
  );
}

/**
 * A simple drawn map used until Mapbox is connected. It shows where places are
 * relative to each other, without street details.
 */
export default function SimpleMap({ places, note }: SimpleMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pinRefs = useRef(new Map<string, HTMLButtonElement>());
  const cardHeadingRef = useRef<HTMLHeadingElement>(null);
  const cardId = useId();
  const positions = projectPlaces(places);
  const selected = places.find((p) => p.id === selectedId) ?? null;

  // When a pin opens its card, move focus into the card so keyboard and
  // screen reader users land on the place name.
  useEffect(() => {
    if (selectedId) cardHeadingRef.current?.focus();
  }, [selectedId]);

  function closeCard() {
    const id = selectedId;
    setSelectedId(null);
    if (id) pinRefs.current.get(id)?.focus();
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') closeCard();
  }

  return (
    <div className="simple-map-wrapper">
      <div className="simple-map" role="region" aria-label="Simple map showing place locations. Use Tab to move between place pins.">
        <svg className="simple-map__background" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <rect width="100" height="100" fill="#eef3ec" />
          {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((n) => (
            <g key={n} stroke="#dfe7dc" strokeWidth="0.3">
              <line x1={n} y1="0" x2={n} y2="100" />
              <line x1="0" y1={n} x2="100" y2={n} />
            </g>
          ))}
        </svg>
        <span className="simple-map__north" aria-hidden="true">N ↑</span>

        {places.map((place) => {
          const position = positions.get(place.id)!;
          const isSelected = place.id === selectedId;
          return (
            <button
              key={place.id}
              ref={(el) => {
                if (el) pinRefs.current.set(place.id, el);
                else pinRefs.current.delete(place.id);
              }}
              type="button"
              className={`simple-map__pin${isSelected ? ' simple-map__pin--selected' : ''}`}
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              aria-label={`${place.name}, ${categoryLabels[place.category]}`}
              aria-expanded={isSelected}
              aria-controls={isSelected ? cardId : undefined}
              onClick={() => (isSelected ? closeCard() : setSelectedId(place.id))}
            >
              <span className="simple-map__pin-label" aria-hidden="true">{place.name}</span>
            </button>
          );
        })}

        {selected && (
          <div id={cardId} className="simple-map__card" onKeyDown={handleCardKeyDown}>
            <div className="simple-map__card-header">
              <h3 ref={cardHeadingRef} tabIndex={-1} className="simple-map__card-title">{selected.name}</h3>
              <button type="button" className="simple-map__close" onClick={closeCard} aria-label={`Close ${selected.name}`}>
                <X aria-hidden="true" />
              </button>
            </div>
            <p className="simple-map__card-meta">{categoryLabels[selected.category]} • {selected.address}</p>
            <ul className="simple-map__card-badges" aria-label={`Sensory conditions at ${selected.name}`}>
              <li><SensoryBadge type="noise" level={selected.sensory.noise} /></li>
              <li><SensoryBadge type="lighting" level={selected.sensory.lighting} /></li>
              <li><SensoryBadge type="crowd" level={selected.sensory.crowd} /></li>
            </ul>
            <Link to={`/places/${selected.id}`} state={linkState} className="simple-map__card-link">
              View details
            </Link>
          </div>
        )}
      </div>
      <p className="simple-map__note">
        Simple map: shows where places are compared to each other. Street details aren't shown.
        {note && ` ${note}`}
      </p>
    </div>
  );
}
