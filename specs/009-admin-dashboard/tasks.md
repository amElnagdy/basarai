---
description: "Task list for Admin Monitoring Dashboard implementation"
---

# Tasks: Admin Monitoring Dashboard

**Input**: Design documents from `/specs/009-admin-dashboard/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/admin-api.md, quickstart.md

**Tests**: Light backend tests are included (gate behavior + stats mapping + pagination math) because plan.md calls them out as pure-logic checks. No frontend tests; UI is verified via quickstart.md.

**Organization**: Tasks are grouped by user story. The operator gate is established once in Foundational so no story ever ships ungated; US3 completes the access story (frontend hiding, `/me` flag, defense-in-depth).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 / US2 / US3 (maps to spec.md user stories)
- Exact file paths are included in every task

## Path Conventions

Web app: backend at `backend/`, frontend at `frontend/`, migrations at `supabase/migrations/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the workspace; this feature adds no new runtime dependencies.

- [ ] T001 Confirm branch `009-admin-dashboard` is checked out, the remote Supabase project is linked (`supabase link`) for `db push`, and verify no new packages are required (`backend/requirements.txt` and `frontend/package.json` unchanged).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Aggregation views + the gated, read-only admin router that both US1 and US2 attach to.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 Create migration `supabase/migrations/00014_admin_views.sql` defining read-only views `admin_stats` (single-row aggregate per data-model.md) and `admin_brand_overview` (one row per brand: `id`, `name`, `owner_user_id`, `owner_full_name` via LEFT JOIN `profiles`, `kit_status` via `COALESCE`, `generation_count`, `has_active_key` via `EXISTS`, `created_at`); add `REVOKE ALL ON admin_stats, admin_brand_overview FROM anon, authenticated;` and `GRANT SELECT ON admin_stats, admin_brand_overview TO service_role;`. Do NOT select any provider key value/hint/vault reference.
- [ ] T003 Apply the migration to remote Supabase (`supabase db push`) and verify both views exist and return rows when queried with the service-role key.
- [ ] T004 [P] Extract `is_admin_email(email: str) -> bool` helper in `backend/app/core/auth.py` (parses `settings.ADMIN_EMAILS`; empty/unset ⇒ no operators) and refactor `get_current_admin_user` to use it with unchanged behavior.
- [ ] T005 Create gated admin router in `backend/app/routers/admin.py` as `APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin_user)])` (no endpoints yet) and register it with `app.include_router(admin.router)` in `backend/app/main.py`.

**Checkpoint**: Migration applied; `/admin/*` is mounted and operator-gated by construction. User stories can begin.

---

## Phase 3: User Story 1 - Monitor System Usage at a Glance (Priority: P1) 🎯 MVP

**Goal**: An operator opens the Admin area and sees system-wide totals plus status/provider breakdowns, recent activity, completed-kit and active-key counts — all on one screen.

**Independent Test**: With seeded multi-account data, sign in as an operator, open the Admin page, and confirm every figure matches the data and the status/provider breakdowns each sum to the generation total.

### Implementation for User Story 1

- [ ] T006 [P] [US1] Add stats response models to `backend/app/models/admin.py`: `GenerationStatusBreakdown` (pending/processing/succeeded/failed), `GenerationProviderBreakdown` (openai/gemini), and `AdminStatsResponse` (totals + nested breakdowns + `generations_last_7d`/`generations_last_30d` + `brand_kits_complete` + `active_provider_keys`).
- [ ] T007 [US1] Implement `GET /admin/stats` in `backend/app/routers/admin.py`: read the single row from the `admin_stats` view via `get_service_client()` and map the flat columns into the nested `AdminStatsResponse`. (depends on T005, T006)
- [ ] T008 [P] [US1] Add `backend/tests/test_admin_models.py` with a test that builds `AdminStatsResponse` from a representative flat `admin_stats` row and asserts the flat→nested mapping plus the breakdown-sum invariants (status sum == total, provider sum == total).
- [ ] T009 [P] [US1] Add `AdminStats` and breakdown types to `frontend/types/index.ts` mirroring `AdminStatsResponse`.
- [ ] T010 [P] [US1] Create `frontend/components/admin/admin-stats-cards.tsx` rendering totals, the status breakdown, the provider breakdown, 7/30-day activity, and completed-kit + active-key counts (functional layout only; visual polish is out of scope).
- [ ] T011 [US1] Create `frontend/app/(dashboard)/admin/page.tsx` that fetches `GET /admin/stats` via `apiRequest` (`frontend/lib/api.ts`) and renders `admin-stats-cards`. (depends on T009, T010)

