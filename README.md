# Kernex

> A device management and ML bundle deployment system for edge devices, with an intelligent control plane and runtime agent architecture.

[![Python 3.11+](https://img.shields.io/badge/python-3.11%2B-blue)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green)](https://fastapi.tiangolo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🧠 Core Philosophy

Kernex is built around fundamental principles for edge AI deployment:

- **Device-Centric** – Every device registers, maintains identity, and receives secure commands
- **Minimal Footprint** – Lightweight runtime agent suitable for edge hardware
- **Bundle-Based Deployment** – Model/code bundles versioned, checksummed, and deployed atomically
- **Command-Driven Control** – Devices poll heartbeat endpoint, pull commands asynchronously
- **Privacy-First** – Local execution by default, encrypted device identity with RSA keypairs

---

## 🏗️ Architecture

Kernex is a **two-component system** with distinct responsibilities:

```
┌─────────────────────────────────────────────────────┐
│         CONTROL PLANE (FastAPI REST API)            │
│   • Device registration & identity management       │
│   • Bundle versioning & storage                     │
│   • Deployment orchestration & scheduling           │
│   • Command generation for device polling           │
└────────────────────┬────────────────────────────────┘
                     │
        HTTP Heartbeat (Every 60s)
                     │
┌────────────────────▼────────────────────────────────┐
│       RUNTIME AGENT (Device/Edge Agent)             │
│   • Device discovery & RSA keypair generation       │
│   • Heartbeat polling loop with backoff             │
│   • Bundle download & execution                     │
│   • Status reporting & metrics collection           │
└─────────────────────────────────────────────────────┘
```

**Data Flow:**
1. Device generates RSA keypair, registers with control plane → receives `device_id`
2. Device enters heartbeat loop (default 60s interval), sends metrics (CPU, memory, agent version)
3. Control plane polls pending deployments, returns commands in heartbeat response
4. Device executes commands (deploy bundle, rollback, etc.) and reports status
5. Control plane tracks deployment progress and device health

---

## ✨ Key Features

### Device Management 🔌
- ✅ Unique device registration with RSA public key authentication
- ✅ Automatic keypair generation on first run
- ✅ Persistent device identity caching (`device_config.json`)
- ✅ Real-time heartbeat monitoring (last_heartbeat tracking)
- ✅ Hardware metadata collection (CPU %, memory, agent version)

### Bundle Management 📦
- ✅ Version-based bundle uploads with SHA256 checksumming
- ✅ JSON manifest support for bundle metadata
- ✅ Atomic file storage with path (`{version}-{filename}`)
- ✅ Bundle validation on control plane before deployment
- ✅ Rollback support (version history tracking)

### Deployment Orchestration 🚀
- ✅ Multi-device deployment targeting (JSON array of device_ids)
- ✅ Deployment status tracking (pending → in_progress → success/failed)
- ✅ Command-driven polling (devices pull vs. server push)
- ✅ Exponential backoff for failed heartbeats (1s → 60s max)
- ✅ Idempotent device registration (re-register with same pubkey = same device_id)

### Control Plane (FastAPI) ⚙️
- RESTful API under `/api/v1` prefix
- SQLAlchemy async ORM with PostgreSQL/SQLite support
- Automatic schema migration on startup
- Request/response validation with Pydantic 2.x
- Structured logging for debugging

### Runtime Agent 🖥️
- Minimal dependencies (httpx, cryptography, pydantic)
- Async heartbeat loop with robust error handling
- Pluggable command executors (deploy, rollback, etc.)
- Metrics aggregation before each heartbeat
- Docker & systemd service support

---

## 📁 Project Structure

```
kernex/
│
├── control-plane/              # FastAPI REST API
│   ├── app/
│   │   ├── main.py             # App initialization, routes setup
│   │   ├── config.py           # Settings (DATABASE_URL, etc.)
│   │   ├── auth.py             # Authentication (planned: RSA signatures)
│   │   ├── api/v1/             # API routes
│   │   │   ├── devices.py      # Device registration & heartbeat
│   │   │   ├── bundles.py      # Bundle upload & versioning
│   │   │   └── deployments.py  # Deployment creation & status
│   │   ├── models/             # SQLAlchemy ORM models
│   │   │   ├── device.py       # Device, heartbeat records
│   │   │   ├── bundle.py       # Bundle versioning
│   │   │   └── deployment.py   # Deployment tracking
│   │   ├── schemas/            # Pydantic request/response models
│   │   ├── services/           # Business logic layer
│   │   └── db/
│   │       ├── session.py      # AsyncSession factory
│   │       └── migrations/     # Alembic schema versions
│   ├── tests/                  # Pytest suite (in-memory SQLite)
│   ├── Dockerfile              # Multi-stage FastAPI build
│   └── requirements.txt         # FastAPI, SQLAlchemy, etc.
│
├── runtime/                     # Device/Edge Agent
│   ├── kernex/
│   │   ├── main.py             # Heartbeat loop & orchestration
│   │   ├── config.py           # Agent settings (control plane URL, etc.)
│   │   ├── agent/
│   │   │   ├── api.py          # HTTP client for control plane
│   │   │   ├── launcher.py     # Command execution engine
│   │   │   └── monitor.py      # Metrics collection
│   │   └── device/
│   │       ├── identity.py     # RSA keypair generation
│   │       ├── info.py         # Hardware info gathering
│   │       └── config.py       # Device config persistence
│   ├── tests/                  # Agent unit tests
│   ├── Dockerfile              # Lightweight runtime image
│   └── requirements.txt         # httpx, cryptography, pydantic
│
├── infra/                       # Deployment configs
│   ├── docker-compose.yml      # Local dev stack
│   ├── kubernetes/             # K8s manifests
│   └── terraform/              # AWS infrastructure
│
├── frontend/                    # Next.js dashboard (optional)
│   ├── app/
│   │   ├── devices/            # Device list & detail views
│   │   ├── bundles/            # Bundle upload & browse
│   │   └── deployments/        # Deployment creation & tracking
│   └── components/
│       ├── DeviceList.tsx
│       ├── BundleUpload.tsx
│       └── DeploymentForm.tsx
│
└── docs/
    ├── architecture.md         # System design deep-dive
    ├── api-spec.md            # API endpoint reference
    ├── bundle-spec.md         # Bundle format & manifest schema
    └── deployment-guide.md    # Step-by-step deployment instructions
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 13+ (or SQLite for dev)
- Docker & Docker Compose (optional, for containerized setup)

### Installation

```bash
# Clone repository
git clone https://github.com/GouravMukherjee/kernex.git
cd kernex

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\Activate.ps1
```

### Run Control Plane

```powershell
cd control-plane

# Set database URL (SQLite for dev)
$env:DATABASE_URL="sqlite+aiosqlite:///./dev.db"

# Start API server
python -m app.main
# → http://localhost:8000
# → API docs: http://localhost:8000/docs
```

### Run Runtime Agent

```powershell
cd runtime

# Point to control plane
$env:CONTROL_PLANE_URL="http://localhost:8000/api/v1"

# Start agent
python -m kernex
# → Generates device_key.pem (RSA4096)
# → Caches device_id in device_config.json
# → Enters heartbeat loop (60s interval, exponential backoff on failure)
```

### Docker Compose (Full Stack)

```bash
docker-compose -f infra/docker-compose.yml up -d
# → Control plane: http://localhost:8000
# → PostgreSQL: localhost:5432
# → Runtime agents can connect and register
```

---

## 💻 Development

### Running Tests

```bash
# Test control plane
pytest control-plane/tests/ -v

# Test runtime
pytest runtime/tests/ -v
```

### Code Style

```bash
# Format code
black control-plane/ runtime/

# Lint
flake8 control-plane/ runtime/

# Type checking
mypy control-plane/ runtime/
```

### Database Migrations

```bash
cd control-plane

# Generate migration (after model changes)
alembic revision --autogenerate -m "Add new_field to Device"

# Apply migrations
alembic upgrade head
```

---

## 📊 API Overview

### Device Registration
```http
POST /api/v1/devices/register
Content-Type: application/json

{
  "public_key": "-----BEGIN PUBLIC KEY-----\n...",
  "hardware_metadata": {
    "cpu_cores": 4,
    "memory_mb": 8192,
    "device_type": "edge-server"
  }
}

→ 200 OK
{
  "device_id": "dev_abc123xyz",
  "public_key": "...",
  "created_at": "2026-01-14T10:30:00Z"
}
```

### Device Heartbeat
```http
POST /api/v1/devices/dev_abc123xyz/heartbeat
Content-Type: application/json

{
  "agent_version": "0.1.0",
  "memory_mb": 4096,
  "cpu_pct": 35.2,
  "status": "healthy"
}

→ 200 OK
{
  "commands": [
    {
      "type": "deploy",
      "deployment_id": "dpl_456",
      "bundle_version": "1.2.3"
    }
  ]
}
```

### Bundle Upload
```http
POST /api/v1/bundles/upload
Content-Type: multipart/form-data

form:
  version: 1.2.3
  manifest: {"model": "qwen-1.5b", "..."}
  file: <bundle.tar.gz>

→ 201 Created
{
  "version": "1.2.3",
  "checksum_sha256": "abc123...",
  "storage_path": "./data/bundles/1.2.3-bundle.tar.gz"
}
```

### Create Deployment
```http
POST /api/v1/deployments
Content-Type: application/json

{
  "bundle_version": "1.2.3",
  "target_device_ids": ["dev_abc123xyz", "dev_def456uvw"]
}

→ 201 Created
{
  "deployment_id": "dpl_789",
  "bundle_version": "1.2.3",
  "target_device_ids": [...],
  "status": "pending"
}
```

---

## 🔐 Security & Privacy

- 🔒 **Device Identity**: RSA4096 keypairs generated locally, public key registered once
- 🛡️ **Bundle Integrity**: SHA256 checksums verified before deployment
- 🔐 **Encrypted Configs**: Device identity persisted securely
- 📋 **Audit Logging**: All device registrations, heartbeats, and deployments logged
- ⚙️ **Rate Limiting**: (Planned) Heartbeat request throttling per device
- 🔑 **Authentication**: (Planned) JWT tokens for API users, RSA signatures for devices

---

## 📊 Current Status

Kernex is **functional and under active development** toward production readiness.

- ✅ Device registration & identity management
- ✅ Heartbeat polling with exponential backoff
- ✅ Bundle versioning & storage
- ✅ Deployment targeting & command generation
- 🧪 Command execution on runtime (in progress)
- 🚧 Bundle download/extraction logic
- 🚧 Rollback mechanisms
- 🚧 API authentication & authorization
- 🚧 Production observability stack

**Latest updates**: See [CHANGELOG.md](CHANGELOG.md)

---

## 🛣️ Roadmap

### Slice 1: Device Registration ✅
- [x] Device registration endpoint
- [x] RSA keypair generation
- [x] Device metadata collection

### Slice 2: Heartbeat & Command Polling ✅
- [x] Heartbeat endpoint with metrics
- [x] Command response generation
- [x] Exponential backoff on failures

### Slice 3: Bundle Management 🚧
- [x] Bundle upload & versioning
- [ ] Bundle download on device
- [ ] SHA256 verification
- [ ] Manifest processing

### Slice 4: Deployment Execution 🚧
- [ ] Command executor on device
- [ ] Model/bundle loading
- [ ] Status reporting to control plane

### Slice 5: Advanced Features 📅
- [ ] Rollback mechanisms
- [ ] Multi-bundle deployments
- [ ] Scheduled deployments
- [ ] Health checks & auto-recovery

### Phase: Production Hardening
- [ ] API authentication (JWT + RSA signatures)
- [ ] Rate limiting & DDoS protection
- [ ] Structured logging & error tracking
- [ ] Prometheus metrics & alerting
- [ ] Database connection pooling & tuning
- [ ] Blue-green deployment strategy

---

## 🤝 Contributing

Contributions welcome! Please follow:

1. **Branch from main** for new features/fixes
2. **Write tests** for new functionality
3. **Update docs** in `docs/` folder
4. **Follow code style** (Black, flake8, mypy passing)
5. **Commit messages** should be clear and descriptive

---

## 📚 Documentation

- **[Architecture Deep Dive](docs/architecture.md)** – System design & component interactions
- **[API Specification](docs/api-spec.md)** – Complete endpoint reference
- **[Bundle Format](docs/bundle-spec.md)** – Bundle structure & manifest schema
- **[Deployment Guide](docs/deployment-guide.md)** – Production setup & best practices
- **[Troubleshooting](docs/troubleshooting.md)** – Common issues & solutions

---

## 📜 License

MIT License – See [LICENSE](LICENSE) for details.

Free to use, modify, and distribute. Attribution appreciated.

---

**Last updated**: January 2026  
**Maintained by**: Kernex Team  
**Status**: 🚀 Active Development – Production readiness in progress
- Performance optimization
- Observability and logging
- Security and safety mechanisms
- Documentation and examples

---

## Repository Structure

The repository organization is subject to change as the project matures:

```
kernex/
├── core/            # Core engine and orchestration logic
├── intelligence/    # LLM interfaces and reasoning modules
├── memory/          # Memory abstractions and storage interfaces
├── tools/           # Tool registration and execution framework
├── config/          # Configuration management
├── docs/            # Design notes and documentation
└── examples/        # Example implementations and demos
```

---

## Contributing

Kernex is currently under active design and is not yet open for general contributions.

If you are interested in the project:
- Watch the repository for updates
- Open issues for questions or suggestions
- Star the project if the vision aligns with your interests

Contribution guidelines will be established once the core architecture stabilizes.

---

## License

MIT License. See [LICENSE](LICENSE) file for details.


