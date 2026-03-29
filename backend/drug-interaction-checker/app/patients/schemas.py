"""Pydantic schemas for patient management requests and responses."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, field_validator


class PatientCreate(BaseModel):
    """Payload for POST /api/v1/patients."""

    full_name: str
    age: int
    status: Literal["Stable", "Under Treatment", "Critical"]
    phone: str | None = None
    address: str | None = None
    clinical_notes: str | None = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("full_name must be at least 2 characters")
        if len(v) > 200:
            raise ValueError("full_name must be at most 200 characters")
        return v

    @field_validator("age")
    @classmethod
    def validate_age(cls, v: int) -> int:
        if v < 0 or v > 150:
            raise ValueError("age must be between 0 and 150")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 30:
            raise ValueError("phone must be at most 30 characters")
        return v

    @field_validator("address")
    @classmethod
    def validate_address(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 500:
            raise ValueError("address must be at most 500 characters")
        return v


class PatientUpdate(BaseModel):
    """Payload for PUT /api/v1/patients/{id}. All fields are optional."""

    full_name: str | None = None
    age: int | None = None
    status: Literal["Stable", "Under Treatment", "Critical"] | None = None
    phone: str | None = None
    address: str | None = None
    clinical_notes: str | None = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if len(v) < 2:
            raise ValueError("full_name must be at least 2 characters")
        if len(v) > 200:
            raise ValueError("full_name must be at most 200 characters")
        return v

    @field_validator("age")
    @classmethod
    def validate_age(cls, v: int | None) -> int | None:
        if v is not None and (v < 0 or v > 150):
            raise ValueError("age must be between 0 and 150")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 30:
            raise ValueError("phone must be at most 30 characters")
        return v

    @field_validator("address")
    @classmethod
    def validate_address(cls, v: str | None) -> str | None:
        if v is not None and len(v) > 500:
            raise ValueError("address must be at most 500 characters")
        return v


class PatientResponse(BaseModel):
    """Patient record returned to the client."""

    id: int
    doctor_id: int
    full_name: str
    age: int
    status: str
    phone: str | None
    address: str | None
    clinical_notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PatientListResponse(BaseModel):
    """Response for list and search endpoints."""

    patients: list[PatientResponse]
    total: int
