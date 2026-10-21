import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { renderWithRouter } from '../test/renderWithRouter';
import * as client from '../api/client';
import { NO_RESULTS_MESSAGE, SEARCH_ERROR_MESSAGE } from './SearchPage';

afterEach(() => {
  vi.restoreAllMocks();
});

const group = (name: string) => screen.getByRole('group', { name });

describe('SearchPage', () => {
  it('TC-SEARCH-16: shows all places and marks Search as the current page', async () => {
    renderWithRouter(<App />, { route: '/search' });
    expect(await screen.findAllByRole('article')).toHaveLength(6);
    expect(screen.getByRole('link', { name: 'Search' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Show Results (6)' })).toBeInTheDocument();
  });

  it('TC-SEARCH-17: selecting filters narrows the results and updates the count', async () => {
    renderWithRouter(<App />, { route: '/search' });
    await screen.findAllByRole('article');
    await userEvent.click(within(group('Noise Level')).getByRole('button', { name: 'Low' }));
    await userEvent.click(within(group('Lighting')).getByRole('button', { name: 'Dim' }));

    expect(await screen.findByRole('button', { name: 'Show Results (0)' })).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.getByText(NO_RESULTS_MESSAGE)).toBeInTheDocument();
  });

  it('TC-SEARCH-18: shows a no-results message that explains what to try', async () => {
    renderWithRouter(<App />, { route: '/search?noise=high&lighting=dim' });
    expect(await screen.findByText(NO_RESULTS_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('TC-SEARCH-19: Clear all brings back every place', async () => {
    renderWithRouter(<App />, { route: '/search?noise=high&lighting=dim' });
    await screen.findByText(NO_RESULTS_MESSAGE);
    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(await screen.findAllByRole('article')).toHaveLength(6);
  });

  it('TC-SEARCH-20: Show Results moves keyboard focus to the results heading', async () => {
    renderWithRouter(<App />, { route: '/search?crowd=moderate' });
    await screen.findAllByRole('article');
    await userEvent.click(screen.getByRole('button', { name: /Show Results/ }));
    expect(screen.getByRole('heading', { name: /^Results/ })).toHaveFocus();
  });

  it('TC-SEARCH-21: searching on the Search page keeps the filters', async () => {
    renderWithRouter(<App />, { route: '/search?noise=moderate' });
    await screen.findAllByRole('article');
    await userEvent.type(screen.getByRole('searchbox'), 'jupiter{Enter}');
    const cards = await screen.findAllByRole('article');
    expect(cards).toHaveLength(1);
    expect(within(group('Noise Level')).getByRole('button', { name: 'Moderate' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('TC-SEARCH-22: an empty search on the Search page clears the search text', async () => {
    renderWithRouter(<App />, { route: '/search?q=jupiter' });
    expect(await screen.findAllByRole('article')).toHaveLength(1);
    await userEvent.clear(screen.getByRole('searchbox'));
    await userEvent.keyboard('{Enter}');
    expect(await screen.findAllByRole('article')).toHaveLength(6);
  });

  it('TC-SEARCH-23: filters stay applied after opening a place and going back', async () => {
    renderWithRouter(<App />, { route: '/search' });
    await screen.findAllByRole('article');
    await userEvent.click(within(group('Crowd Level')).getByRole('button', { name: 'Moderate' }));
    await screen.findByRole('button', { name: 'Show Results (6)' });

    await userEvent.click(screen.getByRole('link', { name: 'Recycled Books, Records & CDs' }));
    await userEvent.click(await screen.findByRole('link', { name: 'Back to results' }));

    expect(await screen.findAllByRole('article')).toHaveLength(6);
    expect(within(group('Crowd Level')).getByRole('button', { name: 'Moderate' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('TC-SEARCH-24: explains how to fix a failed search, and Try again works', async () => {
    const spy = vi.spyOn(client, 'searchPlaces').mockRejectedValueOnce(new Error('Network'));
    renderWithRouter(<App />, { route: '/search' });
    expect(await screen.findByRole('alert')).toHaveTextContent(SEARCH_ERROR_MESSAGE);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findAllByRole('article')).toHaveLength(6);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
