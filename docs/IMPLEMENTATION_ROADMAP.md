# KERNEX PRODUCTION IMPLEMENTATION ROADMAP

**Status**: Phase Planning & Prioritization  
**Date**: January 14, 2026  
**Owner**: Engineering Team

---

## QUICK REFERENCE - PHASE TIMELINE

```
Week 1  │ Phase 1: Containerization
        │ ├─ Dockerfiles for control-plane & runtime
        │ ├─ docker-compose.yml with PostgreSQL
        │ ├─ Local testing & validation
        │ └─ CI/CD pipeline setup

Week 2  │ Phase 2: Database Migration
        │ ├─ Alembic setup
        │ ├─ Create migrations
        │ ├─ Test migration path
        │ └─ Backup/restore procedures

Week 3  │ Phase 3: Bundle Storage
        │ ├─ MinIO integration (or S3)
        │ ├─ Update upload/download endpoints
        │ ├─ Retention policies
        │ └─ Backup procedures

Week 4  │ Phase 4: Security Hardening
        │ ├─ TLS/HTTPS certificates
        │ ├─ API authentication (API keys)
        │ ├─ Secrets management
        │ └─ Security testing

Week 5  │ Phase 5: Observability Stack
        │ ├─ Structured logging
        │ ├─ Prometheus metrics
        │ ├─ Log aggregation
        │ ├─ Grafana dashboards
        │ └─ Alerting rules

Week 6  │ Phase 6: Infrastructure as Code (Kubernetes)
        │ ├─ Terraform configuration
        │ ├─ Kubernetes manifests
        │ ├─ EKS cluster creation
        │ └─ Staging environment

Week 7  │ Phase 7: Testing & Validation
        │ ├─ Load testing (100+ devices)
        │ ├─ Chaos testing
        │ ├─ Security testing
        │ ├─ Beta program
        │ └─ Performance validation

Week 8+ │ Phase 8: Production Launch
        │ ├─ Pre-launch checklist
        │ ├─ Production deployment
        │ ├─ Public launch
        │ └─ Ongoing monitoring
```

---

## PHASE 1: CONTAINERIZATION (DAYS 1-3)

### Task Breakdown

#### Task 1.1: Create Control Plane Dockerfile

**File**: `control-plane/Dockerfile`

**Implementation**:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app ./app

# Run database migrations on startup
RUN mkdir -p /app/data

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/api/v1/health')"

# Run application
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Checklist**:
- [ ] Base image: python:3.11-slim
- [ ] System dependencies installed
- [ ] Python packages installed
- [ ] App code copied
- [ ] Port 8000 exposed
- [ ] Healthcheck configured
- [ ] File created at control-plane/Dockerfile

---

#### Task 1.2: Create Runtime Dockerfile

**File**: `runtime/Dockerfile`

**Implementation**:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY kernex ./kernex

# Create bundle directory
RUN mkdir -p /root/.kernex/bundles

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1 || echo "Heartbeat loop running"

# Run application
CMD ["python", "-m", "kernex"]
```

**Checklist**:
- [ ] Base image: python:3.11-slim
- [ ] System dependencies installed
- [ ] Python packages installed
- [ ] App code copied
- [ ] Bundle directory created
- [ ] Healthcheck configured
- [ ] File created at runtime/Dockerfile

---

#### Task 1.3: Create docker-compose.yml

**File**: `docker-compose.yml` (root level)

**Implementation**:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: kernex
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-kernex-dev}
      POSTGRES_DB: kernex
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kernex"]
      interval: 10s
      timeout: 5s
      retries: 5

  control-plane:
    build: ./control-plane
    environment:
      DATABASE_URL: postgresql+asyncpg://kernex:${POSTGRES_PASSWORD:-kernex-dev}@postgres:5432/kernex
      BUNDLE_STORAGE_PATH: /data/bundles
      API_KEYS: ${API_KEYS:-key1,key2}
    volumes:
      - bundle_storage:/data/bundles
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  minio:
    image: minio/minio:latest
    environment:
      MINIO_ROOT_USER: ${MINIO_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD:-minioadmin}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
    restart: unless-stopped

  runtime:
    build: ./runtime
    environment:
      CONTROL_PLANE_URL: http://control-plane:8000/api/v1
      POLLING_INTERVAL: 60
    volumes:
      - runtime_bundles:/root/.kernex/bundles
    depends_on:
      control-plane:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
  bundle_storage:
  minio_data:
  runtime_bundles:
```

