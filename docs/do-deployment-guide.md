# Digital Ocean Production Deployment Guide

This guide walks you through deploying Kernex to **DigitalOcean** using:
- **App Platform** (managed container deployment)
- **Managed PostgreSQL** (database)
- **Spaces** (S3-compatible object storage for bundles)

## Prerequisites

- DigitalOcean account with billing enabled
- `doctl` CLI installed ([Install doctl](https://docs.digitalocean.com/reference/doctl/how-to/install/))
- Terraform installed (v1.0+)
- GitHub account with SSH key configured
- GitHub personal access token with `repo` scope

## Step 1: Prepare DigitalOcean Access

### 1.1 Create DigitalOcean API Token

1. Log in to [DigitalOcean Console](https://cloud.digitalocean.com)
2. Go to **Settings** → **API** → **Tokens/Keys**
3. Click **Generate New Token**
   - Name: `kernex-terraform`
   - Expiration: 90 days (or custom)
   - Select **Read and Write** scope
4. Copy the token (you'll need it in Step 3)

### 1.2 Create GitHub Personal Access Token

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens**
2. Click **Generate new token (classic)**
   - Name: `kernex-do-deployment`
   - Select scopes: `repo`, `read:user`
3. Copy the token

## Step 2: Configure Terraform

### 2.1 Copy the example tfvars file

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
```

### 2.2 Edit terraform.tfvars

```bash
# Edit the file and replace placeholder values:
```

**Key values to set:**

```hcl
digitalocean_token       = "dop_v1_YOUR_TOKEN_HERE"
app_platform_github_repo = "https://github.com/GouravMukherjee/kernex"
github_token             = "ghp_YOUR_GITHUB_TOKEN_HERE"
region                   = "nyc3"  # or sfo3, lon1, etc.
```

**Available regions:**
- `nyc1`, `nyc3` – New York
- `sfo1`, `sfo2`, `sfo3` – San Francisco
- `lon1` – London
- `ams3` – Amsterdam

### 2.3 Keep tfvars.example as reference (DO NOT commit terraform.tfvars)

```bash
# Add to .gitignore
echo "terraform.tfvars" >> ../../.gitignore
echo "*.tfstate" >> ../../.gitignore
echo "*.tfstate.*" >> ../../.gitignore
```

## Step 3: Initialize and Deploy

### 3.1 Initialize Terraform

```bash
terraform init
```

Expected output:
```
Initializing the backend...
Initializing provider plugins...
Terraform has been successfully configured!
```

### 3.2 Review the deployment plan

```bash
terraform plan -out=tfplan
```

This shows all resources that will be created:
- DigitalOcean App Platform app
- Managed PostgreSQL cluster
- Spaces bucket for bundles

### 3.3 Apply the Terraform configuration

```bash
terraform apply tfplan
```

**⏱️ This takes 5-10 minutes.** Terraform will:
1. Create managed PostgreSQL cluster (2-3 min)
2. Create Spaces bucket
3. Configure App Platform app
4. Connect services together

### 3.4 Save outputs

After deployment completes, Terraform displays output values:

```bash
# Save outputs to a file for reference
terraform output -json > outputs.json

# View specific outputs
terraform output app_url
terraform output control_plane_url
```

**Save these values securely:**
- `app_url` – Your application domain
- `control_plane_url` – API endpoint
- `database_credentials` – Keep private!

## Step 4: Verify Deployment

### 4.1 Check App Platform

```bash
# Get app status
doctl apps list

# Get detailed app info
doctl apps describe <app-id>
```

### 4.2 Test the Control Plane API

```bash
# Get the control plane URL from Terraform output
CONTROL_PLANE_URL="https://your-app.ondigitalocean.app/api/v1"

# Test healthcheck
curl $CONTROL_PLANE_URL/health

# View API docs
# Navigate to https://your-app.ondigitalocean.app/docs in browser
```

### 4.3 Test the Frontend

```bash
# Open in browser
open https://your-app.ondigitalocean.app
```

### 4.4 Verify Database Connection

The App Platform should have successfully migrated the database schema during first deployment. Check the app logs:

```bash
doctl apps logs <app-id> --component control-plane-api
```

Look for:
```
✓ Database migrations completed
✓ Connected to PostgreSQL
```

## Step 5: Configure Runtime Agents

### 5.1 Get the Control Plane URL

```bash
terraform output control_plane_url
```

Output: `https://your-app.ondigitalocean.app/api/v1`

### 5.2 Set environment variable on runtime agents

On each edge device running the Kernex runtime agent:

```bash
export CONTROL_PLANE_URL="https://your-app.ondigitalocean.app/api/v1"

# Or add to systemd service (if running as service)
# In kernex.service:
Environment="CONTROL_PLANE_URL=https://your-app.ondigitalocean.app/api/v1"
```

### 5.3 Test device registration

```bash
# On the edge device:
python -m kernex

# Should see:
# ✓ Generated RSA4096 keypair
# ✓ Registered with control plane
# ✓ Device ID: dev_abc123xyz
# ✓ Starting heartbeat loop (60s interval)
```

## Step 6: Configure Bundle Storage (Spaces)

Your bundles are now stored in DigitalOcean Spaces. Configure the control plane to use Spaces:

### 6.1 Get Spaces credentials

```bash
terraform output storage_credentials
```

### 6.2 Update control-plane environment

In App Platform dashboard or via `doctl`:

Set these environment variables for the `control-plane-api` service:

```bash
BUNDLE_STORAGE_TYPE=spaces
SPACES_BUCKET=kernex-bundles-production
SPACES_REGION=nyc3
AWS_ACCESS_KEY_ID=<from terraform output>
AWS_SECRET_ACCESS_KEY=<from terraform output>
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

Or redeploy via Terraform:
```bash
terraform apply
```

## Step 7: Monitor & Maintain

### 7.1 View logs

```bash
# Control Plane API logs
doctl apps logs <app-id> --component control-plane-api

# Frontend logs
doctl apps logs <app-id> --component frontend

# Watch logs in real-time
doctl apps logs <app-id> --follow
```

### 7.2 Scale resources

To increase database capacity:

```bash
# Edit terraform.tfvars
# Change postgres_size = "db-s-4vcpu-8gb"

terraform plan
terraform apply
```

### 7.3 Backup database

DigitalOcean Managed PostgreSQL includes automatic daily backups. To restore:

```bash
doctl databases backup list <db-cluster-id>
```

### 7.4 Monitor App Platform

Go to DigitalOcean Console → Apps → Your App:
- **Metrics** – CPU, memory, requests
- **Logs** – Service logs
- **Settings** → **Alerts** – Configure notifications

## Step 8: Enable Custom Domain (Optional)

### 8.1 Point domain to DigitalOcean

Add CNAME record in your DNS provider:
```
api.yourdomain.com  CNAME  your-app.ondigitalocean.app
```

### 8.2 Configure custom domain in App Platform

1. Go to App Platform Settings → **Domains**
2. Click **Edit** and add your domain
3. DigitalOcean automatically provisions SSL certificate

## Troubleshooting

### Database Connection Timeout

**Symptom:** Control Plane can't connect to PostgreSQL

**Solution:**
```bash
# Check firewall rule exists
terraform show | grep database_firewall

# If missing, reapply
terraform apply -target=digitalocean_database_firewall.kernex_fw
```

### App Platform Deployment Fails

**Check logs:**
```bash
doctl apps logs <app-id>
```

**Common issues:**
- GitHub token expired → Update in terraform.tfvars
- Docker image pull failed → Check image is public or update credentials
- Port mismatch → Ensure `http_port` matches app startup port

### Spaces Access Issues

**Symptom:** Bundle upload fails with 403 Access Denied

**Solution:**
```bash
# Verify credentials
terraform output storage_credentials

# Update App Platform environment variables
terraform apply -target=digitalocean_app.kernex_app
```

### App Slow or High CPU

**Check metrics:**
```bash
doctl apps info <app-id>
```

**Scale up:**
```bash
# Edit terraform.tfvars
postgres_size = "db-s-4vcpu-8gb"  # Increase from db-s-2vcpu-2gb

terraform apply
```

## Cleanup

To destroy all DigitalOcean resources and stop incurring charges:

```bash
# Review what will be deleted
terraform plan -destroy

# Destroy all resources
terraform destroy

# Confirm when prompted
```

⚠️ **Warning:** This deletes:
- App Platform app
- Managed PostgreSQL database
- Spaces bucket
- All data

## Cost Estimation

Approximate monthly costs for production deployment:

| Resource | Size | Cost |
|----------|------|------|
| App Platform | 2 containers | ~$12-15/month |
| PostgreSQL | db-s-2vcpu-2gb | ~$30/month |
| Spaces | 100GB storage | ~$5/month |
| **Total** | | **~$47-50/month** |

Costs increase with:
- App scaling (more containers)
- Database upgrades (larger sizes)
- Bandwidth & storage usage
- Reserved IPs, load balancers

## Next Steps

1. ✅ Deploy to DigitalOcean
2. 🔒 Enable API authentication (JWT)
3. 📊 Set up monitoring & alerts
4. 🔐 Configure HTTPS & custom domain
5. 📈 Set up auto-scaling policies
6. 🎯 Load test before production traffic

## Support

- **DigitalOcean Docs:** https://docs.digitalocean.com
- **Terraform Docs:** https://registry.terraform.io/providers/digitalocean/digitalocean
- **Kernex Issues:** https://github.com/GouravMukherjee/kernex/issues
