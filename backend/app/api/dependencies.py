"""FastAPI dependency functions for authentication and rate limiting."""

import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt_handler import decode_access_token
from app.auth.models import User
from app.auth.service import get_user_by_id
from app.database.session import get_db
from app.middleware.rate_limiter import interaction_rate_limiter

logger = logging.getLogger(__name__)

_bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract the JWT from the Authorization header, validate it, and return the user.

    Raises:
        HTTPException 401: If the token is missing, expired, or invalid.
        HTTPException 401: If the user referenced by the token no longer exists.
    """
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str: str | None = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await get_user_by_id(db, int(user_id_str))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def rate_limit_check(current_user: User = Depends(get_current_user)) -> User:
    """Apply the in-memory rate limiter for the authenticated user.

    Returns the current user so downstream handlers can reuse it without
    calling get_current_user a second time.

    Raises:
        HTTPException 429: When the user exceeds 10 requests per minute.
    """
    interaction_rate_limiter.check(current_user.id)
    return current_user
