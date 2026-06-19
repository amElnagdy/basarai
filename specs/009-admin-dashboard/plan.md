# Implementation Plan: Admin Monitoring Dashboard

**Branch**: `009-admin-dashboard` | **Date**: 2026-06-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-admin-dashboard/spec.md`

---

## Summary

Deliver the admin-only half of the (re-scoped) Phase 8: a **read-only** operator dashboard. The original Phase 8 "Admin + Polish" is split — the polish work (loading/empty/error states, tasks 8.5–8.7) moves to the separate UI/UX revamp, leaving this feature to cover admin (tasks 8.1, 8.2, 8.4, and the 8.8 verification).

The operator allow-list gate already exists (`get_current_admin_user` + `ADMIN_EMAILS`). This plan adds: (1) one migration with two read-only aggregate views (`admin_stats`, `admin_brand_overview`) secured to the service role; (2) a gated, GET-only `/admin` router exposing `GET /admin/stats` and `GET /admin/brands` (offset paginated, 24/page); (3) an additive `is_admin` field on `/me` (via a shared `is_admin_email()` helper) so the frontend can gate the Admin entry point; and (4) a gated Admin page rendering stat cards + a paginated all-brands table.

No new tables, no schema changes to existing tables, no writes/deletes, no cost/token tracking, no provider calls, and no `auth.users`/PII reads. The brand overview surfaces only a `has_active_key` boolean — never key material.

---

## Technical Context

**Language/Version**: Python 3.13 (backend), TypeScript 5.x / Next.js 14 App Router (frontend)
**Primary Dependencies**: FastAPI 0.109+, Pydantic 2.x, `supabase-py` (service client over PostgREST, incl. views); Next.js 14, `@supabase/ssr`, shadcn/ui conventions, Tailwind CSS, lucide-react
**Storage**: Existing Supabase PostgreSQL. Adds two **read-only views** (`admin_stats`, `admin_brand_overview`) over existing `profiles`, `brands`, `brand_kits`, `provider_keys`, `generations`. No table/column changes.
**Testing**: Backend `pytest` for model shape + stats flat→nested mapping and pagination math (pure logic); manual end-to-end verification via `quickstart.md` for gating, view security, aggregate accuracy, and pagination.
**Target Platform**: Bunny Magic Container (Linux, single image, HTTP-only behind platform HTTPS)
**Project Type**: web-service (FastAPI) + web-app (Next.js 14 App Router)
**Performance Goals**: SC-005 — dashboard presents current figures in under ~3 seconds for expected MVP volume; `/admin/stats` is a single-row view read, `/admin/brands` is one paginated view read per page.
**Constraints**: Operator gate enforced server-side (router-level dependency); read-only (GET-only handlers); views revoked from `anon`/`authenticated` and granted to `service_role` only; owner identity limited to `owner_user_id` + `profiles.full_name` (no email/`auth.users`); provider keys exposed only as a boolean; aggregates span all accounts.
**Scale/Scope**: MVP operator monitoring; low-to-moderate brand/generation volume. Two backend endpoints + one additive field, one migration, one gated frontend page.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Evidence |
|-----------|-------|----------|
| I. Product Truth — Brand tenancy | PASS | Cross-brand reads are by the explicitly sanctioned **operator** role (implementation-plan Roles: "Admin — operator-only, email allowlist"); read-only observation, no resource ownership change, no brand sharing |
| I. Product Truth — Image generation only | PASS | Adds no new product capability; only surfaces counts over existing data |
| II. Brand Isolation | PASS | Operator monitoring is gated by `get_current_admin_user`; regular tenants still cannot see other tenants' data (views revoked from `anon`/`authenticated`) |
| II. Hard Delete | N/A | Feature performs no deletes |
| II. Key Secrecy | PASS | `admin_brand_overview` exposes only `has_active_key` boolean; no key value, hint, or vault reference is read or returned; nothing key-related logged |
| II. Official Endpoints Only | N/A | No provider calls |
| II. PNG Output Only | N/A | No image generation/output |
| III. Tech Constraints | PASS | Existing FastAPI + Next.js 14 + Supabase + Bunny Magic stack only |
| IV. Data Rules | PASS | Read-only over existing fields; provider keys referenced by presence only, never raw values |
| V. UX Rules | PASS | No conflict; generation/history UX rules untouched |
| VI. RLS / server-side verification | PASS | Operator check is server-side; new views are not granted to `anon`/`authenticated` (defense-in-depth) so they cannot weaken RLS or be reached outside the gated backend |
| VI. Logs safe metadata only | PASS | Admin endpoints log request id + safe counts; no PII (owner email deliberately not surfaced) or keys |
| VII. Definition of Done | PASS (adapted) | Quickstart covers no-kit/complete-kit reflection, both providers in stats, access-control + view-security checks; hard-delete is N/A (read-only) and documented as such |

**No violations. No complexity exceptions required.** The cross-brand read is the defined operator role from the roadmap, not a breach of brand isolation.

---

## Project Structure

### Documentation (this feature)

```text
specs/009-admin-dashboard/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── admin-api.md
├── checklists/
│   └── requirements.md
└── tasks.md            # created by /speckit.tasks (not this command)
```

### Source Code

```text
supabase/
└── migrations/
    └── 00014_admin_views.sql              # NEW: admin_stats + admin_brand_overview views,
                                           #      REVOKE from anon/authenticated, GRANT service_role