**Checklist**:
- [ ] PostgreSQL service configured with persistence
- [ ] Control Plane service configured with healthcheck
- [ ] MinIO service configured for bundle storage
- [ ] Runtime service configured
- [ ] All environment variables parameterized
- [ ] Volumes for persistence
- [ ] Dependency ordering (postgres → control-plane → runtime)
- [ ] File created at docker-compose.yml

---

#### Task 1.4: Create .dockerignore files

**File**: `control-plane/.dockerignore`
```
__pycache__
.pytest_cache
.git
.gitignore
*.pyc
*.pyo
*.pyd
.Python
*.egg-info/
dist/
build/
.venv/
venv/
.env
.env.local
```

**File**: `runtime/.dockerignore`
```
__pycache__
.pytest_cache
.git
.gitignore
*.pyc
*.pyo
*.pyd
.Python
*.egg-info/
dist/
build/
.venv/
venv/
.env
.env.local
device_config.json
device_key.pem
```

**Checklist**:
- [ ] control-plane/.dockerignore created
- [ ] runtime/.dockerignore created

---

#### Task 1.5: Test Locally

**Commands**:
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f control-plane

# Test API
curl http://localhost:8000/api/v1/devices

# Stop services
docker-compose down
```

**Checklist**:
- [ ] Images build without errors
- [ ] Services start successfully
- [ ] All services healthy (docker ps shows "healthy")
- [ ] API responds to requests
- [ ] Can access http://localhost:8000/docs (Swagger UI)
- [ ] Database connection works
- [ ] MinIO accessible at http://localhost:9000

---

#### Task 1.6: CI/CD Pipeline

**GitHub Actions Workflow**: `.github/workflows/build.yml`

```yaml
name: Build and Push

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r control-plane/requirements.txt
      - run: pytest control-plane/tests/
      - run: pytest runtime/tests/ || true

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      - uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - uses: docker/build-push-action@v4
        with:
          context: ./control-plane
          push: true
          tags: ghcr.io/${{ github.repository }}/control-plane:latest
      
      - uses: docker/build-push-action@v4
        with:
          context: ./runtime
          push: true
          tags: ghcr.io/${{ github.repository }}/runtime:latest
```

**Checklist**:
- [ ] GitHub Actions workflow created
- [ ] Tests run on every push
- [ ] Images pushed to registry on main branch
- [ ] Tagging strategy defined

---

### Phase 1 Success Criteria

```
✅ control-plane Dockerfile builds and runs
✅ runtime Dockerfile builds and runs
✅ docker-compose up -d works
✅ PostgreSQL accessible
✅ MinIO accessible
✅ Control plane API responding
✅ All services healthy
✅ Tests pass in Docker environment
✅ CI/CD pipeline working
```

**Estimated Effort**: 6-8 hours  
**Owner**: DevOps Engineer or Senior Developer

---

## PHASE 2: DATABASE MIGRATION (DAYS 4-6)

### Task Breakdown

#### Task 2.1: Install and Configure Alembic

**Commands**:
```bash
cd control-plane
pip install alembic

# Initialize Alembic
alembic init migrations

# Configure alembic.ini
# Update line with: sqlalchemy.url = driver://user:pass@localhost/dbname
# Or better: use environment variable
```

**Configuration**: `control-plane/alembic.ini`
```ini
[sqlalchemy]
sqlalchemy.url = 

[loggers]
keys = root,sqlalchemy

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

