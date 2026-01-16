# Deployment Status & Blockers

**Date**: January 15, 2026
**Status**: BLOCKED - Database permissions issue
**Target Resolution**: Tomorrow

## Current Situation

Production infrastructure is deployed on DigitalOcean:
- ✅ App Platform created (kernex-production)
- ✅ PostgreSQL cluster created (kernex-db-production)
- ✅ Control plane service deployed
- ❌ Control plane failing to start due to database permission error

## The Issue

The `kernex_app` database user lacks permissions to create tables in the PostgreSQL `public` schema.

**Error**: `asyncpg.exceptions.InsufficientPrivilegeError: permission denied for schema public`

**Location**: Control plane startup during Alembic migrations (creating Device, Bundle, Deployment, Heartbeat tables)

## Database Credentials

```
Host: kernex-db-production-do-user-30393383-0.f.db.ondigitalocean.com
Port: 25060
Admin User: doadmin
Admin Password: ${AIVEN_ADMIN_PASSWORD}
App User: kernex_app
App Password: ${AIVEN_APP_PASSWORD}
Database: kernex_db
```

**Note**: Actual credentials stored in `secrets/LOCAL_SECRETS_BACKUP.txt` (not committed to Git)

## Solution Steps for Tomorrow

### Option 1: Using PostgreSQL Client (RECOMMENDED)

**Prerequisites**: Install PostgreSQL client
- Windows: https://www.postgresql.org/download/windows/
- Or via Chocolatey: `choco install postgresql`

**Steps**:
1. Open PowerShell
2. Navigate to: `cd "a:\Project Kernex\infra\scripts"`
3. Run the permission fix script:
   ```powershell
   .\fix-db-permissions.ps1 -AdminPassword "${AIVEN_ADMIN_PASSWORD}"
   ```
   (Get password from `secrets/LOCAL_SECRETS_BACKUP.txt`)
4. Wait for all GRANT commands to complete successfully
5. Redeploy the app in DigitalOcean App Platform:
   - Go to App Platform > kernex-control-plane
   - Click "Settings" > "Rebuild & Deploy"
   - Wait for deployment to complete
   - Check logs to verify tables are created

### Option 2: Manual SQL via DigitalOcean Console (FASTER)

1. Go to **DigitalOcean Console** > **Databases** > **kernex-db-production**
2. Click **Users & Databases** tab
3. Click on **doadmin** user > **Connection parameters**
4. Copy the psql connection command
5. Paste and run these SQL commands:
   ```sql
   GRANT USAGE ON SCHEMA public TO kernex_app;
   GRANT CREATE ON SCHEMA public TO kernex_app;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kernex_app;
   GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO kernex_app;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO kernex_app;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO kernex_app;
   ```
6. Redeploy control plane in App Platform

### Option 3: Temporary Workaround (If options 1-2 fail)

Use doadmin user in the connection string temporarily:
1. Go to App Platform > kernex-control-plane > Settings > Environment
2. Change DATABASE_URL to use `doadmin` instead of `kernex_app`:
   ```
   postgresql+asyncpg://doadmin:${AIVEN_ADMIN_PASSWORD}@kernex-db-production-do-user-30393383-0.f.db.ondigitalocean.com:25060/kernex_db
   ```
   (Get password from `secrets/LOCAL_SECRETS_BACKUP.txt`)
3. Redeploy - tables will be created
4. Switch back to `kernex_app` user after tables are created

## App Platform Details

**App URL**: https://kernex-production-p8vam.ondigitalocean.app
**Service**: kernex-control-plane (2 instances, 3% CPU, 22% RAM)
**Recent Activity**: Multiple deployment failures due to health check timeouts (container doesn't start due to DB error)

## Terraform Files

All Terraform configuration is in `infra/terraform/`:
- `database.tf` - PostgreSQL cluster and permissions
- `app-platform.tf` - App Platform app
- `outputs.tf` - Output values
- `terraform.tfstate` - State file (contains sensitive credentials)

## Files Created

- `infra/scripts/fix-db-permissions.ps1` - PowerShell script to fix permissions
- `infra/scripts/fix-db-permissions.sh` - Bash script version (if needed on Linux)

## Next Steps After Fix

1. Verify control plane health check passes
2. Test device registration at: `/api/v1/devices/register`
3. Commit Terraform changes to Git
4. Test device agent registration against production API
5. Deploy frontend (separate step)

## Resources

- DigitalOcean Console: https://cloud.digitalocean.com/
- Terraform State: `a:\Project Kernex\infra\terraform\terraform.tfstate`
- API Docs: https://kernex-production-p8vam.ondigitalocean.app/docs (after fix)
