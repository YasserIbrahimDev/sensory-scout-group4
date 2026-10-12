import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  /** Set to false when nearby text already says the rating, so screen readers don't hear it twice. */
  announce?: boolean;
}

/**
 * Five stars, rounded to the nearest half (4.6 shows as 4½).
 * Screen readers hear the exact number, for example "Rated 4.6 out of 5".
 */
export default function StarRating({ rating, announce = true }: StarRatingProps) {
  const rounded = Math.round(rating * 2) / 2;

  return (
    <span className="star-rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const full = rounded >= n;
        const half = !full && rounded >= n - 0.5;
        return (
          <span key={n} className="star-rating__slot" aria-hidden="true">
            <Star className={`star-rating__star${full ? ' star-rating__star--filled' : ''}`} />
            {half && <StarHalf className="star-rating__star star-rating__star--filled star-rating__half" />}
          </span>
        );
      })}
      {announce && <span className="visually-hidden">Rated {rating} out of 5</span>}
    </span>
  );
}
