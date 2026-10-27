import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import App from '../App';
import PlaceDetailsPage from './PlaceDetailsPage';
import { LOAD_ERROR_MESSAGE } from './HomePage';
import { SEARCH_ERROR_MESSAGE } from './SearchPage';
import { MAP_LOAD_ERROR_MESSAGE, missingLocationMessage } from './MapPage';
import { REVIEW_TEXT_UNAVAILABLE } from '../components/placeTabs/ReviewsTab';
import { renderWithRouter } from '../test/renderWithRouter';
import { allVenues, mockApi, useApiData } from '../test/fakeApi';

// The Sprint 1 pages running on the API instead of mock data.

beforeEach(() => {
  useApiData();
  // These tests check the simple map, which is what shows without a Mapbox token.
  vi.stubEnv('VITE_MAPBOX_TOKEN', '');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderDetails(placeId: string) {
  return renderWithRouter(
    <Routes>
      <Route path="/places/:placeId" element={<PlaceDetailsPage />} />
    </Routes>,
    { route: `/places/${placeId}` },
  );
}

describe('Sprint 1 pages on the API', () => {
  it('TC-API-20: Home shows API places, with "not reported" for unrated levels', async () => {
    mockApi();
    renderWithRouter(<App />);
    const cards = await screen.findAllByRole('article');
    expect(cards.map((c) => within(c).getByRole('heading').textContent)).toEqual([
      'Sample Busy Food Hall',
      'Sample Community Lounge',
      'Sample Willow Reading Room',
    ]);
    const lounge = cards[1];
    expect(within(lounge).getByText('Noise not reported yet')).toBeInTheDocument();
    expect(within(lounge).getByText('No reviews yet')).toBeInTheDocument();
    // Review counts without star ratings show the count only.
    expect(within(cards[2]).getByText('2 reviews')).toBeInTheDocument();
    expect(within(cards[2]).getByRole('link', { name: 'Sample Willow Reading Room' })).toHaveAttribute('href', '/places/1');
  });

  it('TC-API-21: Home shows its error message when the API fails', async () => {
    mockApi(allVenues, () => ({ status: 500 }));
    renderWithRouter(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent(LOAD_ERROR_MESSAGE);
  });

  it('TC-API-22: Search filters the API places', async () => {
    mockApi();
    renderWithRouter(<App />, { route: '/search?noise=low' });
    expect(await screen.findByRole('heading', { name: 'Results (1)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sample Willow Reading Room' })).toBeInTheDocument();
  });

  it('TC-API-23: Search shows its error message when the API is offline', async () => {
    mockApi(allVenues, () => 'offline');
    renderWithRouter(<App />, { route: '/search' });
    expect(await screen.findByRole('alert')).toHaveTextContent(SEARCH_ERROR_MESSAGE);
  });

  it('TC-API-24: Place Details loads by API id and says what is not known', async () => {
    mockApi();
    renderDetails('3');
    expect(await screen.findByRole('heading', { level: 1, name: 'Sample Community Lounge' })).toBeInTheDocument();
    expect(screen.getByText('Community space • Sample City')).toBeInTheDocument();
    const sensory = screen.getByRole('region', { name: /Sensory Information/ });
    expect(within(sensory).getAllByText('Not reported yet')).toHaveLength(5);
    // No map position, so directions use the address.
    expect(screen.getByRole('link', { name: 'Get Directions (opens in a new tab)' }).getAttribute('href'))
      .toContain('destination=3%20Example%20Lane');
  });

  it('TC-API-25: Place Details explains that review text is not available yet', async () => {
    mockApi();
    renderDetails('1');
    expect(await screen.findByText('2 reviews', { selector: '.place-hero__rating' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Reviews (2)' }));
    expect(await screen.findByText(REVIEW_TEXT_UNAVAILABLE)).toBeInTheDocument();
  });

  it('TC-API-26: Place Details shows "not found" for unknown ids and an error when the API fails', async () => {
    mockApi();
    const { unmount } = renderDetails('999');
    expect(await screen.findByRole('heading', { name: 'Place not found' })).toBeInTheDocument();
    unmount();
    mockApi(allVenues, () => ({ status: 503 }));
    renderDetails('1');
    expect(await screen.findByRole('heading', { name: "Couldn't load this place" })).toBeInTheDocument();
  });

  it('TC-API-27: Map shows places that have a position and says how many are missing', async () => {
    mockApi();
    renderWithRouter(<App />, { route: '/map' });
    expect(await screen.findByRole('heading', { name: 'Places on the map (2)' })).toBeInTheDocument();
    expect(screen.getByText(missingLocationMessage(1), { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Find it on the Search page' })).toHaveAttribute('href', '/search');
    const map = screen.getByRole('region', { name: /Simple map/ });
    expect(within(map).getAllByRole('button')).toHaveLength(2);
  });

  it('TC-API-28: Map shows its error message when the API fails', async () => {
    mockApi(allVenues, () => ({ status: 500 }));
    renderWithRouter(<App />, { route: '/map' });
    expect(await screen.findByRole('alert')).toHaveTextContent(MAP_LOAD_ERROR_MESSAGE);
  });
});
