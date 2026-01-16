# Kernex MVP Deployment Plan - DigitalOcean (EXECUTED)

**Status**: Deployed with database permission blocker  
**Date**: January 15, 2026  
**Cost Period**: Month 1  
**Total Budget**: $200 DigitalOcean credits (expires in 30 days)

---

## 1. Infrastructure Components

### 1.1 Compute: App Platform

**Component**: DigitalOcean App Platform  
**Purpose**: Managed container deployment for control-plane API  
**Configuration**:
- Service name: `kernex-control-plane`
- Source: GitHub (GouravMukherjee/kernex, main branch)
- Docker image: Built from `control-plane/Dockerfile`
- Instances: 2 (auto-scaled by App Platform)
- CPU per instance: Shared
- RAM per instance: 512 MB
- Health check: HTTP `/health` on port 8000
- Auto-deploy: Enabled on git push to main
- HTTPS: Automatic (DigitalOcean managed cert)

**Why App Platform?**
- No upfront server management (MVP phase)
- Auto-redeploy on git push (dev velocity)
- Free TLS certificates
- Trivial to scale (just change tier)
- Can migrate to Kubernetes later

**Upgrade path**: Switch to DOKS (DigitalOcean Kubernetes) when traffic requires true autoscaling

---

### 1.2 Database: Managed PostgreSQL

**Component**: DigitalOcean Managed PostgreSQL  
**Configuration**:
- Cluster name: `kernex-db-production`
- Engine: PostgreSQL 15
- Size: db-s-2vcpu-4gb (2 vCPU, 4GB RAM, 60GB SSD)
- Region: SFO3 (same as app for low latency)
- HA: Not enabled (MVP cost optimization)
- Backups: Automated daily (default)
- Connection limit: 100 (default)

**Database Details**:
- Database name: `kernex_db`
- Admin user: `doadmin` (superuser)
- App user: `kernex_app` (limited perms - CURRENTLY BROKEN)
- Connection pooling: None (small scale)

**Why Managed PostgreSQL?**
- 2 developers, MVP scale → don't need to manage backups
- DigitalOcean handles patch/upgrade
- Easy to snapshot for staging
- Cost-justified: dev would spend time on ops otherwise

**Upgrade path**: Migrate to self-managed RDS or keep managed (both trivial with Terraform)

---

### 1.3 Storage: Spaces (OPTIONAL - NOT YET ENABLED)

**Component**: DigitalOcean Spaces (S3-compatible)  
**Status**: Disabled in Terraform (requires manual Spaces key creation)  
**Planned Configuration**:
- Bucket name: `kernex-bundles`
- Region: SFO3
- CORS: Enabled for control-plane domain
- TTL: Object lifecycle not configured

**Why Spaces?**
- Bundle uploads (ML models) too large for database
- S3-compatible API reduces lock-in
- Cheap compared to compute for storage

**Current blocker**: Spaces requires manual API key creation; commented out until needed

---

### 1.4 Networking: Firewall & Load Balancing

**Inbound**:
- App Platform → Public internet (HTTPS auto)
- Database ← Only App Platform (firewall rule)

**Database Firewall Rule**:
- Type: Tag-based
- Tag: `kernex-app`
- Direction: Inbound
- Source: Any (DigitalOcean managed)

**Load Balancing**: None (App Platform handles internally)

---

## 2. Cost Breakdown

| Component | Size/Tier | Unit Cost | Quantity | Monthly Cost | Notes |
|-----------|-----------|-----------|----------|--------------|-------|
| App Platform | Basic tier | $12/month | 1 service | $12.00 | Shared CPU, 512MB RAM per instance |
| PostgreSQL | db-s-2vcpu-4gb | $30/month | 1 cluster | $30.00 | 2vCPU, 4GB RAM, 60GB SSD |
| Spaces Storage | First 250GB | Free | 1 bucket | $0.00 | Not enabled; would add if needed |
| **Total** | — | — | — | **$42.00/month** | MVP safe zone |
| **Credit usage** | — | — | — | **$42/30 days** | $200 budget lasts ~4.7 months |

**Cost optimization notes**:
- App Platform auto-scales by CPU, not by users (safe for 1–3 devs)
- PostgreSQL: db-s-1vcpu-2gb ($15) too small for concurrent connections; db-s-2vcpu-4gb justified
- No additional costs for: TLS, DDos protection, domain (using .ondigitalocean.app)

---

