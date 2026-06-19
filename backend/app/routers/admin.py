from fastapi import APIRouter, Depends

from app.core.auth import get_current_admin_user
from app.core.supabase import get_service_client
from app.models.admin import (
    AdminStatsResponse,
    GenerationProviderBreakdown,
    GenerationStatusBreakdown,
)

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_admin_user)],
)


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
async def get_admin_stats():
    result = get_service_client().table("admin_stats").select("*").single().execute()
    return _to_stats_response(result.data)
