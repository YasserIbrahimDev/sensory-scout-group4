// A stand-in for mapbox-gl in tests. jsdom has no WebGL, so the real map can't draw.
// It records the markers and popups that MapView creates so tests can check them.

type Handler = (event?: unknown) => void;

export const mapboxState = {
  maps: [] as MockMap[],
  markers: [] as MockMarker[],
  throwOnCreate: false,
  reset() {
    this.maps = [];
    this.markers = [];
    this.throwOnCreate = false;
  },
};

class MockMap {
  handlers: Record<string, Handler[]> = {};
  removed = false;
  constructor(public options: { container: HTMLElement }) {
    if (mapboxState.throwOnCreate) throw new Error('WebGL not supported');
    mapboxState.maps.push(this);
  }
  on(event: string, handler: Handler) {
    (this.handlers[event] ??= []).push(handler);
    return this;
  }
  fire(event: string, data?: unknown) {
    this.handlers[event]?.forEach((handler) => handler(data));
  }
  addControl() {
    return this;
  }
  fitBounds() {
    return this;
  }
  remove() {
    this.removed = true;
  }
}

class MockPopup {
  content: HTMLElement | null = null;
  setDOMContent(node: HTMLElement) {
    this.content = node;
    return this;
  }
}

class MockMarker {
  element: HTMLElement;
  lngLat: [number, number] | null = null;
  popup: MockPopup | null = null;
  constructor(options: { element: HTMLElement }) {
    this.element = options.element;
    this.element.setAttribute('aria-label', 'Map marker');
    mapboxState.markers.push(this);
  }
  setLngLat(lngLat: [number, number]) {
    this.lngLat = lngLat;
    return this;
  }
  setPopup(popup: MockPopup) {
    this.popup = popup;
    return this;
  }
  addTo(map: MockMap) {
    map.options.container.appendChild(this.element);
    return this;
  }
}

class MockLngLatBounds {
  extend() {
    return this;
  }
}

class MockNavigationControl {}

export default {
  accessToken: '',
  Map: MockMap,
  Marker: MockMarker,
  Popup: MockPopup,
  LngLatBounds: MockLngLatBounds,
  NavigationControl: MockNavigationControl,
};
