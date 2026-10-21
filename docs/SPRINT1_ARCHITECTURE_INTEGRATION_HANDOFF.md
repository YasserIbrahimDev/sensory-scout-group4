# Sprint 1 Architecture & Integration Handoff
**Sensory Scout — Team 4 | Hamza Shakur | October 20, 2026**

## Verified system and integration status
Frontend: React/TypeScript/Vite, Home, Search, Place Details and Map. Backend: FastAPI, PostgreSQL, SQLAlchemy, Alembic. `GET /api/v1/places/{place_id}` exists. Backend's `GET /api/v1/places` listing/search/filter endpoint is not present on main. Frontend `src/api/client.ts` still returns mock places/reviews, not live API responses. Existing contract: `backend/API_CONTRACT.md` (do not replace it).

## Architecture decisions needing team agreement
1. **Place IDs:** frontend uses string slugs; backend uses positive integer IDs. Use numeric IDs in API requests, with explicit adapter mapping.
2. **Sensory filtering:** frontend supports multi-select categorical noise/lighting/crowd values; proposed backend contract uses numeric min/max thresholds. These are NOT equivalent. Agree category bucket boundaries, whether OR applies within groups, and missing-rating behavior.
3. **Missing sensory ratings:** backend averages may be null. Display Unknown, not zero or Low.
4. **Accessibility:** backend returns counts of conflicting wheelchair-accessibility reports; frontend expects boolean. Do not treat reported accessibility as verified. Sensory-room filtering has no matching backend field.
5. **Overall stars/reviews:** backend details contain review count and sensory intensity averages, not overall star ratings or individual review text. Never present intensity as a quality rating or mock reviews as real data.
6. **Map:** backend coordinates can be null. No fabricated coordinates, markers, or opening hours.
7. **Sample venues:** backend records are fictional. Clearly label development data.

## Integration flow and acceptance tests
- Home -> listing endpoint once implemented; do not call first three records 'popular' without a ranking algorithm.
- Search -> listing endpoint with agreed query semantics; verify combined filters, empty results, loading, retries and pagination.
- Details -> `GET /api/v1/places/{numeric_id}`; handle 404, 422, network errors, nullable fields.
- Map -> list/map-ready endpoint; omit venues without coordinates, offer address-based directions when possible.
- Verify backend tests/lint, frontend build/tests, and live PostgreSQL integration. Record real results, not README claims.

## Owners / boundaries
- **Hamza — Design & Architecture:** compatibility matrix, interface decisions, API handoff review, design traceability.
- **Hamza — Project Management:** dependencies, blockers, review coordination, testing tracker and demo readiness.
- **Robert:** listing/QA; **Soma:** search/filter endpoint; **Yasser:** database and details endpoint; **Naomi/Alina:** frontend.
- Do not change their code without agreement. Create focused PRs; do not push to main.

## Sprint 1 release checklist (unverified until evidence exists)
- [ ] List route implemented and tested
- [ ] Sensory filter semantics agreed and implemented
- [ ] Frontend uses live API for demo path
- [ ] ID/nullable/accessibility/reviews/map differences resolved
- [ ] Frontend + FastAPI + PostgreSQL demonstrated end to end
- [ ] Test tracker updated with actual test IDs and results
- [ ] Requirements/design documents, reflection and presentation updated
- [ ] Outstanding PRs reviewed; team approval before merges

## Branch risk
`feature/sensory-scout-data-update` has unmerged frontend changes. `database_setup` diverges from main and should not be blindly merged over the revised database design.
