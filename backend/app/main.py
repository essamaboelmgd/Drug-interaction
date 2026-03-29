"""FastAPI application entry point.

Run with:
    uvicorn app.main:app --reload
"""

import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.api.router import router as api_router
from app.auth.router import router as auth_router
from app.patients.router import router as patients_router
from app.config import settings
from app.database.base import Base
from app.database.session import engine
from app.gemini.client import GeminiServiceError

# Ensure all ORM models are imported so Base.metadata knows every table.
from app.auth.models import User, QueryHistory  # noqa: F401
from app.patients.models import Patient  # noqa: F401

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Drug Interaction Checker API",
    description=(
        "Accepts two drug names and returns a structured AI-powered analysis of their "
        "pharmacological interaction, side effects, risks, and clinical recommendations."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — allow all origins in development.
# In production, replace ["*"] with your frontend's domain(s):
#   allow_origins=["https://your-frontend.example.com"]
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth_router)
app.include_router(api_router)
app.include_router(patients_router)

# ---------------------------------------------------------------------------
# Global exception handlers
# ---------------------------------------------------------------------------


@app.exception_handler(GeminiServiceError)
async def gemini_error_handler(request: Request, exc: GeminiServiceError) -> JSONResponse:
    """Map GeminiServiceError → 502 Bad Gateway."""
    logger.error("Unhandled GeminiServiceError: [%s] %s", exc.code, exc.message)
    return JSONResponse(
        status_code=502,
        content={"success": False, "error": {"code": exc.code, "message": exc.message}},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Pass HTTP exceptions through with a consistent JSON shape."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": {"code": "HTTP_ERROR", "message": exc.detail}},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all: log the real error but return a generic 500 to the client."""
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"},
        },
    )


# ---------------------------------------------------------------------------
# Startup / shutdown
# ---------------------------------------------------------------------------


@app.on_event("startup")
async def on_startup() -> None:
    """Create database tables and log a startup banner."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("=" * 60)
    logger.info("  Drug Interaction Checker API")
    logger.info("  Version : %s", settings.APP_VERSION)
    logger.info("  Env     : %s", settings.ENVIRONMENT)
    logger.info("  Docs    : http://127.0.0.1:8000/docs")
    logger.info("=" * 60)


@app.on_event("shutdown")
async def on_shutdown() -> None:
    """Dispose the async engine connection pool on shutdown."""
    await engine.dispose()
    logger.info("Database engine disposed. Goodbye.")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/health", tags=["Health"], summary="Health check (no auth required)")
async def health() -> dict:
    """Return a simple health status. Useful for load balancers and uptime monitors."""
    return {"status": "healthy"}
