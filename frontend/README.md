# Sensory Scout Frontend

React + TypeScript + Vite web app for Sensory Scout (Team 4).

## Run it locally

```bash
cd frontend
npm ci
npm run dev
```

Open http://localhost:5173.

Copy `.env.example` to `.env.local` and fill in the values. Never commit `.env.local` or real keys.

- `VITE_MAPBOX_TOKEN`: a Mapbox public token (starts with `pk.`) from https://account.mapbox.com/access-tokens/. Without it, the Map page shows a simple drawn map (`SimpleMap.tsx`) instead of the detailed Mapbox map. Restart `npm run dev` after changing it.
- `VITE_API_URL`: the FastAPI backend address, including `/api/v1` (for example `http://localhost:8000/api/v1`).
- `VITE_USE_MOCK_DATA`: set to `true` to use the built-in mock places instead of the backend, for example when the backend isn't running. Leave it out or set `false` to use the API.

The backend only accepts requests from `http://localhost:5173` (its `CORS_ORIGINS` setting), so run the frontend on that port when using the API.

## What's done (Sprint 1)

**UI: App shell and routing**
- Sidebar with Home, Search, Map, Favorites, Profile, and Settings (`src/components/layout/`)
- On phones the sidebar becomes a top logo bar and a bottom tab bar
- Routes: `/`, `/search`, `/places/:placeId`, plus "coming soon" pages for Map, Favorites, Profile, and Settings
- Skip link, and focus moves to the page content on navigation
- Mock place data in `src/data/mockPlaces.ts`

**UI: Sensory badge and place card components**
- `src/components/SensoryBadge.tsx`: icon plus text label for noise, lighting, and crowd level
- `src/components/PlaceCard.tsx`: photo (or category placeholder), name, category, city, rating, and three sensory badges; the whole card links to the place's details page
- All sensory labels live in `src/lib/sensoryLabels.ts` so filters, cards, and details stay consistent

**UI: Home page (R7)**
- Search bar (`src/components/SearchBar.tsx`) with a labelled field; an empty search shows a message explaining what to enter
- Searching opens `/search?q=...` (the Search page itself is built in Card 2)
- "Popular near you" shows three places with a "See all" link to the Search page
- Loading message, an error message with a Try again button, and a message when there are no places
- All data loads through `src/api/client.ts`; pages never import mock data directly

**UI: Search page with filters and Place Details (R7, R8)**
- Search page (`src/pages/SearchPage.tsx`) with the search bar, filter panel, and results
- Filter panel (`src/components/FilterPanel.tsx`): Noise Level, Lighting, and Crowd Level buttons, Place Type dropdown, accessibility checkboxes, Clear all, and Show Results (count)
- Filters apply right away and are saved in the page address (for example `/search?noise=low&crowd=low`), so they stay applied after going back from Place Details
- Within a group, any selected level matches (Low or Moderate noise); every group must match
- Place Details: header with name, category, city, and rating; Sensory Information tiles (`SensoryInfo.tsx`) before everything else; Overview, Reviews, Photos, and Nearby tabs (`PlaceTabs.tsx`)
- Reviews tab: average rating and the most recent reviews; "Write a review" is marked "coming soon" until sign-in exists
- Photos tab: the place's photos with descriptions for screen readers
- Nearby tab: the 3 closest places with distance and sensory conditions
- Save and Share are marked "coming soon"

**UI: Map page (R9)**
- Map page (`src/pages/MapPage.tsx`) uses Mapbox (`src/components/MapView.tsx`) with a pin for each place; pins are buttons you can reach with Tab
- Without a Mapbox token, or if Mapbox can't load, a simple drawn map (`src/components/SimpleMap.tsx`) shows the pins by location; selecting a pin opens a card with the place's sensory info and a details link (Escape closes it)
- A list of the same places sits beside the map for screen reader and keyboard users
- The Mapbox library only downloads when a token is set, so it never slows down the other pages
- Get Directions on Place Details opens directions in Google Maps (no key needed; `src/lib/directions.ts`)

