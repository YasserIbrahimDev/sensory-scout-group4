import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { mapboxState } from './mapboxMock';
import { resetMockAccount } from '../data/mockAccount';

// jsdom has no WebGL, so every test uses the stand-in map from mapboxMock.ts.
vi.mock('mapbox-gl', () => import('./mapboxMock'));

// jsdom does not implement scrolling; AppLayout calls it on navigation.
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

beforeEach(() => {
  mapboxState.reset();
  vi.stubEnv('VITE_MAPBOX_TOKEN', 'pk.test-token');
  // Tests use the mock places unless a test turns this off to check the API path.
  vi.stubEnv('VITE_USE_MOCK_DATA', 'true');
});

afterEach(() => {
  cleanup();
  // Each test starts signed out with the original demo account.
  resetMockAccount();
  vi.unstubAllEnvs();
});
