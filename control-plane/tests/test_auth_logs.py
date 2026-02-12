import asyncio

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.db.session import Base, get_session
from app.main import app
from app.api import dependencies as api_dependencies


@pytest.fixture(scope="session")
def test_client():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    session_factory = async_sessionmaker(bind=engine, expire_on_commit=False)

    async def override_get_session():
        async with session_factory() as session:
            yield session

    async def prepare_db():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.get_event_loop().run_until_complete(prepare_db())
    app.dependency_overrides[get_session] = override_get_session
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_auth_register_login_me_bearer_flow(test_client):
    register = test_client.post(
        "/api/v1/auth/register",
        json={"username": "tester_auth", "email": "tester_auth@example.com", "password": "secret123"},
    )
    assert register.status_code == 200

    login = test_client.post(
        "/api/v1/auth/login",
        json={"username": "tester_auth", "password": "secret123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    me = test_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me.status_code == 200
    assert me.json()["username"] == "tester_auth"


def test_logs_endpoint_returns_events(test_client):
    register = test_client.post(
        "/api/v1/devices/register",
        json={"public_key": "-----BEGIN RSA PUBLIC KEY-----\nLOGS\n-----END RSA PUBLIC KEY-----"},
    )
    assert register.status_code == 201
    device_id = register.json()["device_id"]

    heartbeat = test_client.post(
        f"/api/v1/devices/{device_id}/heartbeat",
        json={"agent_version": "0.1.0", "memory_mb": 128, "cpu_pct": 2.0, "status": "healthy"},
    )
    assert heartbeat.status_code == 200

    logs = test_client.get("/api/v1/logs", params={"limit": 10})
    assert logs.status_code == 200
    payload = logs.json()
    assert "logs" in payload
    assert isinstance(payload["logs"], list)
    assert len(payload["logs"]) >= 1
    assert {"timestamp", "level", "message"}.issubset(set(payload["logs"][0].keys()))


def test_production_requires_token_for_protected_endpoint(test_client):
    original_env = api_dependencies.settings.environment
    original_required = api_dependencies.settings.require_admin_auth
    try:
        api_dependencies.settings.environment = "production"
        api_dependencies.settings.require_admin_auth = False

        response = test_client.get("/api/v1/devices")
        assert response.status_code == 401
    finally:
        api_dependencies.settings.environment = original_env
        api_dependencies.settings.require_admin_auth = original_required


def test_production_allows_valid_token_for_protected_endpoint(test_client):
    original_env = api_dependencies.settings.environment
    original_required = api_dependencies.settings.require_admin_auth
    try:
        api_dependencies.settings.environment = "production"
        api_dependencies.settings.require_admin_auth = False

        register = test_client.post(
            "/api/v1/auth/register",
            json={
                "username": "prod_auth_user",
                "email": "prod_auth_user@example.com",
                "password": "secret123",
            },
        )
        assert register.status_code == 200

        login = test_client.post(
            "/api/v1/auth/login",
            json={"username": "prod_auth_user", "password": "secret123"},
        )
        assert login.status_code == 200
        token = login.json()["access_token"]

        devices = test_client.get(
            "/api/v1/devices",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert devices.status_code == 200
    finally:
        api_dependencies.settings.environment = original_env
        api_dependencies.settings.require_admin_auth = original_required
