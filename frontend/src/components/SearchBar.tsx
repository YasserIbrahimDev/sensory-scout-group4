import { useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
  /** When true, an empty search is allowed (used on the Search page to clear the text). */
  allowEmpty?: boolean;
}

export const EMPTY_SEARCH_MESSAGE =
  'Enter a place name, category, or location, then select Search.';

export default function SearchBar({ onSearch, initialQuery = '', allowEmpty = false }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const errorId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed && !allowEmpty) {
      setError(EMPTY_SEARCH_MESSAGE);
      inputRef.current?.focus();
      return;
    }
    setError('');
    onSearch(trimmed);
  }

  return (
    <form role="search" className="search-bar" onSubmit={handleSubmit} noValidate>
      <label htmlFor={inputId} className="visually-hidden">
        Search places
      </label>
      <div className="search-bar__row">
        <div className="search-bar__field">
          <Search className="search-bar__icon" aria-hidden="true" />
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            className="search-bar__input"
            placeholder="Search by name, category, or location..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (error) setError('');
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            autoComplete="off"
          />
        </div>
        <button type="submit" className="button button--primary search-bar__button">
          Search
        </button>
      </div>
      {error && (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
