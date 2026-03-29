"""Declarative base used by all SQLAlchemy ORM models.

All model modules are imported at the bottom of this file so that
Base.metadata.create_all() discovers every table regardless of import order.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Shared base class for all ORM models."""


# Register all ORM models with this metadata.
# These imports MUST appear after Base is defined (circular-import safe because
# each model module only needs Base, which is already defined by this point).
from app.auth.models import QueryHistory, User  # noqa: E402, F401
from app.patients.models import Patient  # noqa: E402, F401
