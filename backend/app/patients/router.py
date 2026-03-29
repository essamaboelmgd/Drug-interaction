"""Patient management routes — all endpoints require JWT authentication.

Route order matters: /search must appear before /{patient_id} so FastAPI
does not treat the literal string "search" as a patient_id integer.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.auth.models import User
from app.database.session import get_db
from app.patients import service
from app.patients.schemas import (
    PatientCreate,
    PatientListResponse,
    PatientResponse,
    PatientUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/patients", tags=["Patients"])


@router.post(
    "",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a new patient",
)
async def create_patient(
    body: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PatientResponse:
    """Create a patient record owned by the authenticated doctor."""
    patient = await service.create_patient(db, current_user.id, body)
    logger.info("Doctor %s created patient id=%s", current_user.id, patient.id)
    return PatientResponse.model_validate(patient)


@router.get(
    "",
    response_model=PatientListResponse,
    summary="List all patients for the current doctor",
)
async def list_patients(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PatientListResponse:
    """Return a paginated list of the doctor's patients, newest first."""
    patients = await service.get_patients(db, current_user.id, skip=skip, limit=limit)
    return PatientListResponse(
        patients=[PatientResponse.model_validate(p) for p in patients],
        total=len(patients),
    )


@router.get(
    "/search",
    response_model=PatientListResponse,
    summary="Search patients by name, phone, or status",
)
async def search_patients(
    q: str = Query(min_length=1, description="Search term matched against name, phone, status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PatientListResponse:
    """Case-insensitive search across full_name, phone, and status using OR logic."""
    patients = await service.search_patients(db, current_user.id, q)
    return PatientListResponse(
        patients=[PatientResponse.model_validate(p) for p in patients],
        total=len(patients),
    )


@router.get(
    "/{patient_id}",
    response_model=PatientResponse,
    summary="Get a single patient by ID",
)
async def get_patient(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PatientResponse:
    """Return the patient. Returns 404 if not found or owned by another doctor."""
    patient = await service.get_patient(db, patient_id, current_user.id)
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return PatientResponse.model_validate(patient)


@router.put(
    "/{patient_id}",
    response_model=PatientResponse,
    summary="Update a patient (partial update supported)",
)
async def update_patient(
    patient_id: int,
    body: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PatientResponse:
    """Apply a partial update. Only fields present in the request body are changed."""
    patient = await service.update_patient(db, patient_id, current_user.id, body)
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return PatientResponse.model_validate(patient)


@router.delete(
    "/{patient_id}",
    summary="Delete a patient",
)
async def delete_patient(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Permanently delete a patient record. Returns 404 if not found or not owned."""
    deleted = await service.delete_patient(db, patient_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    logger.info("Doctor %s deleted patient id=%s", current_user.id, patient_id)
    return {"success": True, "message": "Patient deleted"}
