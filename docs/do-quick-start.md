# Digital Ocean Quick Start

One-command deployment summary for Kernex to DigitalOcean.

## Prerequisites

```bash
# Install required tools
brew install terraform doctl  # macOS
# or for Linux/Windows: see docs

# Authenticate with DigitalOcean
doctl auth init
# → Paste your DigitalOcean token (from console.digitalocean.com)
```

## Deploy in 5 minutes

```bash
cd infra/terraform

# 1. Copy and edit configuration
cp terraform.tfvars.example terraform.tfvars
# → Edit: digitalocean_token, github_token, app_platform_github_repo

# 2. Deploy
terraform init
terraform apply

# 3. Get URLs
terraform output app_url
terraform output control_plane_url
```

## After Deployment

```bash
# Test API
curl https://your-app.ondigitalocean.app/api/v1/health

# Configure runtime agents
export CONTROL_PLANE_URL="https://your-app.ondigitalocean.app/api/v1"
python -m kernex  # Device will register automatically

# View logs
doctl apps logs <app-id>

# Scale database
# Edit terraform.tfvars: postgres_size = "db-s-4vcpu-8gb"
# Run: terraform apply
```

## Costs

- **App Platform:** ~$12-15/month
- **PostgreSQL:** ~$30/month
- **Spaces:** ~$5/month
- **Total:** ~$47-50/month

## Cleanup

```bash
terraform destroy
```

---

📚 Full guide: [do-deployment-guide.md](do-deployment-guide.md)
