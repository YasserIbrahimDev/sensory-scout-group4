import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage, { PROFILE_MESSAGES } from './ProfilePage';
import { renderWithRouter } from '../test/renderWithRouter';
import { DEMO_ACCOUNT, signInAsDemo } from '../test/account';
import * as client from '../api/client';

function renderProfile() {
  return renderWithRouter(<ProfilePage />, { route: '/profile' });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ProfilePage: sign in and sign up', () => {
  it('TC-PROFILE-01: signed-out users see the sign-in form', async () => {
    renderProfile();
    expect(await screen.findByRole('heading', { level: 2, name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('TC-PROFILE-02: an empty sign-in shows a message under each field and focuses the first one', async () => {
    renderProfile();
    await userEvent.click(await screen.findByRole('button', { name: 'Sign in' }));
    const email = screen.getByLabelText('Email');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('Enter your email address.');
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('Enter your password.');
    expect(email).toHaveFocus();
  });

  it('TC-PROFILE-03: a wrong password shows the reason and stays signed out', async () => {
    renderProfile();
    await userEvent.type(await screen.findByLabelText('Email'), DEMO_ACCOUNT.email);
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The email or password is incorrect.');
    expect(screen.getByRole('heading', { level: 2, name: 'Sign in' })).toBeInTheDocument();
  });

  it('TC-PROFILE-04: signing in shows the account and announces it', async () => {
    renderProfile();
    await userEvent.type(await screen.findByLabelText('Email'), DEMO_ACCOUNT.email);
    await userEvent.type(screen.getByLabelText('Password'), DEMO_ACCOUNT.password);
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Your account' })).toHaveFocus();
    expect(screen.getByText('You are signed in as Demo User.')).toHaveAttribute('role', 'status');
    expect(screen.getByText(DEMO_ACCOUNT.email)).toBeInTheDocument();
  });

  it('TC-PROFILE-05: a network failure while signing in shows a general error', async () => {
    vi.spyOn(client, 'signIn').mockRejectedValueOnce(new Error('Network'));
    renderProfile();
    await userEvent.type(await screen.findByLabelText('Email'), DEMO_ACCOUNT.email);
    await userEvent.type(screen.getByLabelText('Password'), DEMO_ACCOUNT.password);
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(PROFILE_MESSAGES.signInFailed);
  });

  it('TC-PROFILE-06: sign-up checks every field before creating the account', async () => {
    renderProfile();
    await userEvent.click(await screen.findByRole('button', { name: 'Create an account' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Create an account' })).toHaveFocus();

    await userEvent.type(screen.getByLabelText('Email'), 'sam@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'short');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'other');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Enter your name.');
    expect(screen.getByLabelText('Name')).toHaveFocus();
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(
      'At least 8 characters. Use at least 8 characters for your password.',
    );
    expect(screen.getByLabelText('Confirm password')).toHaveAccessibleDescription('The passwords do not match.');
    expect(await client.getCurrentUser()).toBeNull();
  });

  it('TC-PROFILE-07: creating an account signs the user in', async () => {
    renderProfile();
    await userEvent.click(await screen.findByRole('button', { name: 'Create an account' }));
    await userEvent.type(screen.getByLabelText('Name'), 'Sam Lee');
    await userEvent.type(screen.getByLabelText('Email'), 'sam@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'longenough');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'longenough');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('You are signed in as Sam Lee.')).toBeInTheDocument();
    expect(await screen.findAllByRole('radio', { name: 'No preference', checked: true })).toHaveLength(3);
  });

  it('TC-PROFILE-08: an email that already has an account shows how to fix it', async () => {
    renderProfile();
    await userEvent.click(await screen.findByRole('button', { name: 'Create an account' }));
    await userEvent.type(screen.getByLabelText('Name'), 'Someone');
    await userEvent.type(screen.getByLabelText('Email'), DEMO_ACCOUNT.email);
    await userEvent.type(screen.getByLabelText('Password'), 'longenough');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'longenough');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('An account with this email already exists.');
  });

  it('TC-PROFILE-09: signing out returns to the sign-in form and says so', async () => {
    signInAsDemo();
    renderProfile();
    await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Sign in' })).toHaveFocus();
    expect(screen.getByText(PROFILE_MESSAGES.signedOut)).toHaveAttribute('role', 'status');
  });
});

describe('ProfilePage: sensory preferences', () => {
  it('TC-PROFILE-10: shows noise, lighting, and crowd groups with the saved choices selected', async () => {
    signInAsDemo();
    renderProfile();
    const noise = await screen.findByRole('group', { name: 'Noise level' });
    const lighting = screen.getByRole('group', { name: 'Lighting' });
    const crowd = screen.getByRole('group', { name: 'Crowd level' });
    expect(within(noise).getAllByRole('radio').map((r) => r.closest('label')?.textContent))
      .toEqual(['No preference', 'Quiet', 'Moderate noise', 'Loud']);
    expect(within(noise).getByRole('radio', { name: 'Quiet' })).toBeChecked();
    expect(within(lighting).getByRole('radio', { name: 'Dim light' })).toBeChecked();
    expect(within(crowd).getByRole('radio', { name: 'No preference' })).toBeChecked();
  });

  it('TC-PROFILE-11: saving shows a success message and keeps the new choices', async () => {
    signInAsDemo();
    renderProfile();
    const crowd = await screen.findByRole('group', { name: 'Crowd level' });
    await userEvent.click(within(crowd).getByRole('radio', { name: 'Low crowds' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save preferences' }));
    expect(await screen.findByText(PROFILE_MESSAGES.preferencesSaved)).toHaveAttribute('role', 'status');
    expect(await client.getPreferences()).toEqual({ noise: 'low', lighting: 'dim', crowd: 'low' });
  });

  it('TC-PROFILE-12: a failed save shows an error, not a success message', async () => {
    signInAsDemo();
    vi.spyOn(client, 'savePreferences').mockRejectedValueOnce(new Error('Network'));
    renderProfile();
    await userEvent.click(await screen.findByRole('button', { name: 'Save preferences' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(PROFILE_MESSAGES.preferencesSaveFailed);
    expect(screen.queryByText(PROFILE_MESSAGES.preferencesSaved)).not.toBeInTheDocument();
  });

  it('TC-PROFILE-13: shows an error with Try again when preferences fail to load', async () => {
    signInAsDemo();
    vi.spyOn(client, 'getPreferences').mockRejectedValueOnce(new Error('Network'));
    renderProfile();
    expect(await screen.findByRole('alert')).toHaveTextContent(PROFILE_MESSAGES.preferencesLoadFailed);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('group', { name: 'Noise level' })).toBeInTheDocument();
  });

  it('TC-PROFILE-14: preferences can be changed with arrow keys and saved with the keyboard', async () => {
    signInAsDemo();
    renderProfile();
    const noise = await screen.findByRole('group', { name: 'Noise level' });
    within(noise).getByRole('radio', { name: 'Quiet' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(within(noise).getByRole('radio', { name: 'Moderate noise' })).toBeChecked();
    screen.getByRole('button', { name: 'Save preferences' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByText(PROFILE_MESSAGES.preferencesSaved)).toBeInTheDocument();
    expect((await client.getPreferences()).noise).toBe('moderate');
  });
});
