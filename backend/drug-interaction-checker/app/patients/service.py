"""Async CRUD operations for patient records."""

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.patients.models import Patient
from app.patients.schemas import PatientCreate, PatientUpdate


async def create_patient(db: AsyncSession, doctor_id: int, data: PatientCreate) -> Patient:
    """Create a new patient owned by *doctor_id* and return the persisted record."""
    patient = Patient(
        doctor_id=doctor_id,
        full_name=data.full_name,
        age=data.age,
        status=data.status,
        phone=data.phone,
        address=data.address,
        clinical_notes=data.clinical_notes,
    )
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return patient


async def get_patient(db: AsyncSession, patient_id: int, doctor_id: int) -> Patient | None:
    """Return the patient only if it exists AND belongs to *doctor_id*, else None."""
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.doctor_id == doctor_id)
    )
    return result.scalar_one_or_none()


async def get_patients(
    db: AsyncSession, doctor_id: int, skip: int = 0, limit: int = 50
) -> list[Patient]:
    """Return a paginated list of patients for *doctor_id*, newest first."""
    result = await db.execute(
        select(Patient)
        .where(Patient.doctor_id == doctor_id)
        .order_by(Patient.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def update_patient(
    db: AsyncSession, patient_id: int, doctor_id: int, data: PatientUpdate
) -> Patient | None:
    """Apply a partial update to a patient. Returns None if not found or not owned."""
    patient = await get_patient(db, patient_id, doctor_id)
    if patient is None:
        return None

    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(patient, field, value)

    await db.commit()
    await db.refresh(patient)
    return patient


async def delete_patient(db: AsyncSession, patient_id: int, doctor_id: int) -> bool:
    """Delete a patient. Returns True on success, False if not found or not owned."""
    patient = await get_patient(db, patient_id, doctor_id)
    if patient is None:
        return False
    await db.delete(patient)
    await db.commit()
    return True


async def search_patients(db: AsyncSession, doctor_id: int, query: str) -> list[Patient]:
    """Search across full_name, phone, and status using a case-insensitive LIKE filter.

    OR logic: any record matching at least one field is included.
    Example: ``query="critical"`` returns patients with status "Critical".
    Example: ``query="ahmed"`` returns patients whose name contains "ahmed".
    """
    pattern = f"%{query}%"
    result = await db.execute(
        select(Patient)
        .where(
            Patient.doctor_id == doctor_id,
            or_(
                Patient.full_name.ilike(pattern),
                Patient.phone.ilike(pattern),
                Patient.status.ilike(pattern),
            ),
        )
        .order_by(Patient.created_at.desc())
    )
    return list(result.scalars().all())
