# Research: Admin Monitoring Dashboard

**Feature**: `009-admin-dashboard` | **Date**: 2026-06-19

All planning unknowns are resolved below. No `NEEDS CLARIFICATION` markers remain.

---

## Decision 1 — Aggregate counts via two read-only SQL views

**Decision**: Add one migration (`supabase/migrations/00014_admin_views.sql`) defining two read-only views:

- `admin_stats` — a single-row aggregate (totals, status breakdown, provider breakdown, 7/30-day activity, completed-kit count, active-key count).
- `admin_brand_overview` — one row per brand with owner reference + display name, kit status, generation count, active-key boolean, and created_at.

The backend reads these through the existing service client.

**Rationale**:
- The all-brands list needs a per-brand generation count. Computing this in Python would require either fetching all generation rows (wasteful) or one count query per brand on the page (N+1, 24 round-trips/page). A SQL view does the `GROUP BY`/`EXISTS` in one query and lets PostgREST paginate + order it directly.
- The stats view collapses ~13 aggregate counts into a single round-trip.
- Read-only views are a pure addition: no data-model change, no new writable surface, and a clean seam for the upcoming Clerk migration (no auth coupling introduced).
- Consistent with the project's existing use of SQL helpers (vault RPC wrappers in migrations 00012/00013, triggers in 00007/00010).

**Alternatives considered**:
- *Python count queries against base tables*: no migration, but N+1 per-brand counts and many round-trips for stats. Rejected for efficiency and for teaching a poor pattern.
- *Single `admin_get_stats()` RPC returning JSON*: works, but mixing an RPC (stats) with a view (brands) means two patterns; a single-row view is simpler to query (`select *`) and keeps one consistent approach.

---

## Decision 2 — Secure the views: REVOKE from anon/authenticated, GRANT to service_role

**Decision**: In the same migration, `REVOKE ALL ON admin_stats, admin_brand_overview FROM anon, authenticated` and `GRANT SELECT ... TO service_role`.

**Rationale**:
- Supabase exposes `public`-schema objects through PostgREST and grants default privileges to `anon`/`authenticated`. Without an explicit revoke, a logged-in user could query these admin views directly via the Supabase REST endpoint, bypassing the FastAPI operator gate — a cross-account data leak (Constitution VI).
- The primary access control remains `get_current_admin_user` on the FastAPI router; the revoke is defense-in-depth so the admin aggregates are never reachable outside the gated backend.
- The backend uses the service-role key (`get_service_client()`), which bypasses RLS and retains access to the views.

**Alternatives considered**:
- *Place views in a private (non-exposed) schema*: also valid, but adds schema-management overhead; explicit REVOKE in `public` is the lower-friction, well-understood pattern here.

---

## Decision 3 — Expose `is_admin` on the existing `/me` response

**Decision**: Add `is_admin: bool` to `ProfileResponse`. Extract the allow-list check from `get_current_admin_user` into a shared `is_admin_email(email) -> bool` helper in `app/core/auth.py`; `get_current_admin_user` and the `/me` handler both use it.

**Rationale**:
- The frontend must hide/show the Admin nav entry and gate the Admin layout. It cannot read `ADMIN_EMAILS` (a backend secret), and duplicating the list client-side would drift and leak operator identities into the bundle.
- `/me` is already fetched for the account area, so no new endpoint is needed.
- A shared helper keeps one source of truth for "who is an operator."

**Alternatives considered**:
- *Dedicated `GET /admin/whoami`*: extra endpoint for one boolean. Rejected — `/me` already exists.
- *`NEXT_PUBLIC_ADMIN_EMAILS`*: leaks operator emails into the client bundle and duplicates config. Rejected.

---

## Decision 4 — Offset pagination (`page`/`per_page`, default 24)

**Decision**: The all-brands list uses offset pagination: `page` (default 1, ≥1) and `per_page` (default 24, max 100), ordered `created_at DESC, id DESC`, returning `{ items, page, per_page, total }` with `total` from a `count="exact"` query.

**Rationale**:
- An admin monitoring list benefits from a known total and page numbers ("page X of Y"); offset pagination gives both directly.
- A stable composite sort (`created_at DESC, id DESC`) makes a point-in-time snapshot deterministic, satisfying FR-015 (no omit/duplicate) under the normal case. Admin/brand data changes slowly, so the offset-shift edge during concurrent inserts is acceptable for monitoring.
- 24/page matches the existing generation-history page size (spec assumption) for UI consistency.

**Alternatives considered**:
- *Cursor pagination* (as generation history uses): avoids offset shift but provides no total/page numbers, which the admin overview wants. The trade-off favors offset here.

---

## Decision 5 — Owner identity without PII

**Decision**: `admin_brand_overview` exposes `owner_user_id` (stable identifier) and `owner_full_name` (from `profiles.full_name`, may be null). It does **not** join `auth.users` and does **not** surface email.

**Rationale**:
- Keeps the admin feature decoupled from Supabase auth internals ahead of the Clerk migration (no `auth.users` read).
- Avoids exposing PII in a cross-account view and in logs (Constitution VI).
- `full_name` is sufficient for an operator to recognize an account; the UUID is the unambiguous identifier and a safe fallback when `full_name` is null.

**Alternatives considered**:
- *Show owner email* (most recognizable for abuse-monitoring): deferred — introduces PII and an `auth.users` dependency. Recorded as a future option in the spec.

---

## Decision 6 — Centralized gate + read-only guarantee

**Decision**: Mount the admin router with a router-level dependency `dependencies=[Depends(get_current_admin_user)]` and expose only `GET` endpoints. No write/delete handlers exist in the admin surface.

**Rationale**:
- A router-level dependency gates every admin route uniformly (FR-001/002), so a new endpoint cannot accidentally ship ungated.
- Read-only is enforced structurally by exposing only `GET`s (FR-017), not by per-handler checks.

---

## Resolved constraints summary

| Area | Resolution |
|------|------------|
| Stats source | `admin_stats` view (single row) |
| Brand list source | `admin_brand_overview` view (paginated via PostgREST) |
| View security | REVOKE anon/authenticated; GRANT service_role |
| Admin detection (FE) | `is_admin` on `/me` via shared `is_admin_email()` |
| Pagination | offset `page`/`per_page`, default 24, order `created_at DESC, id DESC` |
| Owner identity | `owner_user_id` + `owner_full_name`; no email/`auth.users` |
| Provider keys | `has_active_key` boolean only — never key value/hint/vault id |
| Gate | router-level `get_current_admin_user`; GET-only |
