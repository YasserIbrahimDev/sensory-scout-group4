# Sprint 1 Presentation Outline (5–10 minute target, confirm rubric)
Sensory Scout — Team 4 | Hamza Shakur — Project Management / Design & Architecture
This is a presentation **outline**, not a completed slide deck.

| Slide | Topic | Presenter proposal | Evidence/demo |
|---|---|---|---|
| 1 | Sensory Scout problem and intended users | Hamza | Purpose: sensory-friendly place discovery |
| 2 | Sprint objective, scope and actual status | Hamza | Verified progress and current blockers |
| 3 | Frontend UX: Home, Search, Details, Map | Naomi/Soma | Label as prototype while client uses mocks |
| 4 | System architecture | Hamza/Yasser | React -> API client -> FastAPI -> PostgreSQL diagram |
| 5 | Data model and implemented API | Yasser | Seven tables; GET details endpoint; separate planned list endpoint |
| 6 | API integration risks and decisions | Hamza | IDs, sensory categories, missing ratings, accessibility |
| 7 | Testing and quality | Robert | Test matrix; actual results only when executed |
| 8 | Demo and next steps | Team / Hamza close | Demonstrate working paths and identify mocks honestly |

## Suggested speaking notes for Hamza
**Opening (30–45 seconds):** Sensory Scout aims to help people with sensory sensitivities compare environments by noise, lighting and crowding. Sprint 1 focuses on the foundation for browsing venues and connecting a responsive interface to structured sensory data.

**Architecture (60–90 seconds):** Our planned stack is React and TypeScript in the browser, a FastAPI REST layer, and PostgreSQL through SQLAlchemy. We have a backend details endpoint and frontend prototype pages. The integration work is to replace mock API-client responses with typed live requests, resolve identifier and filter differences, and handle unknown sensory values without misleading users.

**Project status and next steps (45–60 seconds):** We have identified the critical dependencies: list/search/filter endpoints, an API adapter, and end-to-end tests. We use branch-based pull requests so teammates can review changes. We will mark features complete only when the integrated application and test evidence confirm them.

## Presentation guardrails
Do not claim listing/filter routes, live search, complete reviews, accessibility certification, test passes or completed PostgreSQL integration without checking current merged code and test evidence. Confirm actual speakers, slide count, time limit and professor rubric before submission.
