# DigitalOcean Deployment Guide for Kernex

## 🎯 Overview

Deploy Kernex Phase 2 to DigitalOcean using $200 free credit from GitHub Student Pack.

**Estimated Setup Time**: 30-45 minutes  
**Cost Year 1**: $0 (covered by credits)  
**Cost Year 2+**: ~$60-120/year  

---

## 📋 Prerequisites

- [ ] GitHub Student Developer Pack account (verify at education.github.com)
- [ ] $200 DigitalOcean credit activated
- [ ] Git installed locally
- [ ] Project Kernex cloned to your machine

---

## Step 1: Activate DigitalOcean Credit (5 minutes)

1. Go to [DigitalOcean GitHub Education](https://education.github.com/pack)
2. Find "DigitalOcean" offer: **$200 in platform credit for 1 year**
3. Click "Get access"
4. Sign in with GitHub
5. Accept terms
6. You'll get **$200 credit code**
7. Go to [DigitalOcean.com](https://www.digitalocean.com)
8. Sign up with GitHub or email
9. Go to **Billing** → **Promo Code**
10. Enter your $200 credit code
11. ✅ Credit activated!

---

## Step 2: Create a Droplet (10 minutes)

### 2.1 Create Basic Droplet

1. Login to DigitalOcean dashboard
2. Click **Create** → **Droplets**
3. **Choose Image**: 
   - Select **Docker** (under Marketplace)
   - This pre-installs Docker & Docker Compose

4. **Choose Plan**: 
   - **Basic** → **$6.99/month** (recommended)
   - 1 CPU, 1GB RAM, 25GB SSD
   - Covers Phase 2 easily

5. **Choose Datacenter Region**:
   - Pick closest to your location (or `New York` if unsure)

6. **Authentication**:
   - ✅ **New SSH Key** (secure)
   - Download private key (save as `do_key.pem`)
   - Or use password (less secure)

7. **Hostname**: `kernex-api`

8. Click **Create Droplet** (~60 seconds to launch)

### 2.2 Get Droplet IP

Once created, copy the **IPv4 address** (e.g., `123.45.67.89`)

---

## Step 3: SSH Into Droplet (5 minutes)

```bash
# On your local machine
chmod 600 ~/path/to/do_key.pem

ssh -i ~/path/to/do_key.pem root@YOUR_DROPLET_IP

# You're now in the Droplet terminal!
```

---

## Step 4: Setup Application (15 minutes)

### 4.1 Clone Repository

```bash
# In droplet terminal
cd /root
git clone https://github.com/YOUR_USERNAME/Project-Kernex.git
cd Project-Kernex
```

### 4.2 Create Environment File

```bash
# Create .env file
cat > control-plane/.env << EOF
DATABASE_URL=postgresql://kernex:kernex_password@localhost:5432/kernex
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
CORS_ORIGINS=["http://YOUR_DROPLET_IP", "https://your-domain.com"]
RATE_LIMIT_REQUESTS_PER_MINUTE=60
ACCESS_TOKEN_EXPIRE_MINUTES=60
EOF
```

Replace:
- `YOUR_DROPLET_IP` with your DigitalOcean IP
- `your-domain.com` with your domain (or leave blank for now)

### 4.3 Setup PostgreSQL with Docker

```bash
# Pull PostgreSQL image
docker pull postgres:15

# Run PostgreSQL container
docker run -d \
  --name kernex-db \
  -e POSTGRES_USER=kernex \
  -e POSTGRES_PASSWORD=kernex_password \
  -e POSTGRES_DB=kernex \
  -p 5432:5432 \
  -v kernex_postgres:/var/lib/postgresql/data \
  postgres:15

# Verify it's running
docker ps
```

### 4.4 Run Migrations

```bash
# Navigate to control-plane
cd control-plane

# Run Alembic migrations
docker run --rm \
  --env-file .env \
  --network host \
  -v $(pwd):/app \
  -w /app \
  python:3.11 bash -c "pip install -r requirements.txt && alembic upgrade head"
```

### 4.5 Start Control-Plane API

```bash
# Build Docker image
cd /root/Project-Kernex/control-plane
docker build -t kernex-api:latest .

# Run API container
docker run -d \
  --name kernex-api \
  --env-file .env \
  -p 8000:8000 \
  --network host \
  kernex-api:latest

# Verify it's running
docker ps
docker logs kernex-api
```

---

## Step 5: Test the Deployment (5 minutes)

```bash
# From droplet terminal
# Test health endpoint
curl http://localhost:8000/health

# Should return: {"status":"ok"}

# Test metrics endpoint
curl http://localhost:8000/metrics | head -20

# Should show Prometheus metrics

# Test auth endpoint (register)
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "SecurePass123!"
  }'
```

---

## Step 6: Setup Domain (Optional, 5 minutes)

### 6.1 Add Domain in DigitalOcean

1. In DigitalOcean dashboard, go to **Networking** → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `kernex.example.com`)
4. Select your Droplet
5. Click **Add Domain**

### 6.2 Point Domain to Droplet

1. Get name servers from DigitalOcean dashboard
2. Go to your domain registrar (Namecheap, GoDaddy, etc.)
3. Update nameservers to DigitalOcean's:
   ```
   ns1.digitalocean.com
   ns2.digitalocean.com
   ns3.digitalocean.com
   ```

### 6.3 Create A Record (if manual)

If using external registrar:
- **Type**: A
- **Name**: @ (or subdomain like `api`)
- **Value**: YOUR_DROPLET_IP
- **TTL**: 3600

---

## Step 7: Setup SSL Certificate (5 minutes)

```bash
# Install Certbot
sudo apt update
sudo apt install -y certbot

# Generate SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Certificate saved to:
# /etc/letsencrypt/live/your-domain.com/

# Create renewal service (auto-renews)
sudo certbot renew --dry-run
```

---

## Step 8: Setup Reverse Proxy (Nginx) (10 minutes)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx config
sudo tee /etc/nginx/sites-available/kernex << EOF
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/kernex /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Step 9: Setup Auto-Restart (Crash Recovery)

Create systemd service to auto-restart API:

```bash
sudo tee /etc/systemd/system/kernex-api.service << EOF
[Unit]
Description=Kernex API
After=docker.service
Requires=docker.service

[Service]
Type=simple
Restart=always
RestartSec=10
ExecStart=/usr/bin/docker start -a kernex-api
ExecStop=/usr/bin/docker stop kernex-api

[Install]
WantedBy=multi-user.target
EOF

# Enable service
sudo systemctl daemon-reload
sudo systemctl enable kernex-api.service
```

---

## Step 10: Monitoring Setup (5 minutes)

### Option A: Datadog (Recommended)

```bash
# 1. Sign up at datadog.com (free with GitHub Pack)
# 2. Get API key
# 3. Install Datadog Agent

sudo DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=YOUR_API_KEY bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_agent.sh)"

# 4. Configure to scrape /metrics endpoint
# Edit: /etc/datadog-agent/datadog.yaml

# Add:
openmetrics_endpoints:
  - http://localhost:8000/metrics
```

### Option B: Prometheus + Grafana

```bash
# Pull Prometheus image
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v prometheus-storage:/prometheus \
  prom/prometheus:latest

# Access at http://YOUR_DROPLET_IP:9090
```

---

## Step 11: Verify Everything Works

```bash
# SSH into droplet
ssh -i ~/path/to/do_key.pem root@YOUR_DROPLET_IP

# Check all containers running
docker ps

# Check logs
docker logs kernex-api
docker logs kernex-db

# Test API from outside droplet (local machine)
curl http://YOUR_DROPLET_IP:8000/health

# Test from domain (if configured)
curl https://your-domain.com/health
```

---

## 📊 Final Setup Summary

| Component | Status | Access |
|-----------|--------|--------|
| API | ✅ Running | `http://YOUR_IP:8000` |
| Database | ✅ PostgreSQL | `localhost:5432` |
| Metrics | ✅ Prometheus | `http://YOUR_IP:8000/metrics` |
| Health Check | ✅ Working | `/health` |
| Auth | ✅ JWT Ready | `/api/v1/auth/register` |

---

## 💰 Cost Breakdown (Year 1)

| Item | Cost |
|------|------|
| Droplet ($6.99/mo × 12) | $0 (credit covers) |
| PostgreSQL (included) | $0 (included) |
| Domain (optional) | $0-15 |
| SSL Certificate | $0 (Let's Encrypt free) |
| **Total Year 1** | **$0-15** |
| **Total Year 2** | **~$85/year** |

---

## 🆘 Troubleshooting

### API won't start
```bash
docker logs kernex-api
# Check error, usually missing environment variable
```

### Database connection error
```bash
# Test connection
docker exec kernex-db psql -U kernex -d kernex -c "SELECT 1"
```

### Domain not resolving
```bash
# DNS might take 24-48 hours
# Check: dig your-domain.com
```

### SSL certificate error
```bash
# Renew manually
sudo certbot renew --force-renewal
```

---

## 📈 Next Steps

1. ✅ **Monitor in Production**: Setup Datadog/Prometheus
2. ✅ **Setup Logging**: Configure structured JSON logging aggregation
3. ✅ **Auto-backups**: Enable DigitalOcean automated backups
4. ✅ **Build Frontend**: Deploy Next.js frontend once ready
5. ✅ **Phase 3**: Implement advanced authorization

---

## 🎉 Congratulations!

Your Kernex Phase 2 API is now **LIVE IN PRODUCTION** on DigitalOcean! 

**Endpoint**: `https://your-domain.com/api/v1`  
**Metrics**: `https://your-domain.com/metrics`  
**Health**: `https://your-domain.com/health`  

---

## 📞 Support

If issues arise, check:
1. DigitalOcean dashboard for droplet status
2. Logs: `docker logs kernex-api`
3. Database: `docker logs kernex-db`
4. Nginx: `sudo systemctl status nginx`

**Time to deployment**: ~45 minutes  
**Cost**: FREE (covered by $200 credit)  
**Status**: PRODUCTION READY ✅