**Checklist**:
- [ ] Alembic installed
- [ ] alembic init migrations executed
- [ ] alembic.ini configured
- [ ] migrations/ directory created

---

#### Task 2.2: Create Initial Migration

**Commands**:
```bash
cd control-plane

# Generate migration from models
alembic revision --autogenerate -m "Initial schema from models"

# Review the generated migration
cat migrations/versions/xxx_initial_schema.py

# Test it runs
alembic upgrade head
```

**Migration File** (auto-generated): `migrations/versions/001_initial_schema.py`
```python
"""Initial schema from models

Revision ID: 001
Revises: 
Create Date: 2026-01-14 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # This is auto-generated from models
    # Creates: devices, bundles, deployments, heartbeats tables
    pass

def downgrade() -> None:
    pass
```

**Checklist**:
- [ ] Initial migration generated
- [ ] All models included (Device, Bundle, Deployment, Heartbeat)
- [ ] All columns and constraints present
- [ ] Migration reviewed for accuracy
- [ ] Migration tested

---

#### Task 2.3: Update Configuration

**File**: `control-plane/app/config.py`

```python
import os
from functools import lru_cache
from pydantic import BaseModel, Field

class Settings(BaseModel):
    app_name: str = Field(default="kernex-control-plane")
    database_url: str = Field(
        default=os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://kernex:kernex-dev@localhost/kernex"
        )
    )
    api_prefix: str = "/api/v1"
    bundle_storage_path: str = Field(
        default=os.getenv("BUNDLE_STORAGE_PATH", "/data/bundles")
    )
    api_keys: list[str] = Field(
        default_factory=lambda: os.getenv("API_KEYS", "").split(",")
    )

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

**Checklist**:
- [ ] DATABASE_URL defaults to PostgreSQL
- [ ] Connection string includes asyncpg driver
- [ ] API_KEYS configuration added
- [ ] Settings cached with lru_cache

---

#### Task 2.4: Create Backup Scripts

**File**: `scripts/backup-database.sh`

```bash
#!/bin/bash
set -e

BACKUP_DIR="/backups/kernex"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="kernex_backup_${DATE}.sql"

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
pg_dump -h ${DB_HOST:-localhost} \
        -U ${DB_USER:-kernex} \
        ${DB_NAME:-kernex} > $BACKUP_DIR/$FILENAME

# Compress
gzip $BACKUP_DIR/$FILENAME

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/$FILENAME.gz s3://kernex-backups/

# Keep only last 30 days of backups
find $BACKUP_DIR -name "kernex_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/$FILENAME.gz"
```

**File**: `scripts/restore-database.sh`

```bash
#!/bin/bash
set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Extract if gzipped
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | psql -h ${DB_HOST:-localhost} \
                                     -U ${DB_USER:-kernex} \
                                     ${DB_NAME:-kernex}
else
    psql -h ${DB_HOST:-localhost} \
         -U ${DB_USER:-kernex} \
         ${DB_NAME:-kernex} < "$BACKUP_FILE"
fi

echo "Restore completed from: $BACKUP_FILE"
```

**Checklist**:
- [ ] Backup script created and tested
- [ ] Restore script created and tested
- [ ] Cron job configured (daily backups)
- [ ] S3 upload working (optional)

---

#### Task 2.5: Test Migration

**Steps**:
```bash
# 1. Start fresh PostgreSQL
docker-compose up -d postgres

# 2. Create database
docker-compose exec postgres createdb -U kernex kernex

# 3. Run migration
cd control-plane
alembic upgrade head

# 4. Verify tables created
docker-compose exec postgres psql -U kernex -d kernex -c "\dt"

# 5. Test application
docker-compose up control-plane

# 6. Test API
curl http://localhost:8000/api/v1/devices

# 7. Test data creation (register device, create deployment)
# 8. Verify in database
docker-compose exec postgres psql -U kernex -d kernex -c "SELECT * FROM devices;"

