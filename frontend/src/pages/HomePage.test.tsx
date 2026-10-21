import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router-dom';
import HomePage, { LOAD_ERROR_MESSAGE } from './HomePage';
import { renderWithRouter } from '../test/renderWithRouter';
import * as client from '../api/client';

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname + location.search}</p>;
}

function renderHome() {
  return renderWithRouter(
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<LocationProbe />} />
    </Routes>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HomePage', () => {
  it('TC-HOME-12: shows the heading, subheading, and search bar', async () => {
    renderHome();
    expect(screen.getByRole('heading', { level: 1, name: 'Find sensory-friendly places' })).toBeInTheDocument();
    expect(screen.getByText('Discover. Compare. Decide.')).toBeInTheDocument();
    expect(screen.getByRole('search')).toBeInTheDocument();
    await screen.findAllByRole('article');
  });

  it('TC-HOME-13: shows a loading message, then three popular places', async () => {
    renderHome();
    expect(screen.getByRole('status')).toHaveTextContent('Loading places');
    const cards = await screen.findAllByRole('article');
    expect(cards).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Emily Fowler Central Library' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('TC-HOME-14: "See all" links to the Search page', async () => {
    renderHome();
    expect(screen.getByRole('link', { name: 'See all places' })).toHaveAttribute('href', '/search');
    await screen.findAllByRole('article');
  });

  it('TC-HOME-15: searching opens the Search page with the query', async () => {
    renderHome();
    await userEvent.type(screen.getByRole('searchbox'), 'quiet cafe{Enter}');
    expect(screen.getByTestId('location')).toHaveTextContent('/search?q=quiet%20cafe');
  });

  it('TC-HOME-16: shows an error that explains how to fix a failed load, and Try again works', async () => {
    const spy = vi.spyOn(client, 'getPopularPlaces').mockRejectedValueOnce(new Error('Network'));
    renderHome();

    expect(await screen.findByRole('alert')).toHaveTextContent(LOAD_ERROR_MESSAGE);
    expect(screen.queryByRole('article')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findAllByRole('article')).toHaveLength(3);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('TC-HOME-17: shows a helpful message when there are no places', async () => {
    vi.spyOn(client, 'getPopularPlaces').mockResolvedValueOnce([]);
    renderHome();
    expect(await screen.findByText(/No places to show yet/)).toBeInTheDocument();
  });
});
