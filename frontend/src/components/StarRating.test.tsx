import { render, screen } from '@testing-library/react';
import StarRating from './StarRating';

function filledCount(container: HTMLElement) {
  return {
    full: container.querySelectorAll('.star-rating__slot > .star-rating__star--filled:not(.star-rating__half)').length,
    half: container.querySelectorAll('.star-rating__half').length,
  };
}

describe('StarRating', () => {
  it('TC-DETAILS-25: rounds to the nearest half star and announces the exact rating', () => {
    const { container } = render(<StarRating rating={4.6} />);
    expect(filledCount(container)).toEqual({ full: 4, half: 1 });
    expect(screen.getByText('Rated 4.6 out of 5')).toBeInTheDocument();
  });

  it('TC-DETAILS-26: whole numbers show whole stars', () => {
    const { container } = render(<StarRating rating={4} />);
    expect(filledCount(container)).toEqual({ full: 4, half: 0 });
  });

  it('TC-DETAILS-27: can skip the announcement when the rating is already said nearby', () => {
    render(<StarRating rating={4.6} announce={false} />);
    expect(screen.queryByText(/Rated/)).not.toBeInTheDocument();
  });
});
