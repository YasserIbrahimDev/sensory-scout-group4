import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { renderWithRouter } from '../../test/renderWithRouter';

describe('App shell', () => {
  it('TC-HOME-18: shows the logo and all navigation links', async () => {
    renderWithRouter(<App />);
    expect(screen.getByRole('link', { name: 'Sensory Scout home' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    for (const label of ['Home', 'Search', 'Map', 'Favorites', 'Profile', 'Settings']) {
      expect(nav).toContainElement(screen.getByRole('link', { name: label }));
    }
    await screen.findAllByRole('article');
  });

  it('TC-HOME-19: marks the current page in the navigation', async () => {
    renderWithRouter(<App />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Search' })).not.toHaveAttribute('aria-current');
    await screen.findAllByRole('article');
  });

  it('TC-HOME-20: skip link is the first thing keyboard users reach', async () => {
    renderWithRouter(<App />);
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveFocus();
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#main-content');
    await screen.findAllByRole('article');
  });

  it('TC-HOME-21: moves focus to the main content after navigating', async () => {
    renderWithRouter(<App />);
    await screen.findAllByRole('article');
    await userEvent.click(screen.getByRole('link', { name: 'Map' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Map' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('TC-HOME-22: Favorites, Profile, and Settings each open their own page', async () => {
    for (const [route, title] of [['/favorites', 'Favorites'], ['/profile', 'Profile'], ['/settings', 'Settings']]) {
      const { unmount } = renderWithRouter(<App />, { route });
      expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
      expect(screen.queryByText('This page is coming in a later update.')).not.toBeInTheDocument();
      await waitFor(() => expect(screen.queryByText(/^Loading/)).not.toBeInTheDocument());
      unmount();
    }
  });

  it('TC-HOME-23: shows a helpful page for unknown addresses', () => {
    renderWithRouter(<App />, { route: '/nope' });
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'go back home' })).toHaveAttribute('href', '/');
  });

  it('TC-HOME-24: the Search page receives the query from the Home search bar', async () => {
    renderWithRouter(<App />, { route: '/search?q=library' });
    expect(screen.getByRole('searchbox')).toHaveValue('library');
    expect(await screen.findAllByRole('article')).toHaveLength(1);
  });
});
