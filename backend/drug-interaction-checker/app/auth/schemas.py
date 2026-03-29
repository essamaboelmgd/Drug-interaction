"""Pydantic schemas for authentication requests and responses."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    """Payload for POST /auth/register."""

    email: EmailStr
    password: str
    name: str
    specialty: str | None = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name must not be empty")
        return v


class UserResponse(BaseModel):
    """User object returned to the client (no password)."""

    id: int
    email: str
    name: str
    specialty: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DoctorMeResponse(UserResponse):
    """Extended user profile returned by GET /auth/me — includes patient count."""

    patient_count: int


class LoginRequest(BaseModel):
    """Payload for POST /auth/login."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response returned after successful login."""

    access_token: str
    token_type: str = "bearer"
