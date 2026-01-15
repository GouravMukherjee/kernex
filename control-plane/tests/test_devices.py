import asyncio
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.main import app
from app.db.session import Base, get_session


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_client():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    TestSession = async_sessionmaker(bind=engine, expire_on_commit=False)

    async def override_get_session():
        async with TestSession() as session:
            yield session

    async def prepare_db():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    asyncio.get_event_loop().run_until_complete(prepare_db())
    app.dependency_overrides[get_session] = override_get_session
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_device_register(test_client):
    payload = {
        "public_key": "-----BEGIN RSA PUBLIC KEY-----\nTEST\n-----END RSA PUBLIC KEY-----",
        "device_type": "raspberry_pi",
        "hardware_metadata": {"ram_gb": 4},
        "org_id": "org-123",
    }
    response = test_client.post("/api/v1/devices/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "device_id" in data
    uuid.UUID(data["device_id"])


def test_device_register_duplicate_public_key_conflict(test_client):
    payload = {
        "public_key": "-----BEGIN RSA PUBLIC KEY-----\nDUP\n-----END RSA PUBLIC KEY-----",
        "device_type": "raspberry_pi",
    }
    first = test_client.post("/api/v1/devices/register", json=payload)
    assert first.status_code == 201
    second = test_client.post("/api/v1/devices/register", json=payload)
    assert second.status_code == 201
    assert second.json()["device_id"] == first.json()["device_id"]


def test_device_heartbeat(test_client):
    reg = test_client.post(
        "/api/v1/devices/register",
        json={
            "public_key": "-----BEGIN RSA PUBLIC KEY-----\nHB\n-----END RSA PUBLIC KEY-----"
        },
    )
    device_id = reg.json()["device_id"]
    hb_resp = test_client.post(
        f"/api/v1/devices/{device_id}/heartbeat",
        json={"agent_version": "0.1.0", "memory_mb": 512, "cpu_pct": 12.5, "status": "healthy"},
    )
    assert hb_resp.status_code == 200
    assert hb_resp.json()["commands"] == []


def test_list_devices(test_client):
    # Register two devices
    test_client.post(
        "/api/v1/devices/register",
        json={"public_key": "-----BEGIN RSA PUBLIC KEY-----\nDEV1_LIST\n-----END RSA PUBLIC KEY-----"},
    )
    test_client.post(
        "/api/v1/devices/register",
        json={"public_key": "-----BEGIN RSA PUBLIC KEY-----\nDEV2_LIST\n-----END RSA PUBLIC KEY-----"},
    )
    
    # List devices (just verify endpoint works)
    resp = test_client.get("/api/v1/devices")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 2
    assert len(data["devices"]) >= 2
    assert "device_id" in data["devices"][0]


def test_get_device_detail(test_client):
    reg = test_client.post(
        "/api/v1/devices/register",
        json={
            "public_key": "-----BEGIN RSA PUBLIC KEY-----\nDETAIL_TEST\n-----END RSA PUBLIC KEY-----",
            "device_type": "raspberry_pi",
            "hardware_metadata": {"ram_gb": 8, "cpu_cores": 4},
        },
    )
    device_id = reg.json()["device_id"]
    
    # Get device detail immediately after registration
    resp = test_client.get(f"/api/v1/devices/{device_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["device_id"] == device_id
    assert data["device_type"] == "raspberry_pi"
    assert data["hardware_metadata"]["ram_gb"] == 8
    assert data["status"] == "online"
    # Note: last_heartbeat may be set if previous tests sent heartbeats in shared fixture


def test_device_heartbeat_updates_last_heartbeat(test_client):
    reg = test_client.post(
        "/api/v1/devices/register",
        json={"public_key": "-----BEGIN RSA PUBLIC KEY-----\nHB_UPDATE\n-----END RSA PUBLIC KEY-----"},
    )
    device_id = reg.json()["device_id"]
    
    # Send heartbeat
    test_client.post(
        f"/api/v1/devices/{device_id}/heartbeat",
        json={"agent_version": "0.1.0", "memory_mb": 512, "cpu_pct": 12.5, "status": "healthy"},
    )
    
    # Check device detail shows last_heartbeat
    resp = test_client.get(f"/api/v1/devices/{device_id}")
    data = resp.json()
    assert data["last_heartbeat"] is not None
    assert data["status"] == "healthy"


def test_heartbeat_with_pending_deployment(test_client):
    # Register device
    dev_reg = test_client.post(
        "/api/v1/devices/register",
        json={"public_key": "-----BEGIN RSA PUBLIC KEY-----\nDEPL\n-----END RSA PUBLIC KEY-----"},
    )
    device_id = dev_reg.json()["device_id"]
    
    # Upload bundle
    import json as json_lib
    manifest = json_lib.dumps({"version": "v1.0.0", "model": {"name": "test_model", "size_mb": 100}})
    bundle_resp = test_client.post(
        "/api/v1/bundles",
        files={"file": ("model.tar.gz", b"fake_bundle_content")},
        data={"manifest": manifest},
    )
    assert bundle_resp.status_code == 201
    
    # Create deployment targeting device
    deploy_resp = test_client.post(
        "/api/v1/deployments",
        json={"bundle_version": "v1.0.0", "target_devices": [device_id]},
    )
    assert deploy_resp.status_code == 201
    deployment_id = deploy_resp.json()["deployment_id"]
    
    # Send heartbeat - should return deployment command
    hb_resp = test_client.post(
        f"/api/v1/devices/{device_id}/heartbeat",
        json={"agent_version": "0.1.0", "memory_mb": 512, "cpu_pct": 12.5, "status": "healthy"},
    )
    assert hb_resp.status_code == 200
    commands = hb_resp.json()["commands"]
    assert len(commands) == 1
    assert commands[0]["type"] == "deploy"
    assert commands[0]["deployment_id"] == deployment_id
    assert commands[0]["bundle_version"] == "v1.0.0"
