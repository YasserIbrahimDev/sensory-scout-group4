import { screen, within } from '@testing-library/react';
import PlaceCard from './PlaceCard';
import { renderWithRouter } from '../test/renderWithRouter';
import type { Place } from '../types/place';

const place: Place = {
  id: 'denton-public-library',
  name: 'Denton Public Library',
  category: 'library',
  city: 'Denton, TX',
  address: '502 Oakland St, Denton, TX 76201',
  description: 'Quiet reading rooms.',
  rating: 4.6,
  reviewCount: 48,
  location: { lat: 33.219, lng: -97.1335 },
  sensory: { noise: 'low', lighting: 'dim', crowd: 'low' },
  accessibility: { wheelchair: true, sensoryRoom: true },
};

describe('PlaceCard', () => {
  it('TC-HOME-04: shows name, "Category • City", and rating with review count', () => {
    renderWithRouter(<PlaceCard place={place} />);
    expect(screen.getByRole('heading', { name: 'Denton Public Library' })).toBeInTheDocument();
    expect(screen.getByText('Library • Denton, TX')).toBeInTheDocument();
    expect(screen.getByText('Rated 4.6 out of 5 from 48 reviews').parentElement).toHaveTextContent('4.6 (48)');
    expect(screen.getByText('Rated 4.6 out of 5 from 48 reviews')).toBeInTheDocument();
  });

  it('TC-HOME-05: lists noise, lighting, and crowd conditions', () => {
    renderWithRouter(<PlaceCard place={place} />);
    const list = screen.getByRole('list', { name: 'Sensory conditions' });
    const items = within(list).getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toEqual(['Quiet', 'Dim light', 'Low crowds']);
  });

  it('TC-HOME-06: links to the place details page', () => {
    renderWithRouter(<PlaceCard place={place} />);
    expect(screen.getByRole('link', { name: 'Denton Public Library' })).toHaveAttribute(
      'href',
      '/places/denton-public-library',
    );
  });

  it('TC-HOME-07: shows the photo when there is one, with empty alt text', () => {
    const { container } = renderWithRouter(
      <PlaceCard place={{ ...place, imageUrl: '/library.jpg' }} />,
    );
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', '/library.jpg');
    expect(img).toHaveAttribute('alt', '');
  });
});