**UI: Connect Sprint 1 pages to the API**
- Home, Search, Place Details, and Map now load places from the FastAPI backend through `src/api/client.ts`, using Hamza's HTTP client (`src/api/backendClient.ts`). `src/api/placeAdapter.ts` turns API results into the shape the pages use.
- Home, Search, and Map need the place listing endpoint (`GET /places`), which is on Robert's `robert/sprint1-place-list` branch and not merged into `main` yet. Until it is, those pages show their error message unless `VITE_USE_MOCK_DATA=true`. Place Details works with `main`'s backend.
- Search filters and text search run in the browser until the backend's search and filter endpoint (Soma) is ready. A place with no reported level never matches a selected level.
- Anything the API doesn't send is shown as unknown, never guessed: sensory levels say "Not reported yet", places with no star ratings show only their review count, and the Reviews tab explains that written reviews can't be shown yet
- Places without coordinates are left off the map, and the Map page says how many. Get Directions uses the address instead.
- The backend's sample places have no coordinates, so the Map is empty with the current sample data.
- Place ids from the API are numbers (`/places/1`). Old mock links like `/places/harmony-coffee` show "Place not found" when using the API.

## What's done (Sprint 2)

All three pages use mock data through `src/api/client.ts`, like Sprint 1. The backend does not have sign-in, profile, or saved-place endpoints yet (see `backend/API_CONTRACT.md`), so "Connect Sprint 2 pages to the API" is waiting on those.

To try the signed-in pages, sign in on Profile with `demo@sensoryscout.test` / `scout1234`, or create an account. Mock accounts are kept in memory, so a page reload signs you out.

**UI: Favorites page (R13)**
- `src/pages/FavoritesPage.tsx`: saved places as place cards, most recently saved first, each with a Remove button
- Save on Place Details now works: it shows as pressed when the place is saved, and says "Saved to your Favorites" or "Removed from your Favorites"
- A failed save or remove shows an error, never a success message
- Signed-out users see a sign-in prompt instead

**UI: Profile page with Sign In and Sensory Preferences (R1, R2)**
- Sign-in and create-account forms (`src/pages/ProfilePage.tsx`) with a message under each field that has a problem; focus moves to the first one (rules in `src/lib/accountValidation.ts`)
- Account-only actions (like Save) show a sign-in prompt (`src/components/SignInPrompt.tsx`); after signing in, the user goes back to the page they came from
- Noise, lighting, and crowd preferences, each with a "No preference" option, using the same labels as the filters
- Saving shows a success message, or an error if it fails
- Who is signed in is shared across pages through `src/lib/auth.tsx`

**UI: Settings page**
- Location access on/off switch (`src/pages/SettingsPage.tsx`). Turning it on asks the browser for permission; if the browser blocks it, the switch stays off and explains how to change it
- The page explains that search by name or address still works with location off
- Other settings still need to be agreed with the team; no requirement or wireframe covers them yet

## Tests

```bash
npm test               # run all tests once
npm run test:watch     # re-run tests on every save
npm run test:coverage  # coverage report (fails below 70%)
```

Tests use mock places by default (`src/test/setup.ts`). API tests use a fake backend shaped like `backend/API_CONTRACT.md` (`src/test/fakeApi.ts`).

Test names start with an ID like `TC-HOME-01`, `TC-SEARCH-01`, `TC-DETAILS-01`, `TC-MAP-01`, `TC-API-01`, `TC-FAV-01`, `TC-PROFILE-01`, or `TC-SETTINGS-01` so they can be matched to the Test Case Tracker.
Tests use a stand-in for Mapbox (`src/test/mapboxMock.ts`) because the test environment can't draw maps.

## Folder structure

```
src/
  api/           client.ts: the only place pages load data from; placeAdapter.ts; Hamza's backendClient.ts
  components/
    layout/      AppLayout, Sidebar
    FilterPanel.tsx
    MapView.tsx
    PlaceCard.tsx
    PlaceTabs.tsx
    SearchBar.tsx
    SensoryBadge.tsx
    SensoryInfo.tsx
  data/          mock places and accounts (temporary, only used by api/client.ts)
  lib/           shared labels and icons, search filters, directions link, sign-in state
  pages/         one file per route
  styles/        global.css with design tokens
  test/          test setup and helpers
  types/         Place, sensory, and user types
```

## Notes for the team

- Temperature and scents are optional fields in `src/types/place.ts` until we confirm the backend will store them.
- Lighting uses Dim / Normal / Bright everywhere, matching the filter wireframe.
- Places now have a `location` (latitude and longitude) for the map. Mock coordinates are approximate.
- Place images in `public/images/places/` are generated illustrations, not real photos. Swap them for real photos when the team has them.
- Sample reviews are in `src/data/mockReviews.ts`.
- Mapbox's free tier covers 50,000 map loads a month.