# 9. Test backup
./scripts/backup-database.sh

# 10. Drop database and restore
docker-compose exec postgres dropdb -U kernex kernex
docker-compose exec postgres createdb -U kernex kernex
alembic upgrade head
./scripts/restore-database.sh /backups/kernex/kernex_backup_*.sql.gz

# 11. Verify data restored
docker-compose exec postgres psql -U kernex -d kernex -c "SELECT * FROM devices;"
```

**Checklist**:
- [ ] Migration runs without errors
- [ ] All tables created
- [ ] All columns present
- [ ] Primary keys and constraints correct
- [ ] Backup creates valid SQL
- [ ] Restore recovers all data
- [ ] Application works with PostgreSQL

---

### Phase 2 Success Criteria

```
✅ Alembic installed and configured
✅ Initial migration created and verified
✅ control-plane connects to PostgreSQL
✅ All tables created with correct schema
✅ Backup script working
✅ Restore script working
✅ Tests pass with PostgreSQL
✅ All 14 tests passing
```

**Estimated Effort**: 8-10 hours  
**Owner**: Database Administrator or Backend Engineer

---

## PHASE 3: BUNDLE STORAGE (DAYS 7-9)

### Task Breakdown

#### Task 3.1: MinIO Integration

**Update** `control-plane/app/services/bundle_service.py`:

```python
import hashlib
import json
import os
from pathlib import Path
from typing import Optional

import aioboto3
from botocore.config import Config

class BundleService:
    def __init__(self):
        self.use_minio = os.getenv("BUNDLE_STORAGE_TYPE", "local") == "minio"
        
        if self.use_minio:
            self.s3_client = aioboto3.client(
                's3',
                endpoint_url=os.getenv("MINIO_ENDPOINT", "http://minio:9000"),
                aws_access_key_id=os.getenv("MINIO_ACCESS_KEY", "minioadmin"),
                aws_secret_access_key=os.getenv("MINIO_SECRET_KEY", "minioadmin"),
                region_name="us-east-1",
                config=Config(signature_version='s3v4')
            )
            self.bucket_name = "kernex-bundles"
        else:
            self.storage_path = Path(os.getenv("BUNDLE_STORAGE_PATH", "./data/bundles"))
            self.storage_path.mkdir(parents=True, exist_ok=True)

    async def upload_bundle(self, file_data: bytes, version: str, filename: str) -> str:
        """Upload bundle and return storage path"""
        
        if self.use_minio:
            key = f"{version}/{filename}"
            async with self.s3_client as s3:
                await s3.put_object(
                    Bucket=self.bucket_name,
                    Key=key,
                    Body=file_data
                )
            return key
        else:
            version_dir = self.storage_path / version
            version_dir.mkdir(parents=True, exist_ok=True)
            file_path = version_dir / filename
            file_path.write_bytes(file_data)
            return str(file_path)

    async def download_bundle(self, storage_path: str) -> bytes:
        """Download bundle"""
        
        if self.use_minio:
            async with self.s3_client as s3:
                response = await s3.get_object(
                    Bucket=self.bucket_name,
                    Key=storage_path
                )
                return await response['Body'].read()
        else:
            return Path(storage_path).read_bytes()

    async def delete_bundle(self, storage_path: str) -> None:
        """Delete bundle"""
        
        if self.use_minio:
            async with self.s3_client as s3:
                await s3.delete_object(
                    Bucket=self.bucket_name,
                    Key=storage_path
                )
        else:
            Path(storage_path).unlink()

bundle_service = BundleService()
```

**Checklist**:
- [ ] aioboto3 added to requirements
- [ ] BundleService abstraction created
- [ ] MinIO backend implemented
- [ ] Local filesystem backend still supported
- [ ] Upload tested
- [ ] Download tested
- [ ] Delete tested

---

#### Task 3.2: Retention Policy

**File**: `control-plane/app/workers/bundle_cleanup.py`

```python
import asyncio
import logging
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.bundle import Bundle

