import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page">
      <h1 className="page__title">Page not found</h1>
      <p className="page__subtitle">
        Check the address, or <Link to="/">go back home</Link>.
      </p>
    </div>
  );
}