backend/
├── app/
│   ├── core/
│   │   └── auth.py                        # MODIFY: extract is_admin_email() helper;
│   │                                      #         get_current_admin_user reuses it
│   ├── models/
│   │   ├── admin.py                       # NEW: AdminStatsResponse + breakdowns,
│   │   │                                  #      AdminBrandListItem, AdminBrandsPage
│   │   └── profile.py                     # MODIFY: add is_admin: bool to ProfileResponse
│   ├── routers/
│   │   ├── admin.py                       # NEW: GET /admin/stats, GET /admin/brands
│   │   │                                  #      (router-level Depends(get_current_admin_user))
│   │   └── me.py                          # MODIFY: populate is_admin via is_admin_email()
│   └── main.py                            # MODIFY: include admin.router
└── tests/
    ├── test_admin_models.py               # NEW: stats flat→nested mapping, page shape, bounds
    └── test_admin_access.py               # NEW: gate behavior (operator vs non-operator vs empty list)

frontend/
├── app/
│   └── (dashboard)/
│       └── admin/
│           ├── layout.tsx                 # NEW: server gate via /me is_admin -> notFound() if not operator
│           └── page.tsx                   # NEW: stats cards + paginated all-brands table
├── components/
│   └── admin/
│       ├── admin-stats-cards.tsx          # NEW: totals + status/provider breakdown + activity cards
│       └── admin-brands-table.tsx         # NEW: paginated all-brands table (client component)
├── hooks/
│   └── use-admin-brands.ts                # NEW: client hook for /admin/brands pagination
└── types/
    └── index.ts                           # MODIFY: AdminStats, AdminBrandListItem,
                                           #         AdminBrandsPage; add is_admin to profile type
