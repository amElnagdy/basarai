# Quickstart & Verification: Admin Monitoring Dashboard

**Feature**: `009-admin-dashboard` | **Date**: 2026-06-19

This is the manual verification script for the read-only admin dashboard. Run it against a Supabase project with the migration applied and the app running via Docker.

---

## Setup

1. Apply the migration:
   ```bash
   supabase db push   # applies 00014_admin_views.sql
   ```
2. Set the operator allow-list in `backend/.env`:
   ```bash
   ADMIN_EMAILS=operator@example.com
   ```
3. Seed data across **two accounts** (one operator, one regular), with:
   - At least 25 brands total so the all-brands list spans more than one page.
   - Brands with varied kit status (`not_started`, `complete`), with/without an active provider key, and with 0 / some generations.
   - Generations across both providers (`openai`, `gemini`) and all statuses (`pending`, `processing`, `succeeded`, `failed`), including some in the last 7 days.
4. Start the app:
   ```bash
   make up
   ```

---

## US1 — System usage statistics (P1)

1. Sign in as `operator@example.com`, open the Admin area.
2. **Verify** the dashboard shows: total accounts, total brands, total generations; the status breakdown (pending/processing/succeeded/failed); the provider breakdown (openai/gemini); 7-day and 30-day activity; completed-kit count; active-key count.
3. **Verify** the status counts sum to total generations, and the provider counts sum to total generations (SC-002).
4. **Verify** the figures include the *other* account's data, not just the operator's (FR-011).
5. **Empty-system check**: against a fresh/empty project, the dashboard renders all zeros without error.

---

## US2 — All-brands list (P2)

1. As the operator, open the all-brands list.
2. **Verify** every brand from **both** accounts appears (FR-013).
3. **Verify** each row shows name, owning account (full name or identifier), kit status, generation count, active-key indicator, and created date — all matching the seeded values (FR-014).
4. **Verify** a brand with zero generations shows `0`, not hidden (edge case).
5. **Pagination**: page through the full list; confirm no brand is missing and none appears twice; confirm newest-first order (FR-015/FR-016).
6. **Bounds**: `per_page` above 100 or `page` below 1 returns a validation error.

---

## US3 — Operator-only access (P3)

1. Sign in as the **regular** (non-operator) account.
2. **Verify** the Admin entry point is **not** shown in navigation (FR-003).
3. **Verify** directly visiting the Admin URL is refused (not rendered), and calling `GET /admin/stats` / `GET /admin/brands` returns `403 FORBIDDEN` (FR-002).
4. **Verify** `GET /me` returns `is_admin: false` for the regular account and `true` for the operator.
5. **Empty allow-list**: unset `ADMIN_EMAILS`, restart; confirm even the former operator now gets `403` and `is_admin: false` (FR-004).
6. **Defense-in-depth**: as a non-operator, attempt a direct Supabase REST `select` on `admin_stats` / `admin_brand_overview`; confirm it is denied (views not granted to `anon`/`authenticated`).

---

## Read-only guarantee (FR-017 / SC-006)

- **Verify** the Admin UI exposes no create/edit/delete actions on any brand, account, generation, key, or kit.
- **Verify** the admin router defines only `GET` endpoints.

---

## Definition of Done (adapted from Constitution VII)

This is a read-only, cross-account monitoring feature, so the standard generation-flow DoD items are adapted:

- [ ] Brands with **no** brand kit (0 answers) appear with `kit_status: not_started` and correct counts.
- [ ] Brands with a **completed** kit are counted in `brand_kits_complete` and shown as `complete`.
- [ ] Statistics correctly reflect **OpenAI** generations (provider breakdown + totals).
- [ ] Statistics correctly reflect **Gemini** generations (provider breakdown + totals).
- [ ] Access control tested: non-operator and empty-allow-list both yield `403`; views are not readable by `anon`/`authenticated` (explicit integration checks, in lieu of new RLS policies since views are revoked from those roles).
- [ ] Hard delete: **N/A** — this feature performs no deletes (read-only).
- [ ] Key secrecy: confirmed the brand overview exposes only `has_active_key`, never key values/hints/vault references.