logger = logging.getLogger(__name__)

async def cleanup_old_bundles(days_to_keep: int = 30):
    """Delete bundles older than days_to_keep"""
    
    async with AsyncSession() as session:
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        result = await session.execute(
            select(Bundle).where(Bundle.created_at < cutoff_date)
        )
        old_bundles = result.scalars().all()
        
        for bundle in old_bundles:
            logger.info(f"Deleting old bundle: {bundle.version}")
            # Check if in use by any deployment
            # ... (only delete if not in active deployments)
            await bundle_service.delete_bundle(bundle.storage_path)
            await session.delete(bundle)
        
        await session.commit()
        logger.info(f"Cleanup complete: deleted {len(old_bundles)} bundles")

async def run_cleanup_scheduler(interval_hours: int = 24):
    """Run cleanup every interval_hours"""
    while True:
        try:
            await cleanup_old_bundles()
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")
        
        await asyncio.sleep(interval_hours * 3600)
```

**Checklist**:
- [ ] Cleanup worker created
- [ ] Scheduled to run daily
- [ ] Only deletes old bundles
- [ ] Verifies bundle not in use before deleting
- [ ] Logging for audit trail

---

#### Task 3.3: Test Bundle Operations

**Test**: `control-plane/tests/test_bundle_storage.py`

```python
import pytest
import tempfile
from pathlib import Path

from app.services.bundle_service import bundle_service

@pytest.mark.asyncio
async def test_upload_download_bundle():
    """Test uploading and downloading a bundle"""
    
    test_data = b"test bundle content"
    version = "1.0.0"
    filename = "test.tar.gz"
    
    # Upload
    storage_path = await bundle_service.upload_bundle(
        test_data, version, filename
    )
    
    # Download
    downloaded = await bundle_service.download_bundle(storage_path)
    
    # Verify
    assert downloaded == test_data

@pytest.mark.asyncio
async def test_delete_bundle():
    """Test deleting a bundle"""
    
    test_data = b"test"
    storage_path = await bundle_service.upload_bundle(
        test_data, "1.0.0", "test.tar.gz"
    )
    
    # Delete
    await bundle_service.delete_bundle(storage_path)
    
    # Verify deleted
    with pytest.raises(Exception):
        await bundle_service.download_bundle(storage_path)

@pytest.mark.asyncio
async def test_large_bundle():
    """Test 100MB bundle"""
    
    # Generate 100MB of data
    large_data = b"x" * (100 * 1024 * 1024)
    
    storage_path = await bundle_service.upload_bundle(
        large_data, "1.0.0", "large.tar.gz"
    )
    
    downloaded = await bundle_service.download_bundle(storage_path)
    assert len(downloaded) == len(large_data)
```

**Checklist**:
- [ ] Tests created and passing
- [ ] Small bundle upload/download tested
- [ ] Large bundle (100MB+) tested
- [ ] Delete operation tested
- [ ] Concurrent operations tested

---

### Phase 3 Success Criteria

```
✅ MinIO running in docker-compose
✅ Bundle upload stores in MinIO
✅ Bundle download retrieves from MinIO
✅ Large bundles (100MB+) work
✅ Concurrent uploads/downloads work
✅ Cleanup policy removes old bundles
✅ Tests passing
```

**Estimated Effort**: 6-8 hours  
**Owner**: Backend Engineer

---

## NEXT STEPS

This roadmap covers the critical path to production (Phases 1-3 = ~2 weeks).

**Phases 4-8** are documented in the main `PRODUCTION_DEPLOYMENT_GUIDE.md`.

**To proceed**: 
1. Review this document with team
2. Assign owners to each phase
3. Create tickets in project management
4. Begin Phase 1 this week

**Questions?**
- Review `docs/PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed architecture
- Review `docs/architecture.md` for system design
- Review `tests/` for test patterns to follow

---

**Document Version**: 1.0  
**Date**: January 14, 2026  
**Owner**: Engineering Lead
