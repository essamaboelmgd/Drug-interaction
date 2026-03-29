"""Async Gemini API client wrapper for drug interaction analysis."""

import asyncio
import json
import logging

import google.generativeai as genai
from pydantic import BaseModel, ValidationError

from app.config import settings
from app.gemini.prompts import build_interaction_prompt

logger = logging.getLogger(__name__)

_GEMINI_TIMEOUT_SECONDS = 30


class GeminiServiceError(Exception):
    """Raised when the Gemini API call fails for any reason."""

    def __init__(self, message: str, code: str = "GEMINI_ERROR") -> None:
        super().__init__(message)
        self.code = code
        self.message = message


# ---------------------------------------------------------------------------
# Pydantic model that mirrors the JSON Gemini is expected to return
# ---------------------------------------------------------------------------


class PoisoningRisk(BaseModel):
    exists: bool
    description: str


class InteractionResult(BaseModel):
    drug_1: str
    drug_2: str
    interaction_found: bool
    severity: str
    summary: str
    mechanism: str
    side_effects: list[str]
    risks: list[str]
    poisoning_risk: PoisoningRisk
    recommendations: list[str]
    disclaimer: str


# ---------------------------------------------------------------------------
# Client
# ---------------------------------------------------------------------------


class GeminiClient:
    """Thin async wrapper around the google-generativeai SDK."""

    def __init__(self) -> None:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self._model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,
                response_mime_type="application/json",
            ),
        )

    async def check_interaction(self, drug_1: str, drug_2: str) -> InteractionResult:
        """Send a drug interaction query to Gemini and return a validated result.

        Args:
            drug_1: Name of the first drug.
            drug_2: Name of the second drug.

        Returns:
            Validated :class:`InteractionResult`.

        Raises:
            GeminiServiceError: On API failure, timeout, invalid JSON, or schema mismatch.
        """
        prompt = build_interaction_prompt(drug_1, drug_2)

        try:
            response = await asyncio.wait_for(
                self._model.generate_content_async(prompt),
                timeout=_GEMINI_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError as exc:
            logger.error("Gemini request timed out after %s seconds", _GEMINI_TIMEOUT_SECONDS)
            raise GeminiServiceError(
                "The Gemini API request timed out. Please try again.", code="GEMINI_TIMEOUT"
            ) from exc
        except Exception as exc:
            # Catches transport errors, invalid API key, quota exhaustion, etc.
            error_str = str(exc).lower()
            if "api key" in error_str or "invalid" in error_str:
                code = "GEMINI_AUTH_ERROR"
            elif "quota" in error_str or "rate" in error_str:
                code = "GEMINI_RATE_LIMIT"
            else:
                code = "GEMINI_ERROR"
            logger.exception("Gemini API call failed: %s", exc)
            raise GeminiServiceError(str(exc), code=code) from exc

        raw_text = response.text
        logger.debug("Raw Gemini response: %s", raw_text)

        # Parse JSON
        try:
            data = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            logger.error("Gemini returned non-JSON content: %s", raw_text[:500])
            raise GeminiServiceError(
                "Gemini returned an invalid JSON response.", code="GEMINI_INVALID_RESPONSE"
            ) from exc

        # Validate against schema
        try:
            return InteractionResult.model_validate(data)
        except ValidationError as exc:
            logger.error("Gemini response failed schema validation: %s", exc)
            raise GeminiServiceError(
                "Gemini response did not match expected schema.", code="GEMINI_SCHEMA_ERROR"
            ) from exc


# Module-level singleton — instantiated once at import time
gemini_client = GeminiClient()