**Checkpoint**: Operator can view accurate system stats. MVP is demoable (page is already protected by the foundational gate — non-operators get 403 from the API).

---

## Phase 4: User Story 2 - Browse All Brands Across Accounts (Priority: P2)

**Goal**: An operator browses a paginated list of every brand across all accounts, with owner, kit status, generation count, active-key indicator, and created date.

**Independent Test**: Seed >1 page of brands across ≥2 accounts; open the all-brands list; confirm every brand appears exactly once across pages with correct per-brand context, newest first.

### Implementation for User Story 2

- [ ] T012 [P] [US2] Add `AdminBrandListItem` (id, name, owner_user_id, owner_full_name|null, kit_status, generation_count, has_active_key, created_at) and `AdminBrandsPage` (items, page, per_page, total) models to `backend/app/models/admin.py`.
- [ ] T013 [US2] Implement `GET /admin/brands` in `backend/app/routers/admin.py`: validate `page` (≥1, default 1) and `per_page` (1–100, default 24) returning `VALIDATION_ERROR` on out-of-range; query `admin_brand_overview` via `get_service_client()` with `.select("*", count="exact").order("created_at", desc=True).order("id", desc=True).range(start, end)`; return `AdminBrandsPage` with `total` from the count. (depends on T005, T012)
- [ ] T014 [P] [US2] Extend `backend/tests/test_admin_models.py` with a test for `AdminBrandsPage` shape and offset/total math, plus the `per_page`/`page` bounds validation.
- [ ] T015 [US2] Add `AdminBrandListItem` and `AdminBrandsPage` types to `frontend/types/index.ts`. (shared file with T009 — serialize if stories run in parallel)
- [ ] T016 [P] [US2] Create `frontend/hooks/use-admin-brands.ts` — client hook that pages through `GET /admin/brands?page=&per_page=` via `apiRequest`, exposing items, page, total, and page controls.
- [ ] T017 [P] [US2] Create `frontend/components/admin/admin-brands-table.tsx` — a table showing owner (full name or `owner_user_id`), kit status, generation count, active-key indicator, and created date; newest-first; with page navigation and total count.
- [ ] T018 [US2] Extend `frontend/app/(dashboard)/admin/page.tsx` to render `admin-brands-table` (driven by `use-admin-brands`) below the stats cards. (depends on T011, T016, T017)

**Checkpoint**: Operator can browse all brands with correct counts and working pagination, alongside the stats from US1.

---

## Phase 5: User Story 3 - Operator-Only Access (Priority: P3)

**Goal**: Only operators reach the Admin area; the entry point is hidden from everyone else, `/me` exposes `is_admin`, and the views are unreachable outside the gated backend.

**Independent Test**: As a non-operator, confirm no Admin nav entry and that visiting `/admin` is refused and `/admin/*` returns 403; as an operator, confirm access; with an empty allow-list, confirm everyone is denied.

### Implementation for User Story 3

- [ ] T019 [P] [US3] Add `is_admin: bool = False` to `ProfileResponse` in `backend/app/models/profile.py`.
- [ ] T020 [US3] Populate `is_admin=is_admin_email(current_user.email)` in both the GET and PATCH `/me` responses in `backend/app/routers/me.py`. (depends on T004, T019)
- [ ] T021 [P] [US3] Add `backend/tests/test_admin_access.py` asserting: `is_admin_email` is true for an allow-listed email, false otherwise and false when `ADMIN_EMAILS` is empty/unset; and that `get_current_admin_user` raises 403 (`FORBIDDEN`) for a non-operator.
- [ ] T022 [US3] Add `is_admin: boolean` to the profile type in `frontend/types/index.ts`. (shared file with T009/T015 — serialize if stories run in parallel)
- [ ] T023 [US3] Create `frontend/app/(dashboard)/admin/layout.tsx` that resolves the current profile's `is_admin` (via `/me`) and calls `notFound()` when it is false, so non-operators cannot render any Admin view. (depends on T020, T022)
- [ ] T024 [US3] Add a conditional Admin `<Link href="/admin">` to the dashboard nav in `frontend/app/(dashboard)/layout.tsx`, shown only when `is_admin` is true; source `is_admin` from `/me` (add a small client `frontend/hooks/use-profile.ts` if no client profile source exists). (depends on T020, T022)

