import logging
from typing import Optional
from uuid import uuid4
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
from jwt import PyJWKClient, PyJWKClientError, PyJWTError

from app.config import settings
from app.core.supabase import get_service_client

logger = logging.getLogger(__name__)


security = HTTPBearer(auto_error=False)

_jwks_client = PyJWKClient(
    f"{settings.CLERK_ISSUER}/.well-known/jwks.json",
    cache_jwk_set=True,
    lifespan=3600,
    timeout=5,
)


class User(BaseModel):
    id: str
    email: str


def is_admin_email(email: str) -> bool:
    if not email or not settings.ADMIN_EMAILS:
        return False

    admin_emails = [
        e.strip().lower()
        for e in settings.ADMIN_EMAILS.split(",")
        if e.strip()
    ]
    return email.lower() in admin_emails


def _auth_error(status_code: int, code: str, message: str) -> HTTPException:
    """Build an HTTPException whose detail matches the ErrorResponse contract."""
    return HTTPException(
        status_code=status_code,
        detail={"error": {"code": code, "message": message, "request_id": str(uuid4())}},
        headers={"WWW-Authenticate": "Bearer"} if status_code == 401 else None,
    )


def _authorized_parties() -> list[str]:
    return [p.strip() for p in settings.CLERK_AUTHORIZED_PARTIES.split(",") if p.strip()]


def resolve_profile(clerk_id: str) -> str:
    """Map a Clerk user id (JWT sub) to the internal profiles.user_id UUID."""
    client = get_service_client()
    result = (
        client.table("profiles")
        .select("user_id")
        .eq("clerk_user_id", clerk_id)
        .execute()
    )
    rows = result.data or []
    if rows and rows[0].get("user_id"):
        return str(rows[0]["user_id"])

    client.table("profiles").upsert(
        {"clerk_user_id": clerk_id},
        on_conflict="clerk_user_id",
        ignore_duplicates=True,
    ).execute()

    result = (
        client.table("profiles")
        .select("user_id")
        .eq("clerk_user_id", clerk_id)
        .execute()
    )
    rows = result.data or []
    if not rows or not rows[0].get("user_id"):
        raise _auth_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            "Failed to resolve user profile",
        )
    return str(rows[0]["user_id"])


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> User:
    if credentials is None:
        raise _auth_error(
            status.HTTP_401_UNAUTHORIZED,
            "AUTHENTICATION_REQUIRED",
            "Missing authentication credentials",
        )

    token = credentials.credentials

    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
    except PyJWKClientError:
        logger.exception("JWKS client failed while verifying token")
        raise _auth_error(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "SERVICE_UNAVAILABLE",
            "Authentication service unavailable",
        ) from None
    except PyJWTError:
        # Malformed token (e.g. not enough segments) — never a server error.
        logger.warning("Invalid authentication token")
        raise _auth_error(
            status.HTTP_401_UNAUTHORIZED,
            "INVALID_TOKEN",
            "Invalid authentication token",
        ) from None

    try:
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=settings.CLERK_ISSUER,
            leeway=5,
            options={
                "verify_aud": False,
                "require": ["exp", "nbf", "iat", "iss", "sub"],
            },
        )
    except PyJWTError:
        logger.warning("Invalid authentication token")
        raise _auth_error(
            status.HTTP_401_UNAUTHORIZED,
            "INVALID_TOKEN",
            "Invalid authentication token",
        ) from None

    azp = payload.get("azp")
    if not isinstance(azp, str) or not azp or azp not in _authorized_parties():
        logger.warning("Invalid authentication token")
        raise _auth_error(
            status.HTTP_401_UNAUTHORIZED,
            "INVALID_TOKEN",
            "Invalid authentication token",
        )

    sub = payload.get("sub")
    email = payload.get("email")
    if (
        not isinstance(sub, str)
        or not sub.strip()
        or not isinstance(email, str)
        or not email.strip()
    ):
        logger.warning("Invalid authentication token")
        raise _auth_error(
            status.HTTP_401_UNAUTHORIZED,
            "INVALID_TOKEN",
            "Token payload missing required claims",
        )

    try:
        user_id = resolve_profile(sub)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to resolve profile")
        raise _auth_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "INTERNAL_ERROR",
            "Failed to resolve user profile",
        ) from None

    return User(id=user_id, email=email)


def get_current_admin_user(user: User = Depends(get_current_user)) -> User:
    if not is_admin_email(user.email):
        raise _auth_error(
            status.HTTP_403_FORBIDDEN,
            "FORBIDDEN",
            "Admin access required",
        )

    return user
