# Kernex AI Coding Instructions

## Architecture Overview

**Kernex** is a device management system for deploying ML models/bundles to edge devices. Two main components:

1. **Control Plane** (`control-plane/`): FastAPI REST API managing devices, bundles, deployments
2. **Runtime** (`runtime/`): Device agent that registers, sends heartbeats, receives/executes commands

### Data Flow
- Devices register with RSA public keys, get unique `device_id`
- Continuous heartbeat loop (default 60s interval) polls for commands
- Commands returned in heartbeat responses trigger deployments/rollbacks
- Bundles uploaded to control plane are deployed via deployment targets

### Key Models (SQLAlchemy)
- `Device`: device_id, public_key, hardware_metadata, current_bundle_version, last_heartbeat
- `Bundle`: version (unique), checksum_sha256, manifest (JSON), storage_path
- `Deployment`: bundle_id, target_device_ids (JSON array), status (pending/in_progress/success/failed)
- `Heartbeat`: device_id, agent_version, memory_mb, cpu_pct, status

## Development Workflow

### Running Control Plane
```powershell
cd control-plane
$env:DATABASE_URL="sqlite+aiosqlite:///./dev.db"  # SQLite for dev; asyncpg for Postgres
python -m app.main
```
- Default: http://localhost:8000
- API prefix: `/api/v1`
- Auto-migration on startup via `init_db()` in [app/main.py](control-plane/app/main.py)

### Running Runtime Agent
```powershell
cd runtime
$env:CONTROL_PLANE_URL="http://localhost:8000/api/v1"
python -m kernex
```
- Generates RSA4096 keypair at `./device_key.pem` if missing
- Caches device_id in `./device_config.json`
- Heartbeat loop with exponential backoff (1s→60s max)

### Testing
```bash
pytest control-plane/tests/test_devices.py
pytest control-plane/tests/test_bundles.py
```
- Tests use in-memory SQLite (`sqlite+aiosqlite:///:memory:`)
- Override `get_session` dependency for isolated test DB
- Fixtures in each test file create fresh DB schema

## Code Conventions

### Configuration Pattern
Both components use Pydantic `Settings` with `@lru_cache()`:
```python
from functools import lru_cache
from pydantic import BaseModel, Field

class Settings(BaseModel):
    control_plane_url: AnyHttpUrl = Field(default=os.getenv("CONTROL_PLANE_URL", "http://localhost:8000/api/v1"))

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```
Environment variables override defaults; no `.env` files currently used.

### FastAPI Router Structure
- API versions under `app/api/v1/` with per-resource routers
- Each router file (e.g., [devices.py](control-plane/app/api/v1/devices.py)) defines `router = APIRouter(prefix="/devices", tags=["devices"])`
- Main [api/__init__.py](control-plane/app/api/__init__.py) includes all routers in `api_router`
- Dependency injection for DB sessions: `session: AsyncSession = Depends(get_session)`

### SQLAlchemy Async Pattern
```python
from sqlalchemy import select
device = await session.scalar(select(Device).where(Device.device_id == device_id))
session.add(device)
await session.commit()
```
- Use `session.scalar()` for single results, `session.execute()` for multiple
- Models in `app/models/` inherit from `Base = declarative_base()`

### Idempotency Strategy
- Device registration: re-registering same public_key returns existing device_id (see [devices.py#L26-L29](control-plane/app/api/v1/devices.py#L26-L29))
- Heartbeats naturally idempotent (updates last_heartbeat timestamp)
- Bundle uploads: duplicate versions raise 409 Conflict (see [bundles.py#L58-L59](control-plane/app/api/v1/bundles.py#L58-L59))

## Project-Specific Patterns

### Command Polling in Heartbeats
Heartbeat endpoint returns commands array (see [devices.py#L70-L81](control-plane/app/api/v1/devices.py#L70-L81)):
```python
# Control plane builds commands from pending deployments
deployments = [d for d in pending_deployments if device_id in d.target_device_ids]
commands = [{"type": "deploy", "deployment_id": d.id, "bundle_version": bundle.version}]
return HeartbeatResponse(commands=commands)
```
Runtime agent receives commands but currently stubs execution (slice 2 implemented, deployment execution pending).

### Bundle Storage
- Bundles stored as files in `BUNDLE_STORAGE_PATH` (default `./data/bundles`)
- Filename: `{version}-{original_filename}`
- SHA256 checksum computed on upload and stored in DB
- Manifest is JSON string posted as form field alongside multipart file upload

### Device Identity
- Devices generate RSA4096 keypairs locally ([identity.py](runtime/kernex/device/identity.py))
- Public key sent during registration; private key for future signature auth (not yet implemented)
- `device_config.json` caches device_id to avoid re-registration

### Incremental Development ("Slices")
Project built in slices per docs:
- ✅ Slice 1: Device registration
- ✅ Slice 2: Heartbeat + command polling (commands stubbed)
- 🔲 Slice 3+: Bundle upload/download, deployment execution, rollback

When implementing new features, follow slice approach: minimal end-to-end implementation before expanding.

## Common Tasks

**Add new API endpoint**: Create route in `control-plane/app/api/v1/{resource}.py`, add schemas to `app/schemas/{resource}.py`, register router in `api/__init__.py`

**Add new model**: Define in `app/models/{model}.py` inheriting `Base`, import in `app/models/__init__.py` for migration discovery

**Update runtime behavior**: Main loop in [runtime/kernex/main.py](runtime/kernex/main.py); config in [config.py](runtime/kernex/config.py); device utilities in `device/` subdirectory

**Add tests**: Follow pattern in [test_devices.py](control-plane/tests/test_devices.py) with in-memory DB fixture and dependency override

## External Dependencies

- **FastAPI + Uvicorn**: Control plane API server
- **SQLAlchemy 2.0 async**: ORM with asyncpg (Postgres) or aiosqlite (dev)
- **Pydantic 2.x**: Request/response schemas and settings
- **httpx**: Async HTTP client in runtime
- **cryptography**: RSA keypair generation for device identity

No authentication currently enforced (planned: RSA signatures for devices, JWT for users per [api-spec.md](docs/api-spec.md)).
