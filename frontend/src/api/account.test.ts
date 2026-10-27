import {
  AccountError,
  getCurrentUser,
  getFavorites,
  getPreferences,
  getSettings,
  isFavorite,
  removeFavorite,
  saveFavorite,
  savePreferences,
  saveSettings,
  signIn,
  signOut,
  signUp,
} from './client';
import { DEMO_ACCOUNT } from '../test/account';

describe('api client: account (mock data)', () => {
  it('TC-PROFILE-20: signs in with the right password, ignoring email case and spaces', async () => {
    expect(await getCurrentUser()).toBeNull();
    const user = await signIn({ email: ` ${DEMO_ACCOUNT.email.toUpperCase()} `, password: DEMO_ACCOUNT.password });
    expect(user.name).toBe('Demo User');
    expect(await getCurrentUser()).toEqual(user);
    await signOut();
    expect(await getCurrentUser()).toBeNull();
  });

  it('TC-PROFILE-21: refuses a wrong password with a message safe to show', async () => {
    await expect(signIn({ email: DEMO_ACCOUNT.email, password: 'wrong-password' }))
      .rejects.toEqual(new AccountError('The email or password is incorrect.'));
    expect(await getCurrentUser()).toBeNull();
  });

  it('TC-PROFILE-22: creates an account with no preferences or favorites, and refuses a used email', async () => {
    const user = await signUp({ name: ' Sam Lee ', email: 'Sam@Example.com', password: 'longenough' });
    expect(user).toMatchObject({ name: 'Sam Lee', email: 'sam@example.com' });
    expect(await getPreferences()).toEqual({ noise: null, lighting: null, crowd: null });
    expect(await getFavorites()).toEqual([]);
    await expect(signUp({ name: 'Sam', email: 'sam@example.com', password: 'longenough' }))
      .rejects.toBeInstanceOf(AccountError);
  });

  it('TC-PROFILE-23: saves preferences for the signed-in user', async () => {
    await signIn(DEMO_ACCOUNT);
    await savePreferences({ noise: 'moderate', lighting: null, crowd: 'low' });
    expect(await getPreferences()).toEqual({ noise: 'moderate', lighting: null, crowd: 'low' });
  });

  it('TC-FAV-20: saves and removes favorites, most recently saved first', async () => {
    await signIn(DEMO_ACCOUNT);
    expect((await getFavorites()).map((p) => p.id)).toEqual(['north-lakes-park', 'denton-public-library']);
    await saveFavorite('harmony-coffee');
    await saveFavorite('harmony-coffee');
    expect((await getFavorites()).map((p) => p.id)).toEqual(['harmony-coffee', 'north-lakes-park', 'denton-public-library']);
    await removeFavorite('north-lakes-park');
    expect(await isFavorite('north-lakes-park')).toBe(false);
    expect(await getFavorites()).toHaveLength(2);
  });

  it('TC-FAV-21: account-only actions fail when signed out', async () => {
    await expect(getFavorites()).rejects.toBeInstanceOf(AccountError);
    await expect(saveFavorite('harmony-coffee')).rejects.toBeInstanceOf(AccountError);
    await expect(savePreferences({ noise: null, lighting: null, crowd: null })).rejects.toBeInstanceOf(AccountError);
  });

  it('TC-SETTINGS-20: location access starts off and can be saved', async () => {
    expect(await getSettings()).toEqual({ locationAccess: false });
    await saveSettings({ locationAccess: true });
    expect(await getSettings()).toEqual({ locationAccess: true });
  });
});
