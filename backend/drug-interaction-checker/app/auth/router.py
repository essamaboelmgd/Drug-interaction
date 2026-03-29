"""Authentication routes: register, login, and current-user info."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import func, select

from app.api.dependencies import get_current_user
from app.auth import service
from app.auth.jwt_handler import create_access_token
from app.auth.models import User
from app.auth.schemas import DoctorMeResponse, LoginRequest, TokenResponse, UserCreate, UserResponse
from app.database.session import get_db
from app.patients.models import Patient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Create a new account. Returns the user object (no password field)."""
    existing = await service.get_user_by_email(db, user_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )
    user = await service.create_user(db, user_data)
    logger.info("New user registered: %s (id=%s)", user.email, user.id)
    return user


@router.post("/login", response_model=TokenResponse, summary="Obtain a JWT access token")
async def login(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Verify email/password and return a Bearer token valid for 24 hours."""
    user = await service.authenticate_user(db, credentials.email, credentials.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": str(user.id), "email": user.email})
    logger.info("User logged in: %s (id=%s)", user.email, user.id)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=DoctorMeResponse, summary="Get current user info")
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DoctorMeResponse:
    """Return the profile and patient count for the authenticated doctor."""
    count_result = await db.execute(
        select(func.count(Patient.id)).where(Patient.doctor_id == current_user.id)
    )
    patient_count = count_result.scalar_one()
    return DoctorMeResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        specialty=current_user.specialty,
        created_at=current_user.created_at,
        patient_count=patient_count,
    )
