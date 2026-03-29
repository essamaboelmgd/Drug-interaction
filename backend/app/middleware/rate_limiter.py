"""In-memory token-bucket rate limiter implemented as a FastAPI dependency.

Each user gets a bucket that refills at a fixed rate. When the bucket is empty
the request is rejected with HTTP 429. No external service (Redis, etc.) is
required — the state is held in a process-level dictionary.

Bucket parameters (default: 10 requests / 60 seconds):
  - capacity   — maximum tokens in the bucket
  - refill_rate — tokens added per second
"""

import time
from collections import defaultdict
from dataclasses import dataclass, field

from fastapi import HTTPException, status


@dataclass
class _Bucket:
    """Token bucket state for a single user."""

    capacity: float
    refill_rate: float  # tokens per second
    tokens: float = field(init=False)
    last_refill: float = field(init=False)

    def __post_init__(self) -> None:
        self.tokens = self.capacity
        self.last_refill = time.monotonic()

    def consume(self) -> bool:
        """Refill the bucket based on elapsed time, then consume one token.

        Returns:
            True if a token was consumed; False if the bucket was empty.
        """
        now = time.monotonic()
        elapsed = now - self.last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self.last_refill = now

        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False


class RateLimiter:
    """FastAPI dependency that enforces a per-user request rate limit.

    Usage::

        limiter = RateLimiter(requests=10, window_seconds=60)

        @router.post("/endpoint")
        async def endpoint(
            current_user: User = Depends(get_current_user),
            _: None = Depends(limiter.check),
        ):
            ...
    """

    def __init__(self, requests: int = 10, window_seconds: int = 60) -> None:
        self._capacity = float(requests)
        self._refill_rate = requests / window_seconds
        self._buckets: dict[int, _Bucket] = defaultdict(
            lambda: _Bucket(capacity=self._capacity, refill_rate=self._refill_rate)
        )

    def check(self, user_id: int) -> None:
        """Consume one token for *user_id* or raise HTTP 429.

        This method is called by :func:`app.api.dependencies.rate_limit_check`
        which extracts the user id from the current authenticated user.
        """
        bucket = self._buckets[user_id]
        if not bucket.consume():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. You may make up to 10 requests per minute.",
            )


# Shared singleton used by the dependency in app/api/dependencies.py
interaction_rate_limiter = RateLimiter(requests=10, window_seconds=60)
