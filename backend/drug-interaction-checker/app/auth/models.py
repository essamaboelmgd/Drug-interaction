"""SQLAlchemy ORM models for users and query history."""

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class User(Base):
    """Registered application user (= doctor on this platform)."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    specialty: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    query_history: Mapped[list["QueryHistory"]] = relationship(
        "QueryHistory", back_populates="user", cascade="all, delete-orphan"
    )
    patients: Mapped[list["Patient"]] = relationship(  # type: ignore[name-defined]
        "Patient", back_populates="doctor", lazy="selectin", cascade="all, delete-orphan"
    )


class QueryHistory(Base):
    """Record of every drug-interaction check performed by a user."""

    __tablename__ = "query_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    patient_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("patients.id"), nullable=True, index=True
    )
    drug_1: Mapped[str] = mapped_column(String(100), nullable=False)
    drug_2: Mapped[str] = mapped_column(String(100), nullable=False)
    result: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    user: Mapped["User"] = relationship("User", back_populates="query_history")
    patient: Mapped["Patient"] = relationship(  # type: ignore[name-defined]
        "Patient", back_populates="interactions"
    )
