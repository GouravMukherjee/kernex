"""
Integration tests for Slice 3: Bundle Download, Extraction, and Deployment Execution
"""
import asyncio
import json
import tarfile
import tempfile
from pathlib import Path
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import select

from app.main import app
from app.db.session import Base, get_session
from app.models.bundle import Bundle
from app.models.device import Device
from app.models.deployment import Deployment


@pytest.fixture(scope="module")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="module")
def test_client():
    """Create a test client with in-memory SQLite database."""
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


@pytest.fixture
def client(test_client):
    """Provide test_client as 'client' fixture."""
    return test_client


@pytest.fixture
async def session():
    """Provide async session for tests."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    TestSession = async_sessionmaker(bind=engine, expire_on_commit=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestSession() as sess:
        yield sess


def test_download_bundle_endpoint_returns_file(test_client):
    """Test that GET /bundles/{bundle_id} returns the bundle file."""
    # Create a simple tar.gz file
    with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as tmp:
        tmp_path = Path(tmp.name)
        
        # Create a minimal bundle archive
        with tarfile.open(tmp_path, "w:gz") as tar:
            info = tarfile.TarInfo(name="manifest.json")
            manifest_data = json.dumps({"version": "1.0", "model": "test"}).encode()
            info.size = len(manifest_data)
            tar.addfile(info, BytesIO(manifest_data))
        
        # Create a bundle manually using the DB session
        # Note: We can't directly access session here, so we'll test via upload instead
        # Upload bundle
        with open(tmp_path, "rb") as f:
            response = test_client.post(
                "/api/v1/bundles",
                files={"file": f},
                data={"manifest": json.dumps({"version": "1.0", "model": "test"})}
            )
        
        assert response.status_code == 201
        bundle_data = response.json()
        bundle_id = bundle_data["bundle_id"]
        
        # Download via API
        download_resp = test_client.get(f"/api/v1/bundles/{bundle_id}")
        assert download_resp.status_code == 200
        assert download_resp.headers["content-type"] == "application/octet-stream"
        assert len(download_resp.content) > 0


def test_deployment_with_bundle_includes_bundle_id_in_command(test_client):
    """Test that heartbeat returns commands with bundle_id for download."""
    # Register device
    device_resp = test_client.post(
        "/api/v1/devices/register",
        json={"public_key": "key123", "device_type": "test"}
    )
    device_data = device_resp.json()
    device_id = device_data["device_id"]
    
    # Create and upload bundle
    with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as tmp:
        tmp_path = Path(tmp.name)
        with tarfile.open(tmp_path, "w:gz") as tar:
            info = tarfile.TarInfo(name="manifest.json")
            manifest_data = json.dumps({"version": "2.0", "model": "test"}).encode()
            info.size = len(manifest_data)
            tar.addfile(info, BytesIO(manifest_data))
        
        with open(tmp_path, "rb") as f:
            bundle_resp = test_client.post(
                "/api/v1/bundles",
                files={"file": f},
                data={"manifest": json.dumps({"version": "2.0", "model": "test"})}
            )
        
        assert bundle_resp.status_code == 201
        bundle_id = bundle_resp.json()["bundle_id"]
    
    # Create deployment
    deploy_resp = test_client.post(
        "/api/v1/deployments",
        json={
            "bundle_version": "2.0",
            "target_devices": [device_id]
        }
    )
    assert deploy_resp.status_code == 201
    deployment_id = deploy_resp.json()["deployment_id"]
    
    # Send heartbeat
    hb_resp = test_client.post(
        f"/api/v1/devices/{device_id}/heartbeat",
        json={
            "agent_version": "0.1.0",
            "memory_mb": 256,
            "cpu_pct": 10.0,
            "status": "online",
        }
    )
    
    assert hb_resp.status_code == 200
    commands = hb_resp.json()["commands"]
    assert len(commands) == 1
    
    cmd = commands[0]
    assert cmd["type"] == "deploy"
    assert cmd["deployment_id"] == deployment_id
    assert cmd["bundle_id"] == bundle_id  # ← NEW: bundle_id included
    assert cmd["bundle_version"] == "2.0"


def test_deployment_result_success_updates_status(test_client):
    """Test POST /deployments/{id}/result updates deployment status."""
    # Create device
    device_resp = test_client.post(
        "/api/v1/devices/register",
        json={"public_key": "key456", "device_type": "test"}
    )
    device_id = device_resp.json()["device_id"]
    
    # Create bundle
    with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as tmp:
        tmp_path = Path(tmp.name)
        with tarfile.open(tmp_path, "w:gz") as tar:
            info = tarfile.TarInfo(name="manifest.json")
            manifest_data = json.dumps({"version": "3.0"}).encode()
            info.size = len(manifest_data)
            tar.addfile(info, BytesIO(manifest_data))
        
        with open(tmp_path, "rb") as f:
            bundle_resp = test_client.post(
                "/api/v1/bundles",
                files={"file": f},
                data={"manifest": json.dumps({"version": "3.0"})}
            )
    
    # Create deployment
    deploy_resp = test_client.post(
        "/api/v1/deployments",
        json={
            "bundle_version": "3.0",
            "target_devices": [device_id]
        }
    )
    deployment_id = deploy_resp.json()["deployment_id"]
    
    # Report success
    result_resp = test_client.post(
        f"/api/v1/deployments/{deployment_id}/result",
        params={
            "device_id": device_id,
            "status_str": "success",
        }
    )
    
    assert result_resp.status_code == 200
    assert result_resp.json()["success"] == True
    
    # Verify deployment status updated
    detail_resp = test_client.get(f"/api/v1/deployments/{deployment_id}")
    assert detail_resp.json()["status"] == "success"


def test_deployment_result_failure_with_error_message(test_client):
    """Test POST /deployments/{id}/result with failure status and error message."""
    # Create device
    device_resp = test_client.post(
        "/api/v1/devices/register",
        json={"public_key": "key789", "device_type": "test"}
    )
    device_id = device_resp.json()["device_id"]
    
    # Create bundle
    with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as tmp:
        tmp_path = Path(tmp.name)
        with tarfile.open(tmp_path, "w:gz") as tar:
            info = tarfile.TarInfo(name="manifest.json")
            manifest_data = json.dumps({"version": "4.0"}).encode()
            info.size = len(manifest_data)
            tar.addfile(info, BytesIO(manifest_data))
        
        with open(tmp_path, "rb") as f:
            bundle_resp = test_client.post(
                "/api/v1/bundles",
                files={"file": f},
                data={"manifest": json.dumps({"version": "4.0"})}
            )
    
    # Create deployment
    deploy_resp = test_client.post(
        "/api/v1/deployments",
        json={
            "bundle_version": "4.0",
            "target_devices": [device_id]
        }
    )
    deployment_id = deploy_resp.json()["deployment_id"]
    
    # Report failure
    error_msg = "Checksum mismatch: expected abc, got def"
    result_resp = test_client.post(
        f"/api/v1/deployments/{deployment_id}/result",
        params={
            "device_id": device_id,
            "status_str": "failed",
            "error_message": error_msg,
        }
    )
    
    assert result_resp.status_code == 200
    
    # Verify deployment status and error message
    detail_resp = test_client.get(f"/api/v1/deployments/{deployment_id}")
    data = detail_resp.json()
    assert data["status"] == "failed"
    assert data["error_message"] == error_msg


def test_deployment_result_rejects_non_target_device(test_client):
    """Test that result endpoint rejects reports from devices not in target list."""
    # Create device 1 and device 2
    dev1_resp = test_client.post(
        "/api/v1/devices/register",
        json={"public_key": "key111", "device_type": "test"}
    )
    device1_id = dev1_resp.json()["device_id"]
    
    dev2_resp = test_client.post(
        "/api/v1/devices/register",
        json={"public_key": "key222", "device_type": "test"}
    )
    device2_id = dev2_resp.json()["device_id"]
    
    # Create bundle
    with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as tmp:
        tmp_path = Path(tmp.name)
        with tarfile.open(tmp_path, "w:gz") as tar:
            info = tarfile.TarInfo(name="manifest.json")
            manifest_data = json.dumps({"version": "5.0"}).encode()
            info.size = len(manifest_data)
            tar.addfile(info, BytesIO(manifest_data))
        
        with open(tmp_path, "rb") as f:
            bundle_resp = test_client.post(
                "/api/v1/bundles",
                files={"file": f},
                data={"manifest": json.dumps({"version": "5.0"})}
            )
    
    # Deployment targets only device1
    deploy_resp = test_client.post(
        "/api/v1/deployments",
        json={
            "bundle_version": "5.0",
            "target_devices": [device1_id]
        }
    )
    deployment_id = deploy_resp.json()["deployment_id"]
    
    # Device2 tries to report result
    result_resp = test_client.post(
        f"/api/v1/deployments/{deployment_id}/result",
        params={
            "device_id": device2_id,
            "status_str": "success",
        }
    )
    
    # Should be rejected (403 Forbidden)
    assert result_resp.status_code == 403


def test_deployment_result_invalid_status(test_client):
    """Test that result endpoint rejects invalid status values."""
    # Create device
    device_resp = test_client.post(
        "/api/v1/devices/register",
        json={"public_key": "key333", "device_type": "test"}
    )
    device_id = device_resp.json()["device_id"]
    
    # Create bundle
    with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as tmp:
        tmp_path = Path(tmp.name)
        with tarfile.open(tmp_path, "w:gz") as tar:
            info = tarfile.TarInfo(name="manifest.json")
            manifest_data = json.dumps({"version": "6.0"}).encode()
            info.size = len(manifest_data)
            tar.addfile(info, BytesIO(manifest_data))
        
        with open(tmp_path, "rb") as f:
            bundle_resp = test_client.post(
                "/api/v1/bundles",
                files={"file": f},
                data={"manifest": json.dumps({"version": "6.0"})}
            )
    
    # Create deployment
    deploy_resp = test_client.post(
        "/api/v1/deployments",
        json={
            "bundle_version": "6.0",
            "target_devices": [device_id]
        }
    )
    deployment_id = deploy_resp.json()["deployment_id"]
    
    # Try invalid status
    result_resp = test_client.post(
        f"/api/v1/deployments/{deployment_id}/result",
        params={
            "device_id": device_id,
            "status_str": "invalid",
        }
    )
    
    assert result_resp.status_code == 400
