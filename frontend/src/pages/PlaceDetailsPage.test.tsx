import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import PlaceDetailsPage, { COMING_SOON_MESSAGES } from './PlaceDetailsPage';
import { WRITE_REVIEW_MESSAGE } from '../components/placeTabs/ReviewsTab';
import App from '../App';
import { renderWithRouter } from '../test/renderWithRouter';
import * as client from '../api/client';

function renderDetails(placeId: string) {
  return renderWithRouter(
    <Routes>
      <Route path="/places/:placeId" element={<PlaceDetailsPage />} />
    </Routes>,
    { route: `/places/${placeId}` },
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PlaceDetailsPage', () => {
  it('TC-DETAILS-01: header shows name, "Category • City", and rating with review count', async () => {
    renderDetails('harmony-coffee');
    expect(await screen.findByRole('heading', { level: 1, name: 'Harmony Coffee' })).toBeInTheDocument();
    expect(screen.getByText('Cafe • Denton, TX')).toBeInTheDocument();
    expect(screen.getByText('4.1 (7 reviews)')).toBeInTheDocument();
    expect(screen.getByText('Rated 4.1 out of 5 from 7 reviews')).toBeInTheDocument();
  });

  it('TC-DETAILS-02: shows five sensory tiles with text labels', async () => {
    renderDetails('harmony-coffee');
    const section = await screen.findByRole('region', { name: 'Sensory Information' });
    const terms = within(section).getAllByRole('term').map((t) => t.textContent);
    const values = within(section).getAllByRole('definition').map((d) => d.textContent);
    expect(terms).toEqual(['Noise', 'Lighting', 'Crowds', 'Temperature', 'Strong scents']);
    expect(values).toEqual(['Moderate noise', 'Bright light', 'Moderate crowds', 'Comfortable', 'Strong coffee aroma']);
  });

  it('TC-DETAILS-03: sensory information comes before the tabs', async () => {
    renderDetails('harmony-coffee');
    const sensory = await screen.findByRole('region', { name: 'Sensory Information' });
    const tabs = screen.getByRole('tablist');
    expect(sensory.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('TC-DETAILS-04: says "Not reported yet" when temperature or scents are missing', async () => {
    vi.spyOn(client, 'getPlace').mockResolvedValueOnce({
      ...(await client.getPlace('harmony-coffee'))!,
      sensory: { noise: 'low', lighting: 'dim', crowd: 'low' },
    });
    renderDetails('harmony-coffee');
    const section = await screen.findByRole('region', { name: 'Sensory Information' });
    expect(within(section).getAllByText('Not reported yet')).toHaveLength(2);
  });

  it('TC-DETAILS-05: Overview tab shows address, hours, description, and Get Directions', async () => {
    renderDetails('harmony-coffee');
    const panel = await screen.findByRole('tabpanel', { name: 'Overview' });
    expect(within(panel).getByText('123 Maple Ave, Denton, TX 76201')).toBeInTheDocument();
    expect(within(panel).getByText('Open until 8:00 PM')).toBeInTheDocument();
    expect(within(panel).getByText(/cozy local coffee shop/)).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: 'Get Directions (opens in a new tab)' })).toBeInTheDocument();
  });

  it('TC-DETAILS-06: tabs work with arrow keys, Home, and End', async () => {
    renderDetails('harmony-coffee');
    const overview = await screen.findByRole('tab', { name: 'Overview' });
    expect(overview).toHaveAttribute('aria-selected', 'true');

    overview.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Reviews (7)' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Reviews (7)' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Nearby' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Nearby' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
  });

  it('TC-DETAILS-12: Reviews tab shows the average and the 5 newest reviews first', async () => {
    renderDetails('harmony-coffee');
    await userEvent.click(await screen.findByRole('tab', { name: 'Reviews (7)' }));
    const panel = screen.getByRole('tabpanel', { name: 'Reviews (7)' });
    expect(within(panel).getByText('Average 4.1 out of 5,', { exact: false })).toBeInTheDocument();
    expect(within(panel).getByText('(showing 5 of 7)')).toBeInTheDocument();
    const reviews = within(panel).getAllByRole('listitem');
    expect(reviews).toHaveLength(5);
    expect(reviews[0]).toHaveTextContent('Alicia P.');
    expect(reviews[0]).toHaveTextContent('Oct 5, 2026');
    expect(within(reviews[0]).getByText('Rated 4 out of 5')).toBeInTheDocument();
  });

  it('TC-DETAILS-23: Show more reveals the rest and moves focus to the first new review', async () => {
    renderDetails('harmony-coffee');
    await userEvent.click(await screen.findByRole('tab', { name: 'Reviews (7)' }));
    const panel = screen.getByRole('tabpanel', { name: 'Reviews (7)' });
    await userEvent.click(within(panel).getByRole('button', { name: 'Show more reviews (2 more)' }));
    const reviews = within(panel).getAllByRole('listitem');
    expect(reviews).toHaveLength(7);
    expect(reviews[5]).toHaveFocus();
    expect(within(panel).getByText('(showing 7 of 7)')).toBeInTheDocument();
    expect(within(panel).queryByRole('button', { name: /Show more/ })).not.toBeInTheDocument();
  });

  it('TC-DETAILS-28: places with 5 reviews or fewer show them all with no Show more button', async () => {
    renderDetails('unt-art-gallery');
    await userEvent.click(await screen.findByRole('tab', { name: 'Reviews (5)' }));
    const panel = screen.getByRole('tabpanel', { name: 'Reviews (5)' });
    expect(within(panel).getAllByRole('listitem')).toHaveLength(5);
    expect(within(panel).queryByRole('button', { name: /Show more/ })).not.toBeInTheDocument();
  });

  it('TC-DETAILS-13: Write a review explains that an account is needed', async () => {
    renderDetails('harmony-coffee');
    await userEvent.click(await screen.findByRole('tab', { name: 'Reviews (7)' }));
    const button = screen.getByRole('button', { name: 'Write a review Coming soon' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(button);
    const panel = screen.getByRole('tabpanel', { name: 'Reviews (7)' });
    expect(within(panel).getByRole('status')).toHaveTextContent(WRITE_REVIEW_MESSAGE);
  });

  it('TC-DETAILS-14: Reviews tab explains how to fix a failed load, and Try again works', async () => {
    const spy = vi.spyOn(client, 'getReviews').mockRejectedValueOnce(new Error('Network'));
    renderDetails('harmony-coffee');
    await userEvent.click(await screen.findByRole('tab', { name: 'Reviews (7)' }));
    const panel = screen.getByRole('tabpanel', { name: 'Reviews (7)' });
    expect(await within(panel).findByRole('alert')).toHaveTextContent("We couldn't load reviews.");
    await userEvent.click(within(panel).getByRole('button', { name: 'Try again' }));
    expect(await within(panel).findAllByRole('listitem')).toHaveLength(5);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('TC-DETAILS-15: Reviews tab says when there are no reviews', async () => {
    vi.spyOn(client, 'getReviews').mockResolvedValueOnce([]);
    renderDetails('harmony-coffee');
    await userEvent.click(await screen.findByRole('tab', { name: 'Reviews (7)' }));
    expect(await screen.findByText('No reviews yet.')).toBeInTheDocument();
  });

  it('TC-DETAILS-16: Photos tab shows photos with descriptions for screen readers', async () => {
    renderDetails('harmony-coffee');
    await userEvent.click(await screen.findByRole('tab', { name: 'Photos' }));
    const panel = screen.getByRole('tabpanel', { name: 'Photos' });
    const img = within(panel).getByRole('img');
    expect(img).toHaveAttribute('src', '/images/places/harmony-coffee.svg');
    expect(img).toHaveAccessibleName(/cozy coffee shop/);
  });

  it('TC-DETAILS-17: Photos tab says when there are no photos', async () => {
    vi.spyOn(client, 'getPlace').mockResolvedValueOnce({
      ...(await client.getPlace('harmony-coffee'))!,
      photos: undefined,
    });
    renderDetails('harmony-coffee');
    await userEvent.click(await screen.findByRole('tab', { name: 'Photos' }));
    expect(screen.getByText('No photos yet.')).toBeInTheDocument();
  });

  it('TC-DETAILS-18: Nearby tab lists the closest places with distance and sensory conditions', async () => {
    renderDetails('harmony-coffee');
    await userEvent.click(await screen.findByRole('tab', { name: 'Nearby' }));
    const panel = screen.getByRole('tabpanel', { name: 'Nearby' });
    const links = await within(panel).findAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['Square Burger Co.', 'Calm Corner Books', 'Denton Public Library']);
    expect(within(panel).getByText('Restaurant • 0.1 mi away')).toBeInTheDocument();
    expect(within(panel).getByRole('list', { name: 'Sensory conditions at Square Burger Co.' })).toHaveTextContent('Loud');
  });

  it('TC-DETAILS-19: Nearby tab explains how to fix a failed load, and handles no results', async () => {
    vi.spyOn(client, 'getNearbyPlaces').mockRejectedValueOnce(new Error('Network')).mockResolvedValueOnce([]);
    renderDetails('harmony-coffee');
    await userEvent.click(await screen.findByRole('tab', { name: 'Nearby' }));
    const panel = screen.getByRole('tabpanel', { name: 'Nearby' });
    expect(await within(panel).findByRole('alert')).toHaveTextContent("We couldn't load nearby places.");
    await userEvent.click(within(panel).getByRole('button', { name: 'Try again' }));
    expect(await within(panel).findByText('No nearby places found.')).toBeInTheDocument();
  });

  it('TC-DETAILS-07: Save and Share are marked "coming soon" and explain why when used', async () => {
    renderDetails('harmony-coffee');
    const save = await screen.findByRole('button', { name: 'Save Coming soon' });
    const share = screen.getByRole('button', { name: 'Share Coming soon' });
    expect(save).toHaveAttribute('aria-disabled', 'true');

    await userEvent.click(save);
    expect(screen.getByText(COMING_SOON_MESSAGES.save)).toHaveAttribute('role', 'status');
    await userEvent.click(share);
    expect(screen.getByText(COMING_SOON_MESSAGES.share)).toHaveAttribute('role', 'status');
  });

  it('TC-DETAILS-08: "Back to results" goes to Search when opened directly', async () => {
    renderDetails('harmony-coffee');
    expect(await screen.findByRole('link', { name: 'Back to results' })).toHaveAttribute('href', '/search');
  });

  it('TC-DETAILS-09: shows "Back" to the Home page when opened from Home', async () => {
    renderWithRouter(<App />);
    await userEvent.click(await screen.findByRole('link', { name: 'Harmony Coffee' }));
    expect(await screen.findByRole('link', { name: 'Back' })).toHaveAttribute('href', '/');
  });

  it('TC-DETAILS-10: explains when a place does not exist', async () => {
    renderDetails('missing-place');
    expect(await screen.findByRole('heading', { name: 'Place not found' })).toBeInTheDocument();
  });

  it('TC-DETAILS-11: explains how to recover when loading fails', async () => {
    vi.spyOn(client, 'getPlace').mockRejectedValueOnce(new Error('Network'));
    renderDetails('harmony-coffee');
    expect(await screen.findByRole('heading', { name: "Couldn't load this place" })).toBeInTheDocument();
    expect(screen.getByText(/Check your internet connection/)).toBeInTheDocument();
  });
});

describe('Get Directions', () => {
  it('TC-MAP-12: opens directions to the place in a new tab', async () => {
    renderDetails('harmony-coffee');
    const link = await screen.findByRole('link', { name: 'Get Directions (opens in a new tab)' });
    expect(link).toHaveAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=33.2148,-97.1331');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
