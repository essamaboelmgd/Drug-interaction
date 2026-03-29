"""Tests for the drug interaction check and history endpoints.

Gemini API calls are mocked so no real API key is needed to run these tests.
"""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.gemini.client import InteractionResult, PoisoningRisk
from app.main import app

# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

MOCK_INTERACTION = InteractionResult(
    drug_1="Aspirin",
    drug_2="Warfarin",
    interaction_found=True,
    severity="severe",
    summary="Concurrent use significantly increases bleeding risk.",
    mechanism="Both drugs inhibit platelet aggregation and coagulation pathways.",
    side_effects=["Bleeding", "Bruising", "GI hemorrhage"],
    risks=["Major bleeding event", "Intracranial hemorrhage"],
    poisoning_risk=PoisoningRisk(
        exists=True,
        description="Anticoagulant toxicity leading to uncontrolled bleeding.",
    ),
    recommendations=["Avoid concurrent use", "Monitor INR closely if combination unavoidable"],
    disclaimer=(
        "This is AI-generated information for educational purposes only. "
        "Always consult a healthcare professional."
    ),
)


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.fixture
async def auth_headers(client: AsyncClient) -> dict:
    """Register a test user and return Authorization headers."""
    await client.post(
        "/auth/register",
        json={"email": "tester@example.com", "password": "secret123", "name": "Tester"},
    )
    login = await client.post(
        "/auth/login",
        json={"email": "tester@example.com", "password": "secret123"},
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# /api/v1/check-interaction
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_check_interaction_success(client: AsyncClient, auth_headers: dict):
    with patch(
        "app.api.router.gemini_client.check_interaction",
        new=AsyncMock(return_value=MOCK_INTERACTION),
    ):
        response = await client.post(
            "/api/v1/check-interaction",
            json={"drug_1": "Aspirin", "drug_2": "Warfarin"},
            headers=auth_headers,
        )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["severity"] == "severe"
    assert body["data"]["interaction_found"] is True
    assert "timestamp" in body


@pytest.mark.asyncio
async def test_check_interaction_requires_auth(client: AsyncClient):
    response = await client.post(
        "/api/v1/check-interaction",
        json={"drug_1": "Aspirin", "drug_2": "Warfarin"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_check_interaction_identical_drugs(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/v1/check-interaction",
        json={"drug_1": "Aspirin", "drug_2": "aspirin"},
        headers=auth_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_check_interaction_short_drug_name(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/v1/check-interaction",
        json={"drug_1": "A", "drug_2": "Warfarin"},
        headers=auth_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_check_interaction_missing_field(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/v1/check-interaction",
        json={"drug_1": "Aspirin"},
        headers=auth_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_check_interaction_gemini_error(client: AsyncClient, auth_headers: dict):
    from app.gemini.client import GeminiServiceError

    with patch(
        "app.api.router.gemini_client.check_interaction",
        new=AsyncMock(side_effect=GeminiServiceError("Gemini failed", code="GEMINI_ERROR")),
    ):
        response = await client.post(
            "/api/v1/check-interaction",
            json={"drug_1": "Aspirin", "drug_2": "Ibuprofen"},
            headers=auth_headers,
        )
    assert response.status_code == 200  # handled gracefully inside the route
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == "GEMINI_ERROR"


# ---------------------------------------------------------------------------
# /api/v1/history
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_history_returns_results(client: AsyncClient, auth_headers: dict):
    with patch(
        "app.api.router.gemini_client.check_interaction",
        new=AsyncMock(return_value=MOCK_INTERACTION),
    ):
        await client.post(
            "/api/v1/check-interaction",
            json={"drug_1": "Aspirin", "drug_2": "Warfarin"},
            headers=auth_headers,
        )

    response = await client.get("/api/v1/history", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert len(body["data"]) >= 1
    assert body["data"][0]["drug_1"] == "Aspirin"


@pytest.mark.asyncio
async def test_history_requires_auth(client: AsyncClient):
    response = await client.get("/api/v1/history")
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# /health
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
