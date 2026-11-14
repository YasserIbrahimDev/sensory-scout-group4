# Development demo API

These endpoints provide one local development identity for exercising persisted
sensory preferences and personalized recommendations. They are not authentication
and must not be enabled in production.

## Enable locally

Add the following lines to `backend/.env` (do not commit `.env`):

```ini
DEMO_MODE_ENABLED=true
DEMO_USER_EMAIL=sensory-scout-demo@example.invalid
DEMO_USER_NAME=Sensory Scout Development Demo
```

The demo user is resolved from server configuration. The API does not accept a
user ID from the client. Its `password_hash` column contains the existing project's
disabled-account marker `!disabled-demo-account`; no password or login is created.
If the configured email already belongs to a non-demo account, the API returns
409 rather than using that account.

Keep `DEMO_MODE_ENABLED=false` everywhere except a local development environment.
The demo routes return 404 when the setting is disabled.

## Endpoints

Base URL: `http://localhost:8000/api/v1`

### GET `/demo/preferences`

Returns the configured demo user's saved preferences. An unset preference is null.

### PUT `/demo/preferences`

Accepts JSON. Each property may be an integer from 1 to 5 or null. Omitted
properties default to null, so send all three properties when saving the full
profile.

```json
{"noise": 1, "lighting": 2, "crowd": 1}
```

### GET `/demo/recommendations?limit=3`

Returns up to 100 ranked venue details with `score` and `reason`. If the demo user
has no saved profile or no preferences, the result is an empty `items` array.

The API reuses the existing preference persistence and recommendation services.
No client-supplied identity is trusted, and no real authentication is implemented.
