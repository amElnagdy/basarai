# API Contract: Admin Monitoring Dashboard

**Feature**: `009-admin-dashboard` | **Date**: 2026-06-19

All admin endpoints are mounted under a router with prefix `/admin` and a **router-level** dependency `Depends(get_current_admin_user)`. Every endpoint is `GET` (read-only, FR-017). Non-operator accounts receive `403`.

Error responses follow the existing contract:

```json
{ "error": { "code": "STRING", "message": "STRING", "request_id": "uuid" } }
```

---

## GET /admin/stats

System-wide usage statistics (US1).

**Auth**: operator only. **Query params**: none.

**200 Response** (`AdminStatsResponse`):

```json
{
  "total_accounts": 42,
  "total_brands": 87,
  "total_generations": 1530,
  "generations_by_status": {
    "pending": 1,
    "processing": 2,
    "succeeded": 1400,
    "failed": 127
  },
  "generations_by_provider": {
    "openai": 900,
    "gemini": 630
  },
  "generations_last_7d": 73,
  "generations_last_30d": 295,
  "brand_kits_complete": 51,
  "active_provider_keys": 64
}
```

**Guarantees**:
- Sum of `generations_by_status` values == `total_generations`.
- Sum of `generations_by_provider` values == `total_generations`.
- Aggregates span all accounts (FR-011).
- Empty system returns all zeros, `200` (edge case).

**Errors**: `401` (unauthenticated), `403` (`FORBIDDEN`, non-operator or empty allow-list).

---

## GET /admin/brands

Paginated list of every brand across all accounts (US2).

**Auth**: operator only.

**Query params**:

| Param | Type | Default | Bounds |
|-------|------|---------|--------|
| `page` | int | 1 | ≥ 1 |
| `per_page` | int | 24 | 1–100 |

**200 Response** (`AdminBrandsPage`):

```json
{
  "items": [
    {
      "id": "0b9c...e1",
      "name": "Acme Coffee",
      "owner_user_id": "f3a1...88",
      "owner_full_name": "Jordan Lee",
      "kit_status": "complete",
      "generation_count": 37,
      "has_active_key": true,
      "created_at": "2026-05-02T10:15:00Z"
    }
  ],
  "page": 1,
  "per_page": 24,
  "total": 87
}
```

**Guarantees**:
- Ordered `created_at DESC, id DESC`; paging never omits/duplicates a brand under a stable snapshot (FR-015/FR-016).
- Includes brands from every account, not just the operator's (FR-013).
- Brands with zero generations appear with `generation_count: 0` (edge case).
- `owner_full_name` may be `null`; `owner_user_id` is always present.
- Never includes any provider key value, hint, or vault reference — only `has_active_key` (Constitution II Key Secrecy).

**Errors**: `401`, `403`, `400` (`VALIDATION_ERROR` for out-of-range `page`/`per_page`).

---

## Modified: GET /me

The existing account endpoint gains one field so the frontend can gate the Admin entry point (FR-003) without learning the allow-list.

**200 Response** (`ProfileResponse`, additive):

```json
{
  "user_id": "f3a1...88",
  "email": "operator@example.com",
  "full_name": "Jordan Lee",
  "avatar_url": null,
  "is_admin": true,
  "created_at": "2026-01-10T09:00:00Z",
  "updated_at": "2026-06-01T12:00:00Z"
}
```

`is_admin` is `true` only when the account's email is on the operator allow-list; otherwise `false`. Existing clients ignoring the field are unaffected (additive change).

---

## Access-control contract (US3)

- All `/admin/*` routes require an operator; non-operators get `403 FORBIDDEN`.
- When `ADMIN_EMAILS` is empty/unset, **no** account is an operator → all `/admin/*` return `403`, and `/me` returns `is_admin: false` for everyone (FR-004).
- The underlying `admin_stats` / `admin_brand_overview` views are not selectable by `anon`/`authenticated`, so the admin data is unreachable even via a direct Supabase REST call (defense-in-depth).
