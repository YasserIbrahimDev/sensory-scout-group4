# Sensory Scout backend starter

FastAPI + PostgreSQL aligned with the revised team diagram. Backend only, with all files in one project folder.
Use `schema.dbml` in dbdiagram.io to view/edit the matching seven-table diagram.

## Schema

- users: id, name, email, password_hash, created/updated timestamps.
- sensory_profiles: own id, unique user_id, pref_noise, pref_light, pref_crowd.
- venues: id, slug, name, address, city, category, description, latitude, longitude,
  external_map_provider, external_map_id, image_url, is_sample, timestamps.
- reviews: id, user_id, venue_id, comment, wheelchair_accessible, timestamps.
- ratings: id, unique review_id, noise_rating, light_rating, crowd_rating, timestamps.
- review_votes: id, review_id, user_id, is_upvote, timestamps; one vote per user/review.
- saved_places: id, venue_id, user_id, saved_at; one saved entry per user/venue.

All IDs are integers. One sensory profile per user and at most one ratings row per
review. All foreign keys have cascade deletion. Scores/preferences are 1–5;
1 means quiet/dim/sparse, 5 means loud/bright/crowded. Null means unknown or no
preference. These are proposed scales to confirm with the team/stakeholder.
A ratings row requires at least one assessment. Missing scores are excluded from
averages. The venue table does not duplicate the three ratings fields.

Wheelchair accessibility is a reviewer report. The details response counts yes/no/
unknown reports rather than converting conflicting reports into a definitive fact.
External map ID is a provider identifier, not an IP address or secret API key.
Provider and ID are either both set or both null. Latitude/longitude must be paired.
Image URL is optional. Maps/image fields remain null in fictional sample venues.
PostGIS geography is unnecessary for this starter; use ordinary coordinate columns.

## Fresh database required for this revised baseline

This replaces the earlier places-only baseline with the seven-table design.
It is NOT an upgrade migration for an already initialized older starter database.
If you already applied the old 0001 migration, keep that database and migration
history intact; use a fresh database for this starter, or prepare a separate upgrade.
The updated Compose file uses a new volume (`scout_diagram_data`) and database
(`sensory_scout_diagram`) so the earlier volume is not erased. Stop any old container
holding port 5432 first. Do not run `docker compose down -v` to solve an upgrade.

## Run locally in Windows PowerShell

Requires Python 3.12 and Docker Desktop, or an existing fresh PostgreSQL database.
Copy these files into the existing team repository on a feature branch. Merge
existing files, including README and .gitignore; do not overwrite teammates' work.
Commit the source files, not the ZIP or real .env files.

From the project folder, create your local environment file (edit an existing one instead):

```powershell
Copy-Item .env.example .env
docker compose up -d db
docker compose ps
```

Wait until the database is healthy, then:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m app.seed
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API documentation: http://localhost:8000/docs
Sample details on a fresh seeded database: http://localhost:8000/api/v1/places/1
On macOS/Linux, use `python3.12 -m venv .venv` and `.venv/bin/python`.
Match credentials/ports in the .env file. Example credentials are
local development placeholders. No auth, profile, review, vote or save routes yet.

## Samples and API handoff

`data/sample_data.json` contains 3 disabled sample users, 3 profiles,
10 fictional venues, 10 reviews, 10 ratings, 2 votes and 3 saved places.
It links fixtures using sample emails/slugs/review keys; seeding resolves real IDs
and foreign keys. Re-running it preserves rows and edits. Sample accounts cannot
log in; `!disabled-sample-account` is a disabled marker, not a password hash.
Real authentication must hash passwords and reject disabled markers when added.

Yasser owns setup/schema/seeds and GET /api/v1/places/{place_id}. The route now
accepts a positive integer ID instead of a UUID. Its response includes venue fields,
review_count, sensory_summary (averages and counts), and accessibility_summary.
It does not expose users or password hashes. A venue without ratings has null means.

Robert adds paginated GET /api/v1/places. Soma extends the SAME route with search
and filters. Use `PaginatedVenues` in app/schemas.py. Sensory filters must query
ratings through reviews and aggregate by venue; no noise_level columns remain.
Agree query names/rating thresholds with the frontend before implementing.
Use stable ordering, count matching venues before pagination, and avoid duplicated
venues when joining multiple reviews. `build_venue_detail` is a reusable single-venue
helper; batch the aggregation for list results to avoid queries per item.

## Verification

```powershell
.\.venv\Scripts\python.exe -m pytest -m "not integration"
.\.venv\Scripts\python.exe -m ruff check .
```

37 unit tests passed, including schema consistency, ranges, uniqueness, foreign
keys/cascades, repeatable seeding, rating averages, missing data, and endpoint errors.
The migration also generates PostgreSQL SQL. Unit tests use isolated SQLite databases.
Live PostgreSQL checks still need execution locally; they were not run in this environment:

```powershell
$env:RUN_POSTGRES_TESTS = "1"
.\.venv\Scripts\python.exe -m pytest -m integration
Remove-Item Env:RUN_POSTGRES_TESTS
```

Run these only on a migrated/seeded development database. CI remains Robert's task.
