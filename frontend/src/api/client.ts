import type { LatLng, NearbyPlace, Place, Review } from '../types/place';
import { hasLocation } from '../types/place';
import type { AppSettings, SensoryPreferences, SignInDetails, SignUpDetails, User } from '../types/user';
import type { SearchFilters } from '../lib/searchFilters';
import { categoryLabels } from '../lib/sensoryLabels';
import { mockPlaces } from '../data/mockPlaces';
import { mockReviews } from '../data/mockReviews';
import { mockAccountStore } from '../data/mockAccount';
import { fetchAllPlaces, fetchPlace } from './placeAdapter';

// All data loading goes through this file. Pages never import mock data directly.
// Places come from the FastAPI backend at VITE_API_URL. Set VITE_USE_MOCK_DATA=true
// to use the mock places instead (for working without the backend, and in tests).

/** True when the app should use mock places instead of the API. */
export function usingMockData(): boolean {
  return import.meta.env.VITE_USE_MOCK_DATA === 'true';
}

async function loadAllPlaces(): Promise<Place[]> {
  return usingMockData() ? mockPlaces : fetchAllPlaces();
}

/** Places shown under "Popular near you" on the Home page. */
export async function getPopularPlaces(limit = 3): Promise<Place[]> {
  return (await loadAllPlaces()).slice(0, limit);
}

/** One place by id, or null if it does not exist. */
export async function getPlace(placeId: string): Promise<Place | null> {
  if (!usingMockData()) return fetchPlace(placeId);
  return mockPlaces.find((place) => place.id === placeId) ?? null;
}

/**
 * Reviews for one place, newest first.
 * The API does not return review text yet, so this is empty when using the API.
 */
export async function getReviews(placeId: string): Promise<Review[]> {
  if (!usingMockData()) return [];
  return mockReviews
    .filter((review) => review.placeId === placeId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** The closest other places to one place, nearest first. Places without a map position are left out. */
export async function getNearbyPlaces(placeId: string, limit = 3): Promise<NearbyPlace[]> {
  const places = await loadAllPlaces();
  const origin = places.find((place) => place.id === placeId);
  if (!origin?.location) return [];
  const from = origin.location;
  return places
    .filter(hasLocation)
    .filter((place) => place.id !== placeId)
    .map((place) => ({ place, distanceMiles: distanceInMiles(from, place.location) }))
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .slice(0, limit);
}

/** Every place, for the Map page. */
export async function getPlaces(): Promise<Place[]> {
  return loadAllPlaces();
}

/**
 * Places that match the search text and filters.
 * Within a group (for example Noise Level) any selected level matches;
 * across groups every group must match.
 */
export async function searchPlaces(filters: SearchFilters): Promise<Place[]> {
  return (await loadAllPlaces()).filter((place) => matchesFilters(place, filters));
}

// ---------- Account, favorites, preferences, and settings ----------

/** A request the server understood but refused, with a message safe to show the user. */
export class AccountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountError';
  }
}

export const SIGNED_OUT_MESSAGE = 'Please sign in to continue.';

/** The signed-in user, or null when signed out. */
export async function getCurrentUser(): Promise<User | null> {
  const account = currentAccount();
  return account ? { ...account.user } : null;
}

export async function signIn({ email, password }: SignInDetails): Promise<User> {
  const account = mockAccountStore.accounts.find((a) => a.user.email === normalizeEmail(email));
  if (!account || account.password !== password) {
    throw new AccountError('The email or password is incorrect.');
  }
  mockAccountStore.currentUserId = account.user.id;
  return { ...account.user };
}

export async function signUp({ name, email, password }: SignUpDetails): Promise<User> {
  const normalized = normalizeEmail(email);
  if (mockAccountStore.accounts.some((a) => a.user.email === normalized)) {
    throw new AccountError('An account with this email already exists. Try signing in instead.');
  }
  const user: User = { id: `user-${mockAccountStore.accounts.length + 1}`, name: name.trim(), email: normalized };
  mockAccountStore.accounts.push({
    user,
    password,
    preferences: { noise: null, lighting: null, crowd: null },
    favoriteIds: [],
  });
  mockAccountStore.currentUserId = user.id;
  return { ...user };
}

export async function signOut(): Promise<void> {
  mockAccountStore.currentUserId = null;
}

export async function getPreferences(): Promise<SensoryPreferences> {
  return { ...requireAccount().preferences };
}

export async function savePreferences(preferences: SensoryPreferences): Promise<SensoryPreferences> {
  const account = requireAccount();
  account.preferences = { ...preferences };
  return { ...account.preferences };
}

/** The signed-in user's saved places, most recently saved first. */
export async function getFavorites(): Promise<Place[]> {
  const favoriteIds = [...requireAccount().favoriteIds].reverse();
  const places = await loadAllPlaces();
  return favoriteIds
    .map((id) => places.find((place) => place.id === id))
    .filter((place): place is Place => place !== undefined);
}

export async function isFavorite(placeId: string): Promise<boolean> {
  return requireAccount().favoriteIds.includes(placeId);
}

export async function saveFavorite(placeId: string): Promise<void> {
  const account = requireAccount();
  if (!account.favoriteIds.includes(placeId)) account.favoriteIds.push(placeId);
}

export async function removeFavorite(placeId: string): Promise<void> {
  const account = requireAccount();
  account.favoriteIds = account.favoriteIds.filter((id) => id !== placeId);
}

export async function getSettings(): Promise<AppSettings> {
  return { ...mockAccountStore.settings };
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  mockAccountStore.settings = { ...settings };
  return { ...mockAccountStore.settings };
}

// Mock-only. The backend will identify the user from the sign-in session.
function currentAccount() {
  return mockAccountStore.accounts.find((a) => a.user.id === mockAccountStore.currentUserId);
}

function requireAccount() {
  const account = currentAccount();
  if (!account) throw new AccountError(SIGNED_OUT_MESSAGE);
  return account;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Filtering happens here until the backend's search and filter endpoint (Soma) is ready.
// A place with no reported level never matches a selected level.
function matchesFilters(place: Place, filters: SearchFilters): boolean {
  const q = filters.q.trim().toLowerCase();
  if (q) {
    const haystack = [place.name, categoryLabels[place.category], place.city, place.address]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  const { noise, lighting, crowd } = place.sensory;
  if (filters.noise.length && (noise === null || !filters.noise.includes(noise))) return false;
  if (filters.lighting.length && (lighting === null || !filters.lighting.includes(lighting))) return false;
  if (filters.crowd.length && (crowd === null || !filters.crowd.includes(crowd))) return false;
  if (filters.category && place.category !== filters.category) return false;
  if (filters.wheelchair && !place.accessibility.wheelchair) return false;
  if (filters.sensoryRoom && !place.accessibility.sensoryRoom) return false;
  return true;
}

// Straight-line distance between two points on Earth (haversine formula).
function distanceInMiles(a: LatLng, b: LatLng): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(h));
}
