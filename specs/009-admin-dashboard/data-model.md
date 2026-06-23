# Data Model: Admin Monitoring Dashboard

**Feature**: `009-admin-dashboard` | **Date**: 2026-06-19

This feature introduces **no new tables and no schema changes to existing tables**. It adds two **read-only views** over existing data and a set of read-only API response shapes. Nothing here is writable.

---

## Existing tables consumed (read-only)

| Table | Columns used | Purpose |
|-------|--------------|---------|
| `profiles` | `user_id`, `full_name` | Account count; owner display name |
| `brands` | `id`, `name`, `owner_user_id`, `created_at` | Brand list + count |
| `brand_kits` | `brand_id`, `status` | Kit status per brand; completed-kit count |
| `provider_keys` | `brand_id`, `is_active` | Active-key boolean per brand; active-key count |
| `generations` | `brand_id`, `provider`, `status`, `created_at` | Generation counts, breakdowns, recent activity |

No raw key material (`provider_keys.key_hint`, vault secret references) is read or exposed.

---

## New view: `admin_stats` (single row)

A one-row aggregate over the whole system. Computed on demand.

| Column | Type | Definition |
|--------|------|------------|
| `total_accounts` | int | `count(*)` of `profiles` |
| `total_brands` | int | `count(*)` of `brands` |
| `total_generations` | int | `count(*)` of `generations` |
| `generations_pending` | int | generations where `status = 'pending'` |
| `generations_processing` | int | generations where `status = 'processing'` |
| `generations_succeeded` | int | generations where `status = 'succeeded'` |
| `generations_failed` | int | generations where `status = 'failed'` |
| `generations_openai` | int | generations where `provider = 'openai'` |
| `generations_gemini` | int | generations where `provider = 'gemini'` |
| `generations_last_7d` | int | generations where `created_at >= now() - interval '7 days'` |
| `generations_last_30d` | int | generations where `created_at >= now() - interval '30 days'` |
| `brand_kits_complete` | int | brand_kits where `status = 'complete'` |
| `active_provider_keys` | int | provider_keys where `is_active` |

**Invariant**: `generations_pending + processing + succeeded + failed = total_generations`, and `generations_openai + generations_gemini = total_generations` (FR-012 / SC-002).

---

## New view: `admin_brand_overview` (one row per brand)

| Column | Type | Definition / Notes |
|--------|------|--------------------|
| `id` | uuid | `brands.id` |
| `name` | text | `brands.name` |
| `owner_user_id` | uuid | `brands.owner_user_id` — stable account identifier |
| `owner_full_name` | text \| null | `profiles.full_name` (LEFT JOIN; null if unset) |
| `kit_status` | text | `COALESCE(brand_kits.status::text, 'not_started')` |
| `generation_count` | int | count of `generations` for the brand (0 if none) |
| `has_active_key` | bool | `EXISTS` an active `provider_keys` row for the brand |
| `created_at` | timestamptz | `brands.created_at` |

**Ordering**: queried with `created_at DESC, id DESC` for a stable, predictable order (FR-016).

**Security (both views)**: `REVOKE ALL FROM anon, authenticated`; `GRANT SELECT TO service_role`. Only the gated backend (service-role key) reads them.

---

## API response models (Pydantic — `backend/app/models/admin.py`)

```text
GenerationStatusBreakdown
  pending: int
  processing: int
  succeeded: int
  failed: int

GenerationProviderBreakdown
  openai: int
  gemini: int

AdminStatsResponse
  total_accounts: int
  total_brands: int
  total_generations: int
  generations_by_status: GenerationStatusBreakdown
  generations_by_provider: GenerationProviderBreakdown
  generations_last_7d: int
  generations_last_30d: int
  brand_kits_complete: int
  active_provider_keys: int

AdminBrandListItem
  id: str
  name: str
  owner_user_id: str
  owner_full_name: str | None
  kit_status: str
  generation_count: int
  has_active_key: bool
  created_at: datetime

AdminBrandsPage
  items: list[AdminBrandListItem]
  page: int
  per_page: int
  total: int
```

The router maps the flat `admin_stats` row into the nested `AdminStatsResponse` (status/provider breakdowns grouped).

---

## Modified model: `ProfileResponse` (`backend/app/models/profile.py`)

Add one field:

| Field | Type | Notes |
|-------|------|-------|
| `is_admin` | bool | `True` when the account's email is on the operator allow-list; default `False` |

Populated by the `/me` handler via `is_admin_email(current_user.email)`.

---

## Frontend types (`frontend/types/index.ts`)

Mirror the API shapes: `AdminStats`, `AdminBrandListItem`, `AdminBrandsPage`, and add `is_admin: boolean` to the existing profile type.
