import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import type { AppSettings } from '../types/user';
import { getSettings, saveSettings } from '../api/client';
import { useLoad } from '../lib/useLoad';
import { requestLocationPermission } from '../lib/location';

export const SETTINGS_MESSAGES = {
  loadFailed: "Couldn't load your settings. Check your connection and try again.",
  locationOn: 'Location access is on.',
  locationOff: 'Location access is off. You can still search by name or address.',
  locationDenied:
    'Your browser blocked location access, so it is still off. To allow it, change the location permission for this site in your browser settings. You can still search by name or address.',
  locationUnsupported:
    'This browser does not support location access, so it is still off. You can still search by name or address.',
  saveFailed: "Couldn't save this setting, so nothing was changed. Check your connection and try again.",
} as const;

type Result = { ok: boolean; text: string } | null;

function LocationSetting({ initial }: { initial: AppSettings }) {
  const labelId = useId();
  const hintId = useId();
  const [settings, setSettings] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const on = settings.locationAccess;

  async function handleToggle() {
    if (busy) return;
    setBusy(true);
    setResult(null);
    const turningOn = !on;
    try {
      if (turningOn) {
        const permission = await requestLocationPermission();
        if (permission !== 'granted') {
          setResult({
            ok: false,
            text: permission === 'denied' ? SETTINGS_MESSAGES.locationDenied : SETTINGS_MESSAGES.locationUnsupported,
          });
          return;
        }
      }
      setSettings(await saveSettings({ ...settings, locationAccess: turningOn }));
      setResult({ ok: true, text: turningOn ? SETTINGS_MESSAGES.locationOn : SETTINGS_MESSAGES.locationOff });
    } catch {
      setResult({ ok: false, text: SETTINGS_MESSAGES.saveFailed });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="setting">
      <div className="setting__row">
        <MapPin className="setting__icon" aria-hidden="true" />
        <div className="setting__text">
          <p id={labelId} className="setting__label">Location access</p>
          <p id={hintId} className="setting__hint">
            Lets Sensory Scout use your location to show places near you. If you leave this off, you can
            still <Link to="/search">search by name or address</Link>.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          className="switch"
          aria-checked={on}
          aria-labelledby={labelId}
          aria-describedby={hintId}
          aria-busy={busy || undefined}
          onClick={handleToggle}
        >
          <span className="switch__track" aria-hidden="true">
            <span className="switch__thumb" />
          </span>
          <span className="switch__text" aria-hidden="true">{on ? 'On' : 'Off'}</span>
        </button>
      </div>
      <p role="status" className={result?.ok ? 'notice' : 'visually-hidden'}>{result?.ok ? result.text : ''}</p>
      {result && !result.ok && <p role="alert" className="notice notice--error">{result.text}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const { state, retry } = useLoad(getSettings, 'settings');

  return (
    <div className="page settings">
      <header className="page__header">
        <h1 className="page__title">Settings</h1>
        <p className="page__subtitle">Choose how Sensory Scout works on this device.</p>
      </header>

      <section className="profile-card" aria-labelledby="privacy-heading">
        <h2 id="privacy-heading" className="section-title">Privacy</h2>
        {state.status === 'loading' && <p className="status-message" role="status">Loading your settings…</p>}
        {state.status === 'error' && (
          <div className="status-message status-message--error" role="alert">
            <p>{SETTINGS_MESSAGES.loadFailed}</p>
            <button type="button" className="button button--secondary" onClick={retry}>
              Try again
            </button>
          </div>
        )}
        {state.status === 'ready' && <LocationSetting initial={state.data} />}
      </section>
    </div>
  );
}
