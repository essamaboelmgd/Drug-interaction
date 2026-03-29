"""Tests for patient management endpoints and data-isolation rules."""

from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.gemini.client import InteractionResult, PoisoningRisk
from app.main import app

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

PATIENT_PAYLOAD = {
    "full_name": "John Doe",
    "age": 45,
    "status": "Stable",
    "phone": "555-1234",
    "address": "123 Main St",
    "clinical_notes": "Hypertension",
}

MOCK_INTERACTION = InteractionResult(
    drug_1="Aspirin",
    drug_2="Warfarin",
    interaction_found=True,
    severity="severe",
    summary="Increased bleeding risk.",
    mechanism="Additive anticoagulation.",
    side_effects=["Bleeding"],
    risks=["Hemorrhage"],
    poisoning_risk=PoisoningRisk(exists=True, description="Anticoagulant toxicity."),
    recommendations=["Avoid concurrent use"],
    disclaimer="Educational purposes only. Consult a healthcare professional.",
)


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def _register_and_login(client: AsyncClient, email: str, name: str) -> dict:
    """Register a doctor and return Authorization headers."""
    await client.post(
        "/auth/register",
        json={"email": email, "password": "secret123", "name": name},
    )
    login = await client.post("/auth/login", json={"email": email, "password": "secret123"})
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_patient(client: AsyncClient):
    headers = await _register_and_login(client, "doc1@test.com", "Doc One")
    response = await client.post("/api/v1/patients", json=PATIENT_PAYLOAD, headers=headers)
    assert response.status_code == 201
    body = response.json()
    assert body["full_name"] == "John Doe"
    assert body["status"] == "Stable"
    assert "id" in body


@pytest.mark.asyncio
async def test_list_patients(client: AsyncClient):
    headers = await _register_and_login(client, "doc2@test.com", "Doc Two")
    await client.post("/api/v1/patients", json=PATIENT_PAYLOAD, headers=headers)
    response = await client.get("/api/v1/patients", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 1
    assert len(body["patients"]) >= 1


@pytest.mark.asyncio
async def test_get_patient(client: AsyncClient):
    headers = await _register_and_login(client, "doc3@test.com", "Doc Three")
    created = (await client.post("/api/v1/patients", json=PATIENT_PAYLOAD, headers=headers)).json()
    response = await client.get(f"/api/v1/patients/{created['id']}", headers=headers)
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


@pytest.mark.asyncio
async def test_update_patient(client: AsyncClient):
    headers = await _register_and_login(client, "doc4@test.com", "Doc Four")
    created = (await client.post("/api/v1/patients", json=PATIENT_PAYLOAD, headers=headers)).json()
    response = await client.put(
        f"/api/v1/patients/{created['id']}",
        json={"status": "Critical", "age": 50},
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "Critical"
    assert body["age"] == 50
    assert body["full_name"] == "John Doe"  # unchanged


@pytest.mark.asyncio
async def test_delete_patient(client: AsyncClient):
    headers = await _register_and_login(client, "doc5@test.com", "Doc Five")
    created = (await client.post("/api/v1/patients", json=PATIENT_PAYLOAD, headers=headers)).json()
    response = await client.delete(f"/api/v1/patients/{created['id']}", headers=headers)
    assert response.status_code == 200
    assert response.json()["success"] is True
    # Confirm it's gone
    gone = await client.get(f"/api/v1/patients/{created['id']}", headers=headers)
    assert gone.status_code == 404


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_patient_invalid_status(client: AsyncClient):
    headers = await _register_and_login(client, "doc6@test.com", "Doc Six")
    bad = {**PATIENT_PAYLOAD, "status": "Unknown"}
    response = await client.post("/api/v1/patients", json=bad, headers=headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_patient_invalid_age(client: AsyncClient):
    headers = await _register_and_login(client, "doc7@test.com", "Doc Seven")
    bad = {**PATIENT_PAYLOAD, "age": 200}
    response = await client.post("/api/v1/patients", json=bad, headers=headers)
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_search_by_name(client: AsyncClient):
    headers = await _register_and_login(client, "doc8@test.com", "Doc Eight")
    await client.post("/api/v1/patients", json=PATIENT_PAYLOAD, headers=headers)
    response = await client.get("/api/v1/patients/search?q=john", headers=headers)
    assert response.status_code == 200
    assert response.json()["total"] >= 1


@pytest.mark.asyncio
async def test_search_by_status(client: AsyncClient):
    headers = await _register_and_login(client, "doc9@test.com", "Doc Nine")
    await client.post("/api/v1/patients", json=PATIENT_PAYLOAD, headers=headers)
    response = await client.get("/api/v1/patients/search?q=Stable", headers=headers)
    assert response.status_code == 200
    assert response.json()["total"] >= 1


@pytest.mark.asyncio
async def test_search_by_phone(client: AsyncClient):
    headers = await _register_and_login(client, "doc10@test.com", "Doc Ten")
    await client.post("/api/v1/patients", json=PATIENT_PAYLOAD, headers=headers)
    response = await client.get("/api/v1/patients/search?q=555", headers=headers)
    assert response.status_code == 200
    assert response.json()["total"] >= 1


@pytest.mark.asyncio
async def test_search_no_results(client: AsyncClient):
    headers = await _register_and_login(client, "doc11@test.com", "Doc Eleven")
    response = await client.get("/api/v1/patients/search?q=zzznomatch", headers=headers)
    assert response.status_code == 200
    assert response.json()["total"] == 0


# ---------------------------------------------------------------------------
# Data isolation — doctor A cannot access doctor B's patients
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_isolation_get(client: AsyncClient):
    headers_a = await _register_and_login(client, "doca@test.com", "Doc A")
    headers_b = await _register_and_login(client, "docb@test.com", "Doc B")
    created = (await client.post("/api/v1/patients", json=PATIENT_PAYLOAD, headers=headers_a)).json()
    # Doctor B tries to read Doctor A's patient
    response = await client.get(f"/api/v1/patients/{created['id']}", headers=headers_b)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_isolation_update(client: AsyncClient):
    headers_a = await _register_and_login(client, "docc@test.com", "Doc C")
    headers_b = await _register_and_login(client, "docd@test.com", "Doc D")
    created = (await client.post("/api/v1/patients", json=PATIENT_PAYLOAD, headers=headers_a)).json()
    response = await client.put(
        f"/api/v1/patients/{created['id']}",
        json={"status": "Critical"},
        headers=headers_b,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_isolation_delete(client: AsyncClient):
    headers_a = await _register_and_login(client, "doce@test.com", "Doc E")
    headers_b = await _register_and_login(client, "docf@test.com", "Doc F")
    created = (await client.post("/api/v1/patients", json=PATIENT_PAYLOAD, headers=headers_a)).json()
    response = await client.delete(f"/api/v1/patients/{created['id']}", headers=headers_b)
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Linking interaction checks to patients
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_check_interaction_linked_to_patient(client: AsyncClient):
    headers = await _register_and_login(client, "docg@test.com", "Doc G")
    patient = (await client.post("/api/v1/patients", json=PATIENT_PAYLOAD, headers=headers)).json()

    with patch(
        "app.api.router.gemini_client.check_interaction",
        new=AsyncMock(return_value=MOCK_INTERACTION),
    ):
        response = await client.post(
            "/api/v1/check-interaction",
            json={"drug_1": "Aspirin", "drug_2": "Warfarin", "patient_id": patient["id"]},
            headers=headers,
        )
    assert response.status_code == 200
    assert response.json()["success"] is True


@pytest.mark.asyncio
async def test_check_interaction_wrong_patient(client: AsyncClient):
    """Linking an interaction to another doctor's patient returns 404."""
    headers_a = await _register_and_login(client, "doch@test.com", "Doc H")
    headers_b = await _register_and_login(client, "doci@test.com", "Doc I")
    patient = (await client.post("/api/v1/patients", json=PATIENT_PAYLOAD, headers=headers_a)).json()

    response = await client.post(
        "/api/v1/check-interaction",
        json={"drug_1": "Aspirin", "drug_2": "Warfarin", "patient_id": patient["id"]},
        headers=headers_b,
    )
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Patient interaction history
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_patient_interactions_endpoint(client: AsyncClient):
    headers = await _register_and_login(client, "docj@test.com", "Doc J")
    patient = (await client.post("/api/v1/patients", json=PATIENT_PAYLOAD, headers=headers)).json()

    with patch(
        "app.api.router.gemini_client.check_interaction",
        new=AsyncMock(return_value=MOCK_INTERACTION),
    ):
        await client.post(
            "/api/v1/check-interaction",
            json={"drug_1": "Aspirin", "drug_2": "Warfarin", "patient_id": patient["id"]},
            headers=headers,
        )

    response = await client.get(f"/api/v1/patients/{patient['id']}/interactions", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert len(body["data"]) >= 1
    assert body["data"][0]["patient_id"] == patient["id"]


@pytest.mark.asyncio
async def test_patient_interactions_isolation(client: AsyncClient):
    """Doctor B cannot fetch interaction history for Doctor A's patient."""
    headers_a = await _register_and_login(client, "dock@test.com", "Doc K")
    headers_b = await _register_and_login(client, "docl@test.com", "Doc L")
    patient = (await client.post("/api/v1/patients", json=PATIENT_PAYLOAD, headers=headers_a)).json()

    response = await client.get(
        f"/api/v1/patients/{patient['id']}/interactions", headers=headers_b
    )
    assert response.status_code == 404
