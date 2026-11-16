# Card 2 â€” Frontend demo API integration

## What changed
- Adds `src/api/demoApi.ts` for the development-only preferences and recommendations endpoints.
- `VITE_DEMO_MODE=true` makes the app load the server-configured demo identity, preferences, and recommendations. It does not add login, registration, tokens, or client-supplied user IDs.
- Profile preferences use descriptive five-level choices and send numeric values 1â€“5 to the backend. `No preference` is sent as `null`.
- Recommendation cards continue using the existing `PlaceCard` component; backend venue details are adapted to the existing frontend place model and the backend's reason is displayed.
- With demo mode off, the existing mock account and recommendation behavior remains in place.

## Local setup
In `frontend/.env.local`, keep your existing API URL and add:

```ini
VITE_DEMO_MODE=true
VITE_USE_MOCK_DATA=false
```

In `backend/.env`, retain the local database settings and set `DEMO_MODE_ENABLED=true` plus the configured demo name/email values documented in `backend/DEMO_API.md`.

Start the backend and frontend. Restart Vite after changing `.env.local`:

```powershell
npm run dev
```

## Verification
From `frontend/`:

```powershell
npm run typecheck
npm test
npm run build
```

Then verify in the browser:
1. Open Profile. The configured development demo identity should appear; no sign-in or registration is involved.
2. Select different descriptive levels and save. The request body should contain integer values 1â€“5 or `null`.
3. Reload Profile and confirm the choices persist.
4. Open Home and confirm recommendations and the backend-provided explanation appear.
5. Stop the backend and confirm the UI shows a clear connection error and retry control.

`VITE_DEMO_MODE` is for local development only. Do not enable this mode in production.

