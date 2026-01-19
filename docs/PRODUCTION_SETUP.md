# 🚀 Kernex Production Deployment - Current Setup

**Status**: ✅ **LIVE IN PRODUCTION**

## Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your Users                           │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
        ┌────────────────┴─────────────────┐
        │                                  │
    ┌───▼──────┐                    ┌─────▼──────┐
    │  Vercel  │                    │ DO Droplet │
    │Frontend  │                    │  Backend   │
    │          │                    │            │
    │NextJS    │ HTTP Request       │ FastAPI    │
    │Port 3000 │───────────────────→│ Port 8000  │
    │          │ (NEXT_PUBLIC_API)  │            │
    └──────────┘                    │ PostgreSQL │
                                    │ (on droplet)
                                    └────────────┘
```

---

## 📍 Deployment Locations

### Frontend (Vercel)
- **URL**: https://kernex-ai.vercel.app
- **Platform**: Vercel (managed)
- **Region**: Auto-scaled globally
- **Cost**: Free tier
- **Environment Variable**: `NEXT_PUBLIC_API_URL=https://api.kernex.dev/api/v1`

### Backend (DigitalOcean Droplet)
- **Type**: Ubuntu 25.10 x64
- **Region**: SFO3 (San Francisco)
- **Size**: 1GB Memory / 25GB Disk
- **IP**: Your droplet IP (assigned by DO)
- **Service**: FastAPI control-plane running in Docker
- **Database**: PostgreSQL (running on same droplet in Docker)
- **Cost**: ~$6-7/month (smallest droplet)

---

## ✅ What's Currently Running

### Backend (DigitalOcean Droplet)
```bash
# Services running via Docker Compose:
1. PostgreSQL Database
2. FastAPI Control Plane (port 8000)
3. Health check endpoint: /api/v1/health
4. API endpoints: /api/v1/devices, /api/v1/bundles, /api/v1/deployments, etc.
```

### Frontend (Vercel)
```bash
# Deployed Next.js application:
1. NextJS app running on Vercel CDN
2. Connected to backend via NEXT_PUBLIC_API_URL
3. API client configured in src/lib/api/client.ts
4. All requests routed to backend
```

### Connection Flow
```
Browser (user visits kernex-ai.vercel.app)
    ↓
Next.js App (Vercel)
    ↓ (HTTPS)
Axios API Client (reads NEXT_PUBLIC_API_URL env var)
    ↓ (HTTPS to https://api.kernex.dev/api/v1)
FastAPI Backend (DigitalOcean)
    ↓
PostgreSQL Database
    ↓
JSON Response back to frontend
    ↓
Dashboard displays live data
```

---

## 🔧 Configuration Details

### Backend Environment Variables (Droplet)

**Set these when running the backend:**

```bash
# Database connection (if using external managed DB)
export DATABASE_URL="postgresql+asyncpg://user:password@db-host:5432/kernex_db"

# Frontend URL (for CORS - must match your Vercel domain exactly)
export FRONTEND_URL="https://kernex-ai.vercel.app"

# Environment
export ENVIRONMENT="production"

# Optional: For bundle storage path
export BUNDLE_STORAGE_PATH="/data/bundles"
```

**Current CORS Configuration** (in `control-plane/app/security.py`):
- ✅ Allows: `https://kernex-ai.vercel.app`
- ✅ Allows: `https://*.vercel.app` (development wildcard)
- ✅ Allows: `localhost:3000` (local dev testing)

### Frontend Environment Variables (Vercel)

**In Vercel Dashboard** → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL = https://api.kernex.dev/api/v1
```

Or if using droplet IP directly:
```
NEXT_PUBLIC_API_URL = http://YOUR-DROPLET-IP:8000/api/v1
```

---

## 📋 Troubleshooting

### Issue: "Cannot fetch data" or API errors in Vercel dashboard

**Check**:
1. Backend is running: SSH into droplet and verify
   ```bash
   curl http://localhost:8000/api/v1/health
   ```

2. CORS configuration is correct:
   - Verify `FRONTEND_URL` environment variable matches Vercel URL exactly
   - Check `control-plane/app/security.py` includes your domain

3. Firewall rules allow outbound from Vercel:
   - Most cloud providers block external requests by default
   - DigitalOcean droplets allow outbound by default ✅

### Issue: "Mixed content" or "HTTPS to HTTP" error

**Cause**: Frontend is HTTPS (Vercel) trying to talk to HTTP backend

**Fix**: Update backend URL in Vercel env var to use HTTPS
```
NEXT_PUBLIC_API_URL = https://api.kernex.dev/api/v1  # Use HTTPS
```

And set up reverse proxy (Nginx) with SSL on droplet (see below).

### Issue: Vercel can't connect to backend

**Check connectivity**:
```bash
# From droplet, test if port is open
curl -v http://localhost:8000/api/v1/health

# From your local machine, test droplet connectivity
curl -v http://YOUR-DROPLET-IP:8000/api/v1/health
```

---

## 🔐 Production Recommendations

### 1. Use Domain + Nginx + SSL (Recommended)

Instead of exposing droplet IP directly:

```bash
# 1. Buy a domain (e.g., api.kernex.dev)
# 2. SSH into droplet
# 3. Install Nginx and Certbot

sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# 4. Configure Nginx (see separate guide below)
# 5. Get SSL certificate
sudo certbot --nginx -d api.kernex.dev

# 6. Update Vercel env var
# NEXT_PUBLIC_API_URL = https://api.kernex.dev/api/v1
```

### 2. Nginx Reverse Proxy Configuration

Create `/etc/nginx/sites-available/kernex-api`:
```nginx
server {
    listen 80;
    server_name api.kernex.dev;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.kernex.dev;

    ssl_certificate /etc/letsencrypt/live/api.kernex.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.kernex.dev/privkey.pem;

    client_max_body_size 500M;  # For bundle uploads

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
}
```

### 3. Update Backend CORS for Domain

In `control-plane/app/security.py`, update:
```python
allowed_origins = [
    "http://localhost:3000",
    "https://kernex-ai.vercel.app",  # Your Vercel domain
    "https://api.kernex.dev",        # Your backend domain
]
```

Or use environment variable (safer):
```bash
export FRONTEND_URL="https://kernex-ai.vercel.app"
```

### 4. Database Backup Strategy

**Current**: PostgreSQL running in Docker on droplet
**Risk**: If droplet dies, you lose data

**Better**: Use DigitalOcean Managed PostgreSQL
- Automatic daily backups
- Point-in-time recovery
- High availability
- ~$30-40/month

To migrate:
1. Create managed database in DigitalOcean Console
2. Update `DATABASE_URL` environment variable
3. Restart backend container

---

## 📊 Monitoring & Maintenance

### View Backend Logs (SSH into droplet)

```bash
# If using Docker Compose
cd ~/kernex/infra
docker-compose logs -f api

# Or with tail to see recent logs
docker-compose logs api | tail -50
```

### Check Backend Health

```bash
# From anywhere
curl https://api.kernex.dev/api/v1/health

# Response:
# {"status":"ok"}
```

### Restart Backend (if needed)

```bash
# SSH into droplet
cd ~/kernex/infra
docker-compose restart api
```

### View Database Connections

```bash
# SSH into droplet
docker exec kernex-postgres psql -U kernex -d kernex_db -c "SELECT * FROM pg_stat_activity;"
```

---

## 🚀 Quick Reference Commands

### On DigitalOcean Droplet

```bash
# View all containers
docker-compose ps

# View logs
docker-compose logs -f

# Restart backend
docker-compose restart api

# Restart database
docker-compose restart postgres

# Stop everything
docker-compose down

# Start everything
docker-compose up -d

# Update backend (after git pull)
docker-compose build api
docker-compose up -d api

# SSH into backend container
docker exec -it kernex-api /bin/bash

# SSH into database
docker exec -it kernex-postgres psql -U kernex -d kernex_db
```

### Monitor from Vercel

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Analytics** tab to see traffic
4. Go to **Logs** tab to see frontend logs
5. Go to **Deployments** to see deployment history

---

## 📝 Deployment Checklist

### ✅ Completed
- [x] DigitalOcean droplet created (1GB, 25GB)
- [x] Docker and Docker Compose installed
- [x] Backend (FastAPI) running on droplet
- [x] Database (PostgreSQL) running on droplet
- [x] Frontend deployed to Vercel
- [x] CORS configured to allow Vercel requests
- [x] Environment variable set in Vercel

### 🔲 Optional Next Steps
- [ ] Set up domain name (api.kernex.dev)
- [ ] Configure Nginx reverse proxy
- [ ] Get SSL certificate (Let's Encrypt)
- [ ] Migrate to DigitalOcean Managed PostgreSQL
- [ ] Set up monitoring/alerts
- [ ] Enable backup strategy
- [ ] Configure custom domain for Vercel frontend

---

## 🆘 Getting Help

### If backend is down
1. SSH into droplet: `ssh root@YOUR_DROPLET_IP`
2. Check containers: `docker-compose ps`
3. View logs: `docker-compose logs api`
4. Restart: `docker-compose restart api`

### If frontend can't connect
1. Check CORS: Verify `FRONTEND_URL` env var on backend
2. Check health: `curl https://api.kernex.dev/api/v1/health`
3. Check network: Verify droplet firewall allows port 8000
4. Check env var: Verify `NEXT_PUBLIC_API_URL` in Vercel

### If database is down
1. Check status: `docker-compose ps postgres`
2. View logs: `docker-compose logs postgres`
3. Restart: `docker-compose restart postgres`
4. (If corrupted) Restore from backup or redeploy

---

## 📈 Cost Breakdown

| Service | Cost | Notes |
|---------|------|-------|
| DO Droplet (1GB) | $6/month | Backend + Database |
| Vercel Frontend | Free | Up to certain limits |
| Domain (optional) | ~$12/year | If using custom domain |
| **Total** | **~$6/month** | Very affordable! |

---

## 📚 Related Documentation

- [Backend Connection Guide](./FRONTEND_BACKEND_CONNECTION.md) - How frontend connects to backend
- [Backend Setup](../control-plane/README.md) - Backend development guide
- [Frontend Setup](../frontend/HOW_TO_RUN.md) - Frontend development guide

---

**Last Updated**: January 19, 2026  
**Status**: Production Ready ✅
