import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FavoritesPage, { FAVORITES_MESSAGES } from './FavoritesPage';
import { renderWithRouter } from '../test/renderWithRouter';
import { signInAsDemo } from '../test/account';
import * as client from '../api/client';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FavoritesPage', () => {
  it('TC-FAV-06: signed-out users are asked to sign in', async () => {
    renderWithRouter(<FavoritesPage />, { route: '/favorites' });
    expect(screen.getByRole('heading', { level: 1, name: 'Favorites' })).toBeInTheDocument();
    expect(await screen.findByText(FAVORITES_MESSAGES.signIn)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in or create an account' })).toHaveAttribute('href', '/profile');
  });

  it('TC-FAV-07: lists saved places as cards, most recently saved first', async () => {
    signInAsDemo();
    renderWithRouter(<FavoritesPage />, { route: '/favorites' });
    expect(await screen.findByRole('heading', { level: 2, name: '2 saved places' })).toBeInTheDocument();
    expect(screen.getAllByRole('article').map((card) => within(card).getByRole('heading').textContent))
      .toEqual(['North Lakes Park', 'Emily Fowler Central Library']);
    expect(screen.getByRole('link', { name: 'North Lakes Park' })).toHaveAttribute('href', '/places/north-lakes-park');
  });

  it('TC-FAV-08: Remove takes a place off the list, announces it, and keeps focus on the page', async () => {
    signInAsDemo();
    renderWithRouter(<FavoritesPage />, { route: '/favorites' });
    await userEvent.click(await screen.findByRole('button', { name: 'Remove North Lakes Park from Favorites' }));
    expect(screen.getByRole('status')).toHaveTextContent('Removed North Lakes Park from your Favorites.');
    expect(screen.getByRole('heading', { level: 2, name: '1 saved place' })).toHaveFocus();
    expect(screen.queryByRole('link', { name: 'North Lakes Park' })).not.toBeInTheDocument();
    expect(await client.isFavorite('north-lakes-park')).toBe(false);
  });

  it('TC-FAV-09: a failed remove shows an error and keeps the place', async () => {
    signInAsDemo();
    vi.spyOn(client, 'removeFavorite').mockRejectedValueOnce(new Error('Network'));
    renderWithRouter(<FavoritesPage />, { route: '/favorites' });
    await userEvent.click(await screen.findByRole('button', { name: 'Remove North Lakes Park from Favorites' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(FAVORITES_MESSAGES.removeFailed);
    expect(screen.getByRole('link', { name: 'North Lakes Park' })).toBeInTheDocument();
    expect(screen.queryByText(/^Removed/)).not.toBeInTheDocument();
  });

  it('TC-FAV-10: explains what to do when nothing is saved', async () => {
    signInAsDemo();
    vi.spyOn(client, 'getFavorites').mockResolvedValueOnce([]);
    renderWithRouter(<FavoritesPage />, { route: '/favorites' });
    expect(await screen.findByText(/You haven't saved any places yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Find places to save' })).toHaveAttribute('href', '/search');
  });

  it('TC-FAV-11: shows an error with Try again when the list fails to load', async () => {
    signInAsDemo();
    vi.spyOn(client, 'getFavorites').mockRejectedValueOnce(new Error('Network'));
    renderWithRouter(<FavoritesPage />, { route: '/favorites' });
    expect(await screen.findByRole('alert')).toHaveTextContent(FAVORITES_MESSAGES.loadFailed);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 2, name: '2 saved places' })).toBeInTheDocument();
  });

  it('TC-FAV-12: every control can be reached with the keyboard', async () => {
    signInAsDemo();
    renderWithRouter(<FavoritesPage />, { route: '/favorites' });
    await screen.findByRole('heading', { level: 2, name: '2 saved places' });
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'North Lakes Park' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Remove North Lakes Park from Favorites' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Removed North Lakes Park from your Favorites.');
  });
});