## 3. Architecture Diagram (Textual)

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet (HTTPS)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   DigitalOcean App     │
        │   Platform (managed)   │
        │                        │
        │  kernex-control-plane  │
        │  - 2 instances         │
        │  - Shared CPU, 512MB   │
        │  - Auto health checks  │
        │  - Auto-redeploy on git│
        └────────────┬───────────┘
                     │
         ┌───────────┴────────────┐
         │ (VPC private network)  │
         ▼                        ▼
    ┌─────────────┐         ┌──────────────────┐
    │ PostgreSQL  │         │ (Future: Spaces) │
    │ Managed     │         │ S3-compatible    │
    │             │         │ Bundle storage   │
    │ db-s-2vcpu- │         │ (OPTIONAL)       │
    │ 4gb         │         │                  │
    │ kernex_db   │         └──────────────────┘
    │ doadmin     │
    │ kernex_app  │
    └─────────────┘

Device Agent (external):
  - Registers with control-plane via HTTPS
  - Polls /heartbeat every 60s
  - Receives deployment commands
  - (Not in DigitalOcean; lives on edge devices)
```

**Traffic flow**:
1. Device agent → HTTPS → App Platform public IP → control-plane container
2. Control-plane → PostgreSQL (private network via VPC)
3. Control-plane → (future) Spaces for bundle downloads

---

## 4. Deployment Steps (As Executed)

### Phase 1: Terraform Infrastructure (COMPLETED)

```bash
cd infra/terraform

# Step 1: Initialize Terraform
terraform init
# Provider: digitalocean/digitalocean 2.72.0

# Step 2: Create plan
terraform plan -out=tfplan
# Validated:
#  - App Platform resource
#  - PostgreSQL cluster resource
#  - Database, user, firewall

