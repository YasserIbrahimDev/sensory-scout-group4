import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage, { SETTINGS_MESSAGES } from './SettingsPage';
import { renderWithRouter } from '../test/renderWithRouter';
import * as client from '../api/client';

const PERMISSION_DENIED = 1;

/** Pretends the browser answered the location prompt with `answer`. */
function mockGeolocation(answer: 'allow' | 'block') {
  const getCurrentPosition = vi.fn((success: PositionCallback, failure?: PositionErrorCallback | null) => {
    if (answer === 'allow') {
      success({ coords: { latitude: 33.2, longitude: -97.1 } } as GeolocationPosition);
    } else {
      failure?.({ code: PERMISSION_DENIED, PERMISSION_DENIED } as GeolocationPositionError);
    }
  });
  Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true });
  return getCurrentPosition;
}

function renderSettings() {
  return renderWithRouter(<SettingsPage />, { route: '/settings' });
}

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(navigator, 'geolocation', { value: undefined, configurable: true });
});

describe('SettingsPage', () => {
  it('TC-SETTINGS-01: shows a Location access switch that starts off, and explains the fallback', async () => {
    renderSettings();
    const toggle = await screen.findByRole('switch', { name: 'Location access' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(toggle).toHaveAccessibleDescription(/you can still search by name or address/);
    expect(screen.getByRole('link', { name: 'search by name or address' })).toHaveAttribute('href', '/search');
  });

  it('TC-SETTINGS-02: turning it on asks the browser, then saves and confirms', async () => {
    const ask = mockGeolocation('allow');
    renderSettings();
    const toggle = await screen.findByRole('switch', { name: 'Location access' });
    await userEvent.click(toggle);
    expect(ask).toHaveBeenCalledOnce();
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(SETTINGS_MESSAGES.locationOn);
    expect(await client.getSettings()).toEqual({ locationAccess: true });
  });

  it('TC-SETTINGS-03: turning it off saves without asking the browser', async () => {
    await client.saveSettings({ locationAccess: true });
    const ask = mockGeolocation('allow');
    renderSettings();
    const toggle = await screen.findByRole('switch', { name: 'Location access' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(toggle);
    expect(ask).not.toHaveBeenCalled();
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('status')).toHaveTextContent(SETTINGS_MESSAGES.locationOff);
  });

  it('TC-SETTINGS-04: if the browser blocks location, it stays off and explains how to fix it', async () => {
    mockGeolocation('block');
    renderSettings();
    const toggle = await screen.findByRole('switch', { name: 'Location access' });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('alert')).toHaveTextContent(SETTINGS_MESSAGES.locationDenied);
    expect(await client.getSettings()).toEqual({ locationAccess: false });
  });

  it('TC-SETTINGS-05: browsers without location support keep it off with a message', async () => {
    renderSettings();
    await userEvent.click(await screen.findByRole('switch', { name: 'Location access' }));
    expect(screen.getByRole('alert')).toHaveTextContent(SETTINGS_MESSAGES.locationUnsupported);
  });

  it('TC-SETTINGS-06: a failed save shows an error, not a success message, and keeps the old value', async () => {
    mockGeolocation('allow');
    vi.spyOn(client, 'saveSettings').mockRejectedValueOnce(new Error('Network'));
    renderSettings();
    const toggle = await screen.findByRole('switch', { name: 'Location access' });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('alert')).toHaveTextContent(SETTINGS_MESSAGES.saveFailed);
    expect(screen.queryByText(SETTINGS_MESSAGES.locationOn)).not.toBeInTheDocument();
  });

  it('TC-SETTINGS-07: shows an error with Try again when settings fail to load', async () => {
    vi.spyOn(client, 'getSettings').mockRejectedValueOnce(new Error('Network'));
    renderSettings();
    expect(await screen.findByRole('alert')).toHaveTextContent(SETTINGS_MESSAGES.loadFailed);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('switch', { name: 'Location access' })).toBeInTheDocument();
  });

  it('TC-SETTINGS-08: the switch works with the keyboard (Space)', async () => {
    mockGeolocation('allow');
    renderSettings();
    const toggle = await screen.findByRole('switch', { name: 'Location access' });
    toggle.focus();
    await userEvent.keyboard(' ');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });
});
