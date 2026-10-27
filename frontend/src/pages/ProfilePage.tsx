import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SensoryPreferences, User } from '../types/user';
import { AccountError, getPreferences, savePreferences } from '../api/client';
import { useAuth } from '../lib/auth';
import { useLoad } from '../lib/useLoad';
import { CROWD_LEVELS, LIGHTING_LEVELS, NOISE_LEVELS } from '../lib/searchFilters';
import { crowdLabels, lightingLabels, noiseLabels } from '../lib/sensoryLabels';
import { crowdIcons, lightingIcons, noiseIcons } from '../lib/sensoryIcons';
import { MIN_PASSWORD_LENGTH, validateSignIn, validateSignUp } from '../lib/accountValidation';
import type { FormErrors, SignInForm, SignUpForm } from '../lib/accountValidation';
import type { SignInLinkState } from '../components/SignInPrompt';
import TextField from '../components/TextField';

export const PROFILE_MESSAGES = {
  signInFailed: "Couldn't sign you in. Check your connection and try again.",
  signUpFailed: "Couldn't create your account. Check your connection and try again.",
  signOutFailed: "Couldn't sign you out. Check your connection and try again.",
  signedOut: 'You have signed out.',
  preferencesLoadFailed: "Couldn't load your sensory preferences. Check your connection and try again.",
  preferencesSaved: 'Your sensory preferences were saved.',
  preferencesSaveFailed: "Couldn't save your sensory preferences, so your changes were not saved. Check your connection and try again.",
} as const;

/** Shows the server's own message when it gave one (like a wrong password), or a general one. */
function errorMessage(error: unknown, fallback: string): string {
  return error instanceof AccountError ? error.message : fallback;
}

/** After a failed submit, moves focus to the first field with an error. */
function useFocusFirstError(formRef: RefObject<HTMLFormElement>, attempt: number) {
  useEffect(() => {
    if (attempt === 0) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [formRef, attempt]);
}

// ---------- Signed out: sign in or create an account ----------

interface AuthFormProps {
  onSwitch: () => void;
  onDone: (user: User) => void;
}

function SignInFormSection({ onSwitch, onDone }: AuthFormProps) {
  const { signIn } = useAuth();
  const headingId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<SignInForm>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors<SignInForm>>({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useFocusFirstError(formRef, attempt);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const found = validateSignIn(form);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) {
      setAttempt((n) => n + 1);
      return;
    }
    setBusy(true);
    try {
      onDone(await signIn({ email: form.email.trim(), password: form.password }));
    } catch (error) {
      setServerError(errorMessage(error, PROFILE_MESSAGES.signInFailed));
      setBusy(false);
    }
  }

  return (
    <section className="profile-card" aria-labelledby={headingId}>
      <h2 id={headingId} className="section-title" tabIndex={-1} data-autofocus>Sign in</h2>
      <form ref={formRef} className="account-form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(email) => setForm({ ...form, email })}
          error={errors.email}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(password) => setForm({ ...form, password })}
          error={errors.password}
        />
        {serverError && <p role="alert" className="notice notice--error">{serverError}</p>}
        <button type="submit" className="button button--primary" aria-disabled={busy || undefined}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="account-form__switch">
        New to Sensory Scout?{' '}
        <button type="button" className="link-button" onClick={onSwitch}>Create an account</button>
      </p>
    </section>
  );
}

