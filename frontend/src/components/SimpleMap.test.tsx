import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SimpleMap, { projectPlaces } from './SimpleMap';
import { renderWithRouter } from '../test/renderWithRouter';
import { mockPlaces } from '../data/mockPlaces';

const map = () => screen.getByRole('region', { name: /Simple map/ });

describe('SimpleMap', () => {
  it('TC-MAP-13: places pins by location, with north at the top and west on the left', () => {
    const positions = projectPlaces(mockPlaces);
    const park = positions.get('north-lakes-park')!; // furthest north and west
    const gallery = positions.get('unt-art-gallery')!; // furthest south
    expect(park.y).toBeLessThan(gallery.y);
    expect(park.x).toBeLessThan(positions.get('calm-corner-books')!.x);
    for (const { x, y } of positions.values()) {
      expect(x).toBeGreaterThanOrEqual(12);
      expect(x).toBeLessThanOrEqual(88);
      expect(y).toBeGreaterThanOrEqual(12);
      expect(y).toBeLessThanOrEqual(88);
    }
  });

  it('TC-MAP-14: works with a single place', () => {
    const [only] = projectPlaces([mockPlaces[0]]).values();
    expect(Number.isFinite(only.x) && Number.isFinite(only.y)).toBe(true);
  });

  it('TC-MAP-15: has a labelled pin for every place and says it is simplified', () => {
    renderWithRouter(<SimpleMap places={mockPlaces} note="Extra note." />);
    const pins = within(map()).getAllByRole('button');
    expect(pins).toHaveLength(6);
    expect(pins[2]).toHaveAccessibleName('Jupiter House, Cafe');
    expect(pins[2]).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(/Street details aren't shown\. Extra note\./)).toBeInTheDocument();
  });

  it('TC-MAP-16: selecting a pin opens a card with sensory info and moves focus to it', async () => {
    renderWithRouter(<SimpleMap places={mockPlaces} />);
    const pin = screen.getByRole('button', { name: 'Jupiter House, Cafe' });
    pin.focus();
    await userEvent.keyboard('{Enter}');

    expect(pin).toHaveAttribute('aria-expanded', 'true');
    const heading = screen.getByRole('heading', { name: 'Jupiter House' });
    expect(heading).toHaveFocus();
    expect(screen.getByRole('list', { name: 'Sensory conditions at Jupiter House' })).toHaveTextContent('Moderate noise');
    expect(screen.getByRole('link', { name: 'View details' })).toHaveAttribute('href', '/places/harmony-coffee');
  });

  it('TC-MAP-17: Escape closes the card and returns focus to the pin', async () => {
    renderWithRouter(<SimpleMap places={mockPlaces} />);
    const pin = screen.getByRole('button', { name: 'North Lakes Park, Park' });
    await userEvent.click(pin);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('heading', { name: 'North Lakes Park' })).not.toBeInTheDocument();
    expect(pin).toHaveFocus();
  });

  it('TC-MAP-18: the close button and a second click on the pin both close the card', async () => {
    renderWithRouter(<SimpleMap places={mockPlaces} />);
    const pin = screen.getByRole('button', { name: 'UNT Art Building, Museum' });
    await userEvent.click(pin);
    await userEvent.click(screen.getByRole('button', { name: 'Close UNT Art Building' }));
    expect(screen.queryByRole('heading', { name: 'UNT Art Building' })).not.toBeInTheDocument();
    expect(pin).toHaveFocus();

    await userEvent.click(pin);
    await userEvent.click(pin);
    expect(screen.queryByRole('heading', { name: 'UNT Art Building' })).not.toBeInTheDocument();
  });
});
