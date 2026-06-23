from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from app.models.admin import AdminBrandListItem, AdminBrandsPage
from app.routers.admin import _brands_range, _to_stats_response


def _make_admin_stats_row(**overrides):
    base = {
        "total_accounts": 12,
        "total_brands": 19,
        "total_generations": 40,
        "generations_pending": 3,
        "generations_processing": 2,
        "generations_succeeded": 29,
        "generations_failed": 6,
        "generations_openai": 23,
        "generations_gemini": 17,
        "generations_last_7d": 11,
        "generations_last_30d": 34,
        "brand_kits_complete": 15,
        "active_provider_keys": 8,
    }
    base.update(overrides)
    return base


def test_admin_stats_response_maps_flat_view_row_to_nested_breakdowns():
    stats = _to_stats_response(_make_admin_stats_row())

    assert stats.total_accounts == 12
    assert stats.total_brands == 19
    assert stats.total_generations == 40
    assert stats.generations_by_status.pending == 3
    assert stats.generations_by_status.processing == 2
    assert stats.generations_by_status.succeeded == 29
    assert stats.generations_by_status.failed == 6
    assert stats.generations_by_provider.openai == 23
    assert stats.generations_by_provider.gemini == 17
    assert stats.generations_last_7d == 11
    assert stats.generations_last_30d == 34
    assert stats.brand_kits_complete == 15
    assert stats.active_provider_keys == 8
    assert (
        stats.generations_by_status.pending
        + stats.generations_by_status.processing
        + stats.generations_by_status.succeeded
        + stats.generations_by_status.failed
        == stats.total_generations
    )
    assert (
        stats.generations_by_provider.openai
        + stats.generations_by_provider.gemini
        == stats.total_generations
    )


def _make_admin_brand_item(**overrides):
    base = {
        "id": "00000000-0000-0000-0000-000000000001",
        "name": "Acme",
        "owner_user_id": "00000000-0000-0000-0000-000000000010",
        "owner_full_name": "Ada Lovelace",
        "kit_status": "complete",
        "generation_count": 4,
        "has_active_key": True,
        "created_at": datetime(2026, 6, 19, 12, 30, tzinfo=timezone.utc),
    }
    base.update(overrides)
    return AdminBrandListItem(**base)


def test_admin_brands_page_shape():
    first = _make_admin_brand_item()
    second = _make_admin_brand_item(
        id="00000000-0000-0000-0000-000000000002",
        owner_full_name=None,
        generation_count=0,
        has_active_key=False,
    )

    page = AdminBrandsPage(items=[first, second], page=2, per_page=24, total=50)

    assert page.items == [first, second]
    assert page.page == 2
    assert page.per_page == 24
    assert page.total == 50


@pytest.mark.parametrize(
    ("page", "per_page", "expected"),
    [
        (1, 24, (0, 23)),
        (2, 24, (24, 47)),
        (3, 10, (20, 29)),
    ],
)
def test_brands_range_returns_inclusive_postgrest_range(page, per_page, expected):
    assert _brands_range(page, per_page) == expected


@pytest.mark.parametrize(
    ("page", "per_page"),
    [
        (0, 24),
        (1, 0),
        (1, 101),
    ],
)
def test_brands_range_rejects_out_of_bounds_values(page, per_page):
    with pytest.raises(HTTPException) as exc:
        _brands_range(page, per_page)

    assert exc.value.detail["error"]["code"] == "VALIDATION_ERROR"
