# Kernex Canonical Status (Vercel + DigitalOcean Droplet)

**Last Updated**: February 12, 2026  
**Canonical Deployment**: `Frontend on Vercel` + `Control Plane + Postgres on DigitalOcean Droplet`

## Source Of Truth

This file is the single source of truth for production status and operations.

- Frontend: `https://kernex-ai.vercel.app`
- Backend API: `http://<droplet-ip>:8000/api/v1`
- Health check: `GET /api/v1/health`
- Runtime communication: heartbeat polling from runtime agents to control plane

## Production Readiness

- `Core MVP (Slices 1-5)`: Implemented in control plane/runtime.
- `Deployment baseline`: Docker Compose on droplet is configured.
- `Current hardening`: In progress (auth enforcement, observability depth, frontend full live-data coverage).

## Implemented Features

- Device registration (idempotent)
- Heartbeat ingestion and command polling
- Bundle upload/download and deployment orchestration
- Deployment result reporting
- Rollback orchestration and device bundle history
- Device configuration management with versioning

## Open Gaps (Active Work)

- Frontend auth UX (login/logout/token refresh) is still pending
- End-to-end browser tests are still pending

## Security Enforcement

- In production mode (`ENVIRONMENT=production`), management APIs require bearer auth.
- Device runtime endpoints remain available for device registration and heartbeat.
- You can force auth in any environment with `REQUIRE_ADMIN_AUTH=true`.

## Required Env Vars (Backend)

- `JWT_SECRET_KEY`
- `JWT_ALGORITHM` (default `HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES` (default `60`)
- `REQUIRE_ADMIN_AUTH` (`true`/`false`)

## Canonical Docs

- `docs/current/VERCEL_DROPLET_CANONICAL.md` (this file)
- `docs/current/PRODUCTION_READY.md`
- `docs/current/CURRENT_DEPLOYMENT_STATUS.md`
- `docs/FRESH_DROPLET_DEPLOYMENT.md`
- `docs/DROPLET_OPERATIONS.md`
- `docs/FRONTEND_BACKEND_CONNECTION.md`

## Legacy Note

Older docs that reference Railway or previous phase estimates are retained for history only and are non-canonical.
