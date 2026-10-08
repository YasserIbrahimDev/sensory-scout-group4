import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Place } from '../types/place';
import type { PlaceLinkState } from './PlaceCard';
import { categoryLabels } from '../lib/sensoryLabels';

interface MapViewProps {
  places: Place[];
}

export const MAP_UNAVAILABLE_MESSAGE =
  "The map can't be shown right now. You can still use the list of places on this page, or find places with Search.";

const linkState: PlaceLinkState = { from: '/map' };

export default function MapView({ places }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  const token = import.meta.env.VITE_MAPBOX_TOKEN;

  useEffect(() => {
    const container = containerRef.current;
    if (!token) {
      console.warn('Map: add VITE_MAPBOX_TOKEN to frontend/.env.local (see .env.example).');
      setFailed(true);
      return;
    }
    if (!container || places.length === 0) return;

    let map: mapboxgl.Map;
    try {
      mapboxgl.accessToken = token;
      map = new mapboxgl.Map({
        container,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [places[0].location.lng, places[0].location.lat],
        zoom: 12,
      });
    } catch {
      // For example, the browser does not support WebGL.
      setFailed(true);
      return;
    }

    let loaded = false;
    map.on('load', () => {
      loaded = true;
    });
    // An error before the map loads (bad token, no connection) means no map at all.
    map.on('error', () => {
      if (!loaded) setFailed(true);
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const bounds = new mapboxgl.LngLatBounds();
    for (const place of places) {
      const { lng, lat } = place.location;
      bounds.extend([lng, lat]);

      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = 'map-marker';

      const popup = new mapboxgl.Popup({ offset: 18 }).setDOMContent(popupContent(place));
      new mapboxgl.Marker({ element: marker }).setLngLat([lng, lat]).setPopup(popup).addTo(map);
      // Set after creating the Marker so Mapbox's default "Map marker" label is replaced.
      marker.setAttribute('aria-label', `${place.name}, ${categoryLabels[place.category]}. Show details`);
    }
    map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 0 });

    // Text is set with textContent, never as HTML, so place names from the API can't inject code.
    function popupContent(place: Place): HTMLElement {
      const wrapper = document.createElement('div');
      wrapper.className = 'map-popup';
      const name = document.createElement('p');
      name.className = 'map-popup__name';
      name.textContent = place.name;
      const meta = document.createElement('p');
      meta.textContent = `${categoryLabels[place.category]} • ${place.city}`;
      const link = document.createElement('a');
      link.href = `/places/${place.id}`;
      link.textContent = 'View details';
      link.addEventListener('click', (event) => {
        event.preventDefault();
        navigate(`/places/${place.id}`, { state: linkState });
      });
      wrapper.append(name, meta, link);
      return wrapper;
    }

    return () => map.remove();
  }, [places, token, navigate]);

  if (failed) {
    return (
      <div className="map-view map-view--failed" role="alert">
        <p>{MAP_UNAVAILABLE_MESSAGE}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="map-view"
      role="region"
      aria-label="Map showing place locations. Use Tab to move between place pins."
    />
  );
}
