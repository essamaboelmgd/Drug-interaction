"""Core API routes: drug interaction check and query history."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, rate_limit_check
from app.api.schemas import (
    DrugInteractionRequest,
    ErrorDetail,
    ErrorResponse,
    HistoryItem,
    HistoryResponse,
    InteractionResponse,
)
from app.auth.models import QueryHistory, User
from app.database.session import get_db
from app.gemini.client import GeminiServiceError, gemini_client
from app.patients.models import Patient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Drug Interactions"])


@router.post(
    "/check-interaction",
    summary="Analyze the interaction between two drugs",
    responses={
        200: {"model": InteractionResponse},
        429: {"description": "Rate limit exceeded"},
        502: {"model": ErrorResponse, "description": "Gemini API error"},
    },
)
async def check_interaction(
    body: DrugInteractionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(rate_limit_check),  # also enforces rate limit
) -> InteractionResponse | ErrorResponse:
    """Send both drug names to Gemini and return a structured interaction analysis.

    This endpoint is rate-limited to **10 requests per minute per user**.
    Optionally link the check to a patient by providing ``patient_id``.
    """
    now = datetime.now(timezone.utc)

    # Validate patient_id ownership if provided
    if body.patient_id is not None:
        patient = await db.get(Patient, body.patient_id)
        if patient is None or patient.doctor_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    try:
        result = await gemini_client.check_interaction(body.drug_1, body.drug_2)
    except GeminiServiceError as exc:
        logger.error("Gemini error for user %s: [%s] %s", current_user.id, exc.code, exc.message)
        await _save_history(
            db, current_user.id, body.drug_1, body.drug_2,
            result_json=None, patient_id=body.patient_id,
        )
        raise HTTPException(
            status_code=502,
            detail="AI service temporarily unavailable. Please try again later.",
        )

    await _save_history(
        db, current_user.id, body.drug_1, body.drug_2,
        result_json=result.model_dump_json(), patient_id=body.patient_id,
    )

    logger.info(
        "Interaction check completed for user %s: %s + %s → severity=%s",
        current_user.id,
        body.drug_1,
        body.drug_2,
        result.severity,
    )
    return InteractionResponse(data=result, timestamp=now)


@router.get(
    "/history",
    response_model=HistoryResponse,
    summary="Get the last 10 interaction checks for the current user",
)
async def get_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HistoryResponse:
    """Return the most recent 10 drug-interaction queries made by the authenticated user."""
    stmt = (
        select(QueryHistory)
        .where(QueryHistory.user_id == current_user.id)
        .order_by(QueryHistory.created_at.desc())
        .limit(10)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return HistoryResponse(
        data=[HistoryItem.model_validate(row) for row in rows],
        timestamp=datetime.now(timezone.utc),
    )


@router.get(
    "/patients/{patient_id}/interactions",
    response_model=HistoryResponse,
    summary="Get all drug interaction checks linked to a specific patient",
)
async def get_patient_interactions(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HistoryResponse:
    """Return all interaction checks that were linked to *patient_id*.

    Returns 404 if the patient does not exist or belongs to a different doctor.
    """
    patient = await db.get(Patient, patient_id)
    if patient is None or patient.doctor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    stmt = (
        select(QueryHistory)
        .where(QueryHistory.patient_id == patient_id)
        .order_by(QueryHistory.created_at.desc())
    )
    rows = (await db.execute(stmt)).scalars().all()
    return HistoryResponse(
        data=[HistoryItem.model_validate(row) for row in rows],
        timestamp=datetime.now(timezone.utc),
    )


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------


async def _save_history(
    db: AsyncSession,
    user_id: int,
    drug_1: str,
    drug_2: str,
    result_json: str | None,
    patient_id: int | None = None,
) -> None:
    """Persist a query history record; errors are logged but not re-raised."""
    try:
        entry = QueryHistory(
            user_id=user_id,
            drug_1=drug_1,
            drug_2=drug_2,
            result=result_json,
            patient_id=patient_id,
        )
        db.add(entry)
        await db.commit()
    except Exception:
        logger.exception("Failed to save query history for user %s", user_id)
