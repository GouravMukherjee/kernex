# 🚀 Quick Droplet Deployment Checklist

## ✅ What's Been Updated

- [x] Runtime Dockerfile created with proper multi-stage build
- [x] Frontend Dockerfile created for Next.js
- [x] Docker Compose updated for production deployment:
  - Health checks on all services
  - Network isolation
  - Environment variable support
  - Removed reload mode
  - Added logging and backup directories
  - Included runtime agent in stack
- [x] `.env.example` documented with all configuration options
- [x] `FRESH_DROPLET_DEPLOYMENT.md` created with step-by-step guide
- [x] All changes committed to GitHub (`commit: 92e61a0a`)
- [x] All changes pushed to GitHub

---

## 📋 Droplet Deployment Steps

### 1️⃣ SSH into Fresh Droplet

```bash
ssh root@<YOUR_DROPLET_IP>
```

### 2️⃣ Clone Repository

```bash
apt-get update && apt-get install -y git
mkdir -p /opt/kernex
cd /opt/kernex
git clone https://github.com/GouravMukherjee/kernex.git .
```

### 3️⃣ Install Docker & Docker Compose

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker root
```

### 4️⃣ Configure Environment

```bash
cp .env.example .env
nano .env

# Update these values:
# - DB_PASSWORD (STRONG password!)
# - CORS_ALLOWED_ORIGINS (add your domain/IP)
# - PGADMIN_PASSWORD (if using)
```

### 5️⃣ Create Data Directories

```bash
mkdir -p control-plane/data/bundles control-plane/logs
mkdir -p runtime/.kernex runtime/logs backups
chmod -R 755 control-plane/data runtime/logs backups
chmod 700 runtime/.kernex
```

### 6️⃣ Start Services

```bash
docker-compose build
docker-compose up -d

# Monitor startup (wait 40-60 seconds)
docker-compose logs -f
```

### 7️⃣ Verify Backend is Running

```bash
# Check API health
curl http://localhost:8000/api/v1/health

# Should return: {"status":"ok"}
```

### 8️⃣ Update Vercel Frontend

1. Go to Vercel Project Settings → Environment Variables
2. Update `NEXT_PUBLIC_API_URL`:
   ```
   http://<DROPLET_IP>:8000/api/v1
   ```
   OR
   ```
   https://api.yourdomain.com/api/v1
   ```
3. Redeploy or push commit to auto-deploy

### 9️⃣ Test Backend-Frontend Connection

```bash
# From droplet, test CORS
curl -H "Origin: https://kernex-ai.vercel.app" \
     -X OPTIONS http://localhost:8000/api/v1/health -v

# Should see CORS headers in response
```

### 🔟 Verify Everything

```bash
# Check all services healthy
docker-compose ps

# Should show:
# - kernex-postgres (healthy)
# - kernex-api (healthy)
# - kernex-runtime (running)
# - kernex-pgadmin (running)
```

---

## 📚 Key Documentation Files

**On Droplet (after git clone):**
- `docs/FRESH_DROPLET_DEPLOYMENT.md` - Detailed deployment guide
- `docs/PRODUCTION_SETUP.md` - Architecture and configuration
- `docs/DROPLET_OPERATIONS.md` - Daily operations
- `docs/ORGANIZATION.md` - Directory structure

**Local (before pushing):**
- All changes already pushed to GitHub
- Ready to pull on fresh droplet

---

## 🔗 API Endpoints (After Deployment)

```
Health Check:    http://<DROPLET_IP>:8000/api/v1/health
API Prefix:      http://<DROPLET_IP>:8000/api/v1
PgAdmin:         http://<DROPLET_IP>:5050
```

---

## 🆘 Troubleshooting

### Services not starting?
```bash
docker-compose logs -f
# Check for database connection errors
```

### Frontend CORS errors?
```bash
# Verify CORS_ALLOWED_ORIGINS in .env
grep CORS_ALLOWED_ORIGINS .env

# Restart API
docker-compose restart api
```

### Database connection failed?
```bash
# Check database is healthy
docker-compose logs postgres

# Restart database and API
docker-compose restart postgres
docker-compose restart api
```

### Runtime not connecting?
```bash
# Check runtime logs
docker-compose logs runtime

# Verify CONTROL_PLANE_URL in .env
# Should be: http://api:8000/api/v1
```

---

## 🎯 Next Steps After Deployment

1. ✅ Verify API is healthy
2. ✅ Test frontend connection
3. ✅ Register test device via API
4. ✅ Check device heartbeats
5. ✅ Test bundle upload/deployment
6. ✅ Monitor system performance
7. ✅ Set up backups
8. ✅ Configure monitoring

---

## 📝 Useful Commands

```bash
# View logs
docker-compose logs -f api
docker-compose logs -f postgres
docker-compose logs -f runtime

# Database backup
docker-compose exec postgres pg_dump -U kernex kernex_db > backup.sql

# Stop/start services
docker-compose stop
docker-compose start

# Restart specific service
docker-compose restart api

# Check resources
docker stats
free -h
df -h
```

---

## ✨ Production Ready!

Your droplet is now configured to:
- ✅ Run FastAPI backend with health checks
- ✅ Run PostgreSQL database with persistence
- ✅ Run device runtime agent
- ✅ Provide database GUI (PgAdmin)
- ✅ Support Vercel frontend connection
- ✅ Auto-restart services if they fail
- ✅ Log all service activity

All code is on GitHub and ready to deploy!

---

**Status**: ✅ Ready for Fresh Droplet Deployment
**Last Updated**: January 19, 2026
