"""Business logic for user registration, login, and password management."""

import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.schemas import UserCreate


def hash_password(password: str) -> str:
    """Return the bcrypt hash of a plaintext password."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if *plain* matches the stored *hashed* password."""
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Fetch a user by email address, or return None if not found."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    """Fetch a user by primary key, or return None if not found."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
    """Persist a new user with a hashed password and return the created record."""
    user = User(
        email=user_data.email,
        name=user_data.name.strip(),
        hashed_password=hash_password(user_data.password),
        specialty=user_data.specialty,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    """Verify credentials and return the User on success, or None on failure."""
    user = await get_user_by_email(db, email)
    if user is None or not verify_password(password, user.hashed_password):
        return None
    return user