**Checkpoint**: Access control is complete and observable — gate, hidden entry point, `is_admin` flag, and empty-allow-list behavior all hold.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Roadmap alignment and final verification. (Visual polish — loading/empty/error styling — is explicitly NOT here; it moves to the UI/UX revamp.)

- [ ] T025 [P] Update `docs/implementation-plan.md` Phase 8: narrow it to admin (8.1 admin brands, 8.2 admin stats, 8.4 admin UI, 8.8 verification), note 8.3 gate already exists, and move 8.5–8.7 (error/loading/empty-state polish) into the UI/UX revamp.
- [ ] T026 [P] Run `cd backend && ruff check . && pytest` and the frontend type/lint check; fix any issues introduced by this feature.
- [ ] T027 Execute `specs/009-admin-dashboard/quickstart.md` end-to-end, including the adapted Definition of Done (no-kit/complete-kit reflection, both providers in stats, non-operator + empty-allow-list 403, views not selectable by `anon`/`authenticated`, and key-secrecy: only `has_active_key` exposed).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. T002 → T003 (apply after create). T004 and T005 are independent of each other and of T002/T003. BLOCKS all user stories (US1/US2 need the views + router; the gate is established here).
- **User Stories (Phase 3–5)**: All depend on Foundational. US1 is the MVP. US2 is independent of US1 except both extend the shared admin page (`admin/page.tsx`) and router (`admin.py`) — US2's page task assumes US1 created the page. US3 depends only on the foundational helper/gate.
- **Polish (Phase 6)**: After the desired stories are complete.

### User Story Dependencies

- **US1 (P1)**: After Foundational. Self-contained (stats endpoint + cards + page).
- **US2 (P2)**: After Foundational. Reuses the admin router and admin page created in US1; otherwise independent.
- **US3 (P3)**: After Foundational (uses `is_admin_email` from T004). Independent of US1/US2 data work.

### Within Each Story

- Models before the endpoint that returns them; hook/component before the page that composes them.
- Shared files create soft ordering: `backend/app/models/admin.py` (T006→T012), `backend/app/routers/admin.py` (T007→T013), `backend/tests/test_admin_models.py` (T008→T014), `frontend/types/index.ts` (T009→T015→T022), `frontend/app/(dashboard)/admin/page.tsx` (T011→T018).

### Parallel Opportunities

- Foundational: T004 ‖ T005 (after T002/T003 are underway; both independent files).
- US1: T006 ‖ T008 ‖ T009 ‖ T010 (then T007 after T006; T011 after T009+T010).
- US2: T012 ‖ T014 ‖ T016 ‖ T017 (then T013 after T012; T018 after T016+T017).
- US3: T019 ‖ T021 (then T020; then T023 ‖ T024).
- Polish: T025 ‖ T026.

---

## Parallel Example: User Story 1

```bash
# After Foundational, launch US1's independent tasks together:
Task: "T006 Add stats response models in backend/app/models/admin.py"
Task: "T008 Add stats-mapping test in backend/tests/test_admin_models.py"
Task: "T009 Add AdminStats types in frontend/types/index.ts"
Task: "T010 Create admin-stats-cards.tsx in frontend/components/admin/"
# Then: T007 (endpoint) after T006; T011 (page) after T009 + T010.
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational (migration + gated router) → 3. Phase 3 US1 → **STOP and validate** the stats dashboard against seeded data → demo.

### Incremental Delivery

Foundation → US1 (stats, MVP) → US2 (all-brands list) → US3 (access hardening + nav) → Polish (roadmap doc + quickstart DoD). Each story is a shippable increment; the gate is in place from Foundational so nothing ships open.

### Delegation note

Per the project workflow, these tasks are sized for hand-off to codex-delegate (one task or a small batch at a time), with review of each diff before commit. Foundational (T002–T005) should land and be verified first since every story builds on it.

---

## Notes

- `[P]` = different files, no dependency on an incomplete task. Tasks touching shared files (`admin.py`, `models/admin.py`, `types/index.ts`, `admin/page.tsx`, `test_admin_models.py`) are intentionally not marked `[P]` against each other.
- Read-only is structural: the admin router exposes only `GET`s and the views are revoked from non-service roles — there is no admin write/delete task by design (FR-017).
- Key secrecy: the brand overview exposes only `has_active_key`; never add key value/hint/vault columns to the view or models.
- Commit after each task or logical group; run `ruff`/`pytest` before pushing.
