import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import PlaceDetailsPage, { COMING_SOON_MESSAGES } from './PlaceDetailsPage';
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
    expect(screen.getByText('4.1 (27 reviews)')).toBeInTheDocument();
    expect(screen.getByText('Rated 4.1 out of 5 from 27 reviews')).toBeInTheDocument();
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

  it('TC-DETAILS-06: tabs work with arrow keys, and later tabs say "coming soon"', async () => {
    renderDetails('harmony-coffee');
    const overview = await screen.findByRole('tab', { name: 'Overview' });
    expect(overview).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Reviews (27)' })).toBeInTheDocument();

    overview.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Reviews (27)' })).toHaveFocus();
    expect(screen.getByRole('tabpanel', { name: 'Reviews (27)' })).toHaveTextContent(/coming soon/);

    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tabpanel', { name: 'Nearby' })).toHaveTextContent(/coming soon/);
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Nearby' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();

    await userEvent.click(screen.getByRole('tab', { name: 'Photos' }));
    expect(screen.getByRole('tabpanel', { name: 'Photos' })).toHaveTextContent(/coming soon/);
  });

  it('TC-DETAILS-07: Save and Share are marked "coming soon" and explain why when used', async () => {
    renderDetails('harmony-coffee');
    const save = await screen.findByRole('button', { name: 'Save Coming soon' });
    const share = screen.getByRole('button', { name: 'Share Coming soon' });
    expect(save).toHaveAttribute('aria-disabled', 'true');

    await userEvent.click(save);
    expect(screen.getByRole('status')).toHaveTextContent(COMING_SOON_MESSAGES.save);
    await userEvent.click(share);
    expect(screen.getByRole('status')).toHaveTextContent(COMING_SOON_MESSAGES.share);
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
