import { useCallback, useEffect, useState } from 'react';

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: T };

/**
 * Runs an async loader when `key` changes and tracks loading, error, and ready states.
 * `retry` runs the loader again, for "Try again" buttons.
 */
export function useLoad<T>(load: () => Promise<T>, key: string): { state: LoadState<T>; retry: () => void } {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  const run = useCallback(load, [key]);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    run()
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [run, attempt]);

  return { state, retry: () => setAttempt((n) => n + 1) };
}
