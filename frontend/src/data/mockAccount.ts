import type { AppSettings, SensoryPreferences, User } from '../types/user';

// Mock-only account data, kept in memory so it resets on page reload.
// Only api/client.ts uses this file. It goes away when the account endpoints exist.

interface MockAccount {
  user: User;
  password: string;
  preferences: SensoryPreferences;
  favoriteIds: string[];
}

/** Demo account for trying the signed-in pages. */
export const DEMO_ACCOUNT = { email: 'demo@sensoryscout.test', password: 'scout1234' } as const;

function initialAccounts(): MockAccount[] {
  return [
    {
      user: { id: 'user-1', name: 'Demo User', email: DEMO_ACCOUNT.email },
      password: DEMO_ACCOUNT.password,
      preferences: { noise: 'low', lighting: 'dim', crowd: null },
      favoriteIds: ['denton-public-library', 'north-lakes-park'],
    },
  ];
}

export const mockAccountStore = {
  accounts: initialAccounts(),
  currentUserId: null as string | null,
  settings: { locationAccess: false } as AppSettings,
};

/** Puts the mock account data back to its starting state. Used by tests. */
export function resetMockAccount() {
  mockAccountStore.accounts = initialAccounts();
  mockAccountStore.currentUserId = null;
  mockAccountStore.settings = { locationAccess: false };
}
