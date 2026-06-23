from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_admin_user
from app.core.supabase import get_service_client
from app.models.admin import (
    AdminBrandListItem,
    AdminBrandsPage,
    AdminStatsResponse,
    GenerationProviderBreakdown,
    GenerationStatusBreakdown,
)

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_admin_user)],
)


def _error_response(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={"error": {"code": code, "message": message, "request_id": str(uuid4())}},
    )


def _brands_range(page: int, per_page: int) -> tuple[int, int]:
    if page < 1:
        raise _error_response(
            400,
            "VALIDATION_ERROR",
            "page must be greater than or equal to 1",
        )
    if per_page < 1 or per_page > 100:
        raise _error_response(
            400,
            "VALIDATION_ERROR",
            "per_page must be between 1 and 100",
        )

    start = (page - 1) * per_page
    end = start + per_page - 1
    return start, end


def _to_stats_response(row: dict) -> AdminStatsResponse:
    return AdminStatsResponse(
        total_accounts=row["total_accounts"],
        total_brands=row["total_brands"],
        total_generations=row["total_generations"],
        generations_by_status=GenerationStatusBreakdown(
            pending=row["generations_pending"],
            processing=row["generations_processing"],
            succeeded=row["generations_succeeded"],
            failed=row["generations_failed"],
        ),
        generations_by_provider=GenerationProviderBreakdown(
            openai=row["generations_openai"],
            gemini=row["generations_gemini"],
        ),
        generations_last_7d=row["generations_last_7d"],
        generations_last_30d=row["generations_last_30d"],
        brand_kits_complete=row["brand_kits_complete"],
        active_provider_keys=row["active_provider_keys"],
    )


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats() -> AdminStatsResponse:
    result = get_service_client().table("admin_stats").select("*").single().execute()
    return _to_stats_response(result.data)


@router.get("/brands", response_model=AdminBrandsPage)
async def list_admin_brands(page: int = 1, per_page: int = 24) -> AdminBrandsPage:
    start, end = _brands_range(page, per_page)
    result = (
        get_service_client()
        .table("admin_brand_overview")
        .select("*", count="exact")
        .order("created_at", desc=True)
        .order("id", desc=True)
        .range(start, end)
        .execute()
    )

    return AdminBrandsPage(
        items=[AdminBrandListItem(**row) for row in (result.data or [])],
        page=page,
        per_page=per_page,
        total=result.count or 0,
    )
