/** Real authenticated account API. Demo/mock modes remain in client.ts. */
import type { AppSettings, DemoSensoryPreferences, SignInDetails, SignUpDetails, User } from '../types/user';
import type { VenueDetail } from './backendAdapter';
import { toPlace, type DemoRecommendation } from './demoApi';
import type { Place } from '../types/place';

const KEY = 'sensory-scout-auth-token';
let memoryToken: string | null = null;

function baseUrl(): string {
  return (import.meta.env.VITE_API_URL?.trim() || 'http://localhost:8000/api/v1').replace(/\/+$/, '');
}

/** Keep the bearer token in session storage, not persistent local storage. */
function token(): string | null {
  if (memoryToken) return memoryToken;
  try { return sessionStorage.getItem(KEY); } catch { return null; }
}

function setToken(value: string | null): void {
  memoryToken = value;
  try {
    if (value) sessionStorage.setItem(KEY, value);
    else sessionStorage.removeItem(KEY);
  } catch { /* Browser storage can be disabled. */ }
}

export class AuthApiError extends Error {
  constructor(message: string, public readonly status = 0) {
    super(message);
    this.name = 'AuthApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  const bearer = authenticated ? token() : null;
  if (authenticated && !bearer) throw new AuthApiError('Please sign in to continue.', 401);
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new AuthApiError('Unable to reach the Sensory Scout API.');
  }
  if (!response.ok) {
    if (response.status === 401 && authenticated) setToken(null);
    const fallback = response.status === 401 ? 'Invalid credentials or expired session.'
      : response.status === 409 ? 'An account with this email already exists.'
      : response.status === 404 ? 'Place not found.'
      : 'The request could not be completed.';
    throw new AuthApiError(fallback, response.status);
  }
  if (response.status === 204) return undefined as T;
  try { return await response.json() as T; }
  catch { throw new AuthApiError('Invalid response from the API.', response.status); }
}

interface TokenResponse { access_token: string; token_type: string }
interface BackendUser { id: number; name: string; email: string }
function user(value: BackendUser): User {
  return { id: String(value.id), name: value.name, email: value.email };
}
export async function currentUser(): Promise<User | null> {
  if (!token()) return null;
  try { return user(await request<BackendUser>('/users/me')); }
  catch (error) {
    if (error instanceof AuthApiError && error.status === 401) return null;
    throw error;
  }
}
export async function login(details: SignInDetails): Promise<User> {
  const response = await request<TokenResponse>('/auth/login', {
    method: 'POST', body: JSON.stringify(details),
  }, false);
  setToken(response.access_token);
  try { return user(await request<BackendUser>('/users/me')); }
  catch (error) { setToken(null); throw error; }
}
export async function register(details: SignUpDetails): Promise<User> {
  const response = await request<TokenResponse>('/auth/register', {
    method: 'POST', body: JSON.stringify(details),
  }, false);
  setToken(response.access_token);
  try { return user(await request<BackendUser>('/users/me')); }
  catch (error) { setToken(null); throw error; }
}
export async function logout(): Promise<void> {
  try { if (token()) await request<void>('/auth/logout', { method: 'POST' }); }
  finally { setToken(null); }
}
export async function readPreferences(): Promise<DemoSensoryPreferences> {
  return (await request<{ preferences: DemoSensoryPreferences }>('/users/me/preferences')).preferences;
}
export async function writePreferences(value: DemoSensoryPreferences): Promise<DemoSensoryPreferences> {
  return (await request<{ preferences: DemoSensoryPreferences }>('/users/me/preferences', {
    method: 'PUT', body: JSON.stringify(value),
  })).preferences;
}
export async function readFavorites(): Promise<Place[]> {
  return (await request<VenueDetail[]>('/users/me/favorites')).map(toPlace);
}
export async function addFavorite(id: string): Promise<void> {
  if (!/^[1-9]\d*$/.test(id)) throw new AuthApiError('Invalid place ID.');
  await request<void>(`/users/me/favorites/${id}`, { method: 'PUT' });
}
export async function deleteFavorite(id: string): Promise<void> {
  if (!/^[1-9]\d*$/.test(id)) throw new AuthApiError('Invalid place ID.');
  await request<void>(`/users/me/favorites/${id}`, { method: 'DELETE' });
}
export async function readSettings(): Promise<AppSettings> {
  return request<AppSettings>('/users/me/settings');
}
export async function writeSettings(value: AppSettings): Promise<AppSettings> {
  return request<AppSettings>('/users/me/settings', { method: 'PUT', body: JSON.stringify(value) });
}
export async function readRecommendations(limit = 3): Promise<DemoRecommendation[]> {
  const response = await request<{ items: Array<{ venue: VenueDetail; score: number; reason: string }> }>(
    `/users/me/recommendations?limit=${encodeURIComponent(limit)}`,
  );
  return response.items.map(item => ({ place: toPlace(item.venue), score: item.score, reason: item.reason }));
}
