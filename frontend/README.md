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
- `VITE_API_URL`: the FastAPI backend address (used once the API is connected).

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

## Tests

```bash
npm test               # run all tests once
npm run test:watch     # re-run tests on every save
npm run test:coverage  # coverage report (fails below 70%)
```

Test names start with an ID like `TC-HOME-01`, `TC-SEARCH-01`, `TC-DETAILS-01`, or `TC-MAP-01` so they can be matched to the Test Case Tracker.
Tests use a stand-in for Mapbox (`src/test/mapboxMock.ts`) because the test environment can't draw maps.

## Folder structure

```
src/
  api/           client.ts: the only place that loads data
  components/
    layout/      AppLayout, Sidebar
    FilterPanel.tsx
    MapView.tsx
    PlaceCard.tsx
    PlaceTabs.tsx
    SearchBar.tsx
    SensoryBadge.tsx
    SensoryInfo.tsx
  data/          mock places (temporary, only used by api/client.ts)
  lib/           shared labels and icons, search filters, directions link
  pages/         one file per route
  styles/        global.css with design tokens
  test/          test setup and helpers
  types/         Place and sensory types
```

## Notes for the team

- Temperature and scents are optional fields in `src/types/place.ts` until we confirm the backend will store them.
- Lighting uses Dim / Normal / Bright everywhere, matching the filter wireframe.
- Places now have a `location` (latitude and longitude) for the map. Mock coordinates are approximate.
- Place images in `public/images/places/` are generated illustrations, not real photos. Swap them for real photos when the team has them.
- Sample reviews are in `src/data/mockReviews.ts`.
- Mapbox's free tier covers 50,000 map loads a month.
