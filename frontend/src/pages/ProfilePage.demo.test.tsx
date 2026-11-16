import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage, { PROFILE_MESSAGES } from './ProfilePage';
import { renderWithRouter } from '../test/renderWithRouter';
import * as client from '../api/client';
import type { User } from '../types/user';

const demoUser: User = {
  id: 'development-demo-user',
  name: 'Sensory Scout Development Demo',
  email: 'sensory-scout-demo@example.invalid',
};

const initialPreferences = { noise: 2 as const, lighting: 3 as const, crowd: null };

function renderDemoProfile(
  preferencesMock = vi.fn().mockResolvedValue(initialPreferences),
) {
  vi.stubEnv('VITE_DEMO_MODE', 'true');
  vi.spyOn(client, 'getCurrentUser').mockResolvedValue(demoUser);
  vi.spyOn(client, 'getPreferences').mockImplementation(preferencesMock);
  return renderWithRouter(<ProfilePage />, { route: '/profile' });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ProfilePage: development demo workflow', () => {
  it('loads the server-configured demo identity without sign-in or sign-out controls', async () => {
    renderDemoProfile();

    expect(await screen.findByRole('heading', { level: 2, name: 'Your account' })).toBeInTheDocument();
    expect(screen.getByText(demoUser.name)).toBeInTheDocument();
    expect(screen.getByText('Development demo user')).toBeInTheDocument();
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
  });

  it('shows five descriptive choices and saves their numeric 1–5 values', async () => {
    const save = vi.spyOn(client, 'savePreferences').mockResolvedValue({ noise: 1, lighting: 3, crowd: null });
    renderDemoProfile();

    const noise = await screen.findByRole('group', { name: 'Noise level' });
    const lighting = screen.getByRole('group', { name: 'Lighting' });
    const crowd = screen.getByRole('group', { name: 'Crowd level' });

    expect(within(noise).getAllByRole('radio')).toHaveLength(6);
    expect(within(noise).getByRole('radio', { name: 'Quiet' })).toBeChecked();
    expect(within(lighting).getByRole('radio', { name: 'Balanced' })).toBeChecked();
    expect(within(crowd).getByRole('radio', { name: 'No preference' })).toBeChecked();

    await userEvent.click(within(noise).getByRole('radio', { name: 'Very quiet' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save preferences' }));

    expect(save).toHaveBeenCalledWith({ noise: 1, lighting: 3, crowd: null });
    expect(await screen.findByText(PROFILE_MESSAGES.preferencesSaved)).toBeInTheDocument();
  });

  it('shows a useful error when saving demo preferences fails', async () => {
    vi.spyOn(client, 'savePreferences').mockRejectedValueOnce(new Error('Network unavailable'));
    renderDemoProfile();

    await screen.findByRole('group', { name: 'Noise level' });
    await userEvent.click(screen.getByRole('button', { name: 'Save preferences' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(PROFILE_MESSAGES.preferencesSaveFailed);
    expect(screen.queryByText(PROFILE_MESSAGES.preferencesSaved)).not.toBeInTheDocument();
  });

  it('offers retry when demo preferences cannot be loaded', async () => {
    const load = vi.fn().mockRejectedValue(
      new Error('Network unavailable'),
    );

    renderDemoProfile(load);

    expect(await screen.findByRole('alert'))
      .toHaveTextContent(PROFILE_MESSAGES.preferencesLoadFailed);

    load.mockResolvedValue(initialPreferences);

    await userEvent.click(
      screen.getByRole('button', { name: 'Try again' }),
    );

    expect(
      await screen.findByRole('group', { name: 'Noise level' }),
    ).toBeInTheDocument();

    expect(load).toHaveBeenCalledTimes(2);
  });
});
