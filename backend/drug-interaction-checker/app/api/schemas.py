"""Pydantic request and response schemas for the drug interaction API."""

from datetime import datetime

from pydantic import BaseModel, field_validator

from app.gemini.client import InteractionResult, PoisoningRisk  # re-exported for convenience

__all__ = ["PoisoningRisk", "InteractionResult"]


class DrugInteractionRequest(BaseModel):
    """Body for POST /api/v1/check-interaction."""

    drug_1: str
    drug_2: str
    patient_id: int | None = None

    @field_validator("drug_1", "drug_2", mode="before")
    @classmethod
    def clean_and_validate(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Must be a string")
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Drug name must be at least 2 characters")
        if len(v) > 100:
            raise ValueError("Drug name must be at most 100 characters")
        return v

    @field_validator("drug_2")
    @classmethod
    def drugs_must_differ(cls, v: str, info) -> str:
        drug_1 = info.data.get("drug_1", "")
        if drug_1.lower() == v.lower():
            raise ValueError("drug_1 and drug_2 must not be identical")
        return v


class ErrorDetail(BaseModel):
    code: str
    message: str


class InteractionResponse(BaseModel):
    """Successful response envelope for a drug interaction check."""

    success: bool = True
    data: InteractionResult
    timestamp: datetime


class ErrorResponse(BaseModel):
    """Error response envelope."""

    success: bool = False
    error: ErrorDetail
    timestamp: datetime


class HistoryItem(BaseModel):
    """Single query history entry returned to the client."""

    id: int
    drug_1: str
    drug_2: str
    patient_id: int | None
    result: str | None  # raw JSON string stored in DB
    created_at: datetime

    model_config = {"from_attributes": True}


class HistoryResponse(BaseModel):
    """Response for GET /api/v1/history."""

    success: bool = True
    data: list[HistoryItem]
    timestamp: datetime
