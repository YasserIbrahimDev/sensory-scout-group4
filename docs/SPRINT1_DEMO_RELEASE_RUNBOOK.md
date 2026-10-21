# Sprint 1 Demo & Release Readiness Runbook
Owner: Hamza Shakur (Project Management / Design & Architecture)
Status: Checklist, not a claim of completion.

## Before demo
1. Confirm the intended demonstration commit SHA and branch with team.
2. Confirm PostgreSQL is running on the development machine; use the existing backend README for environment, migration and seed steps. Never commit .env secrets or delete production/development volumes to troubleshoot.
3. Start backend and verify `http://localhost:8000/docs` and `GET /api/v1/places/1`.
4. Confirm `GET /api/v1/places` exists before trying a live list/search demo. It is absent from main as of the October 20 review.
5. Start frontend (`cd frontend && npm ci && npm run dev`). Check whether `src/api/client.ts` still returns mocks; if so, **label demo as frontend prototype**, not full-stack integration.
6. Verify Mapbox token only if map provider approved; without it use the existing fallback and identify it accurately.
7. Collect actual test results from the precise demonstration commit and link to tracker IDs.

## Demo scenarios
- Browse: show Home -> Search and navigation.
- Search: enter a location or name; demonstrate no-result message.
- Filters: show noise, lighting and crowd filters; explain that category mapping must be approved before claiming backend filtering.
- Place details: open a result and show address, sensory information and directions.
- Accessibility: demonstrate keyboard navigation and loading/error states.
- Integration (only after completed): browser network tab shows `/api/v1/places` and `/api/v1/places/{id}` requests backed by PostgreSQL.

## Known limitations to disclose
- Main currently has only backend details endpoint, not list/search/filter.
- Frontend client currently uses mock data.
- Backend sample locations are fictional and may have null coordinates.
- Backend lacks full reviews, opening hours, overall star rating and sensory-room boolean.
- Reviews, save/share, login and personalized recommendations are not ready as live features.
- Mapbox provider approval and token availability may affect live map display.

## Final signoff
- [ ] Backend endpoints verified on merged branch
- [ ] Frontend live API verified on merged branch
- [ ] Data/filters/accessibility contract approved
- [ ] Unit/build/lint/integration tests executed and evidence saved
- [ ] Test tracker and design/requirements updated
- [ ] Demo recorded/rehearsed with correct feature labels
- [ ] Reflection includes actual accomplishments, AI usage and next-sprint focus
- [ ] Team reviews and merges PRs; no unreviewed direct pushes to main

## Presentation ownership proposal
Hamza: overview, architecture decisions, integration risks, sprint status, next steps. Naomi/Alina: UI walkthrough. Robert/Soma/Yasser: backend/search/database demo and testing. Confirm actual speakers with team; do not assign unilaterally.