```

**Structure Decision**: Web application using the established backend/frontend split. Backend follows the existing Pydantic-model + router pattern and reuses the service client; the admin router is gated centrally via a router-level dependency and exposes GET only. Frontend follows the existing `(dashboard)` route group: a gated `admin/` segment with a server layout for access control and a page composed of small components (stats cards, brands table). Aggregation lives in two read-only SQL views so per-brand counts and system totals are single queries. The conditional Admin nav entry is added to the existing dashboard navigation, driven by `is_admin` from `/me`. No new root-level directories.

---

## Phase 0: Research

Decisions captured in [research.md](./research.md). All planning unknowns resolved; no `NEEDS CLARIFICATION` markers remain.

Key decisions:

1. Aggregate via two read-only SQL views (`admin_stats`, `admin_brand_overview`) — avoids N+1 per-brand counts; single query each.
2. Secure the views: `REVOKE` from `anon`/`authenticated`, `GRANT SELECT` to `service_role` (defense-in-depth behind the FastAPI gate).
3. Expose `is_admin` on `/me` via a shared `is_admin_email()` helper — no client-side allow-list duplication.
4. Offset pagination (`page`/`per_page`, default 24, max 100), ordered `created_at DESC, id DESC` — gives total + page numbers.
5. Owner identity = `owner_user_id` + `profiles.full_name`; no email, no `auth.users` join (clean Clerk seam, no PII).
6. Centralized gate (router-level dependency) + GET-only handlers structurally enforce access control and read-only.

---

## Phase 1: Design and Contracts

Artifacts produced:

- [data-model.md](./data-model.md) — view columns, response models, `ProfileResponse` addition.
- [contracts/admin-api.md](./contracts/admin-api.md) — `GET /admin/stats`, `GET /admin/brands`, `/me` `is_admin`, access-control contract.
- [quickstart.md](./quickstart.md) — per-story verification + adapted Definition of Done.

### Backend design

- **Migration `00014_admin_views.sql`**: define `admin_stats` (single-row aggregate) and `admin_brand_overview` (one row per brand with owner reference + display name, kit status, generation count, active-key boolean, created_at). `REVOKE ALL ... FROM anon, authenticated; GRANT SELECT ... TO service_role`.
- **`auth.py`**: extract `is_admin_email(email) -> bool`; `get_current_admin_user` reuses it (behavior unchanged).
- **`models/admin.py`**: `AdminStatsResponse` (+ nested `GenerationStatusBreakdown`, `GenerationProviderBreakdown`), `AdminBrandListItem`, `AdminBrandsPage`.
- **`models/profile.py`**: add `is_admin: bool = False`.
- **`routers/admin.py`**: `APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin_user)])`.
  - `GET /stats`: read `admin_stats` (single row) via service client → map flat row into nested `AdminStatsResponse`.
  - `GET /brands`: validate `page`/`per_page`; read `admin_brand_overview` with `select("*", count="exact").order("created_at", desc=True).order("id", desc=True).range(start, end)`; return `AdminBrandsPage`.
- **`me.py`**: set `is_admin=is_admin_email(current_user.email)` in both `/me` responses.
- **`main.py`**: `app.include_router(admin.router)`.

### Frontend design

- **`admin/layout.tsx`** (server): fetch `/me`; if `!is_admin`, `notFound()`. Backend `403` is the real control; this hides the UI.
- **`admin/page.tsx`**: render `admin-stats-cards` (from `GET /admin/stats`) and `admin-brands-table`.
- **`admin-brands-table.tsx`** (client) + **`use-admin-brands.ts`**: page through `GET /admin/brands?page=&per_page=`, show owner/kit/count/key/created, newest first, with page controls and total.
- **Navigation**: conditionally render the Admin entry when `profile.is_admin` is true.
- **`types/index.ts`**: add admin types + `is_admin` on the profile type. Calls go through the existing API access pattern used by other dashboard data.

### Definition of Done pre-check

- Access: non-operator → `403` and no nav entry; empty allow-list → everyone `403`, `is_admin: false`; views unreadable by `anon`/`authenticated`.
- Accuracy: status/provider breakdowns sum to totals; aggregates span all accounts; zero-generation brands listed with `0`.
- Pagination: full list pages with no omit/duplicate, newest-first.
- Read-only: only GET endpoints; no mutating UI actions.
- Key secrecy: only `has_active_key` exposed.

---

## Constitution Check (Post-Design)

Re-verified against the concrete design:

| Principle | Check | Evidence |
|-----------|-------|----------|
| Brand isolation | PASS | Operator-gated, read-only cross-brand view; views revoked from non-operator roles |
| Key secrecy | PASS | `admin_brand_overview` exposes only `has_active_key`; no key/hint/vault id selected or returned |
| Fixed stack | PASS | Existing FastAPI/Next.js/Supabase/Bunny Magic only; no new runtime deps |
| Data rules | PASS | Read-only over existing fields; no schema change, no cost/token columns |
| Security rules | PASS | Server-side operator gate (router-level dependency); view grants restricted to service role; no PII/keys in logs |
| Definition of Done | PASS (adapted) | Quickstart covers kit/provider reflection + access/view-security; hard delete N/A (read-only) |

No violations. No complexity exceptions required.

---

## Complexity Tracking

No constitution violations; table intentionally empty.
