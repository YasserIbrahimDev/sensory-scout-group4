import { useEffect, useRef, useState } from 'react';
import { PenLine } from 'lucide-react';
import type { Place } from '../../types/place';
import { getReviews } from '../../api/client';
import { useLoad } from '../../lib/useLoad';
import StarRating from '../StarRating';
import { reviewCountLabel } from '../../lib/sensoryLabels';
import TabStatus from './TabStatus';

export const WRITE_REVIEW_MESSAGE =
  'Writing a review needs an account. Sign-in is coming soon, so you can share your experience here.';

export const REVIEWS_PAGE_SIZE = 5;

export const REVIEW_TEXT_UNAVAILABLE =
  "Visitors have reviewed this place, but written reviews can't be shown here yet.";

const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export default function ReviewsTab({ place }: { place: Place }) {
  const { state, retry } = useLoad(() => getReviews(place.id), place.id);
  const [notice, setNotice] = useState('');
  const [visibleCount, setVisibleCount] = useState(REVIEWS_PAGE_SIZE);
  const firstNewReviewRef = useRef<HTMLLIElement>(null);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  // After "Show more", move focus to the first newly shown review.
  useEffect(() => {
    if (focusIndex !== null) firstNewReviewRef.current?.focus();
  }, [focusIndex]);

  function showMore() {
    setFocusIndex(visibleCount);
    setVisibleCount((n) => n + REVIEWS_PAGE_SIZE);
  }

  return (
    <div className="reviews">
      <div className="reviews__summary">
        {place.rating !== null ? (
          <p className="reviews__average">
            <span className="reviews__score" aria-hidden="true">{place.rating.toFixed(1)}</span>
            <StarRating rating={place.rating} announce={false} />
            <span className="reviews__count">
              <span className="visually-hidden">Average {place.rating.toFixed(1)} out of 5, </span>
              {reviewCountLabel(place.reviewCount)}
            </span>
          </p>
        ) : (
          <p className="reviews__average">
            <span className="reviews__count">{reviewCountLabel(place.reviewCount)}</span>
          </p>
        )}
        <button type="button" className="action-button" aria-disabled="true" onClick={() => setNotice(WRITE_REVIEW_MESSAGE)}>
          <PenLine className="action-button__icon" aria-hidden="true" />
          Write a review
          <span className="soon-tag">Coming soon</span>
        </button>
      </div>
      <p role="status" className={notice ? 'notice' : 'visually-hidden'}>{notice}</p>

      {state.status !== 'ready' ? (
        <TabStatus what="reviews" status={state.status} onRetry={retry} />
      ) : state.data.length === 0 ? (
        <p className="status-message">{place.reviewCount > 0 ? REVIEW_TEXT_UNAVAILABLE : 'No reviews yet.'}</p>
      ) : (
        <>
          <h3 className="tab-section-title">
            Most recent reviews{' '}
            <span className="tab-section-title__count">
              (showing {Math.min(visibleCount, state.data.length)} of {state.data.length})
            </span>
          </h3>
          <ul className="review-list">
            {state.data.slice(0, visibleCount).map((review, index) => (
              <li
                key={review.id}
                className="review"
                ref={index === focusIndex ? firstNewReviewRef : undefined}
                tabIndex={index === focusIndex ? -1 : undefined}
              >
                <div className="review__header">
                  <span className="review__avatar" aria-hidden="true">{review.author.charAt(0)}</span>
                  <div>
                    <p className="review__author">{review.author}</p>
                    <p className="review__date">
                      <time dateTime={review.date}>{dateFormat.format(new Date(review.date))}</time>
                    </p>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                <p className="review__text">{review.text}</p>
              </li>
            ))}
          </ul>
          {visibleCount < state.data.length && (
            <button type="button" className="button button--secondary reviews__more" onClick={showMore}>
              Show more reviews ({state.data.length - visibleCount} more)
            </button>
          )}
        </>
      )}
    </div>
  );
}
