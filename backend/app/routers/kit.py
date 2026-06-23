from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import User, get_current_user
from app.core.supabase import get_service_client
from app.models.kit import KitAnswers, UpsertKitRequest, KitResponse, KitStatusEnum
from app.services.kit_summary import derive_status, derive_summary

router = APIRouter(prefix="/brands/{brand_id}/kit", tags=["brand-kit"])


def _error_response(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={"error": {"code": code, "message": message, "request_id": str(uuid4())}},
    )


def _get_brand_or_404(brand_id: UUID, user_id: str) -> dict:
    client = get_service_client()
    result = (
        client.table("brands")
        .select("*")
        .eq("id", str(brand_id))
        .eq("owner_user_id", user_id)
        .maybe_single()
        .execute()
    )
    if result is None or result.data is None:
        raise _error_response(404, "BRAND_NOT_FOUND", "Brand not found")
    return result.data


def _empty_answers() -> KitAnswers:
    return KitAnswers(tagline=None, tone=None, audience=None, colors=[], avoid_words=None)


def _row_to_response(brand: dict, row: dict | None) -> KitResponse:
    if row is None:
        return KitResponse(
            brand_id=brand["id"],
            brand_name=brand["name"],
            answers=_empty_answers(),
            summary=None,
            status=KitStatusEnum.not_started,
            completed_at=None,
            updated_at=None,
        )
    answers = KitAnswers(
        tagline=row.get("tagline"),
        tone=row.get("tone"),
        audience=row.get("audience"),
        colors=row.get("colors") or [],
        avoid_words=row.get("avoid_words"),
    )
    return KitResponse(
        brand_id=brand["id"],
        brand_name=brand["name"],
        answers=answers,
        summary=row.get("summary"),
        status=row.get("status", KitStatusEnum.not_started),
        completed_at=row.get("completed_at"),
        updated_at=row.get("updated_at"),
    )


@router.get("", response_model=KitResponse)
async def get_kit(brand_id: UUID, current_user: User = Depends(get_current_user)):
    brand = _get_brand_or_404(brand_id, current_user.id)
    client = get_service_client()
    result = (
        client.table("brand_kits")
        .select("*")
        .eq("brand_id", str(brand_id))
        .maybe_single()
        .execute()
    )
    row = result.data if result is not None else None
    return _row_to_response(brand, row)


@router.put("", response_model=KitResponse)
async def upsert_kit(
    brand_id: UUID,
    body: UpsertKitRequest,
    current_user: User = Depends(get_current_user),
):
    brand = _get_brand_or_404(brand_id, current_user.id)
    client = get_service_client()

    existing_result = (
        client.table("brand_kits")
        .select("status, completed_at")
        .eq("brand_id", str(brand_id))
        .maybe_single()
        .execute()
    )
    existing = existing_result.data if existing_result is not None else None

    a = body.answers
    new_status = derive_status(
        tagline=a.tagline,
        tone=a.tone.value if a.tone else None,
        audience=a.audience,
        colors=a.colors,
        avoid_words=a.avoid_words,
    )
    summary = derive_summary(
        brand_name=brand["name"],
        tagline=a.tagline,
        tone=a.tone.value if a.tone else None,
        audience=a.audience,
        colors=a.colors,
        avoid_words=a.avoid_words,
    )
    now = datetime.now(timezone.utc)
    if new_status == KitStatusEnum.complete:
        if (
            existing
            and existing.get("status") == KitStatusEnum.complete.value
            and existing.get("completed_at") is not None
        ):
            completed_at = existing["completed_at"]
        else:
            completed_at = now.isoformat()
    else:
        completed_at = None

    payload = {
        "brand_id": str(brand_id),
        "tagline": a.tagline,
        "tone": a.tone.value if a.tone else None,
        "audience": a.audience,
        "colors": a.colors,
        "avoid_words": a.avoid_words,
        "summary": summary,
        "status": new_status.value,
        "completed_at": completed_at,
    }
    result = (
        client.table("brand_kits")
        .upsert(payload, on_conflict="brand_id")
        .execute()
    )
    row = result.data[0] if result.data else None
    return _row_to_response(brand, row)
