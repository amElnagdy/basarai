from app.routers.admin import _to_stats_response


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
