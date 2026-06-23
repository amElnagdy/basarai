import logging
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.auth import User, get_current_user, is_admin_email
from app.core.supabase import get_service_client
from app.models.profile import ProfileResponse, UpdateProfileRequest

logger = logging.getLogger(__name__)

router = APIRouter()


def _error_response(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={"error": {"code": code, "message": message, "request_id": str(uuid4())}},
    )


@router.get("/me", response_model=ProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    client = get_service_client()
    result = (
        client.table("profiles")
        .select("*")
        .eq("user_id", current_user.id)
        .maybe_single()
        .execute()
    )

    if result is None or result.data is None:
        raise _error_response(
            status.HTTP_404_NOT_FOUND,
            "PROFILE_NOT_FOUND",
            "Profile not found",
        )

    return ProfileResponse(
        user_id=result.data["user_id"],
        email=current_user.email,
        full_name=result.data.get("full_name"),
        avatar_url=result.data.get("avatar_url"),
        is_admin=is_admin_email(current_user.email),
        created_at=result.data["created_at"],
        updated_at=result.data["updated_at"],
    )


@router.patch("/me", response_model=ProfileResponse)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
):
    update_data = body.model_dump(exclude_unset=True)

    if not update_data:
        raise _error_response(
            status.HTTP_400_BAD_REQUEST,
            "VALIDATION_ERROR",
            "No fields provided for update",
        )

    client = get_service_client()
    result = (
        client.table("profiles")
        .update(update_data)
        .eq("user_id", current_user.id)
        .execute()
    )

    if not result.data:
        raise _error_response(
            status.HTTP_404_NOT_FOUND,
            "PROFILE_NOT_FOUND",
            "Profile not found",
        )

    row = result.data[0]
    return ProfileResponse(
        user_id=row["user_id"],
        email=current_user.email,
        full_name=row.get("full_name"),
        avatar_url=row.get("avatar_url"),
        is_admin=is_admin_email(current_user.email),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )
