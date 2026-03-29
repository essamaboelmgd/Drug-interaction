"""Tests for authentication endpoints: register, login, and /auth/me."""

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.fixture
async def client():
    """Async test client backed by the FastAPI app."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    response = await client.post(
        "/auth/register",
        json={"email": "alice@example.com", "password": "secret123", "name": "Alice"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "alice@example.com"
    assert body["name"] == "Alice"
    assert "id" in body
    assert "hashed_password" not in body


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {"email": "bob@example.com", "password": "secret123", "name": "Bob"}
    await client.post("/auth/register", json=payload)
    response = await client.post("/auth/register", json=payload)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_register_invalid_email(client: AsyncClient):
    response = await client.post(
        "/auth/register",
        json={"email": "not-an-email", "password": "secret123", "name": "Test"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_short_password(client: AsyncClient):
    response = await client.post(
        "/auth/register",
        json={"email": "short@example.com", "password": "abc", "name": "Short"},
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await client.post(
        "/auth/register",
        json={"email": "carol@example.com", "password": "secret123", "name": "Carol"},
    )
    response = await client.post(
        "/auth/login",
        json={"email": "carol@example.com", "password": "secret123"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post(
        "/auth/register",
        json={"email": "dave@example.com", "password": "secret123", "name": "Dave"},
    )
    response = await client.post(
        "/auth/login",
        json={"email": "dave@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_user(client: AsyncClient):
    response = await client.post(
        "/auth/login",
        json={"email": "nobody@example.com", "password": "secret123"},
    )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# /auth/me
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient):
    await client.post(
        "/auth/register",
        json={"email": "eve@example.com", "password": "secret123", "name": "Eve"},
    )
    login = await client.post(
        "/auth/login",
        json={"email": "eve@example.com", "password": "secret123"},
    )
    token = login.json()["access_token"]

    response = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "eve@example.com"


@pytest.mark.asyncio
async def test_get_me_no_token(client: AsyncClient):
    response = await client.get("/auth/me")
    assert response.status_code == 403  # HTTPBearer returns 403 when header is missing
