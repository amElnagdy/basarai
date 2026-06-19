import logging
from typing import Optional
from uuid import uuid4
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
from jwt import PyJWKClient, PyJWTError

from app.config import settings

logger = logging.getLogger(__name__)


security = HTTPBearer(auto_error=False)

_jwks_client = PyJWKClient(
    f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json",
    cache_jwk_set=True,
    lifespan=3600,
    timeout=5,
)


class User(BaseModel):
    id: str
    email: str
    access_token: str


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


def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> User:
    if credentials is None:
        raise _auth_error(
            status.HTTP_401_UNAUTHORIZED,
            "AUTHENTICATION_REQUIRED",
            "Missing authentication credentials",
        )

    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(credentials.credentials)
        payload = jwt.decode(
            credentials.credentials,
            signing_key.key,
            algorithms=["RS256", "ES256"],
            audience="authenticated",
        )
        user_id: str = payload.get("sub")
        email: str = payload.get("email")

        if user_id is None or email is None:
            raise _auth_error(
                status.HTTP_401_UNAUTHORIZED,
                "INVALID_TOKEN",
                "Token payload missing required claims",
            )

        return User(id=user_id, email=email, access_token=credentials.credentials)

    except PyJWTError:
        logger.exception("JWT decode failed")
        raise _auth_error(
            status.HTTP_401_UNAUTHORIZED,
            "INVALID_TOKEN",
            "Invalid authentication token",
        )


def get_current_admin_user(user: User = Depends(get_current_user)) -> User:
    if not is_admin_email(user.email):
        raise _auth_error(
            status.HTTP_403_FORBIDDEN,
            "FORBIDDEN",
            "Admin access required",
        )

    return user
