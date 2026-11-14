
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { RECOMMENDED_MESSAGES } from './RecommendedForYou';
import { renderWithRouter } from '../test/renderWithRouter';
import { signInAsDemo } from '../test/account';
import { mockApi, useApiData } from '../test/fakeApi';
import {
  noMatchPreferences,
  noMatchVenues,
  syntheticVenues,
} from '../test/syntheticVenues';
import * as client from '../api/client';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function recommendedSection() {
  const heading = await screen.findByRole('heading', {
    level: 2,
    name: 'Recommended for you',
  });
  return heading.closest('section')!;
}

function cardTitles(container: HTMLElement) {
  return within(container)
    .getAllByRole('article')
    .map((card) => within(card).getByRole('heading').textContent);
}

describe('Recommended for you on Home', () => {
  it('TC-HOME-25: sits below the search bar and above "Popular near you"', async () => {
    signInAsDemo();
    renderWithRouter(<App />);
    const section = await recommendedSection();
    const search = screen.getByRole('search');
    const popular = screen.getByRole('heading', {
      level: 2,
      name: 'Popular near you',
    });

    expect(
      search.compareDocumentPosition(section) &
      Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(
      section.compareDocumentPosition(popular) &
      Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    await screen.findAllByRole('article');
  });

  it('TC-HOME-26: signed-out users are asked to sign in', async () => {
    renderWithRouter(<App />);
    const section = await recommendedSection();

    expect(within(section).getByText(RECOMMENDED_MESSAGES.signIn))
      .toBeInTheDocument();

    expect(
      within(section).getByRole('link', {
        name: 'Sign in or create an account',
      }),
    ).toHaveAttribute('href', '/profile');

    await screen.findAllByRole('article');
  });

  it('TC-HOME-27: shows matching places with a short reason, and a card opens place details', async () => {
    // The demo account prefers quiet, dim places.
    signInAsDemo();
    renderWithRouter(<App />);

    const section = await recommendedSection();

    const item = (
      await within(section).findByRole('link', {
        name: 'Emily Fowler Central Library',
      })
    ).closest('li')!;

    expect(within(item).getByText('Quiet, as you prefer.'))
      .toBeInTheDocument();

    expect(
      within(section).getByRole('link', {
        name: 'Edit preferences used for recommendations',
      }),
    ).toHaveAttribute('href', '/profile');

    await userEvent.click(
      within(item).getByRole('link', {
        name: 'Emily Fowler Central Library',
      }),
    );

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Emily Fowler Central Library',
      }),
    ).toBeInTheDocument();
  });

  it('TC-HOME-28: asks users with no preferences to set some', async () => {
    signInAsDemo();

    await client.savePreferences({
      noise: null,
      lighting: null,
      crowd: null,
    });

    renderWithRouter(<App />);
    const section = await recommendedSection();

    expect(
      await within(section).findByText(
        /Set your noise, lighting, and crowd preferences/,
      ),
    ).toBeInTheDocument();

    expect(
      within(section).getByRole('link', {
        name: 'Set your preferences',
      }),
    ).toHaveAttribute('href', '/profile');
  });

  it('TC-HOME-29: explains when no place matches', async () => {
    signInAsDemo();

    await client.savePreferences({
      noise: 'high',
      lighting: 'dim',
      crowd: 'low',
    });

    renderWithRouter(<App />);
    const section = await recommendedSection();

    expect(
      await within(section).findByText(
        /No places match your sensory preferences yet/,
      ),
    ).toBeInTheDocument();

    expect(within(section).queryByRole('article'))
      .not.toBeInTheDocument();
  });

  it('TC-HOME-30: shows an error with Try again, and the rest of Home still loads', async () => {
    signInAsDemo();

    vi.spyOn(client, 'getRecommendations')
      .mockRejectedValueOnce(new Error('Network'));

    renderWithRouter(<App />);
    const section = await recommendedSection();

    expect(await within(section).findByRole('alert'))
      .toHaveTextContent(RECOMMENDED_MESSAGES.loadFailed);

    expect(await screen.findAllByRole('article')).toHaveLength(3);

    await userEvent.click(
      within(section).getByRole('button', { name: 'Try again' }),
    );

    expect(
      await within(section).findByRole('link', {
        name: 'Emily Fowler Central Library',
      }),
    ).toBeInTheDocument();
  });

  describe('on API data (synthetic test dataset)', () => {
    beforeEach(() => {
      useApiData();
    });

    it('TC-API-29: ranks API places and shows the top three, each linking to its API id', async () => {
      mockApi(syntheticVenues);
      signInAsDemo();

      renderWithRouter(<App />);
      const section = await recommendedSection();

      await within(section).findAllByRole('article');

      expect(cardTitles(section)).toEqual([
        'Hush Library',
        'Lantern Tea House',
        'Small Museum',
      ]);

      expect(
        within(section).getByRole('link', {
          name: 'Hush Library',
        }),
      ).toHaveAttribute('href', '/places/101');

      expect(
        within(section).getAllByText('Dim light', { exact: true }).length,
      ).toBeGreaterThan(0);
    });

    it('TC-API-30: shows the no-match message when no API place suits the preferences', async () => {
      mockApi(noMatchVenues);
      signInAsDemo();

      await client.savePreferences(noMatchPreferences);

      renderWithRouter(<App />);
      const section = await recommendedSection();

      expect(
        await within(section).findByText(
          /No places match your sensory preferences yet/,
        ),
      ).toBeInTheDocument();
    });
  });
});