# Step 3: Apply
terraform apply tfplan
# Created 5 resources:
#  1. digitalocean_app (kernex-production)
#  2. digitalocean_database_cluster (kernex-db-production)
#  3. digitalocean_database_db (kernex_db)
#  4. digitalocean_database_user (kernex_app)
#  5. digitalocean_database_firewall (kernex_fw)
# Duration: ~5 minutes
```

**Outputs**:
```
app_url = "https://kernex-production-p8vam.ondigitalocean.app"
database_host = "kernex-db-production-do-user-30393383-0.f.db.ondigitalocean.com"
database_port = 25060
database_user = "kernex_app"
database_password = "${AIVEN_APP_PASSWORD}"
```

**Note**: Actual credentials stored in `secrets/LOCAL_SECRETS_BACKUP.txt` (not committed)

### Phase 2: App Platform Configuration (COMPLETED)

1. Navigate to DigitalOcean Console > App Platform > kernex-production
2. Click "Add components from code"
3. Connect GitHub repo: GouravMukherjee/kernex
4. Select `control-plane` as build source
5. Configure:
   - Build command: `pip install -r requirements.txt` (from Dockerfile)
   - Run command: `python -m app.main` (from Dockerfile)
   - Port: 8000
   - Health check: `GET /health`
6. Add environment variable:
   - Key: `DATABASE_URL`
   - Value: `postgresql+asyncpg://kernex_app:${AIVEN_APP_PASSWORD}@kernex-db-production-do-user-30393383-0.f.db.ondigitalocean.com:25060/kernex_db`
   - Note: Remove `?sslmode=require` (asyncpg doesn't support it)
   - Get password from `secrets/LOCAL_SECRETS_BACKUP.txt`
7. Click "Deploy"

**Deployment result**: Container built, deployed, health check failed → app restarted on error

### Phase 3: Database Permission Fix (BLOCKED)

Control-plane failed to start with:
```
asyncpg.exceptions.InsufficientPrivilegeError: permission denied for schema public
```

**Root cause**: `kernex_app` user lacks `CREATE` privilege in `public` schema

**Blocker resolution** (PENDING):
- Use admin credentials to grant permissions
- See DEPLOYMENT_BLOCKERS.md for 3 solution options
- Once fixed, redeploy app

---

## 5. Component Deployment Map

| Component | Runs Where | Auto-start | Monitoring | Logs |
|-----------|----------|-----------|-----------|------|
| Control-plane API | App Platform container | Yes (managed) | HTTP /health | App Platform console |
| PostgreSQL | DigitalOcean managed | Yes (managed) | UI alerts | DigitalOcean console |
| Device agent | External (customer edge) | No (device owner) | Heartbeat record | Device local logs |
| Bundle storage | (Optional) Spaces | N/A | N/A | N/A |

---

## 6. Assumptions Made

### MVP Assumptions
✓ **1–3 developer users**: No autoscaling, no CDN, no multi-region needed  
✓ **Low traffic**: Shared CPU sufficient (App Platform can upgrade if needed)  
✓ **Internal tooling phase**: No public SLA, acceptable downtime during deploys  
✓ **Single region**: SFO3 chosen (US-based team, lowest latency for most)  
✓ **No multi-tenancy**: Single database cluster, shared namespace  

### Tech Stack Assumptions
✓ **Python FastAPI**: Direct Dockerfile support in App Platform  
✓ **PostgreSQL 15**: Latest stable; async driver (asyncpg) required  
✓ **Docker containers**: Standard DigitalOcean App Platform  
✓ **GitHub auto-deploy**: Main branch → automatic redeploy  

### Cost Assumptions
✓ **$200 DigitalOcean credit**: Covers ~4.7 months at current run rate  
✓ **No paid add-ons**: Monitoring, logging via built-in tools  
✓ **No backups purchased**: Automated backups included in managed DB  
✓ **Spaces disabled**: Bundle storage optional; add if needed  

### Operational Assumptions
✓ **Manual deployments** (via git push): No CI/CD pipeline needed for MVP  
✓ **DigitalOcean console for config**: No separate Terraform re-runs post-deployment  
✓ **Developer manages secrets**: Credentials stored in environment variables  

---

## 7. Current Blockers & Next Steps

### BLOCKER: Database Permissions (CRITICAL)

**Issue**: Control-plane cannot create tables  
**Impact**: API health checks fail → auto-rollback → no startup  
**ETA to fix**: When developer resolves (3 options in DEPLOYMENT_BLOCKERS.md)  

**Options**:
1. Run PowerShell fix script (requires psql client)
2. Manual SQL via DigitalOcean console (fastest, no tools)
3. Temporary doadmin workaround (quick but not production)

### OPTIONAL: Enable Spaces for Bundle Storage

**Current state**: Disabled (requires manual Spaces key)  
**Trigger to enable**: When bundle uploads needed  
**Cost impact**: +~$5/month for storage + transfer costs  

### OPTIONAL: Add Staging Environment

**Current state**: Only production  
**When needed**: Before public launch  
**Approach**: Duplicate Terraform (staging-db, staging-app) with smaller tiers  

---

## 8. Upgrade Roadmap (Post-MVP)

**Phase 2 (if scaling beyond 3 users)**:
- Increase PostgreSQL to db-s-4vcpu-8gb ($60/month)
- Add read replicas for high-availability
- Enable Spaces for bundle storage

**Phase 3 (if moving to production)**:
- Migrate App Platform → DOKS (DigitalOcean Kubernetes) for true autoscaling
- Add Managed Redis for caching
- Set up S3 bucket versioning + lifecycle policies
- Add CloudFlare for CDN + DDoS protection

**Phase 4 (if multi-region needed)**:
- Terraform: Replicate all components to NYC3 region
- DigitalOcean Load Balancer for geo-routing
- Cross-region database replication

---

## 9. Disaster Recovery & Data

**Backups**: PostgreSQL automated daily (7-day retention, DigitalOcean managed)  
**Snapshots**: Manual via Terraform (if needed): `terraform taint digitalocean_database_cluster.kernex_postgres`  
**Secrets**: Stored in DigitalOcean environment variables (encrypted at rest)  
**State file**: `infra/terraform/terraform.tfstate` (contains credentials, NEVER commit)  

---

## 10. Team Access & Permissions

**DigitalOcean Console Access**: 
- Required for manual fixes (database permissions, emergency restarts)
- One developer with owner role sufficient for MVP

**Terraform State Management**:
- Store terraform.tfstate in secure location (NOT git)
- Use Terraform Cloud later (when multi-team)

**GitHub Access**:
- Developer with push to `main` branch = automatic production deploy
- No approval gates (MVP velocity)

---

## Summary Table

| Category | Status | Cost | Notes |
|----------|--------|------|-------|
| **App Platform** | ✅ Deployed | $12/mo | Working (health check failing due to DB error) |
| **PostgreSQL** | ✅ Deployed | $30/mo | Working (permission issue blocks writes) |
| **Spaces** | ❌ Optional | $0 | Disabled (not needed yet) |
| **Networking** | ✅ Configured | $0 | App Platform + database firewall |
| **CI/CD** | ✅ Auto-deploy | $0 | GitHub → App Platform (built-in) |
| **Monitoring** | ⚠️ Basic | $0 | App Platform health checks only |
| **Total Monthly** | **$42/mo** | **$200 credit = 4.7 months** | — |

---

## Execution Status

- ✅ Terraform infrastructure applied
- ✅ App Platform service created and configured
- ✅ GitHub auto-deploy enabled
- ✅ PostgreSQL cluster created with database and users
- ⏳ **BLOCKED**: Database permissions not granted (control-plane failing to start)
- ⏳ **TODO**: Fix permissions, redeploy, verify API health
- ⏳ **TODO**: Test device registration
- ⏳ **TODO**: Commit Terraform to git history
- ⏳ **OPTIONAL**: Deploy frontend Next.js app

**When blocker is fixed**: Control-plane will create tables and start serving requests at https://kernex-production-p8vam.ondigitalocean.app/api/v1/
