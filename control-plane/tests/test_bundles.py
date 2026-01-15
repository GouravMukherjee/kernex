import asyncio
import json
import os
import tempfile

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.main import app
from app.db.session import Base, get_session
from app.config import get_settings


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


def test_upload_and_list_bundle(test_client, monkeypatch):
    # isolate bundle storage
    with tempfile.TemporaryDirectory() as tmpdir:
        monkeypatch.setenv("BUNDLE_STORAGE_PATH", tmpdir)
        # refresh settings cache
        from app import config as cfg
        cfg.get_settings.cache_clear()

        manifest = {"version": "v0.1", "model": {"name": "test-model", "size_mb": 1}}
        files = {
            "file": ("bundle.tar.gz", b"dummydata", "application/gzip"),
            "manifest": (None, json.dumps(manifest)),
        }
        resp = test_client.post("/api/v1/bundles", files=files)
        assert resp.status_code == 201, resp.text
        data = resp.json()
        assert data["version"] == "v0.1"
        # list
        list_resp = test_client.get("/api/v1/bundles")
        assert list_resp.status_code == 200
        assert len(list_resp.json()["bundles"]) == 1
