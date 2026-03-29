"""Async SQLAlchemy engine and session factory.

To switch from SQLite to PostgreSQL:
  1. Install asyncpg: pip install asyncpg
  2. Change DATABASE_URL in .env to:
     postgresql+asyncpg://user:password@localhost:5432/drug_checker
  That's it — no other code changes needed.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    # For SQLite: prevent "same thread" errors in async context
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a database session and closes it after the request."""
    async with AsyncSessionLocal() as session:
        yield session
