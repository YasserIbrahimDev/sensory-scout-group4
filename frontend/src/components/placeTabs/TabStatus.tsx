interface TabStatusProps {
  what: string;
  status: 'loading' | 'error';
  onRetry: () => void;
}

/** Loading and error messages shared by the Reviews and Nearby tabs. */
export default function TabStatus({ what, status, onRetry }: TabStatusProps) {
  if (status === 'loading') {
    return <p className="status-message" role="status">Loading {what}…</p>;
  }
  return (
    <div className="status-message status-message--error" role="alert">
      <p>We couldn't load {what}. Check your internet connection, then select Try again.</p>
      <button type="button" className="button button--secondary" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
