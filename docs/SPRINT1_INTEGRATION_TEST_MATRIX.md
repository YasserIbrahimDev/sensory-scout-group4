# Sprint 1 Integration Test Matrix — Sensory Scout
Owner: Hamza Shakur (Design & Architecture / Project Management)
Status: Planned; **no test in this matrix is claimed as executed**.

| ID | Requirement / boundary | Scenario | Expected result | Status |
|---|---|---|---|---|
| INT-01 | Browse/search | List seeded venues through GET /api/v1/places | PaginatedVenues response, unique IDs, stable ordering | BLOCKED: list route missing on main |
| INT-02 | Search | Search by name or location | Only matching venues returned, count reflects matches | BLOCKED: search route missing |
| INT-03 | Sensory filters | Choose low noise + low crowd | Backend and UI apply team-approved threshold/OR rules | BLOCKED: semantics approval and route |
| INT-04 | Sensory filters | Multi-select low and moderate noise | Results match OR within noise group if agreed | BLOCKED: contract decision |
| INT-05 | Sensory filters | Filter on attribute with null mean | Unknown values excluded from active filter; not mislabeled low | BLOCKED: list/filter route |
| INT-06 | Details | Open venue card with backend integer ID | Correct details fetched, no slug/integer mismatch | BLOCKED: frontend adapter |
| INT-07 | Details | Unknown positive ID | 404 and user-friendly not-found UI | NOT RUN end-to-end |
| INT-08 | Details | Invalid ID | 422 and user-friendly validation/error UI | NOT RUN end-to-end |
| INT-09 | Details | Venue with no ratings | Unknown sensory values displayed, no fabricated star rating | BLOCKED: frontend adapter |
| INT-10 | Accessibility | Conflicting wheelchair reports | UI shows reported/unknown status, not verified boolean | BLOCKED: contract/UI |
| INT-11 | Map | Venue with null coordinates | No fabricated pin; graceful fallback | BLOCKED: frontend adapter |
| INT-12 | Network | API unavailable or times out | Retry or clear error, no crash | NOT RUN end-to-end |
| INT-13 | Frontend | Build and automated tests | `npm run build` and `npm test` pass on tested commit | NOT RUN in this review |
| INT-14 | Backend | Unit/lint | `pytest -m "not integration"` and `ruff check .` pass | NOT RUN in this review |
| INT-15 | PostgreSQL | Migrated seeded development DB | Integration tests pass against PostgreSQL, no data loss | NOT RUN |
| INT-16 | End to end | Search -> filter -> details -> directions | Browser uses live FastAPI/PostgreSQL, consistent data | BLOCKED: integration |
| INT-17 | Accessibility | Keyboard-only flow and screen-reader labels | Search, filters, cards, map fallback and errors operable | NOT RUN on integrated build |

## Evidence recording template
For each executed test record: date/time, tester, Git commit SHA, environment, commands/steps, expected result, actual result, pass/fail, defect link, screenshot/log link. Copy only confirmed results into the professor's official Test Case Tracker. Existing frontend PR #1 reports 96 tests and backend PR #2 reports 37 tests, but those are **historical PR reports**, not new full-stack test execution.

## Decision dependencies
- Robert: list route and pagination.
- Soma: search/filter behavior and numeric scale conversion.
- Naomi/Alina: frontend API adapter, error/empty/unknown states.
- Yasser: database, details, schema and API contract.
- Hamza: traceability, contract review, readiness reporting; Robert/QA validates tracker evidence.