function SignUpFormSection({ onSwitch, onDone }: AuthFormProps) {
  const { signUp } = useAuth();
  const headingId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<SignUpForm>({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<FormErrors<SignUpForm>>({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useFocusFirstError(formRef, attempt);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const found = validateSignUp(form);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) {
      setAttempt((n) => n + 1);
      return;
    }
    setBusy(true);
    try {
      onDone(await signUp({ name: form.name.trim(), email: form.email.trim(), password: form.password }));
    } catch (error) {
      setServerError(errorMessage(error, PROFILE_MESSAGES.signUpFailed));
      setBusy(false);
    }
  }

  return (
    <section className="profile-card" aria-labelledby={headingId}>
      <h2 id={headingId} className="section-title" tabIndex={-1} data-autofocus>Create an account</h2>
      <form ref={formRef} className="account-form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Name"
          autoComplete="name"
          value={form.name}
          onChange={(name) => setForm({ ...form, name })}
          error={errors.name}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(email) => setForm({ ...form, email })}
          error={errors.email}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          value={form.password}
          onChange={(password) => setForm({ ...form, password })}
          error={errors.password}
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={(confirmPassword) => setForm({ ...form, confirmPassword })}
          error={errors.confirmPassword}
        />
        {serverError && <p role="alert" className="notice notice--error">{serverError}</p>}
        <button type="submit" className="button button--primary" aria-disabled={busy || undefined}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="account-form__switch">
        Already have an account?{' '}
        <button type="button" className="link-button" onClick={onSwitch}>Sign in</button>
      </p>
    </section>
  );
}

// ---------- Signed in: account details and sensory preferences ----------

interface PreferenceGroupProps<T extends string> {
  legend: string;
  name: string;
  levels: T[];
  labels: Record<T, string>;
  icons: Record<T, LucideIcon>;
  value: T | null;
  onChange: (value: T | null) => void;
}

function PreferenceGroup<T extends string>({ legend, name, levels, labels, icons, value, onChange }: PreferenceGroupProps<T>) {
  return (
    <fieldset className="filter-group">
      <legend className="filter-group__legend">{legend}</legend>
      <div className="choice-grid">
        <label className="choice">
          <input type="radio" name={name} checked={value === null} onChange={() => onChange(null)} />
          No preference
        </label>
        {levels.map((level) => {
          const Icon: LucideIcon = icons[level];
          return (
            <label key={level} className="choice">
              <input type="radio" name={name} checked={value === level} onChange={() => onChange(level)} />
              <Icon className="choice__icon" aria-hidden="true" />
              {labels[level]}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function PreferencesForm({ initial }: { initial: SensoryPreferences }) {
  const [preferences, setPreferences] = useState(initial);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  function update(change: Partial<SensoryPreferences>) {
    setPreferences({ ...preferences, ...change });
    setResult(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setResult(null);
    try {
      setPreferences(await savePreferences(preferences));
      setResult({ ok: true, text: PROFILE_MESSAGES.preferencesSaved });
    } catch (error) {
      setResult({ ok: false, text: errorMessage(error, PROFILE_MESSAGES.preferencesSaveFailed) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="preferences-form" aria-labelledby="preferences-heading" onSubmit={handleSubmit}>
      <PreferenceGroup
        legend="Noise level"
        name="pref-noise"
        levels={NOISE_LEVELS}
        labels={noiseLabels}
        icons={noiseIcons}
        value={preferences.noise}
        onChange={(noise) => update({ noise })}
      />
      <PreferenceGroup
        legend="Lighting"
        name="pref-lighting"
        levels={LIGHTING_LEVELS}
        labels={lightingLabels}
        icons={lightingIcons}
        value={preferences.lighting}
        onChange={(lighting) => update({ lighting })}
      />
      <PreferenceGroup
        legend="Crowd level"
        name="pref-crowd"
        levels={CROWD_LEVELS}
        labels={crowdLabels}
        icons={crowdIcons}
        value={preferences.crowd}
        onChange={(crowd) => update({ crowd })}
      />
      <p role="status" className={result?.ok ? 'notice' : 'visually-hidden'}>{result?.ok ? result.text : ''}</p>
      {result && !result.ok && <p role="alert" className="notice notice--error">{result.text}</p>}
      <button type="submit" className="button button--primary" aria-disabled={busy || undefined}>
        {busy ? 'Saving…' : 'Save preferences'}
      </button>
    </form>
  );
}

function SensoryPreferencesSection({ userId }: { userId: string }) {
  const { state, retry } = useLoad(getPreferences, userId);

  return (
    <section className="profile-card" aria-labelledby="preferences-heading">
      <h2 id="preferences-heading" className="section-title">Sensory Preferences</h2>
      <p className="profile-card__intro">
        Choose the levels you are most comfortable with. You can change these at any time.
      </p>
      {state.status === 'loading' && <p className="status-message" role="status">Loading your preferences…</p>}
      {state.status === 'error' && (
        <div className="status-message status-message--error" role="alert">
          <p>{PROFILE_MESSAGES.preferencesLoadFailed}</p>
          <button type="button" className="button button--secondary" onClick={retry}>
            Try again
          </button>
        </div>
      )}
      {state.status === 'ready' && <PreferencesForm initial={state.data} />}
    </section>
  );
}

function AccountSection({ user }: { user: User }) {
  const { signOut } = useAuth();
  const [error, setError] = useState('');

  async function handleSignOut() {
    setError('');
    try {
      await signOut();
    } catch {
      setError(PROFILE_MESSAGES.signOutFailed);
    }
  }

  return (
    <section className="profile-card" aria-labelledby="account-heading">
      <h2 id="account-heading" className="section-title" tabIndex={-1} data-autofocus>Your account</h2>
      <div className="account-summary">
        <p>
          Signed in as <strong>{user.name}</strong>
          <span className="account-summary__email">{user.email}</span>
        </p>
        <button type="button" className="button button--secondary" onClick={handleSignOut}>
          <LogOut className="button__icon" aria-hidden="true" />
          Sign out
        </button>
      </div>
      {error && <p role="alert" className="notice notice--error">{error}</p>}
    </section>
  );
}

// ---------- Page ----------

export default function ProfilePage() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as SignInLinkState | null)?.from;
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [status, setStatus] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  // Set when the view changes because of something the user did, so focus follows them.
  const moveFocus = useRef(false);
  const previousStatus = useRef(auth.status);

  useEffect(() => {
    if (previousStatus.current === 'signedIn' && auth.status === 'signedOut') {
      setStatus(PROFILE_MESSAGES.signedOut);
      moveFocus.current = true;
    }
    previousStatus.current = auth.status;
  }, [auth.status]);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    contentRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  });

  function switchMode(next: 'signIn' | 'signUp') {
    setMode(next);
    setStatus('');
    moveFocus.current = true;
  }

  function handleSignedIn(user: User) {
    if (from) {
      // Return to the page that asked them to sign in, like Place Details.
      navigate(from);
      return;
    }
    setStatus(`You are signed in as ${user.name}.`);
    moveFocus.current = true;
  }

  return (
    <div className="page profile">
      <header className="page__header">
        <h1 className="page__title">Profile</h1>
        <p className="page__subtitle">
          {auth.status === 'signedIn'
            ? 'Manage your account and the sensory conditions you prefer.'
            : 'Sign in or create an account to save places and set your sensory preferences.'}
        </p>
      </header>

      <p role="status" className={status ? 'notice profile__status' : 'visually-hidden'}>{status}</p>

      <div ref={contentRef} className="profile__content">
        {auth.status === 'loading' && <p className="status-message" role="status">Loading…</p>}
        {auth.status === 'signedOut' && mode === 'signIn' && (
          <SignInFormSection onSwitch={() => switchMode('signUp')} onDone={handleSignedIn} />
        )}
        {auth.status === 'signedOut' && mode === 'signUp' && (
          <SignUpFormSection onSwitch={() => switchMode('signIn')} onDone={handleSignedIn} />
        )}
        {auth.status === 'signedIn' && (
          <>
            <AccountSection user={auth.user} />
            <SensoryPreferencesSection userId={auth.user.id} />
          </>
        )}
      </div>
    </div>
  );
}
