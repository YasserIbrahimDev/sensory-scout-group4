import { Link } from 'react-router-dom';
import { getRecommendations } from '../api/client';
import { useAuth } from '../lib/auth';
import { useLoad } from '../lib/useLoad';
import { hasPreferences } from '../lib/recommendations';
import PlaceCard from './PlaceCard';
import SignInPrompt from './SignInPrompt';

export const RECOMMENDED_MESSAGES = {
  signIn: 'Sign in and set your sensory preferences to see places picked for you.',
  loadFailed: "Couldn't load your recommendations. Check your connection and try again.",
  noPreferences: 'Set your noise, lighting, and crowd preferences to see places picked for you.',
  empty:
    'No places match your sensory preferences yet. Places only appear here once visitors have reported conditions that suit you.',
} as const;

function Recommendations({ userId }: { userId: string }) {
  const { state, retry } = useLoad(() => getRecommendations(), userId);

  if (state.status === 'loading') {
    return <p className="status-message" role="status">Finding places for you…</p>;
  }

  if (state.status === 'error') {
    return (
      <div className="status-message status-message--error" role="alert">
        <p>{RECOMMENDED_MESSAGES.loadFailed}</p>
        <button type="button" className="button button--secondary" onClick={retry}>
          Try again
        </button>
      </div>
    );
  }

  const { preferences, recommendations } = state.data;

  if (!hasPreferences(preferences)) {
    return (
      <p className="status-message">
        {RECOMMENDED_MESSAGES.noPreferences} <Link to="/profile">Set your preferences</Link>
      </p>
    );
  }

  if (recommendations.length === 0) {
    return (
      <p className="status-message">
        {RECOMMENDED_MESSAGES.empty} <Link to="/profile">Review your preferences</Link>
      </p>
    );
  }

  return (
    <ul className="place-grid recommended__list">
      {recommendations.map(({ place, reason }) => (
        <li key={place.id} className="recommended__item">
          <PlaceCard place={place} />
          <p className="recommended__reason">{reason}</p>
        </li>
      ))}
    </ul>
  );
}

/** The "Recommended for you" section on Home, between the search bar and "Popular near you". */
export default function RecommendedForYou() {
  const { auth } = useAuth();
  if (auth.status === 'loading') return null;

  return (
    <section aria-labelledby="recommended-heading" className="home__recommended">
      <div className="section-header">
        <h2 id="recommended-heading" className="section-title">Recommended for you</h2>
        {auth.status === 'signedIn' && (
          <Link to="/profile" className="section-header__link">
            Edit preferences<span className="visually-hidden"> used for recommendations</span>
          </Link>
        )}
      </div>

      {auth.status === 'signedOut' ? (
        <SignInPrompt message={RECOMMENDED_MESSAGES.signIn} />
      ) : (
        <Recommendations userId={auth.user.id} />
      )}
    </section>
  );
}
