import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { renderWithRouter } from '../test/renderWithRouter';
import { mapboxState } from '../test/mapboxMock';
import * as client from '../api/client';
import { MAP_LOAD_ERROR_MESSAGE } from './MapPage';
import { MAP_UNAVAILABLE_MESSAGE } from '../components/MapView';

afterEach(() => {
  vi.restoreAllMocks();
});

async function renderMap() {
  renderWithRouter(<App />, { route: '/map' });
  await screen.findByRole('heading', { name: /Places on the map/ });
}

describe('MapPage', () => {
  it('TC-MAP-03: shows a pin for every place, each with a screen reader label', async () => {
    await renderMap();
    const map = screen.getByRole('region', { name: /Map showing place locations/ });
    const pins = within(map).getAllByRole('button');
    expect(pins).toHaveLength(6);
    expect(pins[0]).toHaveAccessibleName('Denton Public Library, Library. Show details');
    expect(mapboxState.markers[0].lngLat).toEqual([-97.1335, 33.219]);
    expect(screen.getByRole('link', { name: 'Map' })).toHaveAttribute('aria-current', 'page');
  });

  it('TC-MAP-04: a pin popup links to the place details', async () => {
    await renderMap();
    const popup = mapboxState.markers[2].popup!.content!;
    expect(popup).toHaveTextContent('Harmony Coffee');
    expect(popup).toHaveTextContent('Cafe • Denton, TX');
    fireEvent.click(within(popup).getByRole('link', { name: 'View details' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Harmony Coffee' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/map');
  });

  it('TC-MAP-05: lists every place beside the map for keyboard and screen reader users', async () => {
    await renderMap();
    const list = screen.getByRole('region', { name: 'Places on the map (6)' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(6);
    expect(within(list).getByRole('link', { name: 'Calm Corner Books' })).toHaveAttribute(
      'href',
      '/places/calm-corner-books',
    );
  });

  it('TC-MAP-06: explains the problem when the map token is missing, and keeps the list', async () => {
    vi.stubEnv('VITE_MAPBOX_TOKEN', '');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await renderMap();
    expect(screen.getByRole('alert')).toHaveTextContent(MAP_UNAVAILABLE_MESSAGE);
    expect(screen.getByRole('region', { name: 'Places on the map (6)' })).toBeInTheDocument();
  });

  it('TC-MAP-07: explains the problem when the map fails to load', async () => {
    await renderMap();
    mapboxState.maps[0].fire('error', { error: new Error('401') });
    expect(await screen.findByRole('alert')).toHaveTextContent(MAP_UNAVAILABLE_MESSAGE);
  });

  it('TC-MAP-08: keeps the map after it has loaded, even if a later tile fails', async () => {
    await renderMap();
    mapboxState.maps[0].fire('load');
    mapboxState.maps[0].fire('error', { error: new Error('tile') });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('TC-MAP-09: explains the problem when the browser cannot draw maps', async () => {
    mapboxState.throwOnCreate = true;
    await renderMap();
    expect(screen.getByRole('alert')).toHaveTextContent(MAP_UNAVAILABLE_MESSAGE);
  });

  it('TC-MAP-10: explains how to fix a failed load, and Try again works', async () => {
    vi.spyOn(client, 'getPlaces').mockRejectedValueOnce(new Error('Network'));
    renderWithRouter(<App />, { route: '/map' });
    expect(await screen.findByRole('alert')).toHaveTextContent(MAP_LOAD_ERROR_MESSAGE);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Places on the map (6)' })).toBeInTheDocument();
  });

  it('TC-MAP-11: removes the map when leaving the page', async () => {
    await renderMap();
    await userEvent.click(screen.getByRole('link', { name: 'Home' }));
    expect(mapboxState.maps[0].removed).toBe(true);
  });
});
