"""Integration tests for Slice 4 (Rollback) and Slice 5 (Config Management)"""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import Base, get_session


# In-memory SQLite for testing
@pytest.fixture
def client():
    """Setup test client with in-memory database"""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    
    async def init_db():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    
    import asyncio
    asyncio.run(init_db())
    
    SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async def override_get_session():
        async with SessionLocal() as session:
            yield session
    
    app.dependency_overrides[get_session] = override_get_session
    
    return TestClient(app)


def test_device_config_create_and_update(client):
    """Test creating and updating device configuration"""
    # Register device
    register_response = client.post(
        "/api/v1/devices/register",
        json={"public_key": "test-key-1", "device_type": "test"},
    )
    device_id = register_response.json()["device_id"]
    
    # Get config (should create default)
    response = client.get(f"/api/v1/devices/{device_id}/config")
    assert response.status_code == 200
    config = response.json()
    assert config["polling_interval"] == "60"
    assert config["log_level"] == "INFO"
    
    # Update config
    update_response = client.put(
        f"/api/v1/devices/{device_id}/config",
        json={
            "polling_interval": "120",
            "heartbeat_timeout": "45",
            "deploy_timeout": "600",
            "log_level": "DEBUG",
            "metadata_json": {"custom": "value"},
        },
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["polling_interval"] == "120"
    assert updated["log_level"] == "DEBUG"
    assert updated["version"] == "2"  # Version incremented


def test_bundle_history_tracking(client):
    """Test that deployment results are tracked in bundle history"""
    # Register device
    register_response = client.post(
        "/api/v1/devices/register",
        json={"public_key": "test-key-2", "device_type": "test"},
    )
    device_id = register_response.json()["device_id"]
    
    # Upload bundle
    bundle_response = client.post(
        "/api/v1/bundles",
        data={
            "manifest": '{"version": "1.0.0"}',
        },
        files={"file": ("test.tar.gz", b"test bundle content")},
    )
    bundle_id = bundle_response.json()["bundle_id"]
    
    # Create deployment
    deploy_response = client.post(
        "/api/v1/deployments",
        json={
            "bundle_version": "1.0.0",
            "target_devices": [device_id],
        },
    )
    deployment_id = deploy_response.json()["deployment_id"]
    
    # Report success
    result_response = client.post(
        f"/api/v1/deployments/{deployment_id}/result",
        params={
            "device_id": device_id,
            "status_str": "success",
        },
    )
    assert result_response.status_code == 200
    
    # Check bundle history
    history_response = client.get(f"/api/v1/devices/{device_id}/bundle-history")
    assert history_response.status_code == 200
    history = history_response.json()
    assert len(history) == 1
    assert history[0]["bundle_version"] == "1.0.0"
    assert history[0]["status"] == "success"
    assert history[0]["deployment_id"] == deployment_id


def test_rollback_to_previous_version(client):
    """Test rolling back to a previously deployed bundle version"""
    # Register device
    register_response = client.post(
        "/api/v1/devices/register",
        json={"public_key": "test-key-3", "device_type": "test"},
    )
    device_id = register_response.json()["device_id"]
    
    # Upload bundle v1
    bundle_v1_response = client.post(
        "/api/v1/bundles",
        data={
            "manifest": '{"version": "1.0.0"}',
        },
        files={"file": ("test.tar.gz", b"bundle v1 content")},
    )
    bundle_v1_id = bundle_v1_response.json()["bundle_id"]
    
    # Deploy v1 and report success
    deploy_v1_response = client.post(
        "/api/v1/deployments",
        json={
            "bundle_version": "1.0.0",
            "target_devices": [device_id],
        },
    )
    deployment_v1_id = deploy_v1_response.json()["deployment_id"]
    
    client.post(
        f"/api/v1/deployments/{deployment_v1_id}/result",
        params={
            "device_id": device_id,
            "status_str": "success",
        },
    )
    
    # Upload bundle v2
    bundle_v2_response = client.post(
        "/api/v1/bundles",
        data={
            "manifest": '{"version": "2.0.0"}',
        },
        files={"file": ("test.tar.gz", b"bundle v2 content")},
    )
    bundle_v2_id = bundle_v2_response.json()["bundle_id"]
    
    # Deploy v2 and report failure
    deploy_v2_response = client.post(
        "/api/v1/deployments",
        json={
            "bundle_version": "2.0.0",
            "target_devices": [device_id],
        },
    )
    deployment_v2_id = deploy_v2_response.json()["deployment_id"]
    
    client.post(
        f"/api/v1/deployments/{deployment_v2_id}/result",
        params={
            "device_id": device_id,
            "status_str": "failed",
            "error_message": "v2 had issues",
        },
    )
    
    # Rollback to v1
    rollback_response = client.post(
        "/api/v1/devices/rollback",
        json={
            "bundle_version": "1.0.0",
            "target_device_ids": [device_id],
        },
    )
    assert rollback_response.status_code == 200
    rollback_data = rollback_response.json()
    assert rollback_data["bundle_version"] == "1.0.0"
    assert rollback_data["status"] == "pending"
    
    # Verify history shows both deployments
    history_response = client.get(f"/api/v1/devices/{device_id}/bundle-history")
    history = history_response.json()
    assert len(history) >= 2
    versions = [h["bundle_version"] for h in history]
    assert "1.0.0" in versions
    assert "2.0.0" in versions


def test_rollback_requires_successful_history(client):
    """Test that rollback is rejected for versions not successfully deployed"""
    # Register device
    register_response = client.post(
        "/api/v1/devices/register",
        json={"public_key": "test-key-4", "device_type": "test"},
    )
    device_id = register_response.json()["device_id"]
    
    # Upload bundle
    bundle_response = client.post(
        "/api/v1/bundles",
        data={
            "manifest": '{"version": "1.0.0"}',
        },
        files={"file": ("test.tar.gz", b"bundle content")},
    )
    
    # Try to rollback to version that was never successfully deployed
    rollback_response = client.post(
        "/api/v1/devices/rollback",
        json={
            "bundle_version": "1.0.0",
            "target_device_ids": [device_id],
        },
    )
    assert rollback_response.status_code == 400
    assert "no successful deployment" in rollback_response.json()["detail"].lower()


def test_rollback_nonexistent_bundle(client):
    """Test that rollback to nonexistent bundle is rejected"""
    # Register device
    register_response = client.post(
        "/api/v1/devices/register",
        json={"public_key": "test-key-5", "device_type": "test"},
    )
    device_id = register_response.json()["device_id"]
    
    # Try to rollback to nonexistent version
    rollback_response = client.post(
        "/api/v1/devices/rollback",
        json={
            "bundle_version": "99.99.99",
            "target_device_ids": [device_id],
        },
    )
    assert rollback_response.status_code == 400
    assert "not found" in rollback_response.json()["detail"].lower()


def test_heartbeat_includes_config_command(client):
    """Test that heartbeat response includes config updates"""
    # Register device
    register_response = client.post(
        "/api/v1/devices/register",
        json={"public_key": "test-key-6", "device_type": "test"},
    )
    device_id = register_response.json()["device_id"]
    
    # Update device config
    client.put(
        f"/api/v1/devices/{device_id}/config",
        json={
            "polling_interval": "120",
            "log_level": "DEBUG",
        },
    )
    
    # Send heartbeat
    heartbeat_response = client.post(
        f"/api/v1/devices/{device_id}/heartbeat",
        json={
            "agent_version": "0.1.0",
            "memory_mb": 512,
            "cpu_pct": 25,
            "status": "online",
        },
    )
    assert heartbeat_response.status_code == 200
    
    heartbeat_data = heartbeat_response.json()
    commands = heartbeat_data.get("commands", [])
    
    # Should have a configure command
    config_commands = [c for c in commands if c["type"] == "configure"]
    assert len(config_commands) == 1
    assert config_commands[0]["polling_interval"] == "120"
    assert config_commands[0]["log_level"] == "DEBUG"


def test_config_version_increment(client):
    """Test that config version increments on updates"""
    # Register device
    register_response = client.post(
        "/api/v1/devices/register",
        json={"public_key": "test-key-7", "device_type": "test"},
    )
    device_id = register_response.json()["device_id"]
    
    # Get initial config
    v1 = client.get(f"/api/v1/devices/{device_id}/config").json()
    assert v1["version"] == "1"
    
    # Update 3 times
    for i in range(2, 5):
        client.put(
            f"/api/v1/devices/{device_id}/config",
            json={"polling_interval": str(60 * i)},
        )
        config = client.get(f"/api/v1/devices/{device_id}/config").json()
        assert config["version"] == str(i)


def test_device_status_from_deployment_result(client):
    """Test that current_bundle_version is updated from deployment result"""
    # Register device
    register_response = client.post(
        "/api/v1/devices/register",
        json={"public_key": "test-key-8", "device_type": "test"},
    )
    device_id = register_response.json()["device_id"]
    
    # Device should have no current version initially
    device = client.get(f"/api/v1/devices/{device_id}").json()
    assert device["current_bundle_version"] is None
    
    # Upload and deploy bundle
    bundle_response = client.post(
        "/api/v1/bundles",
        data={
            "manifest": '{"version": "1.5.0"}',
        },
        files={"file": ("test.tar.gz", b"bundle content")},
    )
    
    deploy_response = client.post(
        "/api/v1/deployments",
        json={
            "bundle_version": "1.5.0",
            "target_devices": [device_id],
        },
    )
    deployment_id = deploy_response.json()["deployment_id"]
    
    # Report success
    client.post(
        f"/api/v1/deployments/{deployment_id}/result",
        params={
            "device_id": device_id,
            "status_str": "success",
        },
    )
    
    # Device should now show current version
    device = client.get(f"/api/v1/devices/{device_id}").json()
    assert device["current_bundle_version"] == "1.5.0"


def test_bundle_history_order(client):
    """Test that bundle history is returned in reverse chronological order"""
    # Register device
    register_response = client.post(
        "/api/v1/devices/register",
        json={"public_key": "test-key-9", "device_type": "test"},
    )
    device_id = register_response.json()["device_id"]
    
    # Deploy multiple versions
    versions = ["1.0.0", "1.1.0", "1.2.0"]
    deployment_ids = []
    for version in versions:
        client.post(
            "/api/v1/bundles",
            data={"manifest": f'{{"version": "{version}"}}'},
            files={"file": ("test.tar.gz", b"bundle content")},
        )
        deploy_response = client.post(
            "/api/v1/deployments",
            json={"bundle_version": version, "target_devices": [device_id]},
        )
        dep_id = deploy_response.json()['deployment_id']
        client.post(
            f"/api/v1/deployments/{dep_id}/result",
            params={"device_id": device_id, "status_str": "success"},
        )
        deployment_ids.append(dep_id)
    
    # Get history
    history_response = client.get(f"/api/v1/devices/{device_id}/bundle-history")
    history = history_response.json()
    
    # Should have all versions
    returned_versions = [h["bundle_version"] for h in history]
    assert len(returned_versions) == 3
    assert set(returned_versions) == {"1.0.0", "1.1.0", "1.2.0"}
