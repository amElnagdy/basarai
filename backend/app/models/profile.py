import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


class ProfileResponse(BaseModel):
    user_id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_admin: bool = False
    created_at: datetime
    updated_at: datetime


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if len(v) < 2 or len(v) > 120:
            raise ValueError("Full name must be between 2 and 120 characters")
        return v

    @field_validator("avatar_url")
    @classmethod
    def validate_avatar_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not re.match(r"^https?://.+", v):
            raise ValueError("Avatar URL must be a valid HTTP or HTTPS URL")
        return v
